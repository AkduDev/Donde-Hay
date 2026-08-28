/**
 * Dónde Hay - Text Component
 * Componente de tipografía con variants del design system
 */

import React, { forwardRef } from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { TypographyVariants, TypographyVariant, getLineHeight } from '@/theme/typography';
import { ColorPalette, getColors } from '@/theme/colors';
import { useThemeStore } from '@/store/themeStore';

export interface TextProps extends React.ComponentPropsWithoutRef<typeof Text> {
  // Variant del design system
  variant?: TypographyVariant;

  // Color semántico
  color?: keyof ColorPalette;
  /** Alias de colorMode para consistencia con Box, Button, Card, etc. */
  mode?: 'light' | 'dark';
  colorMode?: 'light' | 'dark';

  // Overrides de estilo
  fontSize?: number;
  fontWeight?: TextStyle['fontWeight'];
  lineHeight?: number;
  letterSpacing?: number;
  fontFamily?: string;
  textAlign?: TextStyle['textAlign'];
  textTransform?: TextStyle['textTransform'];
  textDecorationLine?: TextStyle['textDecorationLine'];
  textDecorationColor?: string;
  textDecorationStyle?: TextStyle['textDecorationStyle'];

  // Truncamiento
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';

  // Test ID
  testID?: string;

  children?: React.ReactNode;
}

const TextComponent = forwardRef<Text, TextProps>(
  (
    {
      variant = 'bodyMedium',
      color,
      mode,
      colorMode,
      fontSize,
      fontWeight,
      lineHeight,
      letterSpacing,
      fontFamily,
      textAlign,
      textTransform,
      textDecorationLine,
      textDecorationColor,
      textDecorationStyle,
      numberOfLines,
      ellipsizeMode,
      style,
      testID,
      children,
      ...rest
    }: TextProps,
    ref
  ) => {
    const { resolvedMode } = useThemeStore();
    // Si no llega un modo explícito, se resuelve desde el store (follows dark mode global)
    const resolvedColorMode = mode ?? colorMode ?? resolvedMode;
    const colors = getColors(resolvedColorMode);
    const variantStyle = TypographyVariants[variant];

    // Si se sobreescribe fontSize SIN lineHeight explícito, se recalcula el
    // lineHeight usando el ratio del variant para no recortar el texto.
    const lineHeightRatio = variantStyle.lineHeight / variantStyle.fontSize;

    const computedStyle: TextStyle = {
      ...variantStyle,
      fontSize: fontSize ?? variantStyle.fontSize,
      fontWeight: fontWeight ?? variantStyle.fontWeight,
      lineHeight:
        lineHeight ??
        (fontSize !== undefined
          ? getLineHeight(lineHeightRatio, fontSize)
          : variantStyle.lineHeight),
      letterSpacing: letterSpacing ?? variantStyle.letterSpacing,
      fontFamily: fontFamily ?? variantStyle.fontFamily,
      color: color ? colors[color] : undefined,
      textAlign,
      textTransform,
      textDecorationLine,
      textDecorationColor,
      textDecorationStyle,
    };

    // Remove undefined values
    Object.keys(computedStyle).forEach(
      (key) => computedStyle[key as keyof TextStyle] === undefined && delete computedStyle[key as keyof TextStyle]
    );

    return (
      <Text
        ref={ref}
        style={[computedStyle, style]}
        testID={testID}
        numberOfLines={numberOfLines}
        ellipsizeMode={ellipsizeMode}
        {...rest}
      >
        {children}
      </Text>
    );
  }
);

TextComponent.displayName = 'Text';

export { TextComponent as Text };
