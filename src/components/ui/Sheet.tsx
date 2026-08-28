/**
 * Dónde Hay - Sheet Component
 * Bottom Sheet con snap points, backdrop y handle
 */

import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import {
  Animated,
  PanResponder,
  ViewStyle,
  StyleProp,
  Dimensions,
  Keyboard,
  Pressable,
  Platform,
} from 'react-native';
import { Box } from './Box';
import { Text } from './Text';
import { Spacing } from '@/theme/spacing';
import { BorderRadius } from '@/theme/radius';
import { Shadows, getShadow } from '@/theme/shadows';
import { ColorPalette, getColors } from '@/theme/colors';
import { useThemeStore } from '@/store/themeStore';

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

interface SheetRef {
  snapTo: (index: number) => void;
  close: () => void;
}

const Sheet = forwardRef<SheetRef, SheetProps>(
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
      mode,
      testID,
    }: SheetProps,
    ref
  ) => {
    const { resolvedMode } = useThemeStore();
    const resolved = mode ?? resolvedMode;
    const colors = getColors(resolved);
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const [currentSnap, setCurrentSnap] = useState(0);

    const snapValues = snapPoints.map((p) =>
      typeof p === 'number' ? p : snapPointValues[p]
    );

    const snapTo = (index: number) => {
      const targetY = SCREEN_HEIGHT - (snapValues[index] ?? 0);
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

    const handleRelease = (y: number, velocity: number) => {
      let targetIndex = 0;
      let minDist = Infinity;

      snapValues.forEach((snap: number | undefined, i: number) => {
        if (snap == null) return;
        const dist = Math.abs(y - (SCREEN_HEIGHT - snap));
        if (dist < minDist) {
          minDist = dist;
          targetIndex = i;
        }
      });

      if (velocity > 1000 && targetIndex === 0) {
        close();
        return;
      }

      snapTo(targetIndex);
    };

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          translateY.setOffset((translateY as any)._value || 0);
          translateY.setValue(0);
        },
        onPanResponderMove: Animated.event(
          [null, { dy: translateY }],
          { useNativeDriver: false }
        ),
        onPanResponderRelease: (_, gesture) => {
          translateY.flattenOffset();
          const velocity = gesture.vy;
          const currentY = ((translateY as any)._value || 0) + SCREEN_HEIGHT - (snapPointValues[initialSnap as string] ?? 0);
          handleRelease(currentY, velocity);
        },
      })
    ).current;

    useImperativeHandle(ref, () => ({
      snapTo,
      close,
    }));

    useEffect(() => {
      if (visible) {
        const initialIndex = snapPoints.indexOf(initialSnap);
        snapTo(initialIndex >= 0 ? initialIndex : 0);
      } else {
        close();
      }
    }, [visible]);

    useEffect(() => {
      if (!visible || !closeOnEscape || Platform.OS !== 'web') return;
      const handleKeyDown = (event: any) => {
        if (event?.key === 'Escape') close();
      };
      const win = globalThis as any;
      if (win?.addEventListener) {
        win.addEventListener('keydown', handleKeyDown);
        return () => win.removeEventListener('keydown', handleKeyDown);
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
      ...getShadow('xl', resolved),
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
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
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
            mode={resolved}
            {...panResponder.panHandlers}
          >
            {handleIndicator && (
              <Box alignItems="center" testID={`${testID}-handle`} mode={resolved}>
                <Box style={handleStyle} mode={resolved} />
              </Box>
            )}

            {(title || subtitle) && (
      <Box
        px="md"
        pb="sm"
        style={[{ borderBottomWidth: 1, borderColor: colors.divider }, headerStyle as any]}
        testID={`${testID}-header`}
        mode={resolved}
      >
                {title && (
                  <Text variant="titleLarge" color="text" mode={resolved} testID={`${testID}-title`}>
                    {title}
                  </Text>
                )}
                {subtitle && (
                  <Box mt="xxxs">
                    <Text variant="bodyMedium" color="textSecondary" mode={resolved} testID={`${testID}-subtitle`}>
                      {subtitle}
                    </Text>
                  </Box>
                )}
              </Box>
            )}

            <Box
              flex={1}
              px="md"
              pb="md"
              style={contentStyle}
              testID={`${testID}-content`}
              mode={resolved}
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
