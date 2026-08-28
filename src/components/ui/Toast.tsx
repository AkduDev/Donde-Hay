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
import { getColors, type ColorPalette } from '@/theme/colors';
import { ZIndex } from '@/theme/z-index';

const TOAST_CONFIG: Record<ToastType, { icon: string; bg: keyof ColorPalette; fg: keyof ColorPalette }> = {
  success: { icon: '✓', bg: 'success', fg: 'onSuccess' },
  error: { icon: '✕', bg: 'error', fg: 'onError' },
  warning: { icon: '⚠', bg: 'warning', fg: 'onWarning' },
  info: { icon: 'ℹ', bg: 'primary', fg: 'onPrimary' },
};

export function ToastContainer() {
  const { toasts, hideToast } = useToastStore();
  const { resolvedMode } = useThemeStore();
  const insets = useSafeAreaInsets();
  const colors = getColors(resolvedMode);

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
              style={[styles.toast, { backgroundColor: colors[config.bg] }]}
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
                  color={config.fg}
                  fontWeight="600"
                  mode={resolvedMode}
                >
                  {config.icon}
                </Text>
                <Text
                  variant="bodyMedium"
                  color={config.fg}
                  numberOfLines={2}
                  style={{ flex: 1 }}
                  mode={resolvedMode}
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
    zIndex: ZIndex.toast,
    elevation: ZIndex.toast,
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