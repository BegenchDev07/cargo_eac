export interface WarehouseOrder {
  id?: string;
  client_article: string;
  weight: number;
  cubic_meters: number;
  product_name: string;
  quantity: number;
  client_number: string;
  qr_data?: any;
  pictures?: string[];
  date?: string;
  created_at?: string;
}

export interface OrderFormData {
  client_article: string;
  weight: string;
  dimension_x: string;
  dimension_y: string;
  dimension_z: string;
  product_name: string;
  quantity: string;
  client_number: string;
  images: string[];
}

export interface ImageAsset {
  uri: string;
  width: number;
  height: number;
  type?: string;
}
