import { WarehouseOrder } from '../lib/types/order';

export interface QRCodeData {
  order_id: string;
  client_article: string;
  weight: number;
  cubic_meters: number;
  product_name: string;
  quantity: number;
  client_number: string;
  date: string;
}

export const generateQRData = (order: WarehouseOrder): string => {
  const qrData: QRCodeData = {
    order_id: order.id || '',
    client_article: order.client_article,
    weight: order.weight,
    cubic_meters: order.cubic_meters,
    product_name: order.product_name,
    quantity: order.quantity,
    client_number: order.client_number,
    date: order.created_at || new Date().toISOString(),
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
