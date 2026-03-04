import PocketBase from 'pocketbase';
import { DatabaseService } from './database.interface';
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
        created_at: record.created || record.date,
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
        created_at: record.created || record.date,
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
        created_at: record.created || record.date,
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

  async uploadImage(orderId: string, imageUri: string, index: number): Promise<string> {
    return imageUri;
  }
}

export const databaseService = new PocketBaseService();
