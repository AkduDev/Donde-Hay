/**
 * Dónde Hay - Alerts Tab
 * Pantalla de alertas de precio
 */

import React from 'react';
import { ScrollView, Pressable, RefreshControl, ActivityIndicator, Alert as AlertRN } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useThemeStore } from '@/store/themeStore';
import { useAlerts, useDeleteAlert, useToggleAlert } from '@/hooks/use-alerts';
import { useAuthStore } from '@/store/authStore';
import { getColors } from '@/theme/colors';

export default function AlertsScreen() {
  const { resolvedMode } = useThemeStore();
  const colors = getColors(resolvedMode);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const { data: alerts, isLoading, refetch, isRefetching } = useAlerts();
  const deleteAlert = useDeleteAlert();
  const toggleAlert = useToggleAlert();

  const handleCreateAlert = () => {
    router.push('/alerts/create' as any);
  };

  const handleEditAlert = (alertId: string) => {
    router.push(`/alerts/${alertId}` as any);
  };

  const handleToggleAlert = (alertId: string, isActive: boolean) => {
    toggleAlert.mutate({ id: alertId, isActive: !isActive });
  };

  const handleDeleteAlert = (alertId: string) => {
    AlertRN.alert(
      'Eliminar alerta',
      '¿Estás seguro de que quieres eliminar esta alerta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteAlert.mutate(alertId),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES');
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Box flex={1} bg="background" mode={resolvedMode}>
          <Box px="md" py="sm" style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}>
            <Text variant="titleLarge" color="text">
              🔔 Alertas
            </Text>
          </Box>
          <Box flex={1} alignItems="center" justifyContent="center" px="xl">
            <Text variant="displaySmall">🔐</Text>
            <Box mt="md" alignItems="center">
              <Text variant="titleMedium" color="text" textAlign="center">
                Inicia sesión para crear alertas
              </Text>
            </Box>
            <Box mt="xs" alignItems="center">
              <Text variant="bodyMedium" color="textSecondary" textAlign="center">
                Recibe notificaciones cuando los precios bajen
              </Text>
            </Box>
            <Button variant="primary" onPress={() => router.push('/login' as any)}>
              Iniciar sesión
            </Button>
          </Box>
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
          <Box>
            <Text variant="titleLarge" color="text">
              🔔 Alertas
            </Text>
            <Text variant="bodySmall" color="textSecondary">
              {alerts?.length || 0} alertas activas
            </Text>
          </Box>
          <Button variant="primary" onPress={handleCreateAlert} accessibilityLabel="Crear nueva alerta de precio">
            + Nueva
          </Button>
        </Box>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching || false} onRefresh={refetch} />
          }
        >
          {isLoading ? (
            <Box alignItems="center" py="xl">
              <ActivityIndicator size="large" />
            </Box>
          ) : !alerts || alerts.length === 0 ? (
            <Box flex={1} alignItems="center" justifyContent="center" py="xl" px="xl">
              <Text variant="displaySmall">🔔</Text>
              <Box mt="md" alignItems="center">
                <Text variant="titleMedium" color="text" textAlign="center">
                  No tienes alertas activas
                </Text>
              </Box>
              <Box mt="xs" alignItems="center">
                <Text variant="bodyMedium" color="textSecondary" textAlign="center">
                  Crea una alerta para recibir notificaciones cuando los precios bajen
                </Text>
              </Box>
              <Button variant="primary" onPress={handleCreateAlert}>
                Crear primera alerta
              </Button>
            </Box>
          ) : (
            <Box px="md" py="md" gap="sm">
              {alerts.map((alert) => (
                <Pressable
                  key={alert.id}
                  onPress={() => handleEditAlert(alert.id)}
                  onLongPress={() => handleDeleteAlert(alert.id)}
                  accessibilityLabel={`Alerta para ${alert.product?.canonicalName || 'producto'}, precio objetivo ${alert.targetPrice} ${alert.currency}, ${alert.isActive ? 'activa' : 'pausada'}`}
                  accessibilityRole="button"
                  accessibilityHint="Pulsa para editar, mantén pulsado para eliminar"
                >
                  <Card
                    variant={alert.isActive ? 'elevated' : 'outlined'}
                    padding="md"
                    mode={resolvedMode}
                  >
                    <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Box flexDirection="row" alignItems="center" gap="xs">
                          <Text variant="titleSmall" color="text" numberOfLines={1}>
                            {alert.product?.canonicalName || 'Producto'}
                          </Text>
                          <Badge
                            variant={alert.isActive ? 'primary' : 'outline'}
                            size="sm"
                          >
                            {alert.isActive ? 'Activa' : 'Pausada'}
                          </Badge>
                        </Box>
                        <Box flexDirection="row" alignItems="center" gap="xs">
                          <Text variant="bodySmall" color="textSecondary">
                            Precio objetivo:
                          </Text>
                          <Text variant="bodySmall" color="primary">
                            ${alert.targetPrice} {alert.currency}
                          </Text>
                        </Box>
                        <Box flexDirection="row" alignItems="center" gap="xs">
                          <Text variant="bodySmall" color="textSecondary">
                            Dirección:
                          </Text>
                          <Text variant="bodySmall" color="text">
                            {alert.direction === 'below' ? '↓ Por debajo de' : '↑ Por encima de'}
                          </Text>
                        </Box>
                        <Text variant="bodySmall" color="textSecondary">
                          Creada {formatDate(alert.createdAt)}
                        </Text>
                      </Box>
                      <Pressable
                        onPress={() => handleToggleAlert(alert.id, alert.isActive)}
                        accessibilityLabel={alert.isActive ? 'Pausar alerta' : 'Reactivar alerta'}
                        accessibilityRole="button"
                      >
                        <Box
                          width={32}
                          height={32}
                          borderRadius="full"
                          bg="surfaceVariant"
                          alignItems="center"
                          justifyContent="center"
                          mode={resolvedMode}
                        >
                          <Text variant="bodySmall" color="textSecondary">
                            {alert.isActive ? '⏸' : '▶'}
                          </Text>
                        </Box>
                      </Pressable>
                    </Box>
                  </Card>
                </Pressable>
              ))}
            </Box>
          )}
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
