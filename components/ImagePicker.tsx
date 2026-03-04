import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Alert } from 'react-native';
import * as ImagePickerLib from 'expo-image-picker';
import { Camera, ImageIcon, X } from 'lucide-react-native';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { formatString } from '../lib/i18n/translations';

interface ImagePickerProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImagePicker({ images, onImagesChange, maxImages = 10 }: ImagePickerProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    const cameraPermission = await ImagePickerLib.requestCameraPermissionsAsync();
    const mediaPermission = await ImagePickerLib.requestMediaLibraryPermissionsAsync();

    if (cameraPermission.status !== 'granted' || mediaPermission.status !== 'granted') {
      Alert.alert(
        t.imagePicker.permissionsRequired,
        t.imagePicker.permissionsMessage
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (images.length >= maxImages) {
      Alert.alert(
        t.imagePicker.photoLimit,
        formatString(t.imagePicker.photoLimitMessage, { max: maxImages.toString() })
      );
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePickerLib.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        onImagesChange([...images, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert(t.imagePicker.errorTitle, t.imagePicker.cameraError);
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (images.length >= maxImages) {
      Alert.alert(
        t.imagePicker.photoLimit,
        formatString(t.imagePicker.photoLimitMessage, { max: maxImages.toString() })
      );
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePickerLib.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        onImagesChange([...images, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert(t.imagePicker.errorTitle, t.imagePicker.galleryError);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.cameraButton]}
          onPress={takePhoto}
          disabled={loading}
        >
          <Camera color="#fff" size={24} />
          <Text style={styles.buttonText}>{t.imagePicker.takePhoto}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.galleryButton]}
          onPress={pickFromGallery}
          disabled={loading}
        >
          <ImageIcon color="#fff" size={24} />
          <Text style={styles.buttonText}>{t.imagePicker.fromGallery}</Text>
        </TouchableOpacity>
      </View>

      {images.length > 0 && (
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {t.imagePicker.photoCount}: {images.length} / {maxImages}
          </Text>
        </View>
      )}

      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <X color="#fff" size={20} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  cameraButton: {
    backgroundColor: '#2563eb',
  },
  galleryButton: {
    backgroundColor: '#059669',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  counterContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  counterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  imageScroll: {
    marginTop: 12,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 4,
  },
});
