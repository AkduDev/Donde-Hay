/**
 * Dónde Hay - Card Component
 * Card con variants: elevated, outlined, filled
 */

import React, { forwardRef } from 'react';
import { ViewStyle, StyleProp, PressableProps } from 'react-native';
import { Box } from './Box';
import { BorderRadius } from '@/theme/radius';
import { Spacing } from '@/theme/spacing';
import { Shadows, getShadow, ShadowLevel } from '@/theme/shadows';
import { ColorPalette, getColors } from '@/theme/colors';

export type CardVariant = 'elevated' | 'outlined' | 'filled' | 'ghost';

export interface CardProps extends Omit<PressableProps, 'style' | 'children'> {
  variant?: CardVariant;
  padding?: keyof typeof Spacing;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  mode?: 'light' | 'dark';
  testID?: string;
  onPress?: () => void;
}

const variantStyles: Record<CardVariant, (mode: 'light' | 'dark') => ViewStyle> = {
  elevated: (mode) => ({
    backgroundColor: getColors(mode).surface,
    borderWidth: 0,
    ...getShadow('md', mode),
    elevation: 4,
  }),
  outlined: (mode) => ({
    backgroundColor: getColors(mode).surface,
    borderWidth: 1.5,
    borderColor: getColors(mode).border,
  }),
  filled: (mode) => ({
    backgroundColor: getColors(mode).surfaceVariant,
    borderWidth: 0,
  }),
  ghost: (mode) => ({
    backgroundColor: 'transparent',
    borderWidth: 0,
  }),
};

const Card = forwardRef<React.ComponentPropsWithoutRef<typeof Box>, CardProps>(
  (
    {
      variant = 'elevated',
      padding = '4',
      children,
      style,
      mode = 'light',
      testID,
      onPress,
      ...rest
    }: CardProps,
    ref
  ) => {
    const containerStyle: ViewStyle = {
      borderRadius: BorderRadius.lg,
      padding: Spacing[padding],
      ...variantStyles[variant](mode),
    };

    const Component = onPress ? Pressable : Box;

    return (
      <Component
        ref={ref as any}
        onPress={onPress}
        style={[containerStyle, style]}
        testID={testID}
        mode={mode}
        {...rest}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

export { Card };
export type { CardProps, CardVariant };

// Sub-componentes de Card
export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  mode?: 'light' | 'dark';
  testID?: string;
}

export const CardHeader = forwardRef<React.ComponentPropsWithoutRef<typeof Box>, CardHeaderProps>(
  ({ title, subtitle, action, mode = 'light', testID, ...props }, ref) => (
    <Box
      ref={ref}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="flex-start"
      gap={2}
      mode={mode}
      testID={testID}
      {...props}
    >
      <Box flex={1} mode={mode}>
        <Text variant="titleMedium" color="text" mode={mode} testID={`${testID}-title`}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="bodySmall" color="textSecondary" mode={mode} testID={`${testID}-subtitle`} mt={1}>
            {subtitle}
          </Text>
        )}
      </Box>
      {action && <Box mode={mode}>{action}</Box>}
    </Box>
  )
);

CardHeader.displayName = 'CardHeader';

export interface CardContentProps {
  children: React.ReactNode;
  mode?: 'light' | 'dark';
  testID?: string;
}

export const CardContent = forwardRef<React.ComponentPropsWithoutRef<typeof Box>, CardContentProps>(
  ({ children, mode = 'light', testID, ...props }, ref) => (
    <Box ref={ref} mode={mode} testID={testID} {...props}>
      {children}
    </Box>
  )
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps {
  children: React.ReactNode;
  divided?: boolean;
  mode?: 'light' | 'dark';
  testID?: string;
}

export const CardFooter = forwardRef<React.ComponentPropsWithoutRef<typeof Box>, CardFooterProps>(
  ({ children, divided = true, mode = 'light', testID, ...props }, ref) => (
    <Box
      ref={ref}
      flexDirection="row"
      justifyContent="flex-end"
      gap={2}
      mode={mode}
      testID={testID}
      {...props}
    >
      {divided && (
        <Box
          borderTopWidth={1}
          borderColor={getColors(mode).divider}
          width="100%"
          py={2}
          mode={mode}
        />
      )}
      {children}
    </Box>
  )
);

CardFooter.displayName = 'CardFooter';

// Re-export Text for internal use
import { Text } from './Text';
import { Pressable } from 'react-native';