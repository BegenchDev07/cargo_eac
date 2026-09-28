import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Freight } from '../lib/types/freight';
import { WarehouseOrder } from '../lib/types/order';
import { translations } from '../lib/i18n/translations';

export const archiverBaseUrl =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_ARCHIVER_URL ||
  process.env.EXPO_PUBLIC_ARCHIVER_URL ||
  'http://120.55.49.54'; // LOCAL fallback: 'http://127.0.0.1:8091'

const pad2 = (value: number): string => String(value).padStart(2, '0');

function formatDate(date: Date): string {
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function formatTimestamp(date: Date): string {
  return (
    `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}` +
    `-${pad2(date.getHours())}${pad2(date.getMinutes())}`
  );
}

// Floats rounded to 3 decimals with a comma decimal separator (0,125);
// integers stay plain (2, not 2,000).
function formatNumber(value: number | null | undefined): string {
  if (value == null) return '';
  const rounded = Math.round(value * 1000) / 1000;
  return String(rounded).replace('.', ',');
}

function quoteField(value: string): string {
  if (value.includes(';') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Columns mirror the freight page grid exactly (same order, same ru headers)
const HEADER =
  'Артикул;Имя клиента;Наименование;Вес (кг);Общий вес (кг);Объём (м³);Общий объём (м³);Количество коробок;Номер клиента;Тип груза;Стоимость;Дата;Фотографии товара';

/**
 * Archive snapshot of a freight. Byte-compatible with the archiver service's
 * format (see POCKETBASE_SETUP.md): UTF-8, semicolon delimiter, comma decimal
 * separator. Returns the string WITHOUT a BOM — callers prepend \uFEFF
 * when saving to a file.
 */
export function generateFreightCSV(freight: Freight, orders: WarehouseOrder[]): string {
  const cargoTypeLabels = translations.ru.dashboard.cargoTypes;

  const lines: string[] = [HEADER];

  for (const order of orders) {
    lines.push(
      [
        quoteField(order.client_article ?? ''),
        quoteField(order.client_name ?? ''),
        quoteField(order.product_name ?? ''),
        formatNumber(order.weight),
        formatNumber(order.total_weight),
        formatNumber(order.cubic_meters),
        formatNumber(order.total_volume),
        String(order.quantity ?? ''),
        quoteField(order.client_number ?? ''),
        quoteField(order.cargo_type ? cargoTypeLabels[order.cargo_type] : ''),
        formatNumber(order.price),
        order.date ? formatDateTime(new Date(order.date)) : '',
        String(order.pictures?.length ?? 0),
      ].join(';')
    );
  }

  // CRLF rows to stay byte-compatible with the archiver service (RFC 4180),
  // including a trailing newline at end of file
  return lines.join('\r\n') + '\r\n';
}

/**
 * Trigger a browser download of the archive CSV (web only). The file gets a
 * BOM so Excel opens the UTF-8 Cyrillic content correctly. Filename follows
 * the archiver convention: YYYYMMDD-HHmm-<freight_number>-<version>.csv with
 * the freight's next version ((archive_version ?? 0) + 1).
 */
export function downloadFreightCSV(freight: Freight, orders: WarehouseOrder[]): void {
  if (Platform.OS !== 'web') return;

  const csv = '\uFEFF' + generateFreightCSV(freight, orders);
  const version = (freight.archive_version ?? 0) + 1;
  const fileName = `${formatTimestamp(new Date())}-${freight.freight_number}-${version}.csv`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
