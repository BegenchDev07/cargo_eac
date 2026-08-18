import PocketBase from 'pocketbase';
import { DatabaseService, UpdateOrderInput } from './database.interface';
import { WarehouseOrder } from '../types/order';
import { Freight, CreateFreightInput } from '../types/freight';
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
      formData.append('cargo_type', order.cargo_type || 'standard');
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

      const record = await pb.collection('orders').create(formData, {
        expand: 'freight',
      });

      return {
        id: record.id,
        client_article: record.client_article,
        weight: record.weight,
        cubic_meters: record.cubic_meters,
        product_name: record.product_name,
        quantity: record.quantity,
        client_number: record.client_number,
        cargo_type: record.cargo_type,
        freight_id: record.expand?.freight?.id,
        freight_number: record.expand?.freight?.freight_number,
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
      const record = await pb.collection('orders').getOne(id, {
        expand: 'freight',
      });

      return {
        id: record.id,
        client_article: record.client_article,
        weight: record.weight,
        cubic_meters: record.cubic_meters,
        product_name: record.product_name,
        quantity: record.quantity,
        client_number: record.client_number,
        cargo_type: record.cargo_type,
        freight_id: record.expand?.freight?.id,
        freight_number: record.expand?.freight?.freight_number,
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
        expand: 'freight',
      });

      const items = resultList.items.map((record) => ({
        id: record.id,
        client_article: record.client_article,
        weight: record.weight,
        cubic_meters: record.cubic_meters,
        product_name: record.product_name,
        quantity: record.quantity,
        client_number: record.client_number,
        cargo_type: record.cargo_type,
        freight_id: record.expand?.freight?.id,
        freight_number: record.expand?.freight?.freight_number,
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
      if (order.cargo_type !== undefined) updateData.cargo_type = order.cargo_type;
      if (order.freight_id !== undefined) updateData.freight = order.freight_id || null;
      if (order.date !== undefined) updateData.date = order.date;
      if (order.qr_data !== undefined) updateData.qr_data = order.qr_data;

      const record = await pb.collection('orders').update(id, updateData, {
        expand: 'freight',
      });

      return {
        id: record.id,
        client_article: record.client_article,
        weight: record.weight,
        cubic_meters: record.cubic_meters,
        product_name: record.product_name,
        quantity: record.quantity,
        client_number: record.client_number,
        cargo_type: record.cargo_type,
        freight_id: record.expand?.freight?.id,
        freight_number: record.expand?.freight?.freight_number,
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

  async listFreights(): Promise<Freight[]> {
    try {
      const resultList = await pb.collection('freights').getList(1, 500, {
        sort: '-created',
      });

      return resultList.items.map((record) => ({
        id: record.id,
        freight_number: record.freight_number,
        load_date: record.load_date,
        notes: record.notes,
        status: record.status,
        created_at: record.created,
      }));
    } catch (error) {
      console.error('PocketBase list freights error:', error);
      return [];
    }
  }

  private async generateFreightNumber(): Promise<string> {
    try {
      const resultList = await pb.collection('freights').getList(1, 1, {
        sort: '-created',
      });

      if (resultList.items.length === 0) {
        return 'F-0001';
      }

      const lastNumber = resultList.items[0].freight_number as string;
      const match = lastNumber.match(/(\d+)$/);
      const lastIndex = match ? parseInt(match[1], 10) : 0;
      const nextIndex = lastIndex + 1;
      return `F-${String(nextIndex).padStart(4, '0')}`;
    } catch (error) {
      console.error('Failed to generate freight number:', error);
      return `F-${Date.now()}`;
    }
  }

  async updateFreight(
    id: string,
    input: Partial<Omit<Freight, 'id' | 'freight_number' | 'created_at'>>
  ): Promise<Freight | null> {
    try {
      const updateData: Record<string, any> = {};
      if (input.load_date !== undefined) updateData.load_date = input.load_date;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.status !== undefined) updateData.status = input.status;

      const record = await pb.collection('freights').update(id, updateData);

      return {
        id: record.id,
        freight_number: record.freight_number,
        load_date: record.load_date,
        notes: record.notes,
        status: record.status,
        created_at: record.created,
      };
    } catch (error) {
      console.error('PocketBase update freight error:', error);
      throw new Error(`Failed to update freight: ${error}`);
    }
  }

  async createFreight(input: CreateFreightInput): Promise<Freight> {
    try {
      const freightNumber = await this.generateFreightNumber();

      const record = await pb.collection('freights').create({
        freight_number: freightNumber,
        load_date: input.load_date,
        notes: input.notes || '',
        status: input.status || 'open',
      });

      return {
        id: record.id,
        freight_number: record.freight_number,
        load_date: record.load_date,
        notes: record.notes,
        status: record.status,
        created_at: record.created,
      };
    } catch (error) {
      console.error('PocketBase create freight error:', error);
      throw new Error(`Failed to create freight: ${error}`);
    }
  }

  async assignOrdersToFreight(orderIds: string[], freightId: string): Promise<void> {
    try {
      await Promise.all(
        orderIds.map((id) =>
          pb.collection('orders').update(id, { freight: freightId })
        )
      );
    } catch (error) {
      console.error('PocketBase assign orders to freight error:', error);
      throw new Error(`Failed to assign orders to freight: ${error}`);
    }
  }

  async uploadImage(orderId: string, imageUri: string, index: number): Promise<string> {
    return imageUri;
  }
}

export const databaseService = new PocketBaseService();
