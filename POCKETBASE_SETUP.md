# PocketBase Setup Guide

This app uses PocketBase as the database backend. Follow these steps to set up your PocketBase instance.

## PocketBase Server

The app is configured to connect to: `http://120.55.49.54`

## Required Collections

You need to create the following collections in your PocketBase admin panel:

### 1. `orders` Collection

Create a collection named `orders` with the following fields:

| Field Name       | Field Type | Required | Options           |
|-----------------|------------|----------|-------------------|
| order_id        | Text       | Yes      | -                 |
| client_article  | Text       | Yes      | -                 |
| customer_name   | Text       | Yes      | -                 |
| weight          | Number     | Yes      | Min: 0            |
| size            | Text       | Yes      | -                 |
| product_name    | Text       | Yes      | -                 |
| quantity        | Number     | Yes      | Min: 1            |
| client_number   | Text       | Yes      | -                 |
| date            | Text       | Yes      | -                 |
| qr_data         | Text       | No       | -                 |
| image_urls      | Text       | No       | Multiple values   |

**Collection Settings:**
- API Rules: Allow all for testing (adjust for production)
- List/View Rule: Leave empty or set based on your needs
- Create Rule: Leave empty or set based on your needs
- Update Rule: Leave empty or set based on your needs
- Delete Rule: Leave empty or set based on your needs

### 2. `order_images` Collection

Create a collection named `order_images` with the following fields:

| Field Name | Field Type | Required | Options                  |
|-----------|------------|----------|--------------------------|
| image     | File       | Yes      | Max size: 5MB per file   |
|           |            |          | Allowed types: image/*   |

**Collection Settings:**
- API Rules: Allow all for testing (adjust for production)
- File settings:
  - Max file size: 5MB (or adjust as needed)
  - Allowed file types: image/jpeg, image/png, image/jpg

## Setup Steps

1. **Access PocketBase Admin Panel**
   - Navigate to `http://120.55.49.54/_/` in your browser
   - Log in with your admin credentials

2. **Create Collections**
   - Click on "Collections" in the sidebar
   - Click "New collection"
   - Add the `orders` collection with all fields listed above
   - Repeat for `order_images` collection

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
   - Images are uploaded to `order_images` collection
   - Order data with image URLs saved to `orders` collection
   - QR code generated with order information

2. **View Order:**
   - Order fetched from `orders` collection by ID
   - QR code displayed with order details
   - Print functionality generates PDF with QR code

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
- Verify `order_images` collection exists
- Check file size limits
- Ensure file field is named `image`
- Verify file permissions

**Data Not Saving:**
- Check API rules in collections
- Verify all required fields are provided
- Check console for error messages
- Verify collection schemas match expected format
