import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import { Printer, Home, CheckCircle } from 'lucide-react-native';
import { WarehouseOrder } from '../lib/types/order';
import { generateQRData, formatOrderDate } from '../utils/qr-generator';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { printOrderLabel } from '../lib/services/print.service';


export default function QRDisplayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useLanguage();
  const [order, setOrder] = useState<WarehouseOrder | null>(null);
  const [qrData, setQrData] = useState<string>('');
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (params.orderData) {
      try {
        const parsedOrder = JSON.parse(params.orderData as string);
        setOrder(parsedOrder);
        const qrString = generateQRData(parsedOrder);
        setQrData(qrString);
      } catch (error) {
        Alert.alert(t.qr.errorTitle, t.qr.errorMessage);
        router.back();
      }
    }
  }, [params.orderData, t]);

  const handlePrint = async () => {
    if (!order || !qrData) return;    
    setPrinting(true);
    debugger;
    try {      
      printOrderLabel(order);

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

  const generateQRSVGBase64 = (data: string): string => {
    return Buffer.from(data).toString('base64');
  };

  const handleNewOrder = () => {
    router.replace('/');
  };

  if (!order || !qrData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>{t.qr.loading}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.successHeader}>
        <CheckCircle color="#059669" size={60} />
        <Text style={styles.successTitle}>{t.qr.orderCreated}</Text>
        <Text style={styles.successSubtitle}>
          ID: {order.id?.slice(0, 8).toUpperCase()}
        </Text>
      </View>

      <View style={styles.qrContainer}>
        <View style={styles.qrCard}>
          <QRCode value={qrData} size={300} />
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{t.qr.orderInfo}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t.form.customerName}:</Text>
          <Text style={styles.infoValue}>{order.client_name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t.form.productName}:</Text>
          <Text style={styles.infoValue}>{order.product_name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t.form.weight}:</Text>
          <Text style={styles.infoValue}>{order.weight} kg</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t.form.cubicMeters}:</Text>
          <Text style={styles.infoValue}>{order.cubic_meters.toFixed(4)} m³</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t.form.quantity}:</Text>
          <Text style={styles.infoValue}>{order.quantity}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t.form.clientNumber}:</Text>
          <Text style={styles.infoValue}>{order.client_number}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t.form.date}:</Text>
          <Text style={styles.infoValue}>{formatOrderDate(order.created_at || '')}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t.form.photos}:</Text>
          <Text style={styles.infoValue}>{order.pictures?.length || 0}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.printButton]}
          onPress={handlePrint}
          disabled={printing}
        >
          {printing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Printer color="#fff" size={24} />
              <Text style={styles.buttonText}>{t.qr.printLabel}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.homeButton]} onPress={handleNewOrder}>
          <Home color="#fff" size={24} />
          <Text style={styles.buttonText}>{t.qr.newOrder}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    width: 140,
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 40,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 12,
  },
  printButton: {
    backgroundColor: '#2563eb',
  },
  homeButton: {
    backgroundColor: '#059669',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
