import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { Language } from '../../lib/i18n/translations';
import { Check } from 'lucide-react-native';

export default function LanguageScreen() {
  const { language, setLanguage, t } = useLanguage();

  const languages: { code: Language; label: string }[] = [
    { code: 'ru', label: t.language.russian },
    { code: 'zh', label: t.language.chinese },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.language.select}</Text>
      </View>

      <View style={styles.content}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageOption,
              language === lang.code && styles.languageOptionActive,
            ]}
            onPress={() => setLanguage(lang.code)}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.languageText,
                language === lang.code && styles.languageTextActive,
              ]}>
              {lang.label}
            </Text>
            {language === lang.code && (
              <Check size={24} color="#007AFF" strokeWidth={3} />
            )}
          </TouchableOpacity>
        ))}
      </View>
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
  content: {
    padding: 16,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageOptionActive: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  languageText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
  },
  languageTextActive: {
    fontWeight: '700',
    color: '#007AFF',
  },
});
