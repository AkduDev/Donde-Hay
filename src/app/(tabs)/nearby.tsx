/**
 * Dónde Hay - Nearby Screen
 * Productos cercanos a la ubicación del usuario
 * Nota: implementación completa con expo-location en tarea posterior
 */

import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/theme/colors';

const PROVINCES = [
  { id: 'lha', name: 'La Habana', count: 1240, icon: '🏛️' },
  { id: 'scu', name: 'Santiago de Cuba', count: 856, icon: '⛰️' },
  { id: 'cam', name: 'Camagüey', count: 445, icon: '🏛️' },
  { id: 'hol', name: 'Holguín', count: 523, icon: '🌴' },
  { id: 'vcl', name: 'Villa Clara', count: 389, icon: '🌉' },
  { id: 'mat', name: 'Matanzas', count: 297, icon: '🏖️' },
  { id: 'ltu', name: 'Las Tunas', count: 214, icon: '🌾' },
  { id: 'cfg', name: 'Cienfuegos', count: 256, icon: '⛵' },
];

export default function NearbyScreen() {
  const { resolvedMode } = useThemeStore();
  const colors = getColors(resolvedMode);

  return (
    <Box flex={1} bg="background" mode={resolvedMode} testID="nearby-screen">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Box px={4} py={4} mode={resolvedMode}>
          <Text variant="headlineMedium" color="text" colorMode={resolvedMode}>
            📍 Cerca de ti
          </Text>
          <Text variant="bodyMedium" color="textSecondary" colorMode={resolvedMode} mt={1}>
            Encuentra productos disponibles en tu provincia
          </Text>
        </Box>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <Box gap={3} mode={resolvedMode}>
            {PROVINCES.map((province) => (
              <Card
                key={province.id}
                variant="elevated"
                padding="4"
                mode={resolvedMode}
                testID={`nearby-province-${province.id}`}
              >
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
                    <Text variant="headlineSmall" colorMode={resolvedMode}>
                      {province.icon}
                    </Text>
                  </Box>
                  <Box flex={1} mode={resolvedMode}>
                    <Text variant="titleMedium" color="text" colorMode={resolvedMode}>
                      {province.name}
                    </Text>
                    <Text variant="bodySmall" color="textSecondary" colorMode={resolvedMode}>
                      {province.count} productos publicados
                    </Text>
                  </Box>
                  <Badge variant="primary" size="sm" mode={resolvedMode}>
                    Ver →
                  </Badge>
                </Box>
              </Card>
            ))}
          </Box>

          <Box mt={6} p={4} borderRadius="lg" bg="surfaceVariant" mode={resolvedMode}>
            <Text variant="titleSmall" color="text" colorMode={resolvedMode} mb={1}>
              🛠️ Próximamente
            </Text>
            <Text variant="bodySmall" color="textSecondary" colorMode={resolvedMode}>
              La geolocalización en tiempo real y el mapa interactivo llegarán en una
              próxima actualización. Por ahora puedes explorar por provincia.
            </Text>
          </Box>
        </ScrollView>
      </SafeAreaView>
    </Box>
  );
}