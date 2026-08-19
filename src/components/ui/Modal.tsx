/**
 * Dónde Hay - Modal Component
 * Modal accesible con backdrop, animaciones y focus trap
 */

import React, { forwardRef, useEffect, useRef } from 'react';
import {
  Modal as RNModal,
  View,
  ViewStyle,
  StyleProp,
  Pressable,
  Keyboard,
  Platform,
} from 'react-native';
import { Box } from './Box';
import { BorderRadius } from '@/theme/radius';
import { Shadows, getShadow } from '@/theme/shadows';
import { getColors } from '@/theme/colors';
import { Text } from './Text';

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalPosition = 'center' | 'bottom' | 'top';

export interface ModalBaseProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: ModalSize;
  position?: ModalPosition;
  closeOnOverlayPress?: boolean;
  closeOnEscape?: boolean;
  hideCloseButton?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  footerStyle?: StyleProp<ViewStyle>;
  mode?: 'light' | 'dark';
  testID?: string;
  presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet';
}

const sizeConfig: Record<ModalSize, {
  width: string | number;
  maxHeight: string | number;
  padding: keyof typeof import('@/theme/spacing').Spacing;
  borderRadius: keyof typeof BorderRadius;
}> = {
  xs: { width: 280, maxHeight: '80%', padding: 'md', borderRadius: 'lg' },
  sm: { width: 360, maxHeight: '80%', padding: 'md', borderRadius: 'lg' },
  md: { width: 420, maxHeight: '85%', padding: 'lg', borderRadius: 'xl' },
  lg: { width: 520, maxHeight: '90%', padding: 'lg', borderRadius: 'xl' },
  xl: { width: 640, maxHeight: '90%', padding: 'xl', borderRadius: '2xl' },
  full: { width: '100%', maxHeight: '100%', padding: 'none', borderRadius: 'none' },
};

const positionStyles: Record<ModalPosition, ViewStyle> = {
  center: { justifyContent: 'center', alignItems: 'center' },
  bottom: { justifyContent: 'flex-end', alignItems: 'stretch' },
  top: { justifyContent: 'flex-start', alignItems: 'stretch' },
};

const Modal = forwardRef<View, ModalBaseProps>(
  (
    {
      visible,
      onClose,
      title,
      subtitle,
      size = 'md',
      position = 'center',
      closeOnOverlayPress = true,
      closeOnEscape = true,
      hideCloseButton = false,
      children,
      style,
      contentStyle,
      headerStyle,
      footerStyle,
      mode = 'light',
      testID,
      presentationStyle = 'pageSheet',
    }: ModalBaseProps,
    ref
  ) => {
    const colors = getColors(mode);
    const sConfig = sizeConfig[size];
    const modalRef = useRef<RNModal>(null);

    useEffect(() => {
      if (!visible || !closeOnEscape || Platform.OS !== 'web') return;

      const handleKeyDown = (event: any) => {
        if (event?.key === 'Escape') {
          onClose();
        }
      };

      const win = globalThis as any;
      if (win?.addEventListener) {
        win.addEventListener('keydown', handleKeyDown);
        return () => win.removeEventListener('keydown', handleKeyDown);
      }

      return () => {};
    }, [visible, closeOnEscape, onClose]);

    useEffect(() => {
      if (visible) {
        Keyboard.dismiss();
      }
    }, [visible]);

    if (!visible) return null;

    const modalStyle: ViewStyle = {
      width: sConfig.width as number,
      maxHeight: sConfig.maxHeight as number,
      borderRadius: BorderRadius[sConfig.borderRadius] as number,
      backgroundColor: colors.surface,
      ...getShadow('xl', mode),
      elevation: 16,
      overflow: 'hidden',
    };

    const overlayStyle: ViewStyle = {
      flex: 1,
      backgroundColor: colors.overlay,
      ...positionStyles[position],
      padding: 16,
    };

    const handleOverlayPress = () => {
      if (closeOnOverlayPress) onClose();
    };

    return (
      <RNModal
        ref={modalRef}
        visible={visible}
        transparent
        animationType="fade"
        presentationStyle={presentationStyle}
        onRequestClose={onClose}
        testID={testID}
      >
        <Pressable
          onPress={handleOverlayPress}
          style={overlayStyle}
          testID={`${testID}-overlay`}
        >
          <Box
            ref={ref}
            style={[modalStyle, style]}
            testID={`${testID}-content`}
            mode={mode}
          >
            {(title || !hideCloseButton) && (
              <Box
                flexDirection="row"
                justifyContent="space-between"
                alignItems="flex-start"
                p={sConfig.padding}
                mode={mode}
                style={[{ borderBottomWidth: 1, borderBottomColor: colors.divider }, headerStyle]}
                testID={`${testID}-header`}
              >
                <Box flex={1} mode={mode}>
                  {title && (
                    <Text variant="titleLarge" color="text" testID={`${testID}-title`}>
                      {title}
                    </Text>
                  )}
                  {subtitle && (
                    <Text variant="bodyMedium" color="textSecondary" testID={`${testID}-subtitle`}>
                      {subtitle}
                    </Text>
                  )}
                </Box>
                {!hideCloseButton && (
                  <Pressable
                    onPress={onClose}
                    testID={`${testID}-close`}
                    accessibilityLabel="Cerrar"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Box p="xs" mode={mode}>
                      <Text variant="bodyLarge" color="textSecondary">✕</Text>
                    </Box>
                  </Pressable>
                )}
              </Box>
            )}

            <Box
              p={size === 'full' ? 'none' : sConfig.padding}
              style={contentStyle}
              testID={`${testID}-body`}
              mode={mode}
            >
              {children}
            </Box>
          </Box>
        </Pressable>
      </RNModal>
    );
  }
);

Modal.displayName = 'Modal';

export { Modal };
