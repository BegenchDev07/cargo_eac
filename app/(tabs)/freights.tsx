import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Truck, Plus, RefreshCw } from 'lucide-react-native';
import { databaseService } from '../../lib/services/pocketbase.service';
import { Freight } from '../../lib/types/freight';
import { WarehouseOrder } from '../../lib/types/order';
import { calculateOrderPrice, formatPrice } from '../../utils/pricing';
import { useLanguage } from '../../lib/i18n/LanguageContext';

export default function FreightsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [freights, setFreights] = useState<Freight[]>([]);
  const [orders, setOrders] = useState<WarehouseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newLoadDate, setNewLoadDate] = useState(new Date().toISOString().slice(0, 16));
  const [newNotes, setNewNotes] = useState('');
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [freightsResult, ordersResult] = await Promise.all([
        databaseService.listFreights(),
        databaseService.listOrders(1, 500),
      ]);
      setFreights(freightsResult);
      setOrders(ordersResult.items);
    } catch (error) {
      console.error('Failed to load freights:', error);
      Alert.alert(t.dashboard.errorTitle, t.dashboard.errorMessage);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getOrdersByFreight = (freightId: string) => {
    return orders.filter((order) => order.freight_id === freightId);
  };

  const getFreightTotalPrice = (freightId: string) => {
    return getOrdersByFreight(freightId).reduce((sum, order) => {
      return sum + calculateOrderPrice(order.weight, order.cubic_meters);
    }, 0);
  };

  const handleCreateFreight = async () => {
    if (!newLoadDate) return;

    setCreating(true);
    try {
      await databaseService.createFreight({
        load_date: new Date(newLoadDate).toISOString(),
        notes: newNotes,
        status: 'open',
      });
      setModalVisible(false);
      setNewNotes('');
      setNewLoadDate(new Date().toISOString().slice(0, 16));
      loadData();
    } catch (error) {
      console.error('Failed to create freight:', error);
      Alert.alert(t.dashboard.errorTitle, t.dashboard.createFreightError);
    } finally {
      setCreating(false);
    }
  };

  const handleFreightPress = (freightId: string) => {
    router.push({
      pathname: '/(tabs)/freight-detail',
      params: { freightId },
    });
  };

  const handleUpdateStatus = async (freightId: string, status: Freight['status']) => {
    try {
      await databaseService.updateFreight(freightId, { status });
      setFreights((prev) =>
        prev.map((f) => (f.id === freightId ? { ...f, status } : f))
      );
    } catch (error) {
      console.error('Failed to update freight status:', error);
      Alert.alert(t.dashboard.errorTitle, 'Failed to update freight status');
    }
  };

  if (loading && freights.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t.dashboard.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Truck size={28} color="#007AFF" />
          <Text style={styles.title}>{t.freights.title}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={loadData} disabled={loading}>
            <RefreshCw size={18} color="#007AFF" style={loading ? styles.spinning : undefined} />
            <Text style={styles.actionText}>{t.dashboard.refresh}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setModalVisible(true)}>
            <Plus size={18} color="#007AFF" />
            <Text style={styles.actionText}>{t.freights.createFreight}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {freights.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Truck size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>{t.freights.empty}</Text>
          </View>
        ) : (
          freights.map((freight) => {
            const freightOrders = getOrdersByFreight(freight.id!);

            return (
              <TouchableOpacity
                key={freight.id}
                style={styles.freightCard}
                onPress={() => handleFreightPress(freight.id!)}
                activeOpacity={0.7}>
                <View style={styles.freightHeader}>
                  <View style={styles.freightHeaderLeft}>
                    <Text style={styles.freightNumber}>{freight.freight_number}</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{freight.status}</Text>
                    </View>
                  </View>
                  <View style={styles.freightHeaderRight}>
                    <Text style={styles.freightMeta}>
                      {freightOrders.length} {t.freights.orders}
                    </Text>
                    <Text style={styles.freightTotal}>
                      {formatPrice(getFreightTotalPrice(freight.id!))}
                    </Text>
                  </View>
                </View>

                <View style={styles.freightInfo}>
                  <Text style={styles.freightDate}>
                    {t.dashboard.loadDate}: {new Date(freight.load_date).toLocaleString()}
                  </Text>
                  {freight.notes ? <Text style={styles.freightNotes}>{freight.notes}</Text> : null}
                  <View style={styles.statusRow}>
                    {(['open', 'closed', 'shipped'] as const).map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusButton,
                          freight.status === status && styles.statusButtonActive,
                          status === 'open' && freight.status === status && styles.statusButtonOpen,
                          status === 'closed' && freight.status === status && styles.statusButtonClosed,
                          status === 'shipped' && freight.status === status && styles.statusButtonShipped,
                        ]}
                        onPress={(event) => {
                          // On web the press bubbles to the card's TouchableOpacity
                          // and triggers navigation; stop it (no-op guard for native)
                          event.stopPropagation?.();
                          handleUpdateStatus(freight.id!, status);
                        }}>
                        <Text
                          style={[
                            styles.statusButtonText,
                            freight.status === status && styles.statusButtonTextActive,
                          ]}>
                          {t.freights.status[status]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.freights.createFreight}</Text>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>{t.dashboard.loadDate}</Text>
              <TextInput
                style={styles.modalInput}
                value={newLoadDate}
                onChangeText={setNewLoadDate}
                placeholder="yyyy-mm-ddTHH:mm"
              />
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>{t.dashboard.notes}</Text>
              <TextInput
                style={styles.modalInput}
                value={newNotes}
                onChangeText={setNewNotes}
                placeholder={t.dashboard.notes}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonSecondaryText}>{t.dashboard.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, creating && styles.modalButtonDisabled]}
                onPress={handleCreateFreight}
                disabled={creating}>
                {creating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>{t.dashboard.confirm}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2F2F7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  freightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  freightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  freightHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  freightNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
    textTransform: 'capitalize',
  },
  freightHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  freightMeta: {
    fontSize: 14,
    color: '#6b7280',
  },
  freightTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
    minWidth: 70,
    textAlign: 'right',
  },
  freightInfo: {
    marginTop: 8,
    gap: 4,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  statusButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
  },
  statusButtonOpen: {
    backgroundColor: '#34C759',
  },
  statusButtonClosed: {
    backgroundColor: '#FF9500',
  },
  statusButtonShipped: {
    backgroundColor: '#8E8E93',
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  freightDate: {
    fontSize: 13,
    color: '#8E8E93',
  },
  freightNotes: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  ordersList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    gap: 10,
  },
  noOrdersText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  orderInfo: {
    flex: 1,
  },
  orderProduct: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  orderDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  orderPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 480,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  modalInput: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#F9FAFB',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalButtonSecondary: {
    backgroundColor: '#F2F2F7',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonSecondaryText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '600',
  },
  spinning: {
    transform: [{ rotate: '180deg' }],
  },
});
