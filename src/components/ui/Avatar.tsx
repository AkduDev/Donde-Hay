/**
 * Dónde Hay - Avatar Component
 * Avatar con imagen, iniciales, badge de estado
 */

import React, { forwardRef } from 'react';
import { Image, ImageSourcePropType, Pressable, View, ViewStyle, StyleProp } from 'react-native';
import { Box } from './Box';
import { Text as TextComponent } from './Text';
import { Badge } from './Badge';
import { BorderRadius } from '@/theme/radius';
import { Spacing } from '@/theme/spacing';
import { FontSizes } from '@/theme/typography';
import { ColorPalette, getColors } from '@/theme/colors';
import { useThemeStore } from '@/store/themeStore';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps {
  source?: ImageSourcePropType;
  name?: string;
  size?: AvatarSize;
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away' | null;
  statusPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  mode?: 'light' | 'dark';
  testID?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

const sizeConfig: Record<AvatarSize, {
  width: number;
  height: number;
  fontSize: number;
  statusSize: number;
  statusBorder: number;
}> = {
  xs: { width: 24, height: 24, fontSize: FontSizes.xs, statusSize: 8, statusBorder: 1 },
  sm: { width: 32, height: 32, fontSize: FontSizes.sm, statusSize: 10, statusBorder: 2 },
  md: { width: 40, height: 40, fontSize: FontSizes.base, statusSize: 12, statusBorder: 2 },
  lg: { width: 48, height: 48, fontSize: FontSizes.lg, statusSize: 14, statusBorder: 2 },
  xl: { width: 64, height: 64, fontSize: FontSizes.xl, statusSize: 16, statusBorder: 3 },
  '2xl': { width: 96, height: 96, fontSize: FontSizes['3xl'], statusSize: 20, statusBorder: 3 },
};

const Avatar = forwardRef<View, AvatarProps>(
  (
    {
      source,
      name,
      size = 'md',
      shape = 'circle',
      status = null,
      statusPosition = 'bottom-right',
      mode,
      testID,
      style,
      onPress,
    }: AvatarProps,
    ref
  ) => {
    const { resolvedMode } = useThemeStore();
    const resolved = mode ?? resolvedMode;
    const colors = getColors(resolved);
    const sConfig = sizeConfig[size];
    const borderRadius = shape === 'circle' ? BorderRadius.full : BorderRadius.md;

    const getInitials = (fullName: string) => {
      return fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const getBackgroundColor = (fullName: string) => {
      const hues = [
        '#2563EB', '#00C896', '#F59E0B', '#EF4444',
        '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
      ];
      let hash = 0;
      for (let i = 0; i < fullName.length; i++) {
        hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hues[Math.abs(hash) % hues.length];
    };

    const initials = name ? getInitials(name) : '?';
    const bgColor = name ? getBackgroundColor(name) : colors.surfaceVariant;

    const avatarStyle: ViewStyle = {
      width: sConfig.width,
      height: sConfig.height,
      borderRadius,
      backgroundColor: bgColor,
      overflow: 'hidden',
    };

    const statusColors: Record<NonNullable<typeof status>, keyof ColorPalette> = {
      online: 'statusAvailable',
      offline: 'statusUnknown',
      busy: 'error',
      away: 'warning',
    };

    const getStatusPosition = () => {
      const positions: Record<typeof statusPosition, ViewStyle> = {
        'bottom-right': { position: 'absolute', bottom: 0, right: 0 },
        'bottom-left': { position: 'absolute', bottom: 0, left: 0 },
        'top-right': { position: 'absolute', top: 0, right: 0 },
        'top-left': { position: 'absolute', top: 0, left: 0 },
      };
      return positions[statusPosition];
    };

    const content = (
      <>
        {source ? (
          <Image
            source={source}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            testID={`${testID}-image`}
          />
        ) : (
          <Box
            flex={1}
            justifyContent="center"
            alignItems="center"
            testID={`${testID}-initials`}
            mode={resolved}
          >
            <TextComponent
              variant="titleMedium"
              color="textInverse"
              style={{ fontSize: sConfig.fontSize }}
              mode={resolved}
            >
              {initials}
            </TextComponent>
          </Box>
        )}

        {status && (
          <Box
            style={[
              getStatusPosition(),
              {
                width: sConfig.statusSize,
                height: sConfig.statusSize,
                borderRadius: BorderRadius.full,
                backgroundColor: colors[statusColors[status]],
                borderWidth: sConfig.statusBorder,
                borderColor: colors.background,
              },
            ]}
            testID={`${testID}-status`}
            mode={resolved}
          />
        )}
      </>
    );

    if (onPress) {
      return (
        <Pressable onPress={onPress} testID={testID}>
          <Box
            position="relative"
            style={[{ ...avatarStyle }, style]}
            mode={resolved}
          >
            {content}
          </Box>
        </Pressable>
      );
    }

    return (
      <Box
        ref={ref}
        position="relative"
        style={[{ ...avatarStyle }, style]}
        testID={testID}
        mode={resolved}
      >
        {content}
      </Box>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
