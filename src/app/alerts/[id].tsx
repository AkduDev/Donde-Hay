/**
 * Dónde Hay - Alert Edit Screen
 * Editar alerta de precio existente
 */

import React, { useState } from 'react';
import { ScrollView, Pressable, Alert as AlertRN, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useThemeStore } from '@/store/themeStore';
import { useAlerts, useUpdateAlert, useDeleteAlert, useToggleAlert } from '@/hooks/use-alerts';
import { getColors } from '@/theme/colors';

export default function AlertEditScreen() {
  const { resolvedMode } = useThemeStore();
  const colors = getColors(resolvedMode);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();

  const { data: alerts, isLoading } = useAlerts();
  const updateAlert = useUpdateAlert();
  const deleteAlert = useDeleteAlert();
  const toggleAlert = useToggleAlert();

  const alert = alerts?.find((a) => a.id === params.id);

  const [targetPrice, setTargetPrice] = useState(alert?.targetPrice?.toString() || '');
  const [currency, setCurrency] = useState<'USD' | 'CUP' | 'MLC'>(alert?.currency || 'USD');
  const [direction, setDirection] = useState<'below' | 'above'>(alert?.direction || 'below');

  const [prevAlert, setPrevAlert] = useState(alert);
  if (alert !== prevAlert) {
    setPrevAlert(alert);
    if (alert) {
      setTargetPrice(alert.targetPrice.toString());
      setCurrency(alert.currency);
      setDirection(alert.direction);
    }
  }

  const handleUpdate = () => {
    if (!params.id) return;

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      AlertRN.alert('Error', 'Ingresa un precio válido');
      return;
    }

    updateAlert.mutate(
      {
        id: params.id,
        data: {
          targetPrice: price,
          currency,
          direction,
        },
      },
      {
        onSuccess: () => {
          AlertRN.alert('Éxito', 'Alerta actualizada', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: () => {
          AlertRN.alert('Error', 'No se pudo actualizar la alerta');
        },
      }
    );
  };

  const handleToggle = () => {
    if (!params.id || !alert) return;
    toggleAlert.mutate({ id: params.id, isActive: !alert.isActive });
  };

  const handleDelete = () => {
    AlertRN.alert(
      'Eliminar alerta',
      '¿Estás seguro de que quieres eliminar esta alerta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteAlert.mutate(params.id!, {
              onSuccess: () => {
                router.back();
              },
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Box flex={1} bg="background" mode={resolvedMode} alignItems="center" justifyContent="center">
          <ActivityIndicator size="large" />
        </Box>
      </SafeAreaView>
    );
  }

  if (!alert) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Box flex={1} bg="background" mode={resolvedMode} alignItems="center" justifyContent="center">
          <Text variant="titleMedium" color="text">
            Alerta no encontrada
          </Text>
          <Button variant="outline" onPress={() => router.back()}>
            Volver
          </Button>
        </Box>
      </SafeAreaView>
    );
  }

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
              ← Editar alerta
            </Text>
          </Pressable>
          <Badge variant={alert.isActive ? 'primary' : 'outline'} size="sm">
            {alert.isActive ? 'Activa' : 'Pausada'}
          </Badge>
        </Box>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <Box gap="md" mt="md">
            {/* Product Info */}
            {alert.product && (
              <Card variant="elevated" padding="md" mode={resolvedMode}>
                <Text variant="titleMedium" color="text">
                  {alert.product.canonicalName}
                </Text>
                <Text variant="bodySmall" color="textSecondary">
                  {alert.product.brand} • {alert.product.model}
                </Text>
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
                      <Text variant="bodySmall" color="text">
                        Por debajo de
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
                      <Text variant="bodySmall" color="text">
                        Por encima de
                      </Text>
                    </Box>
                  </Card>
                </Pressable>
              </Box>
            </Card>

            {/* Actions */}
            <Button
              variant="primary"
              onPress={handleUpdate}
              loading={updateAlert.isPending}
            >
              Actualizar alerta
            </Button>

            <Button
              variant="outline"
              onPress={handleToggle}
              loading={toggleAlert.isPending}
            >
              {alert.isActive ? 'Pausar alerta' : 'Reanudar alerta'}
            </Button>

            <Button
              variant="outline"
              onPress={handleDelete}
              loading={deleteAlert.isPending}
            >
              Eliminar alerta
            </Button>
          </Box>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
