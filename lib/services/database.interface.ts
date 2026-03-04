import { WarehouseOrder } from '../types/order';

export interface DatabaseService {
  createOrder(order: Omit<WarehouseOrder, 'id' | 'created_at'>, images?: string[]): Promise<WarehouseOrder>;
  getOrder(id: string): Promise<WarehouseOrder | null>;
  listOrders(page?: number, perPage?: number): Promise<{ items: WarehouseOrder[], totalPages: number, totalItems: number }>;
  uploadImage(orderId: string, imageUri: string, index: number): Promise<string>;
}
