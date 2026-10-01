import { WarehouseOrder } from '../lib/types/order';

// Only the fields the warehouse staff actually needs when scanning a label —
// kept short so the QR stays low-density and easy to scan/print.
export interface QRCodeData {
  client_article: string;
  client_name?: string;
  product_name: string;
  total_weight?: number;
  total_volume?: number;
  cargo_type?: string;
  client_number: string;
}

export const generateQRData = (order: WarehouseOrder): string => {
  const qrData: QRCodeData = {
    client_article: order.client_article,
    client_name: order.client_name,
    product_name: order.product_name,
    total_weight: order.total_weight,
    total_volume: order.total_volume,
    cargo_type: order.cargo_type,
    client_number: order.client_number,
  };

  return JSON.stringify(qrData, null, 2);
};

export const formatOrderDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
