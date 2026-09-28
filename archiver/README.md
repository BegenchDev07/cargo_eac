# cargo-archiver

Standalone Node.js service that creates versioned CSV snapshots of archived freights.

When a freight's status in PocketBase becomes `archived`, the service writes a CSV
snapshot of all its orders to disk. Any later change to orders under an archived
freight triggers a new version. The CSVs are served over HTTP (and via nginx in
production) for the management download flow.

## How it works

- Connects to PocketBase and subscribes to realtime events:
  - `freights` update → status transitioned **to** `archived` → generate the next
    CSV version immediately.
  - `orders` create/update/delete → if the order's freight is currently
    `archived` → schedule a **debounced** regeneration (default 60 s quiet window
    per freight, `DEBOUNCE_MS`). Multiple changes collapse into one new version.
- Work is serialized per freight (in-process promise queue), so generations never
  overlap and version numbers are monotonic.
- **Startup sweep**: lists all freights with `status = "archived"` and compares
  each record's `archive_version` against the highest version found on disk in
  `ARCHIVE_DIR`:
  - files on disk newer than the record (or record `archive_version` is 0) → the
    record is synced (`archive_version` and `archive_files` are repaired);
  - archived but no files at all → a snapshot is generated;
  - otherwise logs "all in sync".
- After each generation the freight record is updated:
  `archive_version` = new version, `archive_files` = full sorted list of relative
  paths (e.g. `"20261120/20261120-1430-F1001-1.csv"`).

## Requirements

- Node.js v20+ (on Node < 22 the bundled `eventsource` polyfill is used for
  PocketBase realtime).
- PocketBase reachable, collections `freights` and `orders`, open API rules (no
  auth needed).

## Install & run

```sh
npm install
npm start
```

## Environment variables

| Var           | Default                                            | Description                          |
| ------------- | -------------------------------------------------- | ------------------------------------ |
| `PB_URL`      | `http://127.0.0.1:8090`                            | PocketBase base URL                  |
| `ARCHIVE_DIR` | sibling of the `pocketbase` folder (`../archives`) | Archive root folder                  |
| `PORT`        | `8091`                                             | HTTP listen port (binds 127.0.0.1)   |
| `DEBOUNCE_MS` | `60000`                                            | Quiet window for order-change regen  |

## HTTP endpoints

| Method & path                        | Description                                                    |
| ------------------------------------ | -------------------------------------------------------------- |
| `GET /health`                        | `200 {"ok":true}`                                              |
| `POST /regenerate/:freightId`        | Force-generate the next version (repair flow / manual snapshot)|
| `POST /archives/upload?freightId=x`  | Store raw CSV request body as the next version for the freight |
| `GET /archives/*`                    | Static file serving from `ARCHIVE_DIR` (path-traversal safe)   |

All non-file responses are JSON. The upload endpoint prepends a UTF-8 BOM if the
body does not start with one, so stored files stay consistent with the CSV spec.

## Folder layout & versioning

```
archives/
  20261120/
    20261120-1430-F1001-1.csv
    20261120-1512-F1001-2.csv
```

Filename: `YYYYMMDD-HHmm-<freight_number>-<version>.csv`. The version is
monotonic per freight and tracked on the freight record (`archive_version`); the
record also carries `archive_files`, the list of all relative CSV paths.

## CSV format

- UTF-8 **with BOM**, `;` delimiter, CRLF line endings, trailing newline at EOF.
- Decimal separator is a comma; numbers rounded to 3 decimals, trailing zeros
  trimmed (`0,125`, `0,5`); integers plain (`3500`).
- The file contains **only the orders table** — the same columns, in the same
  order, as the freight detail grid (no metadata header):

```
Артикул;Имя клиента;Наименование;Вес (кг);Общий вес (кг);Объём (м³);Общий объём (м³);Количество коробок;Номер клиента;Тип груза;Стоимость;Дата;Фотографии товара
```

- One row per order: client_article, client_name, product_name, weight,
  total_weight, cubic_meters, total_volume, quantity, client_number, cargo type
  (Russian label: dangerous=Опасный, liquid=Жидкость, brand=Брендовый,
  standard=Стандартный — matching `lib/i18n/translations.ts` ru.cargoTypes),
  price, date `DD.MM.YYYY HH:mm`, photo count.
- Fields containing `;`, `"` or newlines are wrapped in double quotes (inner
  quotes doubled).
