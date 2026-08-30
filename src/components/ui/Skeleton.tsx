/**
 * Dónde Hay - Skeleton Component
 * Placeholder de carga con pulso de opacidad (shimmer suave)
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ViewStyle, StyleProp } from 'react-native';
import { Radius, RadiusToken } from '@/theme/radius';
import { getColors } from '@/theme/colors';
import { useThemeStore } from '@/store/themeStore';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: RadiusToken | number;
  mode?: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const Skeleton = React.memo(({
  width = '100%',
  height = 16,
  borderRadius = 'sm',
  mode,
  style,
  testID,
}: SkeletonProps) => {
  const { resolvedMode } = useThemeStore();
  const resolved = mode ?? resolvedMode;
  const colors = getColors(resolved);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const radius =
    typeof borderRadius === 'number' ? borderRadius : Radius[borderRadius];

  return (
    <Animated.View
      testID={testID}
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.surfaceVariant,
          opacity,
        },
        style,
      ]}
    />
  );
});

Skeleton.displayName = 'Skeleton';

export { Skeleton };