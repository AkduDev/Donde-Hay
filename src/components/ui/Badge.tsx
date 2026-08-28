/**
 * Dónde Hay - Badge Component
 * Badge para estados, contadores, etiquetas
 */

import React, { forwardRef } from 'react';
import { View, ViewStyle, StyleProp, TextStyle } from 'react-native';
import { Box } from './Box';
import { Text as TextComponent } from './Text';
import { BorderRadius } from '@/theme/radius';
import { Spacing } from '@/theme/spacing';
import { FontSizes } from '@/theme/typography';
import { ColorPalette, getColors } from '@/theme/colors';
import { useThemeStore } from '@/store/themeStore';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'accent'
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
  accent: { bg: 'accentContainer', text: 'accent', border: 'transparent' },
  outline: { bg: 'transparent', text: 'text', border: 'border' },
  ghost: { bg: 'transparent', text: 'textSecondary', border: 'transparent' },
};

const sizeConfig: Record<BadgeSize, {
  paddingX: keyof typeof Spacing;
  paddingY: keyof typeof Spacing;
  fontSize: number;
  fontWeight: 'medium' | '600';
  borderRadius: keyof typeof BorderRadius;
  gap: keyof typeof Spacing;
  dotSize: number;
}> = {
  xs: { paddingX: 'xxs', paddingY: 'none', fontSize: FontSizes.xs, fontWeight: 'medium', borderRadius: 'full', gap: 'xxxs', dotSize: 4 },
  sm: { paddingX: 'xxs', paddingY: 'none', fontSize: FontSizes.xxs, fontWeight: 'medium', borderRadius: 'full', gap: 'xxxs', dotSize: 5 },
  md: { paddingX: 'xs', paddingY: 'none', fontSize: FontSizes.sm, fontWeight: '600', borderRadius: 'full', gap: 'xxs', dotSize: 6 },
  lg: { paddingX: 'xs', paddingY: 'xxxs', fontSize: FontSizes.base, fontWeight: '600', borderRadius: 'full', gap: 'xxs', dotSize: 7 },
};

const Badge = forwardRef<View, BadgeProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      dot = false,
      dotColor,
      style,
      textStyle,
      mode,
      testID,
    }: BadgeProps,
    ref
  ) => {
    const { resolvedMode } = useThemeStore();
    const resolved = mode ?? resolvedMode;
    const colors = getColors(resolved);
    const vConfig = variantConfig[variant];
    const sConfig = sizeConfig[size];

    const badgeStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing[sConfig.paddingX] as number,
      paddingVertical: Spacing[sConfig.paddingY] as number,
      borderRadius: BorderRadius[sConfig.borderRadius] as number,
      backgroundColor: colors[vConfig.bg],
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: colors[vConfig.border],
      gap: Spacing[sConfig.gap] as number,
    };

    return (
      <Box
        ref={ref}
        style={[badgeStyle, style]}
        testID={testID}
        mode={resolved}
      >
        {dot && (
          <Box
            width={sConfig.dotSize}
            height={sConfig.dotSize}
            borderRadius="full"
            bg={dotColor || colors[vConfig.text]}
            testID={`${testID}-dot`}
            mode={resolved}
          />
        )}
        <TextComponent
          variant="labelSmall"
          style={[
            { fontSize: sConfig.fontSize, fontWeight: sConfig.fontWeight },
            textStyle,
          ]}
          color={vConfig.text}
          mode={resolved}
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
