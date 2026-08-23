import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { LayoutGrid, ExternalLink } from 'lucide-react-native';
import { useLanguage } from '../../lib/i18n/LanguageContext';

interface DashboardGridProps {
  freightId?: string;
}

export default function DashboardGrid({ freightId }: DashboardGridProps) {
  const { t } = useLanguage();

  const handleOpenBrowser = () => {
    if (Platform.OS === 'web') return;
    // Best-effort deep link back to the web version of the same route
    Linking.openURL('https://warehouse-order-processing.expo.app/dashboard').catch(() => {
      // Fallback is silent; the placeholder message already explains the limitation
    });
  };

  return (
    <View style={styles.container}>
      <LayoutGrid size={64} color="#C7C7CC" />
      <Text style={styles.title}>{t.dashboard.webOnlyTitle}</Text>
      <Text style={styles.message}>{t.dashboard.webOnlyMessage}</Text>
      <TouchableOpacity style={styles.button} onPress={handleOpenBrowser}>
        <ExternalLink size={20} color="#FFFFFF" />
        <Text style={styles.buttonText}>{t.dashboard.openInBrowser}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
