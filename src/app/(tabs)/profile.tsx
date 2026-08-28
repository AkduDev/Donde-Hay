/**
 * Dónde Hay - Profile Screen
 * Perfil del usuario: datos, preferencias, historial, alertas
 */

import React from 'react';
import { ScrollView, Pressable, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Divider } from '@/components/ui/Divider';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { getColors, OpacityTokens } from '@/theme/colors';
import { useFavorites, useSavedSearches } from '@/hooks/use-favorites';

const LOGO = require('../../../assets/images/DondeHay3.jpeg');

type MenuItem = {
  id: string;
  icon: string;
  label: string;
  description?: string;
  badge?: string;
  onPress?: () => void;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { resolvedMode } = useThemeStore();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const colors = getColors(resolvedMode);

  // Get real data
  const { data: favorites } = useFavorites();
  const { data: savedSearches } = useSavedSearches();

  const displayName = user?.name ?? 'Usuario invitado';
  const displayEmail = user?.email ?? 'Inicia sesión para sincronizar';

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAuth();
              router.replace('/(auth)/login' as any);
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Actividad',
      items: [
        { 
          id: 'history', 
          icon: '🕐', 
          label: 'Historial de búsquedas', 
          description: 'Tus búsquedas recientes',
          onPress: () => router.push('/(tabs)/search' as any)
        },
        { 
          id: 'alerts', 
          icon: '🔔', 
          label: 'Mis alertas', 
          description: 'Gestiona tus alertas de precio',
          onPress: () => router.push('/(tabs)/alerts' as any)
        },
        { 
          id: 'favorites', 
          icon: '❤️', 
          label: 'Guardados', 
          description: 'Productos y búsquedas guardadas',
          onPress: () => router.push('/(tabs)/saved' as any)
        },
      ],
    },
    {
      title: 'Preferencias',
      items: [
        { 
          id: 'theme', 
          icon: '🎨', 
          label: 'Apariencia', 
          description: 'Modo claro, oscuro o sistema',
          onPress: () => router.push('/profile/preferences' as any)
        },
        { 
          id: 'currency', 
          icon: '💱', 
          label: 'Moneda preferida', 
          description: 'USD, CUP o MLC',
          onPress: () => router.push('/profile/preferences' as any)
        },
        { 
          id: 'location', 
          icon: '📍', 
          label: 'Ubicación por defecto', 
          description: 'Tu provincia',
          onPress: () => router.push('/profile/preferences' as any)
        },
        { 
          id: 'notifications', 
          icon: '📢', 
          label: 'Notificaciones', 
          description: 'Push, email, alertas',
          onPress: () => router.push('/profile/preferences' as any)
        },
      ],
    },
    {
      title: 'Cuenta',
      items: [
        { 
          id: 'edit-profile', 
          icon: '✏️', 
          label: 'Editar perfil', 
          description: 'Nombre, teléfono, avatar',
          onPress: () => router.push('/profile/edit' as any)
        },
        { 
          id: 'help', 
          icon: '❓', 
          label: 'Ayuda y soporte', 
          description: 'Preguntas frecuentes, contacto',
        },
        { 
          id: 'about', 
          icon: 'ℹ️', 
          label: 'Acerca de Dónde Hay', 
          description: 'Versión 1.0.0 · by DevParadise',
        },
      ],
    },
  ];

  return (
    <Box flex={1} bg="background" mode={resolvedMode}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header del perfil */}
          <Box
            px="md"
            py="lg"
            alignItems="center"
            bg="surface"
            mode={resolvedMode}
            style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}
          >
            <Box position="relative" mb="md" mode={resolvedMode}>
              <Avatar
                size="2xl"
                name={displayName}
                source={user?.avatarUrl ? { uri: user.avatarUrl } : undefined}
                mode={resolvedMode}
              />
              {isAuthenticated && (
                <Pressable
                  onPress={() => router.push('/profile/edit' as any)}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                  }}
                  accessibilityLabel="Editar foto de perfil"
                  accessibilityRole="button"
                >
                  <Box
                    width={32}
                    height={32}
                    borderRadius="full"
                    bg="primary"
                    alignItems="center"
                    justifyContent="center"
                    borderWidth={2}
                    borderColor="surface"
                    mode={resolvedMode}
                  >
                    <Text variant="bodySmall" color="onPrimary">
                      ✏️
                    </Text>
                  </Box>
                </Pressable>
              )}
            </Box>

            <Text variant="headlineSmall" color="text" textAlign="center">
              {displayName}
            </Text>
            <Box mt="xs">
              <Text variant="bodySmall" color="textSecondary">
                {displayEmail}
              </Text>
            </Box>

            {!isAuthenticated && (
              <Box mt="md">
                <Pressable onPress={() => router.push('/(auth)/login' as any)}>
                  <Badge variant="primary" size="md">
                    Iniciar sesión
                  </Badge>
                </Pressable>
              </Box>
            )}

            {isAuthenticated && user?.role === 'seller' && (
              <Box mt="md">
                <Badge variant="success" size="md">
                  ✓ Vendedor verificado
                </Badge>
              </Box>
            )}
          </Box>

          {/* Stats rápidos */}
          <Box
            flexDirection="row"
            px="md"
            py="md"
            bg="surface"
            mode={resolvedMode}
            style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}
          >
            {[
              { label: 'Guardados', value: favorites?.length?.toString() || '0' },
              { label: 'Búsquedas', value: savedSearches?.length?.toString() || '0' },
              { label: 'Alertas', value: '0' },
            ].map((stat, index) => (
              <Box
                key={stat.label}
                flex={1}
                alignItems="center"
                mode={resolvedMode}
                style={index > 0 ? { borderLeftWidth: 1, borderLeftColor: colors.divider } : undefined}
              >
                <Text variant="headlineSmall" color="primary" fontWeight="bold">
                  {stat.value}
                </Text>
                <Text variant="labelSmall" color="textSecondary">
                  {stat.label}
                </Text>
              </Box>
            ))}
          </Box>

          {/* Menú por secciones */}
          {menuSections.map((section) => (
            <Box key={section.title} px="md" mt="lg" mode={resolvedMode}>
              <Box mb="xs">
                <Text
                  variant="labelMedium"
                  color="textTertiary"
                  fontWeight="600"
                >
                  {section.title.toUpperCase()}
                </Text>
              </Box>

              <Card variant="elevated" padding="none" mode={resolvedMode}>
                {section.items.map((item, index) => (
                  <React.Fragment key={item.id}>
                    {index > 0 && <Divider mode={resolvedMode} />}
                    <Pressable
                      onPress={item.onPress || (() => console.log('Menu item:', item.id))}
                      style={({ pressed }) => ({
                        opacity: pressed ? OpacityTokens.pressed : 1,
                      })}
                      accessibilityLabel={item.label}
                      accessibilityRole="button"
                      accessibilityHint={item.description}
                    >
                      <Box
                        flexDirection="row"
                        alignItems="center"
                        gap="md"
                        px="md"
                        py="md"
                        mode={resolvedMode}
                      >
                        <Box
                          width={40}
                          height={40}
                          borderRadius="md"
                          bg="surfaceVariant"
                          alignItems="center"
                          justifyContent="center"
                          mode={resolvedMode}
                        >
                          <Text variant="bodyLarge">
                            {item.icon}
                          </Text>
                        </Box>
                        <Box flex={1} mode={resolvedMode}>
                          <Text variant="bodyMedium" color="text" fontWeight="medium">
                            {item.label}
                          </Text>
                          {item.description && (
                            <Text variant="labelSmall" color="textTertiary">
                              {item.description}
                            </Text>
                          )}
                        </Box>
                        {item.badge && (
                          <Box
                            width={22}
                            height={22}
                            borderRadius="full"
                            bg="error"
                            alignItems="center"
                            justifyContent="center"
                            mode={resolvedMode}
                          >
                            <Text variant="labelSmall" color="onError">
                              {item.badge}
                            </Text>
                          </Box>
                        )}
                        <Text variant="bodyMedium" color="textTertiary">
                          ›
                        </Text>
                      </Box>
                    </Pressable>
                  </React.Fragment>
                ))}
              </Card>
            </Box>
          ))}

          {/* Botón logout si está autenticado */}
          {isAuthenticated && (
            <Box px="md" mt="lg" mode={resolvedMode}>
              <Pressable onPress={handleLogout} accessibilityLabel="Cerrar sesión" accessibilityRole="button">
                <Card variant="outlined" padding="md" mode={resolvedMode}>
                  <Box alignItems="center" mode={resolvedMode}>
                    <Text variant="bodyMedium" color="error" fontWeight="medium">
                      Cerrar sesión
                    </Text>
                  </Box>
                </Card>
              </Pressable>
            </Box>
          )}

          {/* Footer branding */}
          <Box alignItems="center" mt="xl" mode={resolvedMode}>
            <Image
              source={LOGO}
              style={{ width: 60, height: 60, borderRadius: 12, marginBottom: 8 }}
              resizeMode="cover"
            />
            <Text variant="labelSmall" color="textTertiary">
              Dónde Hay · Encuentra lo que buscas.
            </Text>
            <Text variant="labelSmall" color="textTertiary">
              by DevParadise
            </Text>
          </Box>
        </ScrollView>
      </SafeAreaView>
    </Box>
  );
}
