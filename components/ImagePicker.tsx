import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (Platform.OS === 'web') {
        images.forEach((uri) => {
          if (uri.startsWith('blob:')) {
            URL.revokeObjectURL(uri);
          }
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkPhotoLimit = (): boolean => {
    if (images.length >= maxImages) {
      Alert.alert(
        t.imagePicker.photoLimit,
        formatString(t.imagePicker.photoLimitMessage, { max: maxImages.toString() })
      );
      return false;
    }
    return true;
  };

  const handleWebFiles = (files: FileList | null) => {
    if (!files) return;

    const remainingSlots = maxImages - images.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    const newImages = filesToAdd.map((file) => URL.createObjectURL(file));

    onImagesChange([...images, ...newImages]);
  };

  const openFileInput = () => {
    fileInputRef.current?.click();
  };

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
    if (Platform.OS === 'web') {
      openFileInput();
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;
    if (!checkPhotoLimit()) return;

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
    } catch {
      Alert.alert(t.imagePicker.errorTitle, t.imagePicker.cameraError);
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async () => {
    if (Platform.OS === 'web') {
      openFileInput();
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;
    if (!checkPhotoLimit()) return;

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
    } catch {
      Alert.alert(t.imagePicker.errorTitle, t.imagePicker.galleryError);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    const removedUri = images[index];
    if (Platform.OS === 'web' && removedUri?.startsWith('blob:')) {
      URL.revokeObjectURL(removedUri);
    }
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(event) => {
            handleWebFiles(event.target.files);
            event.target.value = '';
          }}
        />
      )}
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
