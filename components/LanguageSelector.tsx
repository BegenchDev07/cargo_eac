import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Languages } from 'lucide-react-native';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { Language } from '../lib/i18n/translations';

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = async (lang: Language) => {
    await setLanguage(lang);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Languages color="#6b7280" size={20} />
        <Text style={styles.label}>{t.language.select}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, language === 'ru' && styles.buttonActive]}
          onPress={() => handleLanguageChange('ru')}
        >
          <Text style={[styles.buttonText, language === 'ru' && styles.buttonTextActive]}>
            {t.language.russian}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, language === 'zh' && styles.buttonActive]}
          onPress={() => handleLanguageChange('zh')}
        >
          <Text style={[styles.buttonText, language === 'zh' && styles.buttonTextActive]}>
            {t.language.chinese}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  buttonActive: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  buttonTextActive: {
    color: '#059669',
  },
});
