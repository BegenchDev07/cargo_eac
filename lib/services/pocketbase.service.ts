import PocketBase from 'pocketbase';
import { Platform } from 'react-native';
import { DatabaseService, UpdateOrderInput } from './database.interface';
import { WarehouseOrder } from '../types/order';
import { Freight, CreateFreightInput } from '../types/freight';
import Constants from 'expo-constants';

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

  private async generateClientArticle(): Promise<string> {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);
    const prefix = `${dd}${mm}${yy}`;

    try {
      // Use local-day boundaries so the filter matches the local date in the prefix
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const records = await pb.collection('orders').getFullList({
        filter: `client_article ~ "${prefix}-" && created >= "${startOfDay}" && created < "${endOfDay}"`,
        sort: '-client_article',
        limit: 1,
      });

      let nextCounter = 1;
      if (records.length > 0) {
        const lastArticle = records[0].client_article as string;
        const match = lastArticle.match(/-(\d{4})$/);
        if (match) {
          nextCounter = parseInt(match[1], 10) + 1;
        }
      }

      return `${prefix}-${String(nextCounter).padStart(4, '0')}`;
    } catch (error) {
      console.error('Failed to generate client article:', error);
      return `${prefix}-${String(Date.now()).slice(-4)}`;
    }
  }

  private async uriToFile(uri: string, fileName: string, type: string): Promise<File> {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new File([blob], fileName, { type: type || blob.type || 'image/jpeg' });
  }

  private isUniqueConstraintError(error: any, field: string): boolean {
    const data = error?.response?.data ?? error?.data?.data ?? error?.data;
    return error?.status === 400 && !!data?.[field];
  }

  async createOrder(order: Omit<WarehouseOrder, 'id' | 'created_at' | 'client_article'>, images?: string[]): Promise<WarehouseOrder> {
    const maxAttempts = 3;

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const formData = new FormData();
        const clientArticle = await this.generateClientArticle();

        formData.append('order_id', `order_${Date.now()}`);
        formData.append('client_article', clientArticle);
        formData.append('client_name', order.client_name || '');
        formData.append('weight', order.weight.toString());
        formData.append('total_weight', (order.total_weight ?? order.weight * order.quantity).toString());
        formData.append('cubic_meters', order.cubic_meters.toString());
        formData.append('total_volume', (order.total_volume ?? order.cubic_meters * order.quantity).toString());
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
            };

            if (Platform.OS === 'web') {
              const file = await this.uriToFile(imageUri, fileName, mimeTypes[fileExt] || 'image/jpeg');
              formData.append('pictures', file);
            } else {
              formData.append('pictures', {
                uri: imageUri,
                name: fileName,
                type: mimeTypes[fileExt] || 'image/jpeg',
              } as any);
            }
          }
        }

        try {
          const record = await pb.collection('orders').create(formData, {
            expand: 'freight',
          });

          return {
            id: record.id,
            client_article: record.client_article,
            client_name: record.client_name,
            weight: record.weight,
            total_weight: record.total_weight,
            cubic_meters: record.cubic_meters,
            total_volume: record.total_volume,
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
        } catch (createError: any) {
          // A unique index on client_article (see POCKETBASE_SETUP.md) makes the
          // server reject collisions; regenerate the article and retry.
          if (attempt < maxAttempts && this.isUniqueConstraintError(createError, 'client_article')) {
            console.warn(`client_article collision (attempt ${attempt}), regenerating`);
            continue;
          }
          throw createError;
        }
      }

      throw new Error('Failed to generate a unique client article');
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
        client_name: record.client_name,
        weight: record.weight,
        total_weight: record.total_weight,
        cubic_meters: record.cubic_meters,
        total_volume: record.total_volume,
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
        client_name: record.client_name,
        weight: record.weight,
        total_weight: record.total_weight,
        cubic_meters: record.cubic_meters,
        total_volume: record.total_volume,
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
      if (order.client_name !== undefined) updateData.client_name = order.client_name;
      if (order.weight !== undefined) updateData.weight = order.weight;
      if (order.total_weight !== undefined) updateData.total_weight = order.total_weight;
      if (order.cubic_meters !== undefined) updateData.cubic_meters = order.cubic_meters;
      if (order.total_volume !== undefined) updateData.total_volume = order.total_volume;
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
        client_name: record.client_name,
        weight: record.weight,
        total_weight: record.total_weight,
        cubic_meters: record.cubic_meters,
        total_volume: record.total_volume,
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
    const maxAttempts = 3;

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const freightNumber = await this.generateFreightNumber();

        try {
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
        } catch (createError: any) {
          // A unique index on freight_number (see POCKETBASE_SETUP.md) makes the
          // server reject collisions; regenerate the number and retry.
          if (attempt < maxAttempts && this.isUniqueConstraintError(createError, 'freight_number')) {
            console.warn(`freight_number collision (attempt ${attempt}), regenerating`);
            continue;
          }
          throw createError;
        }
      }

      throw new Error('Failed to generate a unique freight number');
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

  async unassignOrdersFromFreight(orderIds: string[]): Promise<void> {
    try {
      await Promise.all(
        orderIds.map((id) =>
          pb.collection('orders').update(id, { freight: null })
        )
      );
    } catch (error) {
      console.error('PocketBase unassign orders from freight error:', error);
      throw new Error(`Failed to unassign orders from freight: ${error}`);
    }
  }


  async uploadImage(orderId: string, imageUri: string, index: number): Promise<string> {
    return imageUri;
  }
}

export const databaseService = new PocketBaseService();
