# PocketBase Setup Guide

This app uses PocketBase as the database backend. Follow these steps to set up your PocketBase instance.

## PocketBase Server

The app is configured to connect to: `http://120.55.49.54`

## Required Collections

You need to create the following collections in your PocketBase admin panel:

### 1. `orders` Collection

Create a collection named `orders` with the following fields. These match exactly what `lib/services/pocketbase.service.ts` sends and reads:

| Field Name       | Field Type | Required | Options                                             |
|-----------------|------------|----------|-----------------------------------------------------|
| order_id        | Text       | Yes      | -                                                   |
| client_article  | Text       | Yes      | **Unique index required** (see below)               |
| client_name     | Text       | No       | -                                                   |
| weight          | Number     | Yes      | Min: 0                                              |
| cubic_meters    | Number     | Yes      | Min: 0                                              |
| product_name    | Text       | Yes      | -                                                   |
| quantity        | Number     | Yes      | Min: 1                                              |
| client_number   | Text       | Yes      | -                                                   |
| cargo_type      | Select     | No       | Values: `dangerous`, `liquid`, `brand`, `standard`. Default: `standard` |
| date            | Date       | Yes      | -                                                   |
| qr_data         | JSON       | No       | -                                                   |
| pictures        | File       | No       | Multiple values. Allowed types: image/*             |
| freight         | Relation   | No       | Related collection: `freights`, single, on delete: set null |

**Notes:**

- Images are stored directly on the `orders` record in the `pictures` file field (multiple files). The app builds image URLs as `/api/files/orders/{recordId}/{filename}`.
- There is **no** `size` or `image_urls` field, and there is **no** separate `order_images` collection — earlier versions of this document described those, but the code has never used them.
- `uploadImage()` in `lib/services/pocketbase.service.ts` is currently an unused stub that just returns the local URI. It is declared in the `DatabaseService` interface (`lib/services/database.interface.ts`) but never called; image upload happens inline in `createOrder` via the `pictures` field.

**Unique index on `client_article`:**

The app generates `client_article` client-side (day prefix + counter) and relies on a server-side unique constraint to detect collisions and retry. In the PocketBase admin UI, open the `orders` collection, edit the `client_article` field, and enable **Unique** (or add a unique index on the field). Without this index, two orders created concurrently can receive the same article number and the retry logic will not trigger.

**Collection Settings:**
- API Rules: Allow all for testing (adjust for production)
- List/View Rule: Leave empty or set based on your needs
- Create Rule: Leave empty or set based on your needs
- Update Rule: Leave empty or set based on your needs
- Delete Rule: Leave empty or set based on your needs

### 2. `freights` Collection

Create a collection named `freights` with the following fields:

| Field Name     | Field Type | Required | Options                                       |
|---------------|------------|----------|-----------------------------------------------|
| freight_number | Text      | Yes      | **Unique index required** (see below)         |
| load_date     | Date       | Yes      | -                                             |
| notes         | Text       | No       | -                                             |
| status        | Select     | No       | Values: `open`, `closed`, `shipped`. Default: `open` |

**Unique index on `freight_number`:**

The app generates `freight_number` client-side (`F-0001`, `F-0002`, ...) and retries when the server rejects a duplicate. Enable **Unique** on the `freight_number` field in the PocketBase admin UI so concurrent creates cannot produce duplicate numbers.

## Setup Steps

1. **Access PocketBase Admin Panel**
   - Navigate to `http://120.55.49.54/_/` in your browser
   - Log in with your admin credentials

2. **Create Collections**
   - Click on "Collections" in the sidebar
   - Click "New collection"
   - Add the `orders` collection with all fields listed above
   - Repeat for the `freights` collection
   - Enable the unique indexes on `orders.client_article` and `freights.freight_number`

3. **Configure API Rules**
   - For development: Set all rules to allow access
   - For production: Implement proper authentication and authorization rules

4. **Test Connection**
   - Run the app
   - Try creating an order with images
   - Verify data appears in PocketBase admin panel

## Environment Variables

The app uses the following environment variable:

```
EXPO_PUBLIC_POCKETBASE_URL=http://120.55.49.54
```

This is already configured in `.env` file.

## Data Flow

1. **Create Order:**
   - User fills form with order details
   - Images are uploaded as files into the `pictures` field of the `orders` record (same multipart `create` call)
   - QR code generated with order information

2. **View Order:**
   - Order fetched from `orders` collection by ID (with `expand=freight`)
   - Image URLs are derived from the `pictures` filenames
   - QR code displayed with order details
   - Print functionality sends the label to the Kuaimai cloud print API (see `lib/services/print.service.ts`)

## Security Considerations

⚠️ **Important for Production:**

- Implement proper authentication
- Set up API rules to restrict access
- Use HTTPS for production deployments
- Validate all input data server-side
- Set appropriate file size limits
- Restrict file types to images only
- Implement rate limiting

## Troubleshooting

**Connection Issues:**
- Verify PocketBase server is running
- Check network connectivity
- Ensure correct URL in `.env` file
- Check firewall settings

**Upload Issues:**
- Verify the `pictures` file field exists on the `orders` collection
- Check file size limits
- Verify file permissions

**Data Not Saving:**
- Check API rules in collections
- Verify all required fields are provided
- Check console for error messages
- Verify collection schemas match expected format

**Duplicate Article / Freight Numbers:**
- Confirm the unique indexes on `orders.client_article` and `freights.freight_number` are enabled
- The app retries number generation up to 3 times when the server rejects a duplicate
