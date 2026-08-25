/**
 * Dónde Hay - Toast Component
 * Notificaciones toast en la parte superior de la pantalla
 */

import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from './Box';
import { Text } from './Text';
import { useToastStore, type ToastType } from '@/store/toastStore';
import { useThemeStore } from '@/store/themeStore';

const TOAST_CONFIG: Record<ToastType, { icon: string; bg: string; color: string }> = {
  success: { icon: '✓', bg: '#16a34a', color: '#ffffff' },
  error: { icon: '✕', bg: '#dc2626', color: '#ffffff' },
  warning: { icon: '⚠', bg: '#d97706', color: '#ffffff' },
  info: { icon: 'ℹ', bg: '#2563eb', color: '#ffffff' },
};

export function ToastContainer() {
  const { toasts, hideToast } = useToastStore();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <Box
      style={[styles.container, { top: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      {toasts.map((toast) => {
        const config = TOAST_CONFIG[toast.type];
        return (
          <Pressable
            key={toast.id}
            onPress={() => hideToast(toast.id)}
            accessibilityRole="alert"
            accessibilityLabel={`${config.icon} ${toast.message}`}
          >
            <Box
              style={[styles.toast, { backgroundColor: config.bg }]}
              mx="md"
              mb="xs"
              borderRadius="md"
            >
              <Box
                flexDirection="row"
                alignItems="center"
                gap="sm"
              >
                <Text
                  variant="bodyMedium"
                  color="onPrimary"
                  fontWeight="600"
                >
                  {config.icon}
                </Text>
                <Text
                  variant="bodyMedium"
                  color="onPrimary"
                  numberOfLines={2}
                  style={{ flex: 1 }}
                >
                  {toast.message}
                </Text>
              </Box>
            </Box>
          </Pressable>
        );
      })}
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
  } as ViewStyle,
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  } as ViewStyle,
});
