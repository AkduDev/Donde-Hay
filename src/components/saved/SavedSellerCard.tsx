/**
 * Dónde Hay - SavedSellerCard Component
 * Card para mostrar vendedores guardados
 */

import React from 'react';
import { TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useThemeStore } from '@/store/themeStore';
import type { Seller } from '@/types';

export interface SavedSellerCardProps {
  seller: Seller;
  onPress?: (seller: Seller) => void;
  onRemove?: (seller: Seller) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const SavedSellerCard = React.memo(function SavedSellerCard({
  seller,
  onPress,
  onRemove,
  style,
  testID,
}: SavedSellerCardProps) {
  const { resolvedMode } = useThemeStore();

  const handlePress = () => {
    onPress?.(seller);
  };

  const handleRemove = () => {
    onRemove?.(seller);
  };

  const getVerificationBadge = () => {
    switch (seller.verificationStatus) {
      case 'verified':
        return (
          <Badge variant="success" size="sm">
            ✓ Verificado
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" size="sm">
            En verificación
          </Badge>
        );
      default:
        return null;
    }
  };

  const getSourceIcon = () => {
    switch (seller.sourceId) {
      case 'revolico':
        return '🛒';
      case 'facebook':
        return '👤';
      case 'instagram':
        return '📸';
      case 'telegram':
        return '💬';
      default:
        return '🏪';
    }
  };

  const getSourceName = () => {
    switch (seller.sourceId) {
      case 'revolico':
        return 'Revolico';
      case 'facebook':
        return 'Facebook';
      case 'instagram':
        return 'Instagram';
      case 'telegram':
        return 'Telegram';
      default:
        return seller.sourceId;
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      testID={testID}
      style={style}
    >
      <Box
        p="md"
        bg="surface"
        borderRadius="md"
        mode={resolvedMode}
        style={{
          borderWidth: 1,
          borderColor: resolvedMode === 'dark' ? '#333' : '#e5e7eb',
        }}
      >
        {/* Header */}
        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
          <Box flexDirection="row" alignItems="center" flex={1}>
            <Avatar
              size="md"
              name={seller.name}
              source={seller.sourceProfileUrl ? { uri: seller.sourceProfileUrl } : undefined}
            />
            <Box ml="md" flex={1}>
              <Text variant="titleMedium" color="text" numberOfLines={1}>
                {seller.name}
              </Text>
              <Box flexDirection="row" alignItems="center" mt="xs">
                <Text variant="bodySmall" color="textSecondary">
                  {getSourceIcon()} {getSourceName()}
                </Text>
                {seller.rating && (
                  <Box ml="sm">
                    <Text variant="bodySmall" color="textSecondary">
                      ⭐ {seller.rating.toFixed(1)}
                    </Text>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
          <TouchableOpacity onPress={handleRemove}>
            <Text variant="bodyMedium" color="error">
              ✕
            </Text>
          </TouchableOpacity>
        </Box>

        {/* Verification Badge */}
        {getVerificationBadge() && (
          <Box mt="sm">
            {getVerificationBadge()}
          </Box>
        )}

        {/* Contact Info */}
        {(seller.phone || seller.whatsapp) && (
          <Box
            mt="md"
            pt="md"
            style={{ borderTopWidth: 1, borderTopColor: resolvedMode === 'dark' ? '#333' : '#e5e7eb' }}
          >
            <Text variant="bodySmall" color="textSecondary">
              {seller.phone && `📱 ${seller.phone}`}
              {seller.phone && seller.whatsapp && ' • '}
              {seller.whatsapp && '💬 WhatsApp'}
            </Text>
          </Box>
        )}
      </Box>
    </TouchableOpacity>
  );
});
