# PocketBase Schema for Cargo Types & Freights

> The full, authoritative schema for the `orders` and `freights` collections (as actually used by
> `lib/services/pocketbase.service.ts`) is documented in `POCKETBASE_SETUP.md`. This file only
> covers the later additions: `cargo_type`, the `freight` relation, and the `freights` collection.
> Note: the code does **not** use a `size` or `image_urls` field or an `order_images` collection;
> order photos are stored as files in the `pictures` field on `orders`, and `uploadImage()` in the
> service is currently an unused stub that returns the local URI unchanged.

## 1. Update `orders` collection

Add these two fields:

### `cargo_type`
- **Type:** Select
- **Required:** No
- **Default:** `standard`
- **Values:**
  - `dangerous`
  - `liquid`
  - `brand`
  - `standard`

### `freight`
- **Type:** Relation
- **Required:** No
- **Related collection:** `freights`
- **Relation type:** Single
- **On delete:** Set null

## 2. Create `freights` collection

Create a new collection with these fields:

### `freight_number`
- **Type:** Text
- **Required:** Yes
- **Unique:** Yes — required: the app generates numbers client-side and relies on the server
  rejecting duplicates to detect collisions and retry (same for `orders.client_article`).

### `load_date`
- **Type:** DateTime
- **Required:** Yes

### `notes`
- **Type:** Text
- **Required:** No

### `status`
- **Type:** Select
- **Required:** No
- **Default:** `open`
- **Values:**
  - `open`
  - `closed`
  - `shipped`

## 3. API Rules (for development)

If you want the dashboard to read/write without authentication, set these collections to public:

- `orders`: List/View/Create/Update/Delete → public
- `freights`: List/View/Create/Update/Delete → public

For production, restrict these to authenticated users or admin-only.
