import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Package } from 'lucide-react-native';
import ImagePicker from '../../components/ImagePicker';
import { OrderFormData, CARGO_TYPES } from '../../lib/types/order';
import { validateOrderForm, hasValidationErrors, ValidationErrors } from '../../utils/validation';
import { databaseService } from '../../lib/services/pocketbase.service';
import { useLanguage } from '../../lib/i18n/LanguageContext';

export default function OrderFormScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});

  const [formData, setFormData] = useState<OrderFormData>({
    client_name: '',
    weight: '',
    dimension_x: '',
    dimension_y: '',
    dimension_z: '',
    product_name: '',
    quantity: '',
    client_number: '',
    cargo_type: 'standard',
    images: [],
  });

  const updateField = (field: keyof OrderFormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validateOrderForm(formData, t);

    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      Alert.alert(t.validation.validationError, t.validation.fillAllFields);
      return;
    }

    setLoading(true);
    setUploadProgress(t.upload.uploadingPhotos);

    try {
      setUploadProgress(t.upload.creatingOrder);

      const dimX = parseFloat(formData.dimension_x);
      const dimY = parseFloat(formData.dimension_y);
      const dimZ = parseFloat(formData.dimension_z);
      const quantity = parseInt(formData.quantity, 10);
      // Total volume = volume of one box (cm³ → m³) times the number of boxes
      const cubicMeters = ((dimX * dimY * dimZ) / 1000000) * quantity;

      const orderData = {
        client_name: formData.client_name,
        weight: parseFloat(formData.weight),
        dimension_x: dimX,
        dimension_y: dimY,
        dimension_z: dimZ,
        cubic_meters: cubicMeters,
        product_name: formData.product_name,
        quantity: quantity,
        client_number: formData.client_number,
        cargo_type: formData.cargo_type,
        qr_data: {},
      };

      const createdOrder = await databaseService.createOrder(orderData, formData.images);

      setUploadProgress('');
      setLoading(false);

      router.push({
        pathname: '/qr-display',
        params: {
          orderId: createdOrder.id,
          orderData: JSON.stringify(createdOrder),
        },
      });

      setFormData({
        client_name: '',
        weight: '',
        dimension_x: '',
        dimension_y: '',
        dimension_z: '',
        product_name: '',
        quantity: '',
        client_number: '',
        cargo_type: 'standard',
        images: [],
      });
    } catch (error) {
      setLoading(false);
      setUploadProgress('');
      Alert.alert(t.upload.errorTitle, t.upload.errorMessage);
      console.error('Order creation error:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Package color="#1f2937" size={40} />
          <Text style={styles.title}>{t.app.title}</Text>
          <Text style={styles.subtitle}>{t.app.subtitle}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.form.customerName} {t.form.required}</Text>
            <TextInput
              style={[styles.input, errors.client_name && styles.inputError]}
              value={formData.client_name}
              onChangeText={(text) => updateField('client_name', text)}
              placeholder={t.placeholders.customerName}
              placeholderTextColor="#9ca3af"
              editable={!loading}
            />
            {errors.client_name && (
              <Text style={styles.errorText}>{errors.client_name}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.form.productName} {t.form.required}</Text>
            <TextInput
              style={[styles.input, errors.product_name && styles.inputError]}
              value={formData.product_name}
              onChangeText={(text) => updateField('product_name', text)}
              placeholder={t.placeholders.productName}
              placeholderTextColor="#9ca3af"
              editable={!loading}
            />
            {errors.product_name && (
              <Text style={styles.errorText}>{errors.product_name}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.form.clientNumber} {t.form.required}</Text>
            <TextInput
              style={[styles.input, errors.client_number && styles.inputError]}
              value={formData.client_number}
              onChangeText={(text) => updateField('client_number', text)}
              placeholder={t.placeholders.clientNumber}
              placeholderTextColor="#9ca3af"
              editable={!loading}
            />
            {errors.client_number && (
              <Text style={styles.errorText}>{errors.client_number}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.form.weight} {t.form.required}</Text>
            <TextInput
              style={[styles.input, errors.weight && styles.inputError]}
              value={formData.weight}
              onChangeText={(text) => updateField('weight', text.replaceAll(',', '.'))}
              placeholder={t.placeholders.weight}
              placeholderTextColor="#9ca3af"
              keyboardType="default"
              editable={!loading}
            />
            {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.form.dimensions} {t.form.required}</Text>
            <View style={styles.dimensionsRow}>
              <View style={styles.dimensionInput}>
                <Text style={styles.dimensionLabel}>X (cm)</Text>
                <TextInput
                  style={[styles.input, errors.dimension_x && styles.inputError]}
                  value={formData.dimension_x}
                  onChangeText={(text) => updateField('dimension_x', text.replaceAll(',', '.'))}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="default"
                  inputMode="decimal"
                  editable={!loading}
                />
              </View>
              <View style={styles.dimensionInput}>
                <Text style={styles.dimensionLabel}>Y (cm)</Text>
                <TextInput
                  style={[styles.input, errors.dimension_y && styles.inputError]}
                  value={formData.dimension_y}
                  onChangeText={(text) => updateField('dimension_y', text.replaceAll(',', '.'))}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="default"
                  inputMode="decimal"
                  editable={!loading}
                />
              </View>
              <View style={styles.dimensionInput}>
                <Text style={styles.dimensionLabel}>Z (cm)</Text>
                <TextInput
                  style={[styles.input, errors.dimension_z && styles.inputError]}
                  value={formData.dimension_z}
                  onChangeText={(text) => updateField('dimension_z', text.replaceAll(',', '.'))}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="default"
                  inputMode="decimal"
                  editable={!loading}
                />
              </View>
            </View>
            {(errors.dimension_x || errors.dimension_y || errors.dimension_z) && (
              <Text style={styles.errorText}>
                {errors.dimension_x || errors.dimension_y || errors.dimension_z}
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.form.quantity} {t.form.required}</Text>
            <TextInput
              style={[styles.input, errors.quantity && styles.inputError]}
              value={formData.quantity}
              onChangeText={(text) => updateField('quantity', text)}
              placeholder={t.placeholders.quantity}
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              editable={!loading}
            />
            {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.form.cargoType}</Text>
            <View style={styles.cargoTypesRow}>
              {CARGO_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.cargoTypeButton,
                    formData.cargo_type === type && styles.cargoTypeButtonActive,
                  ]}
                  onPress={() => updateField('cargo_type', type)}
                  disabled={loading}>
                  <Text
                    style={[
                      styles.cargoTypeButtonText,
                      formData.cargo_type === type && styles.cargoTypeButtonTextActive,
                    ]}>
                    {t.dashboard.cargoTypes[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.form.photos} {t.form.required}</Text>
            <ImagePicker
              images={formData.images}
              onImagesChange={(images) => updateField('images', images)}
            />
            {errors.images && <Text style={styles.errorText}>{errors.images}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitButtonText}>{uploadProgress}</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>{t.form.submit}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  dimensionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cargoTypesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cargoTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  cargoTypeButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  cargoTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  cargoTypeButtonTextActive: {
    color: '#fff',
  },
  dimensionInput: {
    flex: 1,
    gap: 4,
  },
  dimensionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#059669',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
