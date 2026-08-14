/**
 * Dónde Hay - Profile Screen
 * Perfil del usuario: datos, preferencias, historial, alertas
 * Nota: implementación completa con API en tarea posterior
 */

import React from 'react';
import { ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Divider } from '@/components/ui/Divider';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { getColors } from '@/theme/colors';

type MenuItem = {
  id: string;
  icon: string;
  label: string;
  description?: string;
  badge?: string;
};

const MENU_SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Actividad',
    items: [
      { id: 'history', icon: '🕐', label: 'Historial de búsquedas', description: 'Tus búsquedas recientes' },
      { id: 'alerts', icon: '🔔', label: 'Mis alertas', description: 'Gestiona tus alertas de precio', badge: '2' },
      { id: 'favorites', icon: '❤️', label: 'Guardados', description: 'Productos y búsquedas guardadas' },
    ],
  },
  {
    title: 'Preferencias',
    items: [
      { id: 'theme', icon: '🎨', label: 'Apariencia', description: 'Modo claro, oscuro o sistema' },
      { id: 'currency', icon: '💱', label: 'Moneda preferida', description: 'USD, CUP o MLC' },
      { id: 'location', icon: '📍', label: 'Ubicación por defecto', description: 'Tu provincia' },
      { id: 'notifications', icon: '📢', label: 'Notificaciones', description: 'Push, email, alertas' },
    ],
  },
  {
    title: 'Cuenta',
    items: [
      { id: 'edit-profile', icon: '✏️', label: 'Editar perfil', description: 'Nombre, teléfono, avatar' },
      { id: 'help', icon: '❓', label: 'Ayuda y soporte', description: 'Preguntas frecuentes, contacto' },
      { id: 'about', icon: 'ℹ️', label: 'Acerca de Dónde Hay', description: 'Versión 1.0.0 · by DevParadise' },
    ],
  },
];

export default function ProfileScreen() {
  const { resolvedMode } = useThemeStore();
  const { user, isAuthenticated } = useAuthStore();
  const colors = getColors(resolvedMode);

  const displayName = user?.name ?? 'Usuario invitado';
  const displayEmail = user?.email ?? 'Inicia sesión para sincronizar';

  return (
    <Box flex={1} bg="background" mode={resolvedMode} testID="profile-screen">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header del perfil */}
          <Box
            px={4}
            py={6}
            alignItems="center"
            bg="surface"
            mode={resolvedMode}
            style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}
          >
            <Box position="relative" mb={3} mode={resolvedMode}>
              <Avatar
                size="2xl"
                name={displayName}
                source={user?.avatarUrl ? { uri: user.avatarUrl } : undefined}
                mode={resolvedMode}
              />
              <Pressable
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                }}
                testID="profile-edit-avatar"
                accessibilityLabel="Editar foto de perfil"
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
                  <Text variant="bodySmall" color="onPrimary" mode={resolvedMode}>
                    ✏️
                  </Text>
                </Box>
              </Pressable>
            </Box>

            <Text variant="headlineSmall" color="text" mode={resolvedMode} textAlign="center">
              {displayName}
            </Text>
            <Text variant="bodySmall" color="textSecondary" mode={resolvedMode} mt={1}>
              {displayEmail}
            </Text>

            {!isAuthenticated && (
              <Box mt={3} mode={resolvedMode}>
                <Badge variant="primary" size="md">
                  Iniciar sesión
                </Badge>
              </Box>
            )}

            {isAuthenticated && user?.role === 'seller' && (
              <Box mt={3} mode={resolvedMode}>
                <Badge variant="success" size="md">
                  ✓ Vendedor verificado
                </Badge>
              </Box>
            )}
          </Box>

          {/* Stats rápidos */}
          <Box
            flexDirection="row"
            px={4}
            py={4}
            bg="surface"
            borderBottomWidth={1}
            borderBottomColor="divider"
            mode={resolvedMode}
          >
            {[
              { label: 'Guardados', value: '3' },
              { label: 'Alertas', value: '2' },
              { label: 'Búsquedas', value: '47' },
            ].map((stat, index) => (
              <Box
                key={stat.label}
                flex={1}
                alignItems="center"
                borderLeftWidth={index > 0 ? 1 : 0}
                borderLeftColor="divider"
                mode={resolvedMode}
              >
                <Text variant="headlineSmall" color="primary" fontWeight="bold" mode={resolvedMode}>
                  {stat.value}
                </Text>
                <Text variant="labelSmall" color="textSecondary" mode={resolvedMode}>
                  {stat.label}
                </Text>
              </Box>
            ))}
          </Box>

          {/* Menú por secciones */}
          {MENU_SECTIONS.map((section) => (
            <Box key={section.title} px={4} mt={6} mode={resolvedMode}>
              <Text
                variant="labelMedium"
                color="textTertiary"
                fontWeight="semiBold"
                mb={2}
                mode={resolvedMode}
              >
                {section.title.toUpperCase()}
              </Text>

              <Card variant="elevated" padding="0" mode={resolvedMode}>
                {section.items.map((item, index) => (
                  <React.Fragment key={item.id}>
                    {index > 0 && <Divider mode={resolvedMode} />}
                    <Pressable
                      onPress={() => {
                        // TODO: navegar a la pantalla correspondiente
                        console.log('Menu item:', item.id);
                      }}
                      testID={`profile-menu-${item.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Box
                        flexDirection="row"
                        alignItems="center"
                        gap={3}
                        px={4}
                        py={4}
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
                          <Text variant="bodyLarge" mode={resolvedMode}>
                            {item.icon}
                          </Text>
                        </Box>
                        <Box flex={1} mode={resolvedMode}>
                          <Text variant="bodyMedium" color="text" fontWeight="medium" mode={resolvedMode}>
                            {item.label}
                          </Text>
                          {item.description && (
                            <Text variant="labelSmall" color="textTertiary" mode={resolvedMode}>
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
                            <Text variant="labelSmall" color="onError" mode={resolvedMode}>
                              {item.badge}
                            </Text>
                          </Box>
                        )}
                        <Text variant="bodyMedium" color="textTertiary" mode={resolvedMode}>
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
            <Box px={4} mt={6} mode={resolvedMode}>
              <Pressable
                onPress={() => {
                  // TODO: implementar logout
                  console.log('Logout');
                }}
                testID="profile-logout"
                accessibilityRole="button"
                accessibilityLabel="Cerrar sesión"
              >
                <Card variant="outlined" padding="4" mode={resolvedMode}>
                  <Box alignItems="center" mode={resolvedMode}>
                    <Text variant="bodyMedium" color="error" fontWeight="medium" mode={resolvedMode}>
                      Cerrar sesión
                    </Text>
                  </Box>
                </Card>
              </Pressable>
            </Box>
          )}

          {/* Footer branding */}
          <Box alignItems="center" mt={8} mode={resolvedMode}>
            <Text variant="labelSmall" color="textTertiary" mode={resolvedMode}>
              Dónde Hay · Encuentra lo que buscas.
            </Text>
            <Text variant="labelSmall" color="textTertiary" mode={resolvedMode}>
              by DevParadise
            </Text>
          </Box>
        </ScrollView>
      </SafeAreaView>
    </Box>
  );
}