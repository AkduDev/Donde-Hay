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
import { getShadow } from '@/theme/shadows';
import { getColors } from '@/theme/colors';
import { useThemeStore } from '@/store/themeStore';

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
  ghost: () => ({
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
      mode,
      testID,
      onPress,
      ...rest
    }: CardProps,
    ref
  ) => {
    const { resolvedMode } = useThemeStore();
    const resolved = mode ?? resolvedMode;
    const containerStyle: ViewStyle = {
      borderRadius: BorderRadius.lg,
      padding: Spacing[padding] as number,
      ...variantStyles[variant](resolved),
    };

    if (onPress) {
      return (
        <Pressable
          ref={ref}
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
        mode={resolved}
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
  ({ title, subtitle, action, mode, testID }, ref) => {
    const { resolvedMode } = useThemeStore();
    const resolved = mode ?? resolvedMode;
    return (
      <Box
        ref={ref}
        flexDirection="row"
        justifyContent="space-between"
        alignItems="flex-start"
        gap="sm"
        mode={resolved}
        testID={testID}
      >
        <Box flex={1} mode={resolved}>
          <Text variant="titleMedium" color="text" mode={resolved} testID={`${testID}-title`}>
            {title}
          </Text>
          {subtitle && (
            <Box mt="xs">
              <Text variant="bodySmall" color="textSecondary" mode={resolved} testID={`${testID}-subtitle`}>
                {subtitle}
              </Text>
            </Box>
          )}
        </Box>
        {action && <Box mode={resolved}>{action}</Box>}
      </Box>
    );
  }
);

CardHeader.displayName = 'CardHeader';

export interface CardContentProps {
  children: React.ReactNode;
  mode?: 'light' | 'dark';
  testID?: string;
}

const CardContent = forwardRef<View, CardContentProps>(
  ({ children, mode, testID }, ref) => {
    const { resolvedMode } = useThemeStore();
    const resolved = mode ?? resolvedMode;
    return <Box ref={ref} mode={resolved} testID={testID}>{children}</Box>;
  }
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps {
  children: React.ReactNode;
  divided?: boolean;
  mode?: 'light' | 'dark';
  testID?: string;
}

const CardFooter = forwardRef<View, CardFooterProps>(
  ({ children, divided = true, mode, testID }, ref) => {
    const { resolvedMode } = useThemeStore();
    const resolved = mode ?? resolvedMode;
    return (
      <Box
        ref={ref}
        flexDirection="row"
        justifyContent="flex-end"
        gap="sm"
        mode={resolved}
        testID={testID}
      >
        {divided && (
          <Box
            width="100%"
            py="sm"
            mode={resolved}
            style={{ borderTopWidth: 1, borderColor: getColors(resolved).divider }}
          />
        )}
        {children}
      </Box>
    );
  }
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };
