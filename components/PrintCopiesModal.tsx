import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLanguage } from '../lib/i18n/LanguageContext';

interface PrintCopiesModalProps {
  visible: boolean;
  onCancel: () => void;
  onPrint: (copies: number) => void;
  printing?: boolean;
}

export default function PrintCopiesModal({
  visible,
  onCancel,
  onPrint,
  printing = false,
}: PrintCopiesModalProps) {
  const { t } = useLanguage();
  const [copies, setCopies] = useState('1');

  useEffect(() => {
    if (visible) {
      setCopies('1');
    }
  }, [visible]);

  const parsed = parseInt(copies, 10);
  const valid = !isNaN(parsed) && parsed >= 1 && parsed <= 99;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{t.qr.printCopiesTitle}</Text>

          <TextInput
            style={styles.input}
            value={copies}
            onChangeText={setCopies}
            keyboardType="number-pad"
            selectTextOnFocus
            autoFocus
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={printing}
            >
              <Text style={styles.buttonText}>{t.qr.printCopiesCancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.printButton, !valid && styles.disabled]}
              onPress={() => onPrint(parsed)}
              disabled={!valid || printing}
            >
              <Text style={styles.buttonText}>{t.qr.printCopiesPrint}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 20,
    textAlign: 'center',
    color: '#1f2937',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#9ca3af',
  },
  printButton: {
    backgroundColor: '#2563eb',
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
