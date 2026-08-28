/**
 * Dónde Hay - Divider Component
 * Separador visual con opciones de orientación y texto
 */

import React, { forwardRef } from 'react';
import { View, ViewStyle, StyleProp, TextStyle } from 'react-native';
import { Box } from './Box';
import { Text as TextComponent } from './Text';
import { Spacing } from '@/theme/spacing';
import { ColorPalette, getColors } from '@/theme/colors';
import { useThemeStore } from '@/store/themeStore';

export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerVariant = 'solid' | 'dashed' | 'dotted';

export interface DividerProps {
  orientation?: DividerOrientation;
  variant?: DividerVariant;
  thickness?: number;
  color?: keyof ColorPalette;
  label?: string;
  labelPosition?: 'start' | 'center' | 'end';
  mode?: 'light' | 'dark';
  testID?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

const Divider = forwardRef<View, DividerProps>(
  (
    {
      orientation = 'horizontal',
      variant = 'solid',
      thickness = 1,
      color,
      label,
      labelPosition = 'center',
      mode,
      testID,
      style,
      labelStyle,
    }: DividerProps,
    ref
  ) => {
    const { resolvedMode } = useThemeStore();
    const resolved = mode ?? resolvedMode;
    const colors = getColors(resolved);
    const dividerColor = color ? colors[color] : colors.divider;

    const containerStyle: ViewStyle = {
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      width: orientation === 'horizontal' ? '100%' : undefined,
      height: orientation === 'vertical' ? '100%' : undefined,
    };

    const lineStyle: ViewStyle = {
      flex: 1,
      height: orientation === 'horizontal' ? thickness : undefined,
      width: orientation === 'vertical' ? thickness : undefined,
      backgroundColor: dividerColor,
      borderStyle: variant,
    };

    if (!label) {
      return (
        <Box
          ref={ref}
          style={[containerStyle, style]}
          testID={testID}
          mode={resolved}
        >
          <Box style={lineStyle} mode={resolved} />
        </Box>
      );
    }

    return (
      <Box
        ref={ref}
        style={[containerStyle, style]}
        testID={testID}
        mode={resolved}
      >
        {labelPosition === 'start' && (
          <TextComponent variant="labelSmall" color="textSecondary" mode={resolved} style={labelStyle}>
            {label}
          </TextComponent>
        )}
        <Box
          style={[
            lineStyle,
            labelPosition === 'center' && { flex: 1 },
          ]}
          mode={resolved}
        />
        {labelPosition === 'center' && (
          <TextComponent variant="labelSmall" color="textSecondary" mode={resolved} style={labelStyle}>
            {label}
          </TextComponent>
        )}
        {labelPosition === 'end' && (
          <TextComponent variant="labelSmall" color="textSecondary" mode={resolved} style={labelStyle}>
            {label}
          </TextComponent>
        )}
      </Box>
    );
  }
);

Divider.displayName = 'Divider';

export { Divider };
