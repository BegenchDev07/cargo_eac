import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { WarehouseOrder, CARGO_TYPES, CargoType } from '../lib/types/order';
import { databaseService } from '../lib/services/pocketbase.service';
import { useLanguage } from '../lib/i18n/LanguageContext';

interface EditFormData {
  customer_name: string;
  weight: string;
  product_name: string;
  quantity: string;
  client_number: string;
  cargo_type: CargoType;
}

interface EditFormErrors {
  customer_name?: string;
  weight?: string;
  product_name?: string;
  quantity?: string;
  client_number?: string;
}

interface OrderEditModalProps {
  visible: boolean;
  order: WarehouseOrder | null;
  onClose: () => void;
  onSaved: (updatedOrder: WarehouseOrder) => void;
}

const initialForm: EditFormData = {
  customer_name: '',
  weight: '',
  product_name: '',
  quantity: '',
  client_number: '',
  cargo_type: 'standard',
};

export default function OrderEditModal({ visible, order, onClose, onSaved }: OrderEditModalProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState<EditFormData>(initialForm);
  const [errors, setErrors] = useState<EditFormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && order) {
      setForm({
        customer_name: order.customer_name || '',
        weight: order.weight?.toString() || '',
        product_name: order.product_name || '',
        quantity: order.quantity?.toString() || '',
        client_number: order.client_number || '',
        cargo_type: order.cargo_type || 'standard',
      });
      setErrors({});
    }
  }, [visible, order]);

  const updateField = (field: keyof EditFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof EditFormErrors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as keyof EditFormErrors];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const nextErrors: EditFormErrors = {};

    if (!form.customer_name.trim()) {
      nextErrors.customer_name = t.validation.required;
    }
    if (!form.weight.trim()) {
      nextErrors.weight = t.validation.required;
    } else {
      const weightNum = parseFloat(form.weight);
      if (isNaN(weightNum) || weightNum <= 0) {
        nextErrors.weight = t.validation.invalidWeight;
      }
    }
    if (!form.product_name.trim()) {
      nextErrors.product_name = t.validation.required;
    }
    if (!form.quantity.trim()) {
      nextErrors.quantity = t.validation.required;
    } else {
      const quantityNum = parseInt(form.quantity, 10);
      if (isNaN(quantityNum) || quantityNum <= 0 || !Number.isInteger(quantityNum)) {
        nextErrors.quantity = t.validation.invalidQuantity;
      }
    }
    if (!form.client_number.trim()) {
      nextErrors.client_number = t.validation.required;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!order?.id || !validate()) return;

    setSaving(true);
    try {
      const updatedOrder = await databaseService.updateOrder(order.id, {
        customer_name: form.customer_name,
        weight: parseFloat(form.weight),
        product_name: form.product_name,
        quantity: parseInt(form.quantity, 10),
        client_number: form.client_number,
        cargo_type: form.cargo_type,
      });

      if (updatedOrder) {
        onSaved(updatedOrder);
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      Alert.alert(t.orders.editError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.orders.editOrder}</Text>
              <TouchableOpacity onPress={onClose} disabled={saving}>
                <Text style={styles.modalCloseText}>{t.orders.cancel}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.form.customerName} {t.form.required}</Text>
                <TextInput
                  style={[styles.input, errors.customer_name && styles.inputError]}
                  value={form.customer_name}
                  onChangeText={(text) => updateField('customer_name', text)}
                  placeholder={t.placeholders.customerName}
                  placeholderTextColor="#9ca3af"
                  editable={!saving}
                />
                {errors.customer_name && (
                  <Text style={styles.errorText}>{errors.customer_name}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.form.productName} {t.form.required}</Text>
                <TextInput
                  style={[styles.input, errors.product_name && styles.inputError]}
                  value={form.product_name}
                  onChangeText={(text) => updateField('product_name', text)}
                  placeholder={t.placeholders.productName}
                  placeholderTextColor="#9ca3af"
                  editable={!saving}
                />
                {errors.product_name && (
                  <Text style={styles.errorText}>{errors.product_name}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.form.clientNumber} {t.form.required}</Text>
                <TextInput
                  style={[styles.input, errors.client_number && styles.inputError]}
                  value={form.client_number}
                  onChangeText={(text) => updateField('client_number', text)}
                  placeholder={t.placeholders.clientNumber}
                  placeholderTextColor="#9ca3af"
                  editable={!saving}
                />
                {errors.client_number && (
                  <Text style={styles.errorText}>{errors.client_number}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.form.weight} {t.form.required}</Text>
                <TextInput
                  style={[styles.input, errors.weight && styles.inputError]}
                  value={form.weight}
                  onChangeText={(text) => updateField('weight', text)}
                  placeholder={t.placeholders.weight}
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                  editable={!saving}
                />
                {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.form.quantity} {t.form.required}</Text>
                <TextInput
                  style={[styles.input, errors.quantity && styles.inputError]}
                  value={form.quantity}
                  onChangeText={(text) => updateField('quantity', text)}
                  placeholder={t.placeholders.quantity}
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  editable={!saving}
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
                        form.cargo_type === type && styles.cargoTypeButtonActive,
                      ]}
                      onPress={() => updateField('cargo_type', type)}
                      disabled={saving}>
                      <Text
                        style={[
                          styles.cargoTypeButtonText,
                          form.cargo_type === type && styles.cargoTypeButtonTextActive,
                        ]}>
                        {t.dashboard.cargoTypes[type]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>{t.orders.save}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalBody: {
    maxHeight: '80%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingVertical: 14,
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
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
