/**
 * Dónde Hay - Preferences Screen
 * Configuraciones de preferencias del usuario
 */

import React, { useState } from 'react';
import { ScrollView, Pressable, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Divider';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { getColors, OpacityTokens } from '@/theme/colors';

type ThemeOption = 'light' | 'dark' | 'system';
type CurrencyOption = 'USD' | 'CUP' | 'MLC';

const THEME_OPTIONS: { value: ThemeOption; label: string; icon: string }[] = [
  { value: 'light', label: 'Claro', icon: '☀️' },
  { value: 'dark', label: 'Oscuro', icon: '🌙' },
  { value: 'system', label: 'Sistema', icon: '📱' },
];

const CURRENCY_OPTIONS: { value: CurrencyOption; label: string; symbol: string }[] = [
  { value: 'USD', label: 'Dólar', symbol: '$' },
  { value: 'CUP', label: 'Peso cubano', symbol: '₱' },
  { value: 'MLC', label: 'MLC', symbol: 'MLC' },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const { resolvedMode, setMode } = useThemeStore();
  const colors = getColors(resolvedMode);
  const { user, updatePreferences } = useAuthStore();

  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(
    user?.preferences?.theme || 'system'
  );
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption>(
    user?.preferences?.currency || 'USD'
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.preferences?.notifications?.alerts ?? true
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      updatePreferences({
        theme: selectedTheme,
        currency: selectedCurrency,
        notifications: {
          push: notificationsEnabled,
          email: user?.preferences?.notifications?.email ?? true,
          alerts: notificationsEnabled,
          promotions: user?.preferences?.notifications?.promotions ?? true,
        },
      });

      // Persist currency to Supabase user metadata
      await supabase.auth.updateUser({
        data: { currency: selectedCurrency, notifications_enabled: notificationsEnabled },
      });

      // Update theme
      if (selectedTheme !== 'system') {
        setMode(selectedTheme);
      } else {
        // Use system theme
        setMode('system');
      }

      Alert.alert('Éxito', 'Preferencias actualizadas', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Update preferences error:', error);
      Alert.alert('Error', 'No se pudieron actualizar las preferencias');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Box flex={1} bg="background" mode={resolvedMode}>
        {/* Header */}
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          px="md"
          py="sm"
          mode={resolvedMode}
          style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}
        >
          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
          >
            ← Volver
          </Button>
          <Text variant="titleMedium" color="text">
            Preferencias
          </Text>
          <Box width={60} />
        </Box>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Theme */}
          <Box px="md" mt="lg" mode={resolvedMode}>
            <Box mb="xs">
              <Text variant="labelMedium" color="textTertiary" fontWeight="600">
                TEMA
              </Text>
            </Box>
            <Card variant="elevated" padding="none" mode={resolvedMode}>
              {THEME_OPTIONS.map((option, index) => (
                <React.Fragment key={option.value}>
                  {index > 0 && <Divider mode={resolvedMode} />}
                  <Pressable
                    onPress={() => setSelectedTheme(option.value)}
                    style={({ pressed }) => ({
                      opacity: pressed ? OpacityTokens.pressed : 1,
                    })}
                  >
                    <Box
                      flexDirection="row"
                      alignItems="center"
                      justifyContent="space-between"
                      px="md"
                      py="md"
                      mode={resolvedMode}
                    >
                      <Box flexDirection="row" alignItems="center" gap="md">
                        <Text variant="bodyLarge">{option.icon}</Text>
                        <Text variant="bodyMedium" color="text">
                          {option.label}
                        </Text>
                      </Box>
                      {selectedTheme === option.value && (
                        <Box
                          width={20}
                          height={20}
                          borderRadius="full"
                          bg="primary"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text variant="bodySmall" color="onPrimary">✓</Text>
                        </Box>
                      )}
                    </Box>
                  </Pressable>
                </React.Fragment>
              ))}
            </Card>
          </Box>

          {/* Currency */}
          <Box px="md" mt="lg" mode={resolvedMode}>
            <Box mb="xs">
              <Text variant="labelMedium" color="textTertiary" fontWeight="600">
                MONEDA
              </Text>
            </Box>
            <Card variant="elevated" padding="none" mode={resolvedMode}>
              {CURRENCY_OPTIONS.map((option, index) => (
                <React.Fragment key={option.value}>
                  {index > 0 && <Divider mode={resolvedMode} />}
                  <Pressable
                    onPress={() => setSelectedCurrency(option.value)}
                    style={({ pressed }) => ({
                      opacity: pressed ? OpacityTokens.pressed : 1,
                    })}
                  >
                    <Box
                      flexDirection="row"
                      alignItems="center"
                      justifyContent="space-between"
                      px="md"
                      py="md"
                      mode={resolvedMode}
                    >
                      <Box flexDirection="row" alignItems="center" gap="md">
                        <Box
                          width={32}
                          height={32}
                          borderRadius="md"
                          bg="surfaceVariant"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text variant="bodySmall" fontWeight="bold" color="text">
                            {option.symbol}
                          </Text>
                        </Box>
                        <Text variant="bodyMedium" color="text">
                          {option.label}
                        </Text>
                      </Box>
                      {selectedCurrency === option.value && (
                        <Box
                          width={20}
                          height={20}
                          borderRadius="full"
                          bg="primary"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text variant="bodySmall" color="onPrimary">✓</Text>
                        </Box>
                      )}
                    </Box>
                  </Pressable>
                </React.Fragment>
              ))}
            </Card>
          </Box>

          {/* Notifications */}
          <Box px="md" mt="lg" mode={resolvedMode}>
            <Box mb="xs">
              <Text variant="labelMedium" color="textTertiary" fontWeight="600">
                NOTIFICACIONES
              </Text>
            </Box>
            <Card variant="elevated" padding="none" mode={resolvedMode}>
              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                px="md"
                py="md"
              >
                <Box flexDirection="row" alignItems="center" gap="md">
                  <Text variant="bodyLarge">🔔</Text>
                  <Box>
                    <Text variant="bodyMedium" color="text">
                      Notificaciones push
                    </Text>
                    <Text variant="labelSmall" color="textTertiary">
                      Recibe alertas de precio y novedades
                    </Text>
                  </Box>
                </Box>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: colors.textTertiary, true: colors.primary }}
                  thumbColor="#ffffff"
                />
              </Box>
            </Card>
          </Box>

          {/* Save Button */}
          <Box px="md" mt="xl" mode={resolvedMode}>
            <Button
              variant="primary"
              size="lg"
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar preferencias'}
            </Button>
          </Box>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
