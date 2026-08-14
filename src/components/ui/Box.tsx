/**
 * Dónde Hay - Box Component
 * Wrapper flexbox base con props de spacing, layout y styling
 */

import React, { forwardRef } from 'react';
import { View, ViewStyle } from 'react-native';
import { Spacing } from '@/theme/spacing';
import { BorderRadius } from '@/theme/radius';
import { Shadows, getShadow, ZIndex } from '@/theme/shadows';
import { ColorPalette, getColors } from '@/theme/colors';

export interface BoxProps extends React.ComponentPropsWithoutRef<typeof View> {
  // Layout
  flex?: number;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: ViewStyle['justifyContent'];
  alignItems?: ViewStyle['alignItems'];
  alignSelf?: ViewStyle['alignSelf'];
  flexWrap?: ViewStyle['flexWrap'];
  gap?: keyof typeof Spacing;
  rowGap?: keyof typeof Spacing;
  columnGap?: keyof typeof Spacing;

  // Spacing
  p?: keyof typeof Spacing;
  px?: keyof typeof Spacing;
  py?: keyof typeof Spacing;
  pt?: keyof typeof Spacing;
  pr?: keyof typeof Spacing;
  pb?: keyof typeof Spacing;
  pl?: keyof typeof Spacing;
  m?: keyof typeof Spacing;
  mx?: keyof typeof Spacing;
  my?: keyof typeof Spacing;
  mt?: keyof typeof Spacing;
  mr?: keyof typeof Spacing;
  mb?: keyof typeof Spacing;
  ml?: keyof typeof Spacing;

  // Sizing
  w?: string | number;
  h?: string | number;
  minW?: string | number;
  minH?: string | number;
  maxW?: string | number;
  maxH?: string | number;
  width?: string | number;
  height?: string | number;

  // Visual
  bg?: keyof ColorPalette;
  bgColor?: string;
  borderRadius?: keyof typeof BorderRadius;
  borderWidth?: number;
  borderColor?: string;
  shadow?: keyof typeof Shadows.light;
  elevation?: number;
  zIndex?: keyof typeof ZIndex;
  opacity?: number;
  overflow?: 'visible' | 'hidden' | 'scroll';

  // Position
  position?: 'absolute' | 'relative';
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;

  // Theme
  mode?: 'light' | 'dark';

  // Children
  children?: React.ReactNode;

  // Test ID
  testID?: string;
}

const Box = forwardRef<View, BoxProps>(
  (
    {
      // Layout
      flex,
      flexDirection,
      justifyContent,
      alignItems,
      alignSelf,
      flexWrap,
      gap,
      rowGap,
      columnGap,

      // Spacing
      p,
      px,
      py,
      pt,
      pr,
      pb,
      pl,
      m,
      mx,
      my,
      mt,
      mr,
      mb,
      ml,

      // Sizing
      w,
      h,
      minW,
      minH,
      maxW,
      maxH,
      width,
      height,

      // Visual
      bg,
      bgColor,
      borderRadius,
      borderWidth,
      borderColor,
      shadow,
      elevation,
      zIndex,
      opacity,
      overflow,

      // Position
      position,
      top,
      right,
      bottom,
      left,

      // Theme
      mode = 'light',

      // Children
      children,

      // Style prop
      style,

      // Test ID
      testID,

      ...rest
    }: BoxProps,
    ref
  ) => {
    const colors = getColors(mode);

    const computedStyle: ViewStyle = {
      // Layout
      flex,
      flexDirection,
      justifyContent,
      alignItems,
      alignSelf,
      flexWrap,

      // Gap
      gap: gap ? Spacing[gap] : undefined,
      rowGap: rowGap ? Spacing[rowGap] : undefined,
      columnGap: columnGap ? Spacing[columnGap] : undefined,

      // Spacing
      padding: p ? Spacing[p] : undefined,
      paddingHorizontal: px ? Spacing[px] : undefined,
      paddingVertical: py ? Spacing[py] : undefined,
      paddingTop: pt ? Spacing[pt] : undefined,
      paddingRight: pr ? Spacing[pr] : undefined,
      paddingBottom: pb ? Spacing[pb] : undefined,
      paddingLeft: pl ? Spacing[pl] : undefined,

      margin: m ? Spacing[m] : undefined,
      marginHorizontal: mx ? Spacing[mx] : undefined,
      marginVertical: my ? Spacing[my] : undefined,
      marginTop: mt ? Spacing[mt] : undefined,
      marginRight: mr ? Spacing[mr] : undefined,
      marginBottom: mb ? Spacing[mb] : undefined,
      marginLeft: ml ? Spacing[ml] : undefined,

      // Sizing
      width: w ?? width,
      height: h ?? height,
      minWidth: minW,
      minHeight: minH,
      maxWidth: maxW,
      maxHeight: maxH,

      // Visual
      backgroundColor: bg ? colors[bg] : bgColor,
      borderRadius: borderRadius ? BorderRadius[borderRadius] : undefined,
      borderWidth,
      borderColor,
      opacity,
      overflow,

      // Position
      position,
      top,
      right,
      bottom,
      left,

      // Shadow
      ...(shadow ? getShadow(shadow, mode) : {}),
      elevation: elevation ?? (shadow ? Shadows[mode][shadow].elevation : undefined),
      zIndex: zIndex ? ZIndex[zIndex] : undefined,
    };

    // Remove undefined values
    Object.keys(computedStyle).forEach(
      (key) => computedStyle[key as keyof ViewStyle] === undefined && delete computedStyle[key as keyof ViewStyle]
    );

    return (
      <View
        ref={ref}
        style={[computedStyle, style]}
        testID={testID}
        {...rest}
      >
        {children}
      </View>
    );
  }
);

Box.displayName = 'Box';

export { Box };
export type { BoxProps };