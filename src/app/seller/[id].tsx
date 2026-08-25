/**
 * Dónde Hay - Seller Detail Screen
 * Perfil del vendedor con información de contacto y productos
 */

import React from 'react';
import { ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/theme/colors';

const SOURCE_NAMES: Record<string, string> = {
  revolico: 'Revolico',
  facebook: 'Facebook',
  instagram: 'Instagram',
  telegram: 'Telegram',
};

const SOURCE_ICONS: Record<string, string> = {
  revolico: '🛒',
  facebook: '👤',
  instagram: '📸',
  telegram: '💬',
};

export default function SellerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { resolvedMode } = useThemeStore();
  const colors = getColors(resolvedMode);

  // In a real app this would fetch from Supabase; for now render a skeleton
  // using the same pattern as product detail but with seller-specific fields.

  if (!id) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Box flex={1} alignItems="center" justifyContent="center" p="xl">
          <Text variant="titleMedium" color="text">Vendedor no encontrado</Text>
          <Box mt="md">
            <Button variant="primary" size="md" onPress={() => router.back()}>Volver</Button>
          </Box>
        </Box>
      </SafeAreaView>
    );
  }

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
          <Pressable onPress={() => router.back()}>
            <Text variant="bodyLarge" color="primary">←</Text>
          </Pressable>
          <Box flex={1} alignItems="center">
            <Text variant="titleMedium" color="text">Vendedor</Text>
          </Box>
          <Box width={24} />
        </Box>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Box p="md" gap="lg">
            {/* Seller Info Card */}
            <Card variant="elevated" padding="lg" mode={resolvedMode}>
              <Box alignItems="center">
                <Avatar size="xl" name="Vendedor" />
                <Box mt="md" alignItems="center">
                  <Text variant="headlineSmall" color="text">Vendedor</Text>
                  <Box mt="xs">
                    <Badge variant="default" size="sm">ID: {id}</Badge>
                  </Box>
                </Box>
              </Box>
            </Card>

            {/* Contact Actions */}
            <Box gap="sm">
              <Button
                variant="primary"
                size="lg"
                onPress={() => {/* phone call */}}
              >
                📞 Llamar
              </Button>
              <Button
                variant="outline"
                size="lg"
                onPress={() => {/* whatsapp */}}
              >
                💬 WhatsApp
              </Button>
            </Box>

            {/* Activity placeholder */}
            <Card variant="outlined" padding="md" mode={resolvedMode}>
              <Text variant="titleMedium" color="text">Actividad reciente</Text>
              <Box
                height={80}
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
          </Box>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
