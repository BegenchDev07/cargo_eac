import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Printer, ArrowLeft, CheckCircle, Pencil } from 'lucide-react-native';
import { WarehouseOrder } from '../../lib/types/order';
import { databaseService } from '../../lib/services/pocketbase.service';
import { printOrderLabel } from '../../lib/services/print.service';
import { generateQRData, formatOrderDate } from '../../utils/qr-generator';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import OrderEditModal from '../../components/OrderEditModal';
import PrintCopiesModal from '../../components/PrintCopiesModal';
import ImagePreviewModal from '../../components/ImagePreviewModal';

const { width } = Dimensions.get('window');

export default function OrderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useLanguage();
  const [order, setOrder] = useState<WarehouseOrder | null>(null);
  const [qrData, setQrData] = useState<string>('');
  const [printing, setPrinting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [copiesModalVisible, setCopiesModalVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadOrder();
  }, [params.orderId]);


  const loadOrder = async () => {
    try {
      if (!params.orderId) {
        Alert.alert('Error', 'Order ID not provided');
        router.back();
        return;
      }

      const fetchedOrder = await databaseService.getOrder(params.orderId as string);
      if (fetchedOrder) {
        setOrder(fetchedOrder);
        const qrString = generateQRData(fetchedOrder);
        setQrData(qrString);
      } else {
        throw new Error('Order not found');
      }
    } catch (error) {
      console.error('Failed to load order:', error);
      Alert.alert(t.qr.errorTitle, t.qr.errorMessage);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSaved = (updatedOrder: WarehouseOrder) => {
    setOrder(updatedOrder);
    const qrString = generateQRData(updatedOrder);
    setQrData(qrString);
    setEditModalVisible(false);
    Alert.alert(t.orders.editSuccess);
  };

  const handlePrint = () => {
    if (!order || !qrData) return;
    setCopiesModalVisible(true);
  };

  const handleConfirmPrint = (copies: number) => {
    if (!order) return;
    setCopiesModalVisible(false);
    setPrinting(true);
    try {
      printOrderLabel(order, copies);
    } catch (error) {
      Alert.alert(t.qr.printError, t.qr.printErrorMessage);
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t.qr.loading}</Text>
      </View>
    );
  }

  if (!order || !qrData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{t.qr.errorMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.qr.orderTitle}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.statusBadge}>
          <CheckCircle size={20} color="#34C759" />
          <Text style={styles.statusText}>{t.qr.orderCreated}</Text>
        </View>

        <View style={styles.qrContainer}>
          <View style={styles.qrCard}>
            <QRCode value={qrData} size={Math.min(width - 80, 300)} />
          </View>
          <Text style={styles.orderId}>ID: {order.id?.slice(0, 8).toUpperCase()}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>{t.qr.orderInfo}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.dashboard.article}</Text>
            <Text style={styles.infoValue}>{order.client_article}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.form.customerName}</Text>
            <Text style={styles.infoValue}>{order.client_name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.form.productName}</Text>
            <Text style={styles.infoValue}>{order.product_name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.form.weight}</Text>
            <Text style={styles.infoValue}>{order.weight} kg</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.form.cubicMeters}</Text>
            <Text style={styles.infoValue}>{order.cubic_meters.toFixed(4)} m³</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.form.quantity}</Text>
            <Text style={styles.infoValue}>{order.quantity}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.form.clientNumber}</Text>
            <Text style={styles.infoValue}>{order.client_number}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.form.date}</Text>
            <Text style={styles.infoValue}>{formatOrderDate(order.created_at || '')}</Text>
          </View>
        </View>

        {order.pictures && order.pictures.length > 0 && (
          <View style={styles.imagesCard}>
            <Text style={styles.sectionTitle}>
              {t.form.photos} ({order.pictures.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              {order.pictures.map((pic, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setPreviewImage(pic)}
                  activeOpacity={0.8}>
                  <Image
                    source={{ uri: pic }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditModalVisible(true)}>
          <Pencil color="#FFFFFF" size={24} />
          <Text style={styles.editButtonText}>{t.orders.edit}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.printButton, printing && styles.printButtonDisabled]}
          onPress={handlePrint}
          disabled={printing}>
          {printing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Printer color="#FFFFFF" size={24} />
              <Text style={styles.printButtonText}>{t.qr.printLabel}</Text>
            </>
          )}
        </TouchableOpacity>

        <OrderEditModal
          visible={editModalVisible}
          order={order}
          onClose={() => setEditModalVisible(false)}
          onSaved={handleOrderSaved}
        />

        <PrintCopiesModal
          visible={copiesModalVisible}
          onCancel={() => setCopiesModalVisible(false)}
          onPrint={handleConfirmPrint}
          printing={printing}
        />

        <ImagePreviewModal
          uri={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 24,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  orderId: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  infoLabel: {
    fontSize: 15,
    color: '#8E8E93',
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
    textAlign: 'right',
  },
  imagesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageScroll: {
    marginTop: 12,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F2F2F7',
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  printButtonDisabled: {
    opacity: 0.6,
  },
  printButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
