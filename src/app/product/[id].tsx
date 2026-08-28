/**
 * Dónde Hay - Product Detail Screen
 * Product detail with price comparison and Revolico seller contact
 */

import React, { useState } from 'react';
import { ScrollView, Pressable, Linking } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { SourceChip } from '@/components/product/SourceChip';
import { useThemeStore } from '@/store/themeStore';
import { useProduct } from '@/hooks/use-products';
import { useAddFavorite, useRemoveFavorite } from '@/hooks/use-favorites';
import { formatPrice, getSourceIcon } from '@/utils/format';
import { getColors } from '@/theme/colors';
import type { ProductOffer } from '@/types';

function getSourceName(sourceId: string): string {
  const sources: Record<string, string> = {
    revolico: 'Revolico',
    facebook: 'Facebook',
    instagram: 'Instagram',
    telegram: 'Telegram',
    '1cuba': '1Cuba',
    choleslibres: 'CholesLibres',
    comunidad: 'Comunidad',
  };
  return sources[sourceId] || sourceId;
}

function getRevolicoSellerInfo(offer: ProductOffer): {
  phone?: string;
  whatsapp?: boolean;
  viewCount?: number;
  provinceId?: string;
} | null {
  if (offer.sourceId !== 'revolico' || !offer.rawData) return null;
  const raw = offer.rawData as Record<string, unknown>;
  return {
    phone: raw['sellerPhone'] as string | undefined,
    whatsapp: raw['sellerWhatsapp'] as boolean | undefined,
    viewCount: raw['viewCount'] as number | undefined,
    provinceId: raw['provinceId'] as string | undefined,
  };
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { resolvedMode } = useThemeStore();
  const colors = getColors(resolvedMode);

  const { data: product, isLoading } = useProduct(id || '');
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Box flex={1} alignItems="center" justifyContent="center">
          <Spinner size="lg" mode={resolvedMode} />
        </Box>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Box flex={1} alignItems="center" justifyContent="center" p="xl">
          <Text variant="headlineMedium">📦</Text>
          <Box mt="md" alignItems="center">
            <Text variant="titleMedium" color="text">
              Producto no encontrado
            </Text>
          </Box>
          <Box mt="md">
            <Button
              variant="primary"
              size="md"
              onPress={() => router.back()}
            >
              Volver
            </Button>
          </Box>
        </Box>
      </SafeAreaView>
    );
  }

  const sortedOffers = [...(product.offers || [])].sort((a, b) => a.price - b.price);
  const bestOffer = sortedOffers[0];
  const worstOffer = sortedOffers[sortedOffers.length - 1];

  const handleFavoriteToggle = () => {
    if (product.isFavorite) {
      removeFavorite.mutate(product.id);
    } else {
      addFavorite.mutate({ type: 'product', targetId: product.id });
    }
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  const handleCallPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${cleaned}`);
  };

  const getAvailabilityStatus = (offer: ProductOffer) => {
    const hoursSincePosted =
      (Date.now() - new Date(offer.postedAt).getTime()) / (1000 * 60 * 60);

    if (hoursSincePosted <= 24) {
      return { label: 'Reciente', variant: 'success' as const, icon: '🟢' };
    } else if (hoursSincePosted <= 24 * 7) {
      return { label: 'Esta semana', variant: 'warning' as const, icon: '🟡' };
    } else {
      return { label: 'Antiguo', variant: 'default' as const, icon: '⚪' };
    }
  };

  const getSourceCounts = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const offer of product.offers ?? []) {
      counts[offer.sourceId] = (counts[offer.sourceId] ?? 0) + 1;
    }
    return counts;
  };

  const sourceCounts = getSourceCounts();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Box flex={1} bg="background" mode={resolvedMode}>
        {/* Header */}
        <Box
          flexDirection="row"
          alignItems="center"
          px="md"
          py="sm"
          mode={resolvedMode}
          style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}
        >
          <Pressable
              onPress={() => router.back()}
              accessibilityLabel="Volver a la pantalla anterior"
              accessibilityRole="button"
            >
            <Text variant="bodyLarge" color="primary">
              ←
            </Text>
          </Pressable>
          <Box flex={1} alignItems="center">
            <Text variant="titleMedium" color="text" numberOfLines={1}>
              {product.canonicalName}
            </Text>
          </Box>
          <Pressable
            onPress={handleFavoriteToggle}
            accessibilityLabel={product.isFavorite ? 'Quitar de guardados' : 'Guardar producto'}
            accessibilityRole="button"
          >
            <Text variant="bodyLarge">
              {product.isFavorite ? '❤️' : '🤍'}
            </Text>
          </Pressable>
        </Box>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Image Gallery */}
          <Box bg="surfaceVariant" mode={resolvedMode}>
            {product.imageUrls?.[selectedImageIndex] ? (
              <Image
                source={{ uri: product.imageUrls[selectedImageIndex] }}
                style={{ width: '100%', height: 300 }}
                contentFit="contain"
              />
            ) : (
              <Box
                height={300}
                alignItems="center"
                justifyContent="center"
                mode={resolvedMode}
              >
                <Text variant="displaySmall">📦</Text>
                <Box mt="sm">
                  <Text variant="bodyMedium" color="textSecondary">
                    Sin imagen
                  </Text>
                </Box>
              </Box>
            )}

            {/* Image Thumbnails */}
            {product.imageUrls && product.imageUrls.length > 1 && (
              <Box
                flexDirection="row"
                justifyContent="center"
                gap="xs"
                py="sm"
                mode={resolvedMode}
              >
                {product.imageUrls.map((_, index) => (
                  <Pressable
                    key={index}
                    onPress={() => setSelectedImageIndex(index)}
                  >
                    <Box
                      width={8}
                      height={8}
                      borderRadius="full"
                      bg={selectedImageIndex === index ? 'primary' : 'textTertiary'}
                      mode={resolvedMode}
                    />
                  </Pressable>
                ))}
              </Box>
            )}
          </Box>

          {/* Product Info */}
          <Box p="md" gap="md">
            {/* Title & Brand */}
            <Box>
              <Text variant="headlineSmall" color="text">
                {product.canonicalName}
              </Text>
              <Box mt="xs">
                <Text variant="bodyLarge" color="textSecondary">
                  {product.brand} {product.model}
                </Text>
              </Box>
              {/* Source badges */}
              <Box flexDirection="row" flexWrap="wrap" gap="xxs" mt="sm">
                {Object.entries(sourceCounts).map(([sourceId, count]) => (
                  <SourceChip key={sourceId} sourceId={sourceId} count={count} size="sm" />
                ))}
              </Box>
            </Box>

            {/* Price Range */}
            {bestOffer && (
              <Card variant="elevated" padding="md" mode={resolvedMode}>
                <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                  <Box
                    accessibilityLabel={`Mejor precio: ${formatPrice(bestOffer.price, bestOffer.currency)} en ${getSourceName(bestOffer.sourceId)}`}
                  >
                    <Text variant="labelMedium" color="textSecondary">
                      Mejor precio
                    </Text>
                    <Text variant="headlineMedium" color="success" fontWeight="bold">
                      {formatPrice(bestOffer.price, bestOffer.currency)}
                    </Text>
                    <Text variant="bodySmall" color="textSecondary">
                      en {getSourceName(bestOffer.sourceId)}
                    </Text>
                  </Box>
                  {sortedOffers.length > 1 && worstOffer && (
                    <Box alignItems="flex-end">
                      <Text variant="labelMedium" color="textSecondary">
                        Mayor precio
                      </Text>
                      <Text variant="titleMedium" color="text">
                        {formatPrice(worstOffer.price, worstOffer.currency)}
                      </Text>
                      <Text variant="bodySmall" color="textSecondary">
                        {sortedOffers.length} ofertas disponibles
                      </Text>
                    </Box>
                  )}
                </Box>
              </Card>
            )}

            {/* Offers List */}
            <Box>
              <Text variant="titleMedium" color="text">
                Comparar precios ({sortedOffers.length})
              </Text>
              <Box mt="sm">
                {sortedOffers.map((offer, index) => {
                  const status = getAvailabilityStatus(offer);
                  const revolicoSeller = getRevolicoSellerInfo(offer);
                  return (
                    <Box key={offer.id} mb="sm">
                      <Card
                        variant={index === 0 ? 'elevated' : 'outlined'}
                        padding="md"
                        mode={resolvedMode}
                        accessibilityLabel={`Oferta de ${getSourceName(offer.sourceId)}: ${formatPrice(offer.price, offer.currency)}, ${status.label}`}
                      >
                      <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                        <Box flex={1}>
                          <Box flexDirection="row" alignItems="center" gap="xs">
                            <Text variant="bodyLarge">
                              {getSourceIcon(offer.sourceId)}
                            </Text>
                            <Text variant="titleSmall" color="text">
                              {getSourceName(offer.sourceId)}
                            </Text>
                            {index === 0 && (
                              <Badge variant="success" size="xs">
                                🏆 Mejor precio
                              </Badge>
                            )}
                          </Box>
                          <Box flexDirection="row" alignItems="center" gap="xs" mt="xs">
                            <Badge variant={status.variant} size="xs">
                              {status.icon} {status.label}
                            </Badge>
                            <Text variant="bodySmall" color="textSecondary">
                              {new Date(offer.postedAt).toLocaleDateString('es-CU')}
                            </Text>
                          </Box>

                          {/* Revolico seller info */}
                          {revolicoSeller && (
                            <Box mt="sm">
                              {revolicoSeller.phone && (
                                <Box flexDirection="row" alignItems="center" gap="xs" mt="xxs">
                                  <Pressable
                                    onPress={() => handleCallPhone(revolicoSeller.phone!)}
                                    accessibilityLabel={`Llamar a ${revolicoSeller.phone}`}
                                    accessibilityRole="button"
                                  >
                                    <Box
                                      flexDirection="row"
                                      alignItems="center"
                                      gap="xxs"
                                      px="xs"
                                      py="xxs"
                                      borderRadius="sm"
                                      bg="successContainer"
                                      mode={resolvedMode}
                                    >
                                      <Text variant="labelSmall" color="onSuccessContainer">
                                        📞 {revolicoSeller.phone}
                                      </Text>
                                    </Box>
                                  </Pressable>
                                  {revolicoSeller.whatsapp && (
                                    <Pressable
                                      onPress={() => handleWhatsApp(revolicoSeller.phone!)}
                                      accessibilityLabel="Enviar WhatsApp"
                                      accessibilityRole="button"
                                    >
                                      <Box
                                        flexDirection="row"
                                        alignItems="center"
                                        gap="xxs"
                                        px="xs"
                                        py="xxs"
                                        borderRadius="sm"
                                        bg="successContainer"
                                        mode={resolvedMode}
                                      >
                                        <Text variant="labelSmall" color="onSuccessContainer">
                                          💬 WhatsApp
                                        </Text>
                                      </Box>
                                    </Pressable>
                                  )}
                                </Box>
                              )}
                            </Box>
                          )}
                        </Box>
                        <Box alignItems="flex-end">
                          <Text
                            variant="titleLarge"
                            color={index === 0 ? 'success' : 'text'}
                            fontWeight="bold"
                          >
                            {formatPrice(offer.price, offer.currency)}
                          </Text>
                          <Box mt="xs">
                            <Button
                              variant="outline"
                              size="sm"
                              onPress={() => handleOpenLink(offer.sourceUrl)}
                            >
                              Ver en {getSourceName(offer.sourceId)}
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    </Card>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Price History (Placeholder) */}
            <Card variant="outlined" padding="md" mode={resolvedMode}>
              <Text variant="titleMedium" color="text">
                📈 Historial de precios
              </Text>
              <Box
                height={100}
                bg="surfaceVariant"
                borderRadius="md"
                alignItems="center"
                justifyContent="center"
                mt="sm"
                mode={resolvedMode}
              >
                <Text variant="bodySmall" color="textSecondary">
                  Próximamente
                </Text>
              </Box>
            </Card>

            {/* Share */}
            <Button
              variant="outline"
              size="lg"
              onPress={() => {
                // TODO: Implement share
              }}
              accessibilityLabel="Compartir producto"
              accessibilityRole="button"
            >
              📤 Compartir producto
            </Button>
          </Box>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
