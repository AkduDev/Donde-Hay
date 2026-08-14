/**
 * Dónde Hay - Saved Screen
 * Guardados del usuario: Productos, Búsquedas, Vendedores
 * Nota: implementación completa con datos de API en tarea posterior
 */

import React, { useState } from 'react';
import { ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/theme/colors';
import { Spacing } from '@/theme/spacing';

type SavedTab = 'products' | 'searches' | 'sellers';

const TAB_CONFIG: { id: SavedTab; label: string; icon: string }[] = [
  { id: 'products', label: 'Productos', icon: '📦' },
  { id: 'searches', label: 'Búsquedas', icon: '🔍' },
  { id: 'sellers', label: 'Vendedores', icon: '👤' },
];

export default function SavedScreen() {
  const { resolvedMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState<SavedTab>('products');

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return (
          <Box gap={3} mode={resolvedMode}>
            <Card variant="elevated" padding="3" mode={resolvedMode} testID="saved-product-1">
              <Box flexDirection="row" gap={3} alignItems="center" mode={resolvedMode}>
                <Box
                  width={60}
                  height={60}
                  borderRadius="md"
                  bg="surfaceVariant"
                  alignItems="center"
                  justifyContent="center"
                  mode={resolvedMode}
                >
                  <Text variant="headlineSmall" colorMode={resolvedMode}>📱</Text>
                </Box>
                <Box flex={1} mode={resolvedMode}>
                  <Text variant="titleSmall" color="text" colorMode={resolvedMode}>
                    iPhone 13 128GB
                  </Text>
                  <Text variant="bodySmall" color="success" fontWeight="semiBold" colorMode={resolvedMode}>
                    desde $430
                  </Text>
                  <Text variant="labelSmall" color="textTertiary" colorMode={resolvedMode}>
                    📍 La Habana · 3 ofertas
                  </Text>
                </Box>
                <Text variant="bodyLarge" colorMode={resolvedMode}>❤️</Text>
              </Box>
            </Card>

            <Card variant="elevated" padding="3" mode={resolvedMode} testID="saved-product-2">
              <Box flexDirection="row" gap={3} alignItems="center" mode={resolvedMode}>
                <Box
                  width={60}
                  height={60}
                  borderRadius="md"
                  bg="surfaceVariant"
                  alignItems="center"
                  justifyContent="center"
                  mode={resolvedMode}
                >
                  <Text variant="headlineSmall" colorMode={resolvedMode}>💻</Text>
                </Box>
                <Box flex={1} mode={resolvedMode}>
                  <Text variant="titleSmall" color="text" colorMode={resolvedMode}>
                    Laptop HP Pavilion 15
                  </Text>
                  <Text variant="bodySmall" color="success" fontWeight="semiBold" colorMode={resolvedMode}>
                    $380
                  </Text>
                  <Text variant="labelSmall" color="textTertiary" colorMode={resolvedMode}>
                    📍 Villa Clara · 1 oferta
                  </Text>
                </Box>
                <Text variant="bodyLarge" colorMode={resolvedMode}>❤️</Text>
              </Box>
            </Card>
          </Box>
        );

      case 'searches':
        return (
          <Box gap={3} mode={resolvedMode}>
            <Card variant="elevated" padding="3" mode={resolvedMode} testID="saved-search-1">
              <Box flexDirection="row" alignItems="center" gap={3} mode={resolvedMode}>
                <Box
                  width={48}
                  height={48}
                  borderRadius="full"
                  bg="primaryContainer"
                  alignItems="center"
                  justifyContent="center"
                  mode={resolvedMode}
                >
                  <Text variant="headlineSmall" colorMode={resolvedMode}>🔔</Text>
                </Box>
                <Box flex={1} mode={resolvedMode}>
                  <Text variant="titleSmall" color="text" colorMode={resolvedMode}>
                    iPhone 13 · hasta $450
                  </Text>
                  <Text variant="labelSmall" color="textTertiary" colorMode={resolvedMode}>
                    Alerta activa · La Habana
                  </Text>
                </Box>
                <Badge variant="success" size="xs">
                  Activa
                </Badge>
              </Box>
            </Card>

            <Card variant="elevated" padding="3" mode={resolvedMode} testID="saved-search-2">
              <Box flexDirection="row" alignItems="center" gap={3} mode={resolvedMode}>
                <Box
                  width={48}
                  height={48}
                  borderRadius="full"
                  bg="primaryContainer"
                  alignItems="center"
                  justifyContent="center"
                  mode={resolvedMode}
                >
                  <Text variant="headlineSmall" colorMode={resolvedMode}>🎮</Text>
                </Box>
                <Box flex={1} mode={resolvedMode}>
                  <Text variant="titleSmall" color="text" colorMode={resolvedMode}>
                    PS5 · cualquier precio
                  </Text>
                  <Text variant="labelSmall" color="textTertiary" colorMode={resolvedMode}>
                    Sin alerta
                  </Text>
                </Box>
                <Badge variant="default" size="xs">
                  Inactiva
                </Badge>
              </Box>
            </Card>
          </Box>
        );

      case 'sellers':
        return (
          <Box gap={3} mode={resolvedMode}>
            <Card variant="elevated" padding="3" mode={resolvedMode} testID="saved-seller-1">
              <Box flexDirection="row" alignItems="center" gap={3} mode={resolvedMode}>
                <Avatar size="lg" name="Yanis Tech" mode={resolvedMode} />
                <Box flex={1} mode={resolvedMode}>
                  <Box flexDirection="row" alignItems="center" gap={2} mode={resolvedMode}>
                    <Text variant="titleSmall" color="text" colorMode={resolvedMode}>
                      Yanis Tech
                    </Text>
                    <Badge variant="success" size="xs">
                      ✓ Verificado
                    </Badge>
                  </Box>
                  <Text variant="labelSmall" color="textTertiary" colorMode={resolvedMode}>
                    ⭐ 4.8 · La Habana · Tecnología
                  </Text>
                </Box>
              </Box>
            </Card>

            <Card variant="elevated" padding="3" mode={resolvedMode} testID="saved-seller-2">
              <Box flexDirection="row" alignItems="center" gap={3} mode={resolvedMode}>
                <Avatar size="lg" name="Santa Clara Deals" mode={resolvedMode} />
                <Box flex={1} mode={resolvedMode}>
                  <Text variant="titleSmall" color="text" colorMode={resolvedMode}>
                    Santa Clara Deals
                  </Text>
                  <Text variant="labelSmall" color="textTertiary" colorMode={resolvedMode}>
                    ⭐ 4.5 · Villa Clara · Variado
                  </Text>
                </Box>
              </Box>
            </Card>
          </Box>
        );
    }
  };

  return (
    <Box flex={1} bg="background" mode={resolvedMode} testID="saved-screen">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Box px={4} py={4} mode={resolvedMode}>
          <Text variant="headlineMedium" color="text" colorMode={resolvedMode}>
            ❤️ Mis guardados
          </Text>
        </Box>

        {/* Tab selector */}
        <Box px={4} mb={4} mode={resolvedMode}>
          <Box flexDirection="row" bg="surfaceVariant" borderRadius="lg" p={1} mode={resolvedMode}>
            {TAB_CONFIG.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  testID={`saved-tab-${tab.id}`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  style={{ flex: 1 }}
                >
                  <Box
                    alignItems="center"
                    py={2}
                    borderRadius="md"
                    bg={isActive ? 'surface' : 'transparent'}
                    shadow={isActive ? 'xs' : undefined}
                    mode={resolvedMode}
                  >
                    <Text
                      variant="labelMedium"
                      color={isActive ? 'primary' : 'textSecondary'}
                      fontWeight={isActive ? 'semiBold' : 'regular'}
                      mode={resolvedMode}
                    >
                      {tab.icon} {tab.label}
                    </Text>
                  </Box>
                </Pressable>
              );
            })}
          </Box>
        </Box>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}

          <Box mt={6} p={4} borderRadius="lg" bg="surfaceVariant" mode={resolvedMode}>
            <Text variant="titleSmall" color="text" colorMode={resolvedMode} mb={1}>
              💡 Sincronización pendiente
            </Text>
            <Text variant="bodySmall" color="textSecondary" colorMode={resolvedMode}>
              Los guardados mostrados son de ejemplo. La sincronización con tu cuenta
              estará disponible al conectar el backend.
            </Text>
          </Box>
        </ScrollView>
      </SafeAreaView>
    </Box>
  );
}