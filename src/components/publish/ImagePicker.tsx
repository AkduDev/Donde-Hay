/**
 * Dónde Hay - ImagePicker Component
 * Selector de imágenes con cámara y galería
 */

import React from 'react';
import { Pressable, Alert, ScrollView } from 'react-native';
import * as ImagePickerExpo from 'expo-image-picker';
import { Image } from 'expo-image';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/theme/colors';

const MAX_IMAGES = 5;

export interface ImagePickerProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  mode?: 'light' | 'dark';
}

export function ImagePicker({
  images,
  onImagesChange,
  maxImages = MAX_IMAGES,
  mode: propMode,
}: ImagePickerProps) {
  const { resolvedMode } = useThemeStore();
  const mode = propMode ?? resolvedMode;
  const colors = getColors(mode);

  const remainingSlots = maxImages - images.length;

  const pickFromGallery = async () => {
    if (remainingSlots <= 0) {
      Alert.alert('Límite alcanzado', `Máximo ${maxImages} imágenes`);
      return;
    }

    const { status } = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu galería para seleccionar fotos'
      );
      return;
    }

    const result = await ImagePickerExpo.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newUris = result.assets.map(
        (asset: { uri: string }) => asset.uri
      );
      onImagesChange([...images, ...newUris].slice(0, maxImages));
    }
  };

  const takePhoto = async () => {
    if (remainingSlots <= 0) {
      Alert.alert('Límite alcanzado', `Máximo ${maxImages} imágenes`);
      return;
    }

    const { status } = await ImagePickerExpo.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu cámara para tomar fotos'
      );
      return;
    }

    const result = await ImagePickerExpo.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newUris = result.assets.map(
        (asset: { uri: string }) => asset.uri
      );
      onImagesChange([...images, ...newUris].slice(0, maxImages));
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <Box gap="md" mode={mode}>
      <Box gap="xs">
        <Text variant="titleSmall" color="text" mode={mode}>
          Fotos del producto
        </Text>
        <Text variant="bodySmall" color="textSecondary" mode={mode}>
          {images.length}/{maxImages} imágenes seleccionadas
        </Text>
      </Box>

      {/* Image thumbnails */}
      {images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {images.map((uri, index) => (
            <Box key={uri} position="relative">
              <Image
                source={{ uri }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 8,
                }}
                contentFit="cover"
              />
              <Pressable
                onPress={() => removeImage(index)}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.error,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  variant="labelSmall"
                  color="onError"
                  mode={mode}
                >
                  ✕
                </Text>
              </Pressable>
              {index === 0 && (
                <Box
                  position="absolute"
                  bottom={0}
                  left={0}
                  right={0}
                  bg="primary"
                  py="xxxs"
                  alignItems="center"
                  style={{ borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}
                >
                  <Text variant="labelSmall" color="onPrimary" mode={mode}>
                    Principal
                  </Text>
                </Box>
              )}
            </Box>
          ))}
        </ScrollView>
      )}

      {/* Action buttons */}
      {remainingSlots > 0 && (
        <Box flexDirection="row" gap="sm">
          <Box flex={1}>
            <Button
              variant="outline"
              size="md"
              onPress={takePhoto}
              fullWidth
              mode={mode}
            >
              Cámara
            </Button>
          </Box>
          <Box flex={1}>
            <Button
              variant="outline"
              size="md"
              onPress={pickFromGallery}
              fullWidth
              mode={mode}
            >
              Galería
            </Button>
          </Box>
        </Box>
      )}

      {images.length === 0 && (
        <Box
          alignItems="center"
          py="lg"
          borderWidth={1}
          borderColor={colors.border}
          borderRadius="md"
          style={{ borderStyle: 'dashed' }}
        >
          <Text variant="bodyMedium" color="textSecondary" mode={mode}>
            Agrega fotos para que los compradores vean tu producto
          </Text>
        </Box>
      )}
    </Box>
  );
}
