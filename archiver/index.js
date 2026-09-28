'use strict';

/**
 * cargo-archiver
 *
 * Watches PocketBase in realtime. When a freight becomes `archived` (or orders
 * under an already-archived freight change), it writes a versioned CSV snapshot
 * of that freight's orders to ARCHIVE_DIR/YYYYMMDD/ and records the version on
 * the freight. Serves the archives over HTTP for local testing.
 */

const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const PocketBaseModule = require('pocketbase');
const PocketBase = PocketBaseModule.default || PocketBaseModule;

// Node < 22 has no global EventSource; the PocketBase SDK needs it for realtime.
if (typeof globalThis.EventSource === 'undefined') {
  globalThis.EventSource = require('eventsource').EventSource;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const ARCHIVE_DIR = path.resolve(
  process.env.ARCHIVE_DIR || path.join(__dirname, '..', '..', 'archives')
);
const PORT = Number(process.env.PORT || 8091);
const DEBOUNCE_MS = Number(process.env.DEBOUNCE_MS || 60000);

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

// ---------------------------------------------------------------------------
// Formatting helpers (CSV spec)
// ---------------------------------------------------------------------------

const pad = (n) => String(n).padStart(2, '0');

function fmtDate(d) {
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function fmtDateTime(d) {
  return `${fmtDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function folderName(d) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function timeName(d) {
  return `${pad(d.getHours())}${pad(d.getMinutes())}`;
}

// Numbers: round to 3 decimals, decimal comma, integers plain (0,125 / 0,5 / 3500)
function fmtNum(v) {
  const n = Number(v) || 0;
  const r = Math.round(n * 1000) / 1000;
  if (Number.isInteger(r)) return String(r);
  return r.toFixed(3).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
}

function esc(v) {
  const s = v == null ? '' : String(v);
  return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// Russian cargo type labels — from lib/i18n/translations.ts (ru.cargoTypes)
const CARGO_TYPE_RU = {
  dangerous: 'Опасный',
  liquid: 'Жидкость',
  brand: 'Брендовый',
  standard: 'Стандартный',
};

function parseDate(v) {
  if (!v) return null;
  const d = new Date(String(v).replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// CSV building
// ---------------------------------------------------------------------------

// Columns mirror the freight page grid exactly (same order, same ru headers)
const TABLE_HEADER =
  'Артикул;Имя клиента;Наименование;Вес (кг);Общий вес (кг);Объём (м³);Общий объём (м³);Количество коробок;Номер клиента;Тип груза;Стоимость;Дата;Фотографии товара';

function buildCsv(freight, orders, now) {
  const lines = [TABLE_HEADER];

  for (const o of orders) {
    const d = parseDate(o.date);
    lines.push(
      [
        esc(o.client_article),
        esc(o.client_name),
        esc(o.product_name),
        fmtNum(o.weight),
        fmtNum(o.total_weight),
        fmtNum(o.cubic_meters),
        fmtNum(o.total_volume),
        fmtNum(o.quantity),
        esc(o.client_number),
        esc(CARGO_TYPE_RU[o.cargo_type] || o.cargo_type || ''),
        fmtNum(o.price),
        d ? fmtDateTime(d) : '',
        String(Array.isArray(o.pictures) ? o.pictures.length : 0),
      ].join(';')
    );
  }

  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}

// ---------------------------------------------------------------------------
// Disk scan: archives/YYYYMMDD/YYYYMMDD-HHmm-<freight_number>-<version>.csv
// ---------------------------------------------------------------------------

const FILE_RE = /^(\d{8})-\d{4}-(.+)-(\d+)\.csv$/;

async function scanArchives() {
  // freightNumber -> { maxVersion, files: [relativePath, ...] }
  const byFreight = new Map();
  let dayDirs = [];
  try {
    dayDirs = await fsp.readdir(ARCHIVE_DIR, { withFileTypes: true });
  } catch {
    return byFreight; // archive dir does not exist yet
  }
  for (const day of dayDirs) {
    if (!day.isDirectory() || !/^\d{8}$/.test(day.name)) continue;
    const files = await fsp.readdir(path.join(ARCHIVE_DIR, day.name));
    for (const f of files) {
      const m = FILE_RE.exec(f);
      if (!m) continue;
      const [, , freightNumber, versionStr] = m;
      const version = Number(versionStr);
      const rel = `${day.name}/${f}`;
      let entry = byFreight.get(freightNumber);
      if (!entry) {
        entry = { maxVersion: 0, files: [] };
        byFreight.set(freightNumber, entry);
      }
      entry.maxVersion = Math.max(entry.maxVersion, version);
      entry.files.push(rel);
    }
  }
  for (const entry of byFreight.values()) entry.files.sort();
  return byFreight;
}

// ---------------------------------------------------------------------------
// Per-freight serialized job queue
// ---------------------------------------------------------------------------

const queues = new Map(); // freightId -> Promise

function enqueue(freightId, job) {
  const prev = queues.get(freightId) || Promise.resolve();
  const p = prev.catch(() => {}).then(job);
  queues.set(freightId, p);
  p.finally(() => {
    if (queues.get(freightId) === p) queues.delete(freightId);
  });
  return p;
}

// ---------------------------------------------------------------------------
// Version bookkeeping + generation
// ---------------------------------------------------------------------------

function recordFiles(freight) {
  return Array.isArray(freight.archive_files) ? freight.archive_files.slice() : [];
}

async function nextVersionInfo(freight) {
  const now = new Date();
  const version = (Number(freight.archive_version) || 0) + 1;
  const day = folderName(now);
  const filename = `${day}-${timeName(now)}-${freight.freight_number}-${version}.csv`;
  return { now, version, day, filename, relPath: `${day}/${filename}` };
}

async function writeAndRecord(freight, relPath, version, content) {
  const abs = path.join(ARCHIVE_DIR, relPath);
  await fsp.mkdir(path.dirname(abs), { recursive: true });
  await fsp.writeFile(abs, content, 'utf8');
  const files = recordFiles(freight);
  if (!files.includes(relPath)) files.push(relPath);
  files.sort();
  await pb.collection('freights').update(freight.id, {
    archive_version: version,
    archive_files: files,
  });
  return { version, relPath, abs };
}

async function generate(freightId, reason) {
  const freight = await pb.collection('freights').getOne(freightId);
  const orders = await pb.collection('orders').getFullList({
    filter: `freight = "${freightId}"`,
    sort: 'created',
  });
  const { now, version, relPath } = await nextVersionInfo(freight);
  const csv = buildCsv(freight, orders, now);
  const result = await writeAndRecord(freight, relPath, version, csv);
  log(
    `generated v${result.version} for freight ${freight.freight_number} ` +
      `(${freightId}) [${reason}] -> ${result.relPath} (${orders.length} orders)`
  );
  return { ok: true, freightId, ...result, orders: orders.length };
}

async function storeUpload(freightId, body) {
  const freight = await pb.collection('freights').getOne(freightId);
  const { version, relPath } = await nextVersionInfo(freight);
  // Keep served files consistent with the format spec: ensure UTF-8 BOM.
  const content = body.length >= 3 && body[0] === 0xef && body[1] === 0xbb && body[2] === 0xbf
    ? body
    : Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), body]);
  const result = await writeAndRecord(freight, relPath, version, content);
  log(
    `stored upload as v${result.version} for freight ${freight.freight_number} ` +
      `(${freightId}) -> ${result.relPath} (${body.length} bytes)`
  );
  return { ok: true, freightId, ...result };
}

// ---------------------------------------------------------------------------
// Realtime handlers
// ---------------------------------------------------------------------------

const statusCache = new Map(); // freightId -> last known status
const debounceTimers = new Map(); // freightId -> timeout

function scheduleRegeneration(freightId) {
  clearTimeout(debounceTimers.get(freightId));
  debounceTimers.set(
    freightId,
    setTimeout(() => {
      debounceTimers.delete(freightId);
      enqueue(freightId, () => generate(freightId, 'orders-changed')).catch((err) =>
        log(`regeneration failed for ${freightId}:`, err.message)
      );
    }, DEBOUNCE_MS)
  );
}

async function onOrderEvent(e) {
  const freightId = e.record && e.record.freight;
  if (!freightId) return;
  let freight;
  try {
    freight = await pb.collection('freights').getOne(freightId);
  } catch {
    return; // freight gone or unreachable
  }
  statusCache.set(freightId, freight.status);
  if (freight.status === 'archived') {
    log(
      `order ${e.action} under archived freight ${freight.freight_number}; ` +
        `regeneration scheduled in ${DEBOUNCE_MS}ms`
    );
    scheduleRegeneration(freightId);
  }
}

function onFreightEvent(e) {
  if (e.action !== 'update' && e.action !== 'create') return;
  const freight = e.record;
  const prev = statusCache.get(freight.id);
  statusCache.set(freight.id, freight.status);
  if (freight.status === 'archived' && prev !== 'archived') {
    log(`freight ${freight.freight_number} (${freight.id}) became archived; generating snapshot`);
    enqueue(freight.id, () => generate(freight.id, 'status-archived')).catch((err) =>
      log(`generation failed for ${freight.id}:`, err.message)
    );
  }
}

// ---------------------------------------------------------------------------
// Startup sweep
// ---------------------------------------------------------------------------

async function sweep() {
  const freights = await pb.collection('freights').getFullList({
    filter: 'status = "archived"',
  });
  const onDisk = await scanArchives();
  log(`sweep: ${freights.length} archived freight(s), archive dir has ${onDisk.size} freight(s)`);

  for (const freight of freights) {
    statusCache.set(freight.id, freight.status);
    const disk = onDisk.get(freight.freight_number);
    const recordVersion = Number(freight.archive_version) || 0;

    if (!disk || disk.files.length === 0) {
      log(`sweep: freight ${freight.freight_number} archived but no files on disk; generating`);
      await enqueue(freight.id, () => generate(freight.id, 'sweep-missing')).catch((err) =>
        log(`sweep generation failed for ${freight.freight_number}:`, err.message)
      );
      continue;
    }

    const files = recordFiles(freight);
    const missing = disk.files.filter((f) => !files.includes(f));
    if (disk.maxVersion > recordVersion || missing.length > 0) {
      const merged = [...new Set([...files, ...disk.files])].sort();
      const version = Math.max(recordVersion, disk.maxVersion);
      await pb.collection('freights').update(freight.id, {
        archive_version: version,
        archive_files: merged,
      });
      log(
        `sweep: freight ${freight.freight_number} out of sync ` +
          `(record v${recordVersion}, disk v${disk.maxVersion}); ` +
          `record updated to v${version} with ${merged.length} file(s)`
      );
    } else {
      log(`sweep: freight ${freight.freight_number} all in sync (v${recordVersion})`);
    }
  }
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function serveArchive(res, urlPath) {
  // urlPath: everything after /archives/
  let rel;
  try {
    rel = decodeURIComponent(urlPath);
  } catch {
    return sendJson(res, 400, { ok: false, error: 'bad path encoding' });
  }
  const abs = path.normalize(path.join(ARCHIVE_DIR, rel));
  const root = path.resolve(ARCHIVE_DIR);
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    return sendJson(res, 403, { ok: false, error: 'forbidden' });
  }
  try {
    const data = await fsp.readFile(abs);
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Length': data.length,
    });
    res.end(data);
  } catch {
    sendJson(res, 404, { ok: false, error: 'not found' });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const p = url.pathname;

  try {
    if (req.method === 'GET' && p === '/health') {
      return sendJson(res, 200, { ok: true });
    }

    const regen = /^\/regenerate\/([^/]+)$/.exec(p);
    if (req.method === 'POST' && regen) {
      const freightId = regen[1];
      log(`POST /regenerate/${freightId}`);
      const result = await enqueue(freightId, () => generate(freightId, 'manual-regenerate'));
      return sendJson(res, 200, result);
    }

    if (req.method === 'POST' && p === '/archives/upload') {
      const freightId = url.searchParams.get('freightId');
      if (!freightId) return sendJson(res, 400, { ok: false, error: 'freightId is required' });
      const body = await readBody(req);
      if (body.length === 0) return sendJson(res, 400, { ok: false, error: 'empty body' });
      log(`POST /archives/upload?freightId=${freightId} (${body.length} bytes)`);
      const result = await enqueue(freightId, () => storeUpload(freightId, body));
      return sendJson(res, 200, result);
    }

    if (req.method === 'GET' && p.startsWith('/archives/')) {
      return serveArchive(res, p.slice('/archives/'.length));
    }

    sendJson(res, 404, { ok: false, error: 'not found' });
  } catch (err) {
    log(`request error ${req.method} ${p}:`, err.message);
    const status = err.status === 404 ? 404 : 500;
    sendJson(res, status, { ok: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function main() {
  log(`starting cargo-archiver (PB_URL=${PB_URL}, ARCHIVE_DIR=${ARCHIVE_DIR}, ` +
      `PORT=${PORT}, DEBOUNCE_MS=${DEBOUNCE_MS})`);

  await pb.health.check();
  log('pocketbase reachable');

  await fsp.mkdir(ARCHIVE_DIR, { recursive: true });

  await pb.collection('freights').subscribe('*', (e) => {
    Promise.resolve(onFreightEvent(e)).catch((err) => log('freights event error:', err.message));
  });
  await pb.collection('orders').subscribe('*', (e) => {
    Promise.resolve(onOrderEvent(e)).catch((err) => log('orders event error:', err.message));
  });
  log('subscribed to freights and orders realtime events');

  await sweep();

  server.listen(PORT, '127.0.0.1', () => {
    log(`HTTP listening on http://127.0.0.1:${PORT}`);
  });
}

main().catch((err) => {
  log('fatal:', err);
  process.exit(1);
});
