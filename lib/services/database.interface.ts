import { WarehouseOrder } from '../types/order';
import { Freight, CreateFreightInput } from '../types/freight';

export type UpdateOrderInput = Partial<Omit<WarehouseOrder, 'id' | 'created_at' | 'pictures' | 'freight_number'>>;

export interface DatabaseService {
  createOrder(order: Omit<WarehouseOrder, 'id' | 'created_at'>, images?: string[]): Promise<WarehouseOrder>;
  getOrder(id: string): Promise<WarehouseOrder | null>;
  listOrders(page?: number, perPage?: number): Promise<{ items: WarehouseOrder[], totalPages: number, totalItems: number }>;
  updateOrder(id: string, order: UpdateOrderInput): Promise<WarehouseOrder | null>;
  deleteOrder(id: string): Promise<boolean>;
  listFreights(): Promise<Freight[]>;
  createFreight(input: CreateFreightInput): Promise<Freight>;
  updateFreight(id: string, input: Partial<Omit<Freight, 'id' | 'freight_number' | 'created_at'>>): Promise<Freight | null>;
  assignOrdersToFreight(orderIds: string[], freightId: string): Promise<void>;
  uploadImage(orderId: string, imageUri: string, index: number): Promise<string>;
}
