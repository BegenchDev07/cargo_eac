import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { databaseService } from '../../lib/services/pocketbase.service';
import { WarehouseOrder } from '../../lib/types/order';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { Package, Calendar, RefreshCw, Pencil } from 'lucide-react-native';
import OrderEditModal from '../../components/OrderEditModal';

export default function OrdersScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<WarehouseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WarehouseOrder | null>(null);

  const loadOrders = async () => {
    try {
      const result = await databaseService.listOrders(1, 50);
      setOrders(result.items);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleOrderPress = (order: WarehouseOrder) => {
    router.push({
      pathname: '/(tabs)/order-detail',
      params: {
        orderId: order.id,
      },
    });
  };

  const openEditModal = (order: WarehouseOrder) => {
    setEditingOrder(order);
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditingOrder(null);
  };

  const handleOrderSaved = (updatedOrder: WarehouseOrder) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
    );
    closeEditModal();
    Alert.alert(t.orders.editSuccess);
  };

  const renderOrderItem = ({ item }: { item: WarehouseOrder }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleOrderPress(item)}
      activeOpacity={0.7}>
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <Package size={20} color="#007AFF" />
          <Text style={styles.orderTitle}>{item.product_name}</Text>
        </View>
        <View style={styles.orderHeaderRight}>
          <Text style={styles.orderQuantity}>×{item.quantity}</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Pencil size={18} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t.form.customerName}:</Text>
          <Text style={styles.detailValue}>{item.customer_name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t.form.clientNumber}:</Text>
          <Text style={styles.detailValue}>{item.client_number}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t.form.cubicMeters}:</Text>
          <Text style={styles.detailValue}>{item.cubic_meters.toFixed(4)} m³</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t.form.weight}:</Text>
          <Text style={styles.detailValue}>{item.weight} kg</Text>
        </View>
      </View>

      {item.pictures && item.pictures.length > 0 && (
        <View style={styles.imageContainer}>
          {item.pictures.slice(0, 3).map((pic, index) => (
            <Image
              key={index}
              source={{ uri: pic }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ))}
          {item.pictures.length > 3 && (
            <View style={styles.moreImages}>
              <Text style={styles.moreImagesText}>+{item.pictures.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {item.created_at && (
        <View style={styles.dateContainer}>
          <Calendar size={14} color="#8E8E93" />
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.orders?.title || 'Orders'}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.orders?.title || 'Orders'}</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={64} color="#C7C7CC" />
          <Text style={styles.emptyText}>{t.orders?.empty || 'No orders yet'}</Text>
          <Text style={styles.emptySubtext}>{t.orders?.emptyHint || 'Create your first order in the Insert tab'}</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id || ''}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleRefresh}
        activeOpacity={0.8}
        disabled={refreshing}>
        <RefreshCw
          size={24}
          color="#FFFFFF"
          style={refreshing ? styles.spinning : undefined}
        />
      </TouchableOpacity>

      <OrderEditModal
        visible={editModalVisible}
        order={editingOrder}
        onClose={closeEditModal}
        onSaved={handleOrderSaved}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  orderHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  orderQuantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  editButton: {
    padding: 4,
  },
  orderDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
    textAlign: 'right',
  },
  imageContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  moreImages: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  dateText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spinning: {
    transform: [{ rotate: '180deg' }],
  },
});
