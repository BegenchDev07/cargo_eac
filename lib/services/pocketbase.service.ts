import PocketBase from 'pocketbase';
import { DatabaseService, UpdateOrderInput } from './database.interface';
import { WarehouseOrder } from '../types/order';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

const pocketbaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_POCKETBASE_URL || process.env.EXPO_PUBLIC_POCKETBASE_URL || 'http://120.55.49.54';

const pb = new PocketBase(pocketbaseUrl);

pb.autoCancellation(false);

class PocketBaseService implements DatabaseService {
  private getFileUrl(collectionName: string, recordId: string, filename: string): string {
    return `${pocketbaseUrl}/api/files/${collectionName}/${recordId}/${filename}`;
  }

  private mapRecordToPictures(record: any): string[] {
    if (!record.pictures || record.pictures.length === 0) {
      return [];
    }
    return record.pictures.map((filename: string) =>
      this.getFileUrl('orders', record.id, filename)
    );
  }

  async createOrder(order: Omit<WarehouseOrder, 'id' | 'created_at'>, images?: string[]): Promise<WarehouseOrder> {
    try {
      const formData = new FormData();

      formData.append('order_id', `order_${Date.now()}`);
      formData.append('client_article', order.client_article);
      formData.append('weight', order.weight.toString());
      formData.append('cubic_meters', order.cubic_meters.toString());
      formData.append('product_name', order.product_name);
      formData.append('quantity', order.quantity.toString());
      formData.append('client_number', order.client_number);
      formData.append('date', new Date().toISOString());
      formData.append('qr_data', JSON.stringify(order.qr_data || {}));

      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const imageUri = images[i];
          const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
          const fileName = `image_${i}_${Date.now()}.${fileExt}`;

          const mimeTypes: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
          }          

          formData.append('pictures', {
            uri: images[i],
            name: fileName,
            type: mimeTypes[fileExt]
          }as any);
        }
      }

      const record = await pb.collection('orders').create(formData);

      return {
        id: record.id,
        client_article: record.client_article,
        weight: record.weight,
        cubic_meters: record.cubic_meters,
        product_name: record.product_name,
        quantity: record.quantity,
        client_number: record.client_number,
        qr_data: record.qr_data,
        pictures: this.mapRecordToPictures(record),
        date: record.date,
        created_at: record.created,
      };
    } catch (error) {
      console.error('PocketBase create error:', error);
      throw new Error(`Failed to create order: ${error}`);
    }
  }

  async getOrder(id: string): Promise<WarehouseOrder | null> {
    try {
      const record = await pb.collection('orders').getOne(id);

      return {
        id: record.id,
        client_article: record.client_article,
        weight: record.weight,
        cubic_meters: record.cubic_meters,
        product_name: record.product_name,
        quantity: record.quantity,
        client_number: record.client_number,
        qr_data: record.qr_data,
        pictures: this.mapRecordToPictures(record),
        date: record.date,
        created_at: record.created,
      };
    } catch (error) {
      console.error('PocketBase get error:', error);
      return null;
    }
  }

  async listOrders(page: number = 1, perPage: number = 50): Promise<{ items: WarehouseOrder[], totalPages: number, totalItems: number }> {
    try {
      const resultList = await pb.collection('orders').getList(page, perPage, {
        sort: '-created',
      });

      const items = resultList.items.map((record) => ({
        id: record.id,
        client_article: record.client_article,
        weight: record.weight,
        cubic_meters: record.cubic_meters,
        product_name: record.product_name,
        quantity: record.quantity,
        client_number: record.client_number,
        qr_data: record.qr_data,
        pictures: this.mapRecordToPictures(record),
        date: record.date,
        created_at: record.created,
      }));

      return {
        items,
        totalPages: resultList.totalPages,
        totalItems: resultList.totalItems,
      };
    } catch (error) {
      console.error('PocketBase list error:', error);
      return { items: [], totalPages: 0, totalItems: 0 };
    }
  }

  async updateOrder(id: string, order: UpdateOrderInput): Promise<WarehouseOrder | null> {
    try {
      const updateData: Record<string, any> = {};

      if (order.client_article !== undefined) updateData.client_article = order.client_article;
      if (order.weight !== undefined) updateData.weight = order.weight;
      if (order.cubic_meters !== undefined) updateData.cubic_meters = order.cubic_meters;
      if (order.product_name !== undefined) updateData.product_name = order.product_name;
      if (order.quantity !== undefined) updateData.quantity = order.quantity;
      if (order.client_number !== undefined) updateData.client_number = order.client_number;
      if (order.date !== undefined) updateData.date = order.date;
      if (order.qr_data !== undefined) updateData.qr_data = order.qr_data;

      const record = await pb.collection('orders').update(id, updateData);

      return {
        id: record.id,
        client_article: record.client_article,
        weight: record.weight,
        cubic_meters: record.cubic_meters,
        product_name: record.product_name,
        quantity: record.quantity,
        client_number: record.client_number,
        qr_data: record.qr_data,
        pictures: this.mapRecordToPictures(record),
        date: record.date,
        created_at: record.created,
      };
    } catch (error) {
      console.error('PocketBase update error:', error);
      throw new Error(`Failed to update order: ${error}`);
    }
  }

  async deleteOrder(id: string): Promise<boolean> {
    try {
      await pb.collection('orders').delete(id);
      return true;
    } catch (error) {
      console.error('PocketBase delete error:', error);
      throw new Error(`Failed to delete order: ${error}`);
    }
  }

  async uploadImage(orderId: string, imageUri: string, index: number): Promise<string> {
    return imageUri;
  }
}

export const databaseService = new PocketBaseService();
