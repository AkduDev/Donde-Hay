/**
 * Dónde Hay - ProductCard Component
 * Card para mostrar productos en resultados de búsqueda
 * Muestra información agrupada de ofertas del mismo producto
 */

import React from 'react';
import { Pressable, Image, ViewStyle, StyleProp, TextStyle } from 'react-native';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { BorderRadius } from '@/theme/radius';
import { Spacing } from '@/theme/spacing';
import { getColors } from '@/theme/colors';
import { useThemeStore } from '@/store/themeStore';
import type { ProductWithOffers } from '@/types';

// ============================================
// TIPOS
// ============================================

export interface ProductCardProps {
  product: ProductWithOffers;
  onPress?: (product: ProductWithOffers) => void;
  onFavoritePress?: (product: ProductWithOffers) => void;
  isFavorite?: boolean;
  layout?: 'list' | 'grid';
  showOffers?: boolean;
  maxOffersToShow?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ============================================
// HELPERS
// ============================================

/** Calcula el estado de disponibilidad basado en la última oferta */
function getAvailabilityStatus(product: ProductWithOffers): {
  label: string;
  variant: 'success' | 'warning' | 'default';
  icon: string;
} {
  if (!product.offers || product.offers.length === 0) {
    return { label: 'Sin datos', variant: 'default', icon: '⚪' };
  }

  const lastOffer = product.offers.reduce((latest, offer) =>
    new Date(offer.postedAt) > new Date(latest.postedAt) ? offer : latest
  );

  const hoursSincePosted =
    (Date.now() - new Date(lastOffer.postedAt).getTime()) / (1000 * 60 * 60);

  if (hoursSincePosted <= 24) {
    return { label: 'Reciente', variant: 'success', icon: '🟢' };
  } else if (hoursSincePosted <= 24 * 7) {
    return { label: 'Esta semana', variant: 'warning', icon: '🟡' };
  } else {
    return { label: 'Antiguo', variant: 'default', icon: '⚪' };
  }
}

/** Formatea el precio según la moneda */
function formatPrice(price: number, currency: string): string {
  const symbols: Record<string, string> = { USD: '$', CUP: '₱', MLC: 'M' };
  const symbol = symbols[currency] ?? '$';
  return `${symbol}${price.toLocaleString('es-CU')}`;
}

/** Obtiene el tiempo relativo desde publicación */
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  return date.toLocaleDateString('es-CU', { day: 'numeric', month: 'short' });
}

// ============================================
// COMPONENTE
// ============================================

