# Warehouse Order Processing App

A React Native Android app for warehouse workers to process orders, capture product images, and generate QR codes for package labeling.

## Features

✅ **Comprehensive Order Form** (Russian Language)
- Client article number (Артикул)
- Weight (Вес)
- Size (Размер)
- Product name (Наименование)
- Quantity in box (Кол-во)
- Client number (Номер клиента)

✅ **Multi-Image Capture**
- Take photos with camera
- Select from gallery
- Support for up to 10 images per order
- Image preview with remove functionality

✅ **QR Code Generation**
- Automatic QR code generation with all order details
- Includes timestamp
- JSON format for easy scanning and parsing

✅ **Label Printing**
- Android print dialog integration
- Print QR code labels directly from the app
- Formatted order information on label

✅ **Cloud Storage**
- All order data stored in Supabase
- Product images uploaded to cloud storage
- Full order history and traceability

## Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **Database**: Supabase (with migration path to PocketBase)
- **QR Code**: react-native-qrcode-svg
- **Image Handling**: expo-image-picker
- **Printing**: expo-print

## Prerequisites

- Node.js 16+ installed
- Expo CLI installed (`npm install -g expo-cli`)
- Android device or emulator

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (already set up):
```
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-key>
```

3. Start the development server:
```bash
npm run dev
```

4. Open on Android device using Expo Go app or run on emulator

## Usage

### Creating an Order

1. **Fill in Order Details**
   - Enter all required fields (marked with *)
   - Use numeric keyboard for weight and quantity
   - All labels are in Russian

2. **Add Product Photos**
   - Tap "Сделать фото" to take new photos
   - Tap "Из галереи" to select existing images
   - Remove unwanted images by tapping the X button
   - Maximum 10 photos per order

3. **Submit Order**
   - Tap "Создать QR-код" button
   - App validates all fields
   - Images upload to cloud storage
   - Order is saved to database

### Viewing and Printing QR Code

1. **After submission**, you'll see:
   - Large QR code containing all order data
   - Summary of order details
   - Order ID

2. **Print Label**
   - Tap "Печать этикетки" to open print dialog
   - Select printer (thermal or regular)
   - Print the label for the package

3. **New Order**
   - Tap "Новый заказ" to return to form
   - Form resets for next order

## Validation Rules

- All fields are required
- Weight must be a positive decimal number
- Quantity must be a positive integer
- At least one product photo required
- Error messages display in Russian

## Database Schema

### warehouse_orders table
- `id` (UUID) - Primary key
- `client_article` (text) - Auto-generated order article (DDMMYY-NNNN)
- `client_name` (text) - Customer name
- `weight` (decimal) - Product weight in kg
- `size` (text) - Product size
- `product_name` (text) - Product name
- `quantity` (integer) - Number of boxes
- `client_number` (text) - Client identifier
- `qr_data` (jsonb) - QR code payload
- `image_urls` (text[]) - Array of image URLs
- `created_at` (timestamp) - Creation timestamp

### Storage
- Bucket: `order-images`
- Organized by order ID
- Public read access (for testing)

## QR Code Data Format

```json
{
  "order_id": "uuid",
  "client_article": "ART-12345",
  "weight": 5.5,
  "size": "Large",
  "product_name": "Sample Product",
  "quantity": 10,
  "client_number": "CLIENT-001",
  "date": "2025-10-12T14:30:00Z"
}
```

## Project Structure

```
├── app/
│   ├── _layout.tsx          # Root navigation layout
│   ├── index.tsx            # Order form screen
│   └── qr-display.tsx       # QR code display screen
├── components/
│   └── ImagePicker.tsx      # Image picker component
├── lib/
│   ├── services/
│   │   ├── database.interface.ts   # Database service interface
│   │   ├── supabase.client.ts      # Supabase client
│   │   └── supabase.service.ts     # Supabase implementation
│   └── types/
│       └── order.ts         # TypeScript types
├── utils/
│   ├── qr-generator.ts      # QR code utilities
│   └── validation.ts        # Form validation
└── types/
    └── env.d.ts             # Environment type declarations
```

## Migrating to PocketBase

See [POCKETBASE_MIGRATION.md](./POCKETBASE_MIGRATION.md) for detailed instructions on migrating from Supabase to PocketBase.

## Development

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

## Permissions

The app requires the following Android permissions:
- CAMERA - For taking product photos
- READ_EXTERNAL_STORAGE - For selecting images from gallery
- WRITE_EXTERNAL_STORAGE - For saving files
- READ_MEDIA_IMAGES - For Android 13+ media access

## Troubleshooting

### Camera not working
- Ensure camera permissions are granted
- Check device has camera hardware
- Restart the app after granting permissions

### Images not uploading
- Check internet connection
- Verify Supabase credentials in .env
- Check storage bucket permissions

### QR code not scanning
- Ensure QR code is displayed at adequate size
- Check printer resolution settings
- Verify JSON format is valid

## Future Enhancements

- [ ] Order history view
- [ ] Offline mode with sync
- [ ] Barcode scanning for article numbers
- [ ] Multi-language support
- [ ] Order search and filtering
- [ ] Export orders to CSV
- [ ] Authentication and user management
- [ ] Role-based access control

## License

Private - Internal warehouse use only

## Support

For issues or questions, contact your system administrator.
