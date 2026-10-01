export type CargoType = 'dangerous' | 'liquid' | 'brand' | 'standard';

export const CARGO_TYPES: CargoType[] = ['dangerous', 'liquid', 'brand', 'standard'];

export interface WarehouseOrder {
  id?: string;
  client_article: string;
  client_name?: string;
  weight: number;
  total_weight?: number;
  dimension_x?: number;
  dimension_y?: number;
  dimension_z?: number;
  cubic_meters: number;
  total_volume?: number;
  price?: number;
  product_name: string;
  quantity: number;
  client_number: string;
  cargo_type?: CargoType;
  freight_id?: string;
  freight_number?: string;
  qr_data?: any;
  qr_code?: string;
  pictures?: string[];
  date?: string;
  created_at?: string;
}

export interface OrderFormData {
  client_name: string;
  weight: string;
  dimension_x: string;
  dimension_y: string;
  dimension_z: string;
  product_name: string;
  quantity: string;
  client_number: string;
  cargo_type: CargoType;
  images: string[];
}

export interface ImageAsset {
  uri: string;
  width: number;
  height: number;
  type?: string;
}
