/**
 * Dónde Hay - Badge Component
 * Badge para estados, contadores, etiquetas
 */

import React, { forwardRef } from 'react';
import { ViewStyle, StyleProp, TextStyle } from 'react-native';
import { Box } from './Box';
import { Text as TextComponent } from './Text';
import { BorderRadius } from '@/theme/radius';
import { Spacing } from '@/theme/spacing';
import { ColorPalette, getColors } from '@/theme/colors';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'outline'
  | 'ghost';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  dotColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  mode?: 'light' | 'dark';
  testID?: string;
}

const variantConfig: Record<BadgeVariant, {
  bg: keyof ColorPalette;
  text: keyof ColorPalette;
  border: keyof ColorPalette;
}> = {
  default: { bg: 'surfaceVariant', text: 'textSecondary', border: 'transparent' },
  primary: { bg: 'primaryContainer', text: 'primary', border: 'transparent' },
  secondary: { bg: 'surfaceContainerHigh', text: 'text', border: 'transparent' },
  success: { bg: 'successContainer', text: 'success', border: 'transparent' },
  warning: { bg: 'warningContainer', text: 'warning', border: 'transparent' },
  error: { bg: 'errorContainer', text: 'error', border: 'transparent' },
  info: { bg: 'primaryContainer', text: 'primary', border: 'transparent' },
  outline: { bg: 'transparent', text: 'text', border: 'border' },
  ghost: { bg: 'transparent', text: 'textSecondary', border: 'transparent' },
};

const sizeConfig: Record<BadgeSize, {
  paddingX: keyof typeof Spacing;
  paddingY: keyof typeof Spacing;
  fontSize: number;
  fontWeight: 'medium' | 'semiBold';
  borderRadius: keyof typeof BorderRadius;
  gap: keyof typeof Spacing;
  dotSize: number;
}> = {
  xs: { paddingX: '2', paddingY: '0', fontSize: 10, fontWeight: 'medium', borderRadius: 'full', gap: '1', dotSize: 4 },
  sm: { paddingX: '2', paddingY: '0', fontSize: 11, fontWeight: 'medium', borderRadius: 'full', gap: '1', dotSize: 5 },
  md: { paddingX: '3', paddingY: '0', fontSize: 12, fontWeight: 'semiBold', borderRadius: 'full', gap: '2', dotSize: 6 },
  lg: { paddingX: '3', paddingY: '1', fontSize: 13, fontWeight: 'semiBold', borderRadius: 'full', gap: '2', dotSize: 7 },
};

const Badge = forwardRef<React.ComponentPropsWithoutRef<typeof Box>, BadgeProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      dot = false,
      dotColor,
      style,
      textStyle,
      mode = 'light',
      testID,
    }: BadgeProps,
    ref
  ) => {
    const colors = getColors(mode);
    const vConfig = variantConfig[variant];
    const sConfig = sizeConfig[size];

    const badgeStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing[sConfig.paddingX],
      paddingVertical: Spacing[sConfig.paddingY],
      borderRadius: BorderRadius[sConfig.borderRadius],
      backgroundColor: colors[vConfig.bg],
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: colors[vConfig.border],
      gap: Spacing[sConfig.gap],
    };

    return (
      <Box
        ref={ref}
        style={[badgeStyle, style]}
        testID={testID}
        mode={mode}
      >
        {dot && (
          <Box
            width={sConfig.dotSize}
            height={sConfig.dotSize}
            borderRadius="full"
            bgColor={dotColor || colors[vConfig.text]}
            testID={`${testID}-dot`}
            mode={mode}
          />
        )}
        <TextComponent
          variant="labelSmall"
          style={[
            { fontSize: sConfig.fontSize, fontWeight: sConfig.fontWeight },
            textStyle,
          ]}
          color={vConfig.text as keyof ColorPalette}
          mode={mode}
          testID={`${testID}-text`}
        >
          {children}
        </TextComponent>
      </Box>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps, BadgeVariant, BadgeSize };