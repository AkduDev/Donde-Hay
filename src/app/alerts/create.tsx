/**
 * Dónde Hay - Alert Create Screen
 * Crear nueva alerta de precio
 */

import React, { useState } from 'react';
import { ScrollView, Pressable, Alert as AlertRN } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useThemeStore } from '@/store/themeStore';
import { useCreateAlert } from '@/hooks/use-alerts';
import { getColors } from '@/theme/colors';

export default function AlertCreateScreen() {
  const { resolvedMode } = useThemeStore();
  const colors = getColors(resolvedMode);
  const router = useRouter();
  const params = useLocalSearchParams<{
    productId?: string;
    productName?: string;
    currentPrice?: string;
  }>();

  const [targetPrice] = useState(params.currentPrice || '');
  const [currency, setCurrency] = useState<'USD' | 'CUP' | 'MLC'>('USD');
  const [direction, setDirection] = useState<'below' | 'above'>('below');

  const createAlert = useCreateAlert();

  const handleCreate = () => {
    if (!params.productId) {
      AlertRN.alert('Error', 'No se pudo identificar el producto');
      return;
    }

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      AlertRN.alert('Error', 'Ingresa un precio válido');
      return;
    }

    createAlert.mutate(
      {
        productId: params.productId,
        targetPrice: price,
        currency,
        direction,
      },
      {
        onSuccess: () => {
          AlertRN.alert('Éxito', 'Alerta creada correctamente', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: () => {
          AlertRN.alert('Error', 'No se pudo crear la alerta');
        },
      }
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Box flex={1} bg="background" mode={resolvedMode}>
        <Box
          px="md"
          py="sm"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}
        >
          <Pressable onPress={() => router.back()}>
            <Text variant="titleLarge" color="text">
              ← Crear alerta
            </Text>
          </Pressable>
        </Box>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <Box gap="md" mt="md">
            {/* Product Info */}
            {params.productName && (
              <Card variant="elevated" padding="md" mode={resolvedMode}>
                <Text variant="titleMedium" color="text">
                  {params.productName}
                </Text>
                {params.currentPrice && (
                  <Text variant="bodySmall" color="textSecondary">
                    Precio actual: ${params.currentPrice}
                  </Text>
                )}
              </Card>
            )}

            {/* Target Price */}
            <Card variant="outlined" padding="md" mode={resolvedMode}>
              <Box mb="sm">
                <Text variant="titleSmall" color="text">
                  Precio objetivo
                </Text>
              </Box>
              <Box flexDirection="row" gap="sm">
                <Box flex={1}>
                  <Box mb="xs">
                    <Text variant="bodySmall" color="textSecondary">
                      Moneda
                    </Text>
                  </Box>
                  <Box flexDirection="row" gap="xs">
                    {(['USD', 'CUP', 'MLC'] as const).map((c) => (
                      <Pressable
                        key={c}
                        onPress={() => setCurrency(c)}
                      >
                        <Badge
                          variant={currency === c ? 'primary' : 'outline'}
                          size="sm"
                        >
                          {c}
                        </Badge>
                      </Pressable>
                    ))}
                  </Box>
                </Box>
              </Box>
              <Box mt="md">
                <Box mb="xs">
                  <Text variant="bodySmall" color="textSecondary">
                    Precio
                  </Text>
                </Box>
                <Box
                  flexDirection="row"
                  alignItems="center"
                  borderWidth={1}
                  borderColor={colors.border}
                  borderRadius="md"
                  px="md"
                  py="sm"
                >
                  <Text variant="bodyLarge" color="textSecondary">
                    $
                  </Text>
                  <Box flex={1} ml="xs">
                    <Text
                      variant="headlineSmall"
                      color="text"
                      onPress={() => {}}
                    >
                      {targetPrice || '0'}
                    </Text>
                  </Box>
                </Box>
              </Box>
            </Card>

            {/* Direction */}
            <Card variant="outlined" padding="md" mode={resolvedMode}>
              <Box mb="sm">
                <Text variant="titleSmall" color="text">
                  ¿Cuándo notificarme?
                </Text>
              </Box>
              <Box flexDirection="row" gap="sm">
                <Pressable
                  onPress={() => setDirection('below')}
                  style={{ flex: 1 }}
                >
                  <Card
                    variant={direction === 'below' ? 'elevated' : 'outlined'}
                    padding="md"
                    mode={resolvedMode}
                  >
                    <Box alignItems="center">
                      <Text variant="headlineSmall">↓</Text>
                      <Box mt="xs">
                        <Text variant="bodySmall" color="text">
                          Por debajo de
                        </Text>
                      </Box>
                      <Text variant="bodySmall" color="textSecondary">
                        Cuando baje del precio
                      </Text>
                    </Box>
                  </Card>
                </Pressable>
                <Pressable
                  onPress={() => setDirection('above')}
                  style={{ flex: 1 }}
                >
                  <Card
                    variant={direction === 'above' ? 'elevated' : 'outlined'}
                    padding="md"
                    mode={resolvedMode}
                  >
                    <Box alignItems="center">
                      <Text variant="headlineSmall">↑</Text>
                      <Box mt="xs">
                        <Text variant="bodySmall" color="text">
                          Por encima de
                        </Text>
                      </Box>
                      <Text variant="bodySmall" color="textSecondary">
                        Cuando suba del precio
                      </Text>
                    </Box>
                  </Card>
                </Pressable>
              </Box>
            </Card>

            {/* Create Button */}
            <Button
              variant="primary"
              onPress={handleCreate}
              loading={createAlert.isPending}
            >
              Crear alerta
            </Button>
          </Box>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
