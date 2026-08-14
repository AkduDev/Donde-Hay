/**
 * Dónde Hay - Button Component
 * Botón con múltiples variants, tamaños y estados
 */

import React, { forwardRef } from 'react';
import {
  Pressable,
  PressableProps,
  Text,
  TextStyle,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';
import { Box } from './Box';
import { Text as TextComponent } from './Text';
import { BorderRadius } from '@/theme/radius';
import { Spacing } from '@/theme/spacing';
import { Shadows, getShadow } from '@/theme/shadows';
import { ColorPalette, getColors } from '@/theme/colors';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'accent';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  // Variant & Size
  variant?: ButtonVariant;
  size?: ButtonSize;

  // State
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;

  // Layout
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconSpacing?: keyof typeof Spacing;

  // Content
  children: React.ReactNode;

  // Custom styling
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;

  // Theme
  mode?: 'light' | 'dark';

  // Test ID
  testID?: string;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// Configuración de variants
const variantConfig: Record<ButtonVariant, {
  bg: keyof ColorPalette;
  bgHover: keyof ColorPalette;
  bgPressed: keyof ColorPalette;
  bgDisabled: keyof ColorPalette;
  text: keyof ColorPalette;
  textDisabled: keyof ColorPalette;
  border: keyof ColorPalette;
}> = {
  primary: {
    bg: 'primary',
    bgHover: 'primaryDark',
    bgPressed: 'primaryDark',
    bgDisabled: 'disabledBackground',
    text: 'onPrimary',
    textDisabled: 'disabled',
    border: 'primary',
  },
  secondary: {
    bg: 'surfaceVariant',
    bgHover: 'surfaceContainerHigh',
    bgPressed: 'surfaceContainerHighest',
    bgDisabled: 'disabledBackground',
    text: 'text',
    textDisabled: 'disabled',
    border: 'border',
  },
  outline: {
    bg: 'transparent',
    bgHover: 'primaryContainer',
    bgPressed: 'primaryContainer',
    bgDisabled: 'transparent',
    text: 'primary',
    textDisabled: 'disabled',
    border: 'primary',
  },
  ghost: {
    bg: 'transparent',
    bgHover: 'surfaceVariant',
    bgPressed: 'surfaceContainerHigh',
    bgDisabled: 'transparent',
    text: 'text',
    textDisabled: 'disabled',
    border: 'transparent',
  },
  danger: {
    bg: 'error',
    bgHover: 'error',
    bgPressed: 'error',
    bgDisabled: 'disabledBackground',
    text: 'onError',
    textDisabled: 'disabled',
    border: 'error',
  },
  success: {
    bg: 'success',
    bgHover: 'success',
    bgPressed: 'success',
    bgDisabled: 'disabledBackground',
    text: 'onSuccess',
    textDisabled: 'disabled',
    border: 'success',
  },
  accent: {
    bg: 'accent',
    bgHover: 'accentDark',
    bgPressed: 'accentDark',
    bgDisabled: 'disabledBackground',
    text: 'onAccent',
    textDisabled: 'disabled',
    border: 'accent',
  },
};

// Configuración de tamaños
const sizeConfig: Record<ButtonSize, {
  height: number;
  paddingX: keyof typeof Spacing;
  paddingY: keyof typeof Spacing;
  gap: keyof typeof Spacing;
  fontSize: number;
  fontWeight: keyof typeof import('@/theme/typography').FontWeights;
  borderRadius: keyof typeof BorderRadius;
  iconSize: number;
}> = {
  xs: {
    height: 28,
    paddingX: '2',
    paddingY: '0',
    gap: '1',
    fontSize: 11,
    fontWeight: 'medium',
    borderRadius: 'sm',
    iconSize: 14,
  },
  sm: {
    height: 36,
    paddingX: '3',
    paddingY: '0',
    gap: '2',
    fontSize: 12,
    fontWeight: 'medium',
    borderRadius: 'sm',
    iconSize: 16,
  },
  md: {
    height: 44,
    paddingX: '4',
    paddingY: '1',
    gap: '2',
    fontSize: 14,
    fontWeight: 'semiBold',
    borderRadius: 'md',
    iconSize: 18,
  },
  lg: {
    height: 52,
    paddingX: '5',
    paddingY: '1',
    gap: '3',
    fontSize: 16,
    fontWeight: 'semiBold',
    borderRadius: 'md',
    iconSize: 20,
  },
  xl: {
    height: 60,
    paddingX: '6',
    paddingY: '2',
    gap: '3',
    fontSize: 18,
    fontWeight: 'bold',
    borderRadius: 'lg',
    iconSize: 22,
  },
};

const Button = forwardRef<Pressable, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      loadingText = 'Cargando...',
      fullWidth = false,
      leftIcon,
      rightIcon,
      iconSpacing = '2',
      children,
      style,
      textStyle,
      containerStyle,
      mode = 'light',
      testID,
      accessibilityLabel,
      accessibilityHint,
      onPress,
      onPressIn,
      onPressOut,
      onLongPress,
      ...rest
    }: ButtonProps,
    ref
  ) => {
    const colors = getColors(mode);
    const vConfig = variantConfig[variant];
    const sConfig = sizeConfig[size];
    const isDisabled = disabled || loading;

    // Estado de pressed para feedback visual
    const [pressed, setPressed] = React.useState(false);

    const handlePressIn = (event: React.SyntheticEvent) => {
      if (!isDisabled) setPressed(true);
      onPressIn?.(event);
    };

    const handlePressOut = (event: React.SyntheticEvent) => {
      setPressed(false);
      onPressOut?.(event);
    };

    const handlePress = (event: React.SyntheticEvent) => {
      if (!isDisabled) onPress?.(event);
    };

    // Colores dinámicos según estado
    const getBackgroundColor = () => {
      if (isDisabled) return colors[vConfig.bgDisabled];
      if (pressed) return colors[vConfig.bgPressed];
      return colors[vConfig.bg];
    };

    const getTextColor = () => {
      if (isDisabled) return colors[vConfig.textDisabled];
      return colors[vConfig.text];
    };

    const getBorderColor = () => {
      if (variant === 'outline' && isDisabled) return colors[vConfig.textDisabled];
      return colors[vConfig.border];
    };

    const buttonStyle: ViewStyle = {
      height: sConfig.height,
      paddingHorizontal: Spacing[sConfig.paddingX],
      paddingVertical: Spacing[sConfig.paddingY],
      borderRadius: BorderRadius[sConfig.borderRadius],
      backgroundColor: getBackgroundColor(),
      borderWidth: variant === 'outline' || variant === 'ghost' ? 1.5 : 0,
      borderColor: getBorderColor(),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing[iconSpacing],
      width: fullWidth ? '100%' : undefined,
      opacity: isDisabled ? 0.6 : 1,
      // Shadow para variants elevados
      ...(variant === 'primary' || variant === 'danger' || variant === 'success' || variant === 'accent') && {
        ...getShadow('sm', mode),
        elevation: 2,
      },
      ...(pressed && (variant === 'primary' || variant === 'danger' || variant === 'success' || variant === 'accent')) && {
        ...getShadow('xs', mode),
        elevation: 1,
      },
    };

    const textStyleComputed: TextStyle = {
      fontSize: sConfig.fontSize,
      fontWeight: sConfig.fontWeight,
      color: getTextColor(),
      textAlign: 'center',
      lineHeight: sConfig.height - Spacing[sConfig.paddingY] * 2,
    };

    const content = loading ? (
      <>
        <ActivityIndicator
          size="small"
          color={getTextColor()}
          testID={`${testID}-loader`}
        />
        <TextComponent variant="labelMedium" color={vConfig.textDisabled as keyof ColorPalette} mode={mode}>
          {loadingText}
        </TextComponent>
      </>
    ) : (
      <>
        {leftIcon && <Box testID={`${testID}-left-icon`}>{leftIcon}</Box>}
        <TextComponent
          variant="labelMedium"
          style={[textStyleComputed, textStyle]}
          testID={`${testID}-text`}
        >
          {children}
        </TextComponent>
        {rightIcon && <Box testID={`${testID}-right-icon`}>{rightIcon}</Box>}
      </>
    );

    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress}
        disabled={isDisabled}
        style={({ pressed: pressablePressed }) => [
          buttonStyle,
          containerStyle,
          style,
        ]}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        {...rest}
      >
        {content}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };