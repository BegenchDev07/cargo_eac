# Warehouse Order Processing App - User Flow

## Screen Flow Diagram

```
┌─────────────────────────────────────┐
│                                     │
│     Order Form Screen (index)      │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Артикул: [_______________]    │ │
│  │ Вес: [_______________]        │ │
│  │ Размер: [_______________]     │ │
│  │ Наименование: [__________]    │ │
│  │ Кол-во: [_______________]     │ │
│  │ Номер клиента: [________]     │ │
│  │                               │ │
│  │ ┌────────────┬─────────────┐  │ │
│  │ │ 📷 Сделать │ 🖼️ Из       │  │ │
│  │ │    фото    │  галереи    │  │ │
│  │ └────────────┴─────────────┘  │ │
│  │                               │ │
│  │  [img1] [img2] [img3]...      │ │
│  │                               │ │
│  │  ┌─────────────────────────┐  │ │
│  │  │  Создать QR-код         │  │ │
│  │  └─────────────────────────┘  │ │
│  └───────────────────────────────┘ │
│                                     │
└──────────────┬──────────────────────┘
               │
               │ Submit Form
               │ 1. Validate fields
               │ 2. Upload images
               │ 3. Create order
               │ 4. Generate QR
               ▼
┌─────────────────────────────────────┐
│                                     │
│   QR Display Screen (qr-display)   │
│                                     │
│  ┌───────────────────────────────┐ │
│  │     ✓ Заказ создан!           │ │
│  │     ID: ABC12345              │ │
│  │                               │ │
│  │  ┌─────────────────────────┐  │ │
│  │  │                         │  │ │
│  │  │    [QR CODE 300x300]    │  │ │
│  │  │                         │  │ │
│  │  └─────────────────────────┘  │ │
│  │                               │ │
│  │  Информация о заказе:         │ │
│  │  Артикул: ART-123            │ │
│  │  Наименование: Product       │ │
│  │  Вес: 5.5 кг                 │ │
│  │  Размер: Large               │ │
│  │  Количество: 10              │ │
│  │  Номер клиента: CLIENT-001   │ │
│  │  Дата: 12.10.2025 14:30      │ │
│  │  Фотографий: 3               │ │
│  │                               │ │
│  │  ┌─────────────────────────┐  │ │
│  │  │  🖨️ Печать этикетки      │  │ │
│  │  └─────────────────────────┘  │ │
│  │  ┌─────────────────────────┐  │ │
│  │  │  🏠 Новый заказ          │  │ │
│  │  └─────────────────────────┘  │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

## Data Flow

```
┌──────────────┐
│   User Input │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  Validation Layer    │
│  (utils/validation)  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────┐
│  Database Service Layer  │
│  (lib/services/)         │
└──────┬───────────────────┘
       │
       ├─────────────────┐
       ▼                 ▼
┌─────────────┐   ┌──────────────┐
│  Supabase   │   │  Supabase    │
│  Database   │   │  Storage     │
│  (orders)   │   │  (images)    │
└─────────────┘   └──────────────┘
```

## QR Code Generation Flow

```
Order Data
    │
    ▼
┌───────────────────────┐
│  generateQRData()     │
│  (utils/qr-generator) │
└───────┬───────────────┘
        │
        ▼ Creates JSON
{
  "order_id": "uuid",
  "client_article": "...",
  "weight": 0.0,
  "size": "...",
  "product_name": "...",
  "quantity": 0,
  "client_number": "...",
  "date": "ISO timestamp"
}
        │
        ▼
┌───────────────────────┐
│  QRCode Component     │
│  (react-native-       │
│   qrcode-svg)         │
└───────┬───────────────┘
        │
        ▼
    QR Code SVG
    (displayed)
        │
        ▼
┌───────────────────────┐
│  Print API            │
│  (expo-print)         │
└───────────────────────┘
```

## Component Architecture

```
app/_layout.tsx (Root)
    │
    ├── app/index.tsx (Order Form)
    │   │
    │   ├── components/ImagePicker.tsx
    │   │   ├── Camera API
    │   │   └── Gallery API
    │   │
    │   ├── utils/validation.ts
    │   │
    │   └── lib/services/supabase.service.ts
    │       ├── createOrder()
    │       └── uploadImage()
    │
    └── app/qr-display.tsx (QR Display)
        │
        ├── QRCode Component
        │
        ├── utils/qr-generator.ts
        │   └── generateQRData()
        │
        └── expo-print
            └── printAsync()
```

## State Management

### Order Form State
```typescript
formData: {
  client_article: string
  weight: string
  size: string
  product_name: string
  quantity: string
  client_number: string
  images: string[]
}

errors: ValidationErrors
loading: boolean
uploadProgress: string
```

### QR Display State
```typescript
order: WarehouseOrder
qrData: string (JSON)
printing: boolean
```

## Error Handling Flow

```
User Action
    │
    ▼
Try Operation
    │
    ├─── Success ──────► Continue
    │
    └─── Error
         │
         ▼
    Catch Error
         │
         ├─── Network Error ──► "Проверьте подключение"
         ├─── Validation ─────► Show field errors
         ├─── Upload Error ───► "Не удалось загрузить"
         └─── Unknown ────────► Generic error message
         │
         ▼
    Display Alert
         │
         ▼
    Allow Retry
```

## Permission Flow

```
App Launch
    │
    ▼
User taps Camera/Gallery
    │
    ▼
Check Permissions
    │
    ├─── Granted ──────────► Open Camera/Gallery
    │
    └─── Not Granted
         │
         ▼
    Request Permissions
         │
         ├─── User Grants ───► Open Camera/Gallery
         │
         └─── User Denies
              │
              ▼
         Show Alert
         "Требуются разрешения"
              │
              ▼
         Direct to Settings
```

## Image Processing Pipeline

```
1. Select/Capture Image
        │
        ▼
2. Get Image URI
   (file:// or content://)
        │
        ▼
3. Display Thumbnail
   (local preview)
        │
        ▼
4. On Submit:
   Read as Base64
        │
        ▼
5. Convert to ArrayBuffer
        │
        ▼
6. Upload to Supabase
   Storage Bucket
        │
        ▼
7. Get Public URL
        │
        ▼
8. Store URL in Database
   (image_urls array)
```

## Database Schema Relationships

```
warehouse_orders
├── id (PK)
├── client_article
├── weight
├── size
├── product_name
├── quantity
├── client_number
├── qr_data (JSONB)
├── image_urls[] ──────► References
├── created_at           │
                         │
                         ▼
            Supabase Storage: order-images
            ├── {orderId}/
                ├── {orderId}_0_{timestamp}.jpg
                ├── {orderId}_1_{timestamp}.jpg
                └── {orderId}_2_{timestamp}.jpg
```

## Migration Path (Supabase → PocketBase)

```
Current: Supabase
    │
    ├── Database Service Interface (Abstract)
    │   ├── createOrder()
    │   ├── getOrder()
    │   └── uploadImage()
    │
    ├── Implementation: SupabaseService ✓
    │
    └── Future: PocketBaseService
        │
        └── Same Interface
            (No UI changes needed)
```

## Key Features Summary

✅ Russian language interface
✅ Multi-image support (up to 10)
✅ Real-time validation
✅ Progress indicators
✅ QR code generation
✅ Android printing
✅ Cloud storage
✅ Offline-ready architecture
✅ Easy database migration
✅ Type-safe with TypeScript
