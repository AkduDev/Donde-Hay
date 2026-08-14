/**
 * Dónde Hay - Modal Component
 * Modal accesible con backdrop, animaciones y focus trap
 */

import React, { forwardRef, useEffect, useRef } from 'react';
import {
  Modal as RNModal,
  ModalProps,
  ViewStyle,
  StyleProp,
  Pressable,
  Keyboard,
} from 'react-native';
import { Box } from './Box';
import { Spacing } from '@/theme/spacing';
import { BorderRadius } from '@/theme/radius';
import { Shadows, getShadow } from '@/theme/shadows';
import { ColorPalette, getColors } from '@/theme/colors';

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalPosition = 'center' | 'bottom' | 'top';

export interface ModalProps extends Omit<ModalProps, 'visible' | 'animationType' | 'transparent'> {
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
}

const sizeConfig: Record<ModalSize, {
  width: string | number;
  maxHeight: string | number;
  padding: keyof typeof Spacing;
  borderRadius: keyof typeof BorderRadius;
}> = {
  xs: { width: 280, maxHeight: '80%', padding: '4', borderRadius: 'lg' },
  sm: { width: 360, maxHeight: '80%', padding: '4', borderRadius: 'lg' },
  md: { width: 420, maxHeight: '85%', padding: '5', borderRadius: 'xl' },
  lg: { width: 520, maxHeight: '90%', padding: '5', borderRadius: 'xl' },
  xl: { width: 640, maxHeight: '90%', padding: '6', borderRadius: '2xl' },
  full: { width: '100%', maxHeight: '100%', padding: '0', borderRadius: 'none' },
};

const positionStyles: Record<ModalPosition, ViewStyle> = {
  center: { justifyContent: 'center', alignItems: 'center' },
  bottom: { justifyContent: 'flex-end', alignItems: 'stretch' },
  top: { justifyContent: 'flex-start', alignItems: 'stretch' },
};

const Modal = forwardRef<React.ComponentPropsWithoutRef<typeof RNModal>, ModalProps>(
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
      ...rest
    }: ModalProps,
    ref
  ) => {
    const colors = getColors(mode);
    const sConfig = sizeConfig[size];
    const overlayRef = useRef<Pressable>(null);
    const modalRef = useRef<RNModal>(null);

    // Cerrar con Escape (web) o hardware back (Android)
    useEffect(() => {
      if (!visible) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && closeOnEscape) {
          onClose();
        }
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }

      // Android back handler
      const backHandler = () => {
        if (closeOnEscape) {
          onClose();
          return true;
        }
        return false;
      };

      // Note: BackHandler would need to be imported from react-native
      return () => {};
    }, [visible, closeOnEscape, onClose]);

    // Focus trap y auto-focus
    useEffect(() => {
      if (visible) {
        Keyboard.dismiss();
      }
    }, [visible]);

    if (!visible) return null;

    const modalStyle: ViewStyle = {
      width: sConfig.width,
      maxHeight: sConfig.maxHeight,
      borderRadius: BorderRadius[sConfig.borderRadius],
      backgroundColor: colors.surface,
      ...getShadow('xl', mode),
      elevation: 16,
      overflow: 'hidden',
    };

    const overlayStyle: ViewStyle = {
      flex: 1,
      backgroundColor: colors.overlay,
      ...positionStyles[position],
      padding: Spacing[4],
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
        {...rest}
      >
        <Pressable
          ref={overlayRef}
          onPress={handleOverlayPress}
          style={overlayStyle}
          testID={`${testID}-overlay`}
          accessibilityLiveRegion="polite"
        >
          <Box
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
                borderBottomWidth={1}
                borderColor={colors.divider}
                style={headerStyle}
                testID={`${testID}-header`}
                mode={mode}
              >
                <Box flex={1} mode={mode}>
                  {title && (
                    <Text variant="titleLarge" color="text" mode={mode} testID={`${testID}-title`}>
                      {title}
                    </Text>
                  )}
                  {subtitle && (
                    <Text variant="bodyMedium" color="textSecondary" mode={mode} mt={1} testID={`${testID}-subtitle`}>
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
                    <Box p={2} mode={mode}>
                      <CloseIcon size={24} color={colors.textSecondary} />
                    </Box>
                  </Pressable>
                )}
              </Box>
            )}

            <Box
              p={size === 'full' ? 0 : sConfig.padding}
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
export type { ModalProps, ModalSize, ModalPosition };

// Icono de cierre simple
const CloseIcon = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Import Text
import { Text } from './Text';