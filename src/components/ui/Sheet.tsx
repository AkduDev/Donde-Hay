/**
 * Dónde Hay - Sheet Component
 * Bottom Sheet con snap points, backdrop y handle
 */

import React, { forwardRef, useRef, useEffect, useState } from 'react';
import {
  Animated,
  PanResponder,
  ViewStyle,
  StyleProp,
  Dimensions,
  Keyboard,
  Pressable,
} from 'react-native';
import { Box } from './Box';
import { Spacing } from '@/theme/spacing';
import { BorderRadius } from '@/theme/radius';
import { Shadows, getShadow } from '@/theme/shadows';
import { ColorPalette, getColors } from '@/theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type SheetSize = 'small' | 'medium' | 'large' | 'full';
export type SheetSnapPoint = number | 'small' | 'medium' | 'large' | 'full';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  snapPoints?: SheetSnapPoint[];
  initialSnap?: SheetSnapPoint;
  handleIndicator?: boolean;
  closeOnOverlayPress?: boolean;
  closeOnEscape?: boolean;
  keyboardBehavior?: 'extend' | 'resize' | 'none';
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  mode?: 'light' | 'dark';
  testID?: string;
}

const snapPointValues: Record<string, number> = {
  small: SCREEN_HEIGHT * 0.25,
  medium: SCREEN_HEIGHT * 0.5,
  large: SCREEN_HEIGHT * 0.75,
  full: SCREEN_HEIGHT * 0.95,
};

const Sheet = forwardRef<{ snapTo: (index: number) => void; close: () => void }, SheetProps>(
  (
    {
      visible,
      onClose,
      title,
      subtitle,
      children,
      snapPoints = ['medium', 'large'],
      initialSnap = 'medium',
      handleIndicator = true,
      closeOnOverlayPress = true,
      closeOnEscape = true,
      keyboardBehavior = 'extend',
      style,
      contentStyle,
      headerStyle,
      mode = 'light',
      testID,
    }: SheetProps,
    ref
  ) => {
    const colors = getColors(mode);
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const [currentSnap, setCurrentSnap] = useState(0);
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          translateY.setOffset(translateY._value);
          translateY.setValue(0);
        },
        onPanResponderMove: Animated.event([
          null,
          { dy: translateY },
        ]),
        onPanResponderRelease: (_, gesture) => {
          translateY.flattenOffset();
          const velocity = gesture.vy;
          const currentY = translateY._value + SCREEN_HEIGHT - snapPointValues[initialSnap as string];
          handleRelease(currentY, velocity);
        },
      })
    ).current;

    const snapValues = snapPoints.map((p) =>
      typeof p === 'number' ? p : snapPointValues[p]
    );

    const handleRelease = (y: number, velocity: number) => {
      let targetIndex = 0;
      let minDist = Infinity;

      snapValues.forEach((snap, i) => {
        const dist = Math.abs(y - (SCREEN_HEIGHT - snap));
        if (dist < minDist) {
          minDist = dist;
          targetIndex = i;
        }
      });

      // Si.velocity hacia abajo fuerte, cerrar
      if (velocity > 1000 && targetIndex === 0) {
        close();
        return;
      }

      snapTo(targetIndex);
    };

    const snapTo = (index: number) => {
      const targetY = SCREEN_HEIGHT - snapValues[index];
      Animated.timing(translateY, {
        toValue: targetY,
        duration: 250,
        useNativeDriver: true,
      }).start();
      setCurrentSnap(index);
    };

    const close = () => {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onClose();
      });
    };

    // Expose methods
    React.useImperativeHandle(ref, () => ({
      snapTo,
      close,
    }));

    // Handle visibility changes
    useEffect(() => {
      if (visible) {
        const initialIndex = snapPoints.indexOf(initialSnap);
        snapTo(initialIndex >= 0 ? initialIndex : 0);
      } else {
        close();
      }
    }, [visible]);

    // Close on escape (web)
    useEffect(() => {
      if (!visible) return;
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && closeOnEscape) close();
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }
    }, [visible, closeOnEscape]);

    if (!visible) return null;

    const animatedStyle: ViewStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      transform: [{ translateY }],
    };

    const containerStyle: ViewStyle = {
      flex: 1,
      backgroundColor: colors.surface,
      borderTopLeftRadius: BorderRadius['2xl'],
      borderTopRightRadius: BorderRadius['2xl'],
      ...getShadow('xl', mode),
      elevation: 16,
      overflow: 'hidden',
      maxHeight: snapValues[snapValues.length - 1],
    };

    const handleStyle: ViewStyle = {
      width: 36,
      height: 5,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.borderStrong,
      alignSelf: 'center',
      marginTop: Spacing[3],
      marginBottom: Spacing[2],
    };

    return (
      <Animated.View style={animatedStyle} testID={`${testID}-animated`}>
        <Pressable
          onPress={closeOnOverlayPress ? close : undefined}
          style={{ flex: 1, backgroundColor: colors.overlay }}
          testID={`${testID}-overlay`}
          accessibilityLiveRegion="polite"
        >
          <Box
            style={[containerStyle, style]}
            testID={`${testID}-container`}
            mode={mode}
            {...panResponder.panHandlers}
          >
            {handleIndicator && (
              <Box alignItems="center" testID={`${testID}-handle`} mode={mode}>
                <Box style={handleStyle} mode={mode} />
              </Box>
            )}

            {(title || subtitle) && (
              <Box
                px={4}
                pb={3}
                borderBottomWidth={1}
                borderColor={colors.divider}
                style={headerStyle}
                testID={`${testID}-header`}
                mode={mode}
              >
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
            )}

            <Box
              flex={1}
              px={4}
              pb={4}
              style={contentStyle}
              testID={`${testID}-content`}
              mode={mode}
            >
              {children}
            </Box>
          </Box>
        </Pressable>
      </Animated.View>
    );
  }
);

Sheet.displayName = 'Sheet';

export { Sheet };
export type { SheetProps, SheetSize, SheetSnapPoint };

// Import Text
import { Text } from './Text';