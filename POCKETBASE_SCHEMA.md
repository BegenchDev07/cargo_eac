# PocketBase Schema for Cargo Types & Freights

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
- **Unique:** Yes

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
