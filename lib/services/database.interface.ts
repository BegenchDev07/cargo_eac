import { WarehouseOrder } from '../types/order';

export type UpdateOrderInput = Partial<Omit<WarehouseOrder, 'id' | 'created_at' | 'pictures'>>;


export interface DatabaseService {
  createOrder(order: Omit<WarehouseOrder, 'id' | 'created_at'>, images?: string[]): Promise<WarehouseOrder>;
  getOrder(id: string): Promise<WarehouseOrder | null>;
  listOrders(page?: number, perPage?: number): Promise<{ items: WarehouseOrder[], totalPages: number, totalItems: number }>;
  updateOrder(id: string, order: UpdateOrderInput): Promise<WarehouseOrder | null>;
  deleteOrder(id: string): Promise<boolean>;
  uploadImage(orderId: string, imageUri: string, index: number): Promise<string>;
}
