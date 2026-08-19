/**
 * Dónde Hay - Box Component
 * Wrapper flexbox base con props de spacing, layout y styling
 */

import React, { forwardRef } from 'react';
import { View, ViewStyle } from 'react-native';
import { Spacing } from '@/theme/spacing';
import { BorderRadius } from '@/theme/radius';
import { Shadows, getShadow } from '@/theme/shadows';
import { ColorPalette, getColors } from '@/theme/colors';

export interface BoxProps extends React.ComponentPropsWithoutRef<typeof View> {
  flex?: number;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: ViewStyle['justifyContent'];
  alignItems?: ViewStyle['alignItems'];
  alignSelf?: ViewStyle['alignSelf'];
  flexWrap?: ViewStyle['flexWrap'];
  gap?: keyof typeof Spacing;
  rowGap?: keyof typeof Spacing;
  columnGap?: keyof typeof Spacing;

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

  w?: string | number;
  h?: string | number;
  minW?: string | number;
  minH?: string | number;
  maxW?: string | number;
  maxH?: string | number;
  width?: string | number;
  height?: string | number;

  bg?: keyof ColorPalette;
  bgColor?: string;
  borderRadius?: keyof typeof BorderRadius;
  borderWidth?: number;
  borderColor?: string;
  shadow?: keyof typeof Shadows.light;
  elevation?: number;
  zIndex?: number;
  opacity?: number;
  overflow?: 'visible' | 'hidden' | 'scroll';

  position?: 'absolute' | 'relative';
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;

  mode?: 'light' | 'dark';
  children?: React.ReactNode;
  testID?: string;
}

const Box = forwardRef<View, BoxProps>(
  (
    {
      flex,
      flexDirection,
      justifyContent,
      alignItems,
      alignSelf,
      flexWrap,
      gap,
      rowGap,
      columnGap,
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
      w,
      h,
      minW,
      minH,
      maxW,
      maxH,
      width,
      height,
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
      position,
      top,
      right,
      bottom,
      left,
      mode = 'light',
      children,
      style,
      testID,
      ...rest
    }: BoxProps,
    ref
  ) => {
    const colors = getColors(mode);

    const computedStyle: ViewStyle = {
      flex,
      flexDirection,
      justifyContent,
      alignItems,
      alignSelf,
      flexWrap,
      gap: gap ? (Spacing[gap] as number) : undefined,
      rowGap: rowGap ? (Spacing[rowGap] as number) : undefined,
      columnGap: columnGap ? (Spacing[columnGap] as number) : undefined,
      padding: p ? (Spacing[p] as number) : undefined,
      paddingHorizontal: px ? (Spacing[px] as number) : undefined,
      paddingVertical: py ? (Spacing[py] as number) : undefined,
      paddingTop: pt ? (Spacing[pt] as number) : undefined,
      paddingRight: pr ? (Spacing[pr] as number) : undefined,
      paddingBottom: pb ? (Spacing[pb] as number) : undefined,
      paddingLeft: pl ? (Spacing[pl] as number) : undefined,
      margin: m ? (Spacing[m] as number) : undefined,
      marginHorizontal: mx ? (Spacing[mx] as number) : undefined,
      marginVertical: my ? (Spacing[my] as number) : undefined,
      marginTop: mt ? (Spacing[mt] as number) : undefined,
      marginRight: mr ? (Spacing[mr] as number) : undefined,
      marginBottom: mb ? (Spacing[mb] as number) : undefined,
      marginLeft: ml ? (Spacing[ml] as number) : undefined,
      width: (w ?? width) as ViewStyle['width'],
      height: (h ?? height) as ViewStyle['height'],
      minWidth: minW as ViewStyle['minWidth'],
      minHeight: minH as ViewStyle['minHeight'],
      maxWidth: maxW as ViewStyle['maxWidth'],
      maxHeight: maxH as ViewStyle['maxHeight'],
      backgroundColor: bg ? colors[bg] : bgColor,
      borderRadius: borderRadius ? (BorderRadius[borderRadius] as number) : undefined,
      borderWidth,
      borderColor,
      opacity,
      overflow,
      position,
      top,
      right,
      bottom,
      left,
      zIndex,
      ...(shadow ? getShadow(shadow, mode) : {}),
      elevation: elevation ?? (shadow ? Shadows[mode][shadow].elevation : undefined),
    };

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
