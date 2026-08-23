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
import * as Print from 'expo-print';
import md5 from 'md5';
import { Printer, ArrowLeft, CheckCircle, Pencil } from 'lucide-react-native';
import { WarehouseOrder } from '../../lib/types/order';
import { databaseService } from '../../lib/services/pocketbase.service';
import { generateQRData, formatOrderDate } from '../../utils/qr-generator';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import OrderEditModal from '../../components/OrderEditModal';

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

  useEffect(() => {
    loadOrder();
  }, [params.orderId]);


  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd}`;
  }
  
  
  const buildRenderDataArray = (order: any) => {
    const payload = [
      {
        "tester order": [
          {
            order_number: order.client_article,
            qr_data: order.qr_data || "",
            name: order.product_name,
            weight: `${order.weight}kg`,
            count: String(order.quantity),
            customer_phone: order.client_number,
            date: formatDate(order.created_at),
            volume: `${order.cubic_meters}m3`,
          },
        ],
      },
    ];
  
    // Important: API wants STRINGIFIED JSON with no extra spaces/newlines
    return JSON.stringify(payload);
  };
  
  

  const createDate = (date:any) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
  

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


 const signStr = ({ obj, secret }: any) => {
  // 1. Filter out undefined / null / empty values
  // debugger;
  const filteredObj = Object.entries(obj)
    .filter(
      ([_, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
    .reduce<Record<string, any>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  // 2. Sort keys alphabetically
  const keysSorted = Object.keys(filteredObj).sort();

  // 3. Concatenate key + value
  const str = keysSorted
    .map((key) => `${key}${filteredObj[key]}`)
    .join("");

  // 4. md5(secret + str + secret)
  return md5(secret + str + secret);
  // const test = md5(secret + str + secret);  
  // debugger;
}

  const handlePrint = async () => {
    if (!order || !qrData) return;    
    setPrinting(true);
    debugger;
    try {      
      const renderData = buildRenderDataArray(order);

const date = new Date();

const secret = "886dc8df0e384027a22c01001352dbc2";

const data = {
  appId: "1763132720820",
  printTimes: "1",
  sn: "KM118DW24200294",
  renderDataArray: renderData,
  templateId: "1634986912",
  timestamp: createDate(date),
};

const sign = signStr({ obj: data, secret });
const finalPayload = { ...data, sign };

fetch('https://cloud.kuaimai.com/api/cloud/print/tsplTemplatePrint', {
  method: 'POST',
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(finalPayload) // body is stringified JSON
})
  .then(res => res.json())
  .then(result => {
    console.log("Print result:", result);
  })
  .catch(err => {
    console.error("Print error:", err);
  });

      // const html = `
      //   <html>
      //     <head>
      //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
      //       <style>
      //         body {
      //           font-family: Arial, sans-serif;
      //           padding: 20px;
      //           display: flex;
      //           flex-direction: column;
      //           align-items: center;
      //         }
      //         .qr-container {
      //           margin: 20px 0;
      //           display: flex;
      //           justify-content: center;
      //         }
      //         .info {
      //           margin-top: 20px;
      //           width: 100%;
      //         }
      //         .info-row {
      //           margin: 8px 0;
      //           display: flex;
      //         }
      //         .label {
      //           font-weight: bold;
      //           width: 150px;
      //         }
      //         .value {
      //           flex: 1;
      //         }
      //         h2 {
      //           text-align: center;
      //           margin-bottom: 20px;
      //         }
      //       </style>
      //     </head>
      //     <body>
      //       <h2>${t.qr.orderTitle} #${order.id?.slice(0, 8)}</h2>
      //       <div class="qr-container">
      //         <svg width="300" height="300" viewBox="0 0 300 300">
      //           <rect width="300" height="300" fill="white"/>
      //         </svg>
      //       </div>
      //       <div class="info">
      //         <div class="info-row">
      //           <span class="label">${t.form.clientArticle}:</span>
      //           <span class="value">${order.client_article}</span>
      //         </div>
      //         <div class="info-row">
      //           <span class="label">${t.form.productName}:</span>
      //           <span class="value">${order.product_name}</span>
      //         </div>
      //         <div class="info-row">
      //           <span class="label">${t.form.weight}:</span>
      //           <span class="value">${order.weight} kg</span>
      //         </div>
      //         <div class="info-row">
      //           <span class="label">${t.form.cubicMeters}:</span>
      //           <span class="value">${order.cubic_meters.toFixed(4)} m³</span>
      //         </div>
      //         <div class="info-row">
      //           <span class="label">${t.form.quantity}:</span>
      //           <span class="value">${order.quantity}</span>
      //         </div>
      //         <div class="info-row">
      //           <span class="label">${t.form.clientNumber}:</span>
      //           <span class="value">${order.client_number}</span>
      //         </div>
      //         <div class="info-row">
      //           <span class="label">${t.form.date}:</span>
      //           <span class="value">${formatOrderDate(order.created_at || '')}</span>
      //         </div>
      //       </div>
      //     </body>
      //   </html>
      // `;

      // await Print.printAsync({ html });
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
            <Text style={styles.infoLabel}>{t.form.customerName}</Text>
            <Text style={styles.infoValue}>{order.customer_name}</Text>
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
                <Image
                  key={index}
                  source={{ uri: pic }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
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
