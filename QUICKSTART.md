# Quick Start Guide

Get your warehouse order processing app running in 5 minutes!

## Prerequisites
- Node.js 16+ installed
- Android device or emulator
- Expo Go app (optional, for quick testing)

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Run on Android**
   - Press `a` to open in Android emulator
   - OR scan QR code with Expo Go app

## First Order

1. **Fill out the form** with test data:
   - Артикул: `TEST-001`
   - Вес: `5.5`
   - Размер: `Medium`
   - Наименование: `Test Product`
   - Кол-во: `10`
   - Номер клиента: `CLIENT-001`

2. **Add photos**:
   - Tap "Сделать фото" to take a photo
   - Or tap "Из галереи" to select existing images
   - Add at least 1 photo

3. **Submit**:
   - Tap "Создать QR-код"
   - Wait for upload progress
   - View generated QR code

4. **Print** (optional):
   - Tap "Печать этикетки"
   - Select printer in Android print dialog

5. **Create another order**:
   - Tap "Новый заказ"
   - Form resets automatically

## Testing the Database

All order data is automatically saved to Supabase. To view your orders:

1. Open your Supabase dashboard
2. Navigate to Table Editor
3. Select `warehouse_orders` table
4. See all created orders with their data

## File Structure

```
project/
├── app/                    # Screens
│   ├── index.tsx          # Order form
│   └── qr-display.tsx     # QR code display
├── components/            # Reusable components
├── lib/
│   ├── services/         # Database layer
│   └── types/           # TypeScript types
├── utils/               # Helper functions
└── README.md           # Full documentation
```

## Common Issues

### "Cannot find module" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Camera not working
- Grant camera permissions when prompted
- Restart app after granting permissions

### TypeScript errors
```bash
npm run typecheck
```

## Next Steps

- Read [README.md](./README.md) for full documentation
- Check [APP_FLOW.md](./APP_FLOW.md) for architecture details
- See [POCKETBASE_MIGRATION.md](./POCKETBASE_MIGRATION.md) for database migration

## Available Scripts

- `npm run dev` - Start development server
- `npm run typecheck` - Check TypeScript types
- `npm run lint` - Run linter
- `npm run build:web` - Build for web (testing only)

## Support

For issues:
1. Check TypeScript compilation: `npm run typecheck`
2. Review error logs in terminal
3. Check Supabase connectivity in browser
4. Verify .env file has correct credentials

## Production Build

To create a production build:

1. **EAS Build** (recommended):
   ```bash
   npm install -g eas-cli
   eas build --platform android
   ```

2. **Local Build**:
   ```bash
   npx expo prebuild
   cd android
   ./gradlew assembleRelease
   ```

The APK will be available in `android/app/build/outputs/apk/release/`

## Environment Variables

Already configured in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

To switch to PocketBase, see [POCKETBASE_MIGRATION.md](./POCKETBASE_MIGRATION.md)

---

**Ready to start processing orders!** 📦

Run `npm run dev` and scan the QR code with your Android device.