const ProductCard = ({
  product,
  onPress,
  onFavoritePress,
  isFavorite = false,
  layout = 'list',
  showOffers = true,
  maxOffersToShow = 3,
  style,
  testID,
}: ProductCardProps) => {
  const { resolvedMode } = useThemeStore();
  const colors = getColors(resolvedMode);

  const availability = getAvailabilityStatus(product);
  const validOffers = product.offers ?? [];
  const minPriceOffer = validOffers.length > 0
    ? validOffers.reduce((min, offer) => (offer.price < min.price ? offer : min))
    : null;
  const offerCount = validOffers.length;

  const handlePress = () => onPress?.(product);
  const handleFavorite = () => onFavoritePress?.(product);

  const isGrid = layout === 'grid';

  // ============================================
  // SUB-COMPONENTES
  // ============================================

  const ProductImage = () => (
    <Box
      width={isGrid ? '100%' : 100}
      height={isGrid ? 140 : 100}
      borderRadius="md"
      overflow="hidden"
      bg="surfaceVariant"
      mode={resolvedMode}
    >
      {product.imageUrls?.[0] ? (
        <Image
          source={{ uri: product.imageUrls[0] }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          testID={`${testID}-image`}
        />
      ) : (
        <Box flex={1} alignItems="center" justifyContent="center" mode={resolvedMode}>
          <Text variant="headlineSmall" color="textTertiary" mode={resolvedMode}>
            📦
          </Text>
        </Box>
      )}
    </Box>
  );

  const FavoriteButton = () => (
    <Pressable
      onPress={handleFavorite}
      testID={`${testID}-favorite`}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel={isFavorite ? 'Quitar de guardados' : 'Guardar producto'}
      accessibilityRole="button"
    >
      <Box
        width={36}
        height={36}
        borderRadius="full"
        bg={isFavorite ? 'errorContainer' : 'surfaceContainerHigh'}
        alignItems="center"
        justifyContent="center"
        mode={resolvedMode}
      >
        <Text variant="bodyLarge" mode={resolvedMode}>
          {isFavorite ? '❤️' : '🤍'}
        </Text>
      </Box>
    </Pressable>
  );

  const OffersList = () => {
    if (!showOffers || validOffers.length === 0) return null;

    const offersToShow = validOffers
      .slice()
      .sort((a, b) => a.price - b.price)
      .slice(0, maxOffersToShow);

    return (
      <Box gap={2} mt={3} pt={3} borderWidth={0} borderTopWidth={1} borderColor="divider" mode={resolvedMode}>
        {offersToShow.map((offer, index) => (
          <Box
            key={offer.id}
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            mode={resolvedMode}
          >
            <Box flexDirection="row" alignItems="center" gap={2}>
              <Text variant="bodySmall" mode={resolvedMode}>
                {index === 0 ? '🏆' : '•'}
              </Text>
              <Text variant="labelMedium" color="textSecondary" mode={resolvedMode}>
                {offer.sourceId}
              </Text>
            </Box>
            <Text
              variant="labelMedium"
              color={index === 0 ? 'success' : 'text'}
              fontWeight={index === 0 ? 'semiBold' : 'regular'}
              mode={resolvedMode}
            >
              {formatPrice(offer.price, offer.currency)} · {getRelativeTime(offer.postedAt)}
            </Text>
          </Box>
        ))}
        {offerCount > maxOffersToShow && (
          <Text variant="labelSmall" color="primary" mode={resolvedMode}>
            +{offerCount - maxOffersToShow} ofertas más
          </Text>
        )}
      </Box>
    );
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <Pressable
      onPress={handlePress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${product.canonicalName}, desde ${minPriceOffer ? formatPrice(minPriceOffer.price, minPriceOffer.currency) : 'precio no disponible'}`}
    >
      <Card
        variant="elevated"
        padding={isGrid ? '2' : '3'}
        style={[
          {
            width: isGrid ? '100%' : undefined,
          },
          style,
        ]}
        mode={resolvedMode}
      >
        {isGrid ? (
          // Grid layout (vertical)
          <Box mode={resolvedMode}>
            <Box position="relative" mb={2} mode={resolvedMode}>
              <ProductImage />
              <Box position="absolute" top={2} right={2} mode={resolvedMode}>
                <FavoriteButton />
              </Box>
            </Box>

            <Text
              variant="titleSmall"
              color="text"
              numberOfLines={2}
              ellipsizeMode="tail"
              mode={resolvedMode}
              mb={1}
            >
              {product.canonicalName}
            </Text>

            {minPriceOffer && (
              <Text variant="titleMedium" color="success" fontWeight="bold" mode={resolvedMode}>
                {formatPrice(minPriceOffer.price, minPriceOffer.currency)}
              </Text>
            )}

            <Box flexDirection="row" justifyContent="space-between" alignItems="center" mt={1}>
              <Badge variant={availability.variant} size="xs">
                {availability.icon} {availability.label}
              </Badge>
              {offerCount > 1 && (
                <Text variant="labelSmall" color="textSecondary" mode={resolvedMode}>
                  {offerCount} ofertas
                </Text>
              )}
            </Box>
          </Box>
        ) : (
          // List layout (horizontal)
          <Box flexDirection="row" gap={3} mode={resolvedMode}>
            <ProductImage />

            <Box flex={1} mode={resolvedMode}>
              <Box
                flexDirection="row"
                justifyContent="space-between"
                alignItems="flex-start"
                mode={resolvedMode}
              >
                <Box flex={1} mr={2} mode={resolvedMode}>
                  <Text
                    variant="titleSmall"
                    color="text"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    mode={resolvedMode}
                  >
                    {product.canonicalName}
                  </Text>
                  <Text variant="bodySmall" color="textSecondary" mode={resolvedMode} mt={0.5}>
                    {product.brand} {product.model}
                  </Text>
                </Box>
                <FavoriteButton />
              </Box>

              {minPriceOffer && (
                <Box flexDirection="row" alignItems="baseline" gap={2} mt={2} mode={resolvedMode}>
                  <Text variant="titleLarge" color="success" fontWeight="bold" mode={resolvedMode}>
                    {formatPrice(minPriceOffer.price, minPriceOffer.currency)}
                  </Text>
                  {offerCount > 1 && (
                    <Text variant="labelSmall" color="textSecondary" mode={resolvedMode}>
                      en {offerCount} ofertas
                    </Text>
                  )}
                </Box>
              )}

              <Box flexDirection="row" justifyContent="space-between" alignItems="center" mt={2}>
                <Badge variant={availability.variant} size="xs">
                  {availability.icon} {availability.label}
                </Badge>
                {minPriceOffer && (
                  <Text variant="labelSmall" color="textTertiary" mode={resolvedMode}>
                    📍 {minPriceOffer.locationId}
                  </Text>
                )}
              </Box>

              <OffersList />
            </Box>
          </Box>
        )}
      </Card>
    </Pressable>
  );
};

ProductCard.displayName = 'ProductCard';

export { ProductCard };
export type { ProductCardProps };