/**
 * Dónde Hay - Spinner Component
 * Indicador de carga con múltiples tamaños y variants
 */

import React, { forwardRef } from 'react';
import { ActivityIndicator, ActivityIndicatorProps, ViewStyle, StyleProp } from 'react-native';
import { Box } from './Box';
import { Spacing } from '@/theme/spacing';
import { ColorPalette, getColors } from '@/theme/colors';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'default' | 'primary' | 'accent' | 'white' | 'inverse';

export interface SpinnerProps extends Omit<ActivityIndicatorProps, 'size' | 'color'> {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  label?: string;
  labelPosition?: 'bottom' | 'right';
  overlay?: boolean;
  mode?: 'light' | 'dark';
  testID?: string;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

const sizeConfig: Record<SpinnerSize, {
  rnSize: 'small' | 'large';
  diameter: number;
  labelGap: keyof typeof Spacing;
}> = {
  xs: { rnSize: 'small', diameter: 16, labelGap: '1' },
  sm: { rnSize: 'small', diameter: 20, labelGap: '2' },
  md: { rnSize: 'small', diameter: 24, labelGap: '2' },
  lg: { rnSize: 'large', diameter: 36, labelGap: '3' },
  xl: { rnSize: 'large', diameter: 48, labelGap: '3' },
};

const variantColors: Record<SpinnerVariant, keyof ColorPalette> = {
  default: 'primary',
  primary: 'primary',
  accent: 'accent',
  white: 'onPrimary',
  inverse: 'textInverse',
};

const Spinner = forwardRef<React.ComponentPropsWithoutRef<typeof Box>, SpinnerProps>(
  (
    {
      size = 'md',
      variant = 'default',
      label,
      labelPosition = 'bottom',
      overlay = false,
      mode = 'light',
      testID,
      style,
      containerStyle,
      ...rest
    }: SpinnerProps,
    ref
  ) => {
    const colors = getColors(mode);
    const sConfig = sizeConfig[size];
    const spinnerColor = colors[variantColors[variant]];

    const containerStyleComputed: ViewStyle = {
      flexDirection: labelPosition === 'right' ? 'row' : 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing[sConfig.labelGap],
      ...(overlay && {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.overlay,
        zIndex: 9999,
      }),
    };

    return (
      <Box
        ref={ref}
        style={[containerStyleComputed, containerStyle]}
        testID={testID}
        mode={mode}
      >
        <ActivityIndicator
          size={sConfig.rnSize}
          color={spinnerColor}
          testID={`${testID}-indicator`}
          {...rest}
        />
        {label && (
          <Box
            style={{
              flexDirection: labelPosition === 'right' ? 'row' : 'column',
              alignItems: 'center',
              gap: Spacing[1],
            }}
            testID={`${testID}-label-container`}
            mode={mode}
          >
            <Text variant="bodySmall" color="textSecondary" mode={mode} testID={`${testID}-label`}>
              {label}
            </Text>
          </Box>
        )}
      </Box>
    );
  }
);

Spinner.displayName = 'Spinner';

export { Spinner };
export type { SpinnerProps, SpinnerSize, SpinnerVariant };

// Import Text
import { Text } from './Text';