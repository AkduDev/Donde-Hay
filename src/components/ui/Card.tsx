/**
 * Dónde Hay - Card Component
 * Card con variants: elevated, outlined, filled
 */

import React, { forwardRef } from 'react';
import { View, ViewStyle, StyleProp, Pressable, PressableProps } from 'react-native';
import { Box } from './Box';
import { Text } from './Text';
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

const Card = forwardRef<View, CardProps>(
  (
    {
      variant = 'elevated',
      padding = 'md',
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
      padding: Spacing[padding] as number,
      ...variantStyles[variant](mode),
    };

    if (onPress) {
      return (
        <Pressable
          ref={ref as any}
          onPress={onPress}
          style={[containerStyle, style]}
          testID={testID}
          {...rest}
        >
          {children}
        </Pressable>
      );
    }

    return (
      <Box
        ref={ref}
        style={[containerStyle, style]}
        testID={testID}
        mode={mode}
      >
        {children}
      </Box>
    );
  }
);

Card.displayName = 'Card';

// Sub-componentes de Card
export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  mode?: 'light' | 'dark';
  testID?: string;
}

const CardHeader = forwardRef<View, CardHeaderProps>(
  ({ title, subtitle, action, mode = 'light', testID }, ref) => (
    <Box
      ref={ref}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="flex-start"
      gap="sm"
      mode={mode}
      testID={testID}
    >
      <Box flex={1} mode={mode}>
        <Text variant="titleMedium" color="text" mode={mode} testID={`${testID}-title`}>
          {title}
        </Text>
        {subtitle && (
          <Box mt="xs">
            <Text variant="bodySmall" color="textSecondary" mode={mode} testID={`${testID}-subtitle`}>
              {subtitle}
            </Text>
          </Box>
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

const CardContent = forwardRef<View, CardContentProps>(
  ({ children, mode = 'light', testID }, ref) => (
    <Box ref={ref} mode={mode} testID={testID}>
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

const CardFooter = forwardRef<View, CardFooterProps>(
  ({ children, divided = true, mode = 'light', testID }, ref) => (
    <Box
      ref={ref}
      flexDirection="row"
      justifyContent="flex-end"
      gap="sm"
      mode={mode}
      testID={testID}
    >
      {divided && (
        <Box
          width="100%"
          py="sm"
          mode={mode}
          style={{ borderTopWidth: 1, borderColor: getColors(mode).divider }}
        />
      )}
      {children}
    </Box>
  )
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };
