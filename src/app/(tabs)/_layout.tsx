/**
 * Dónde Hay - Tabs Layout
 * Layout de navegación por tabs
 */

import { Tabs } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/theme/colors';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';

export default function TabsLayout() {
  const { resolvedMode } = useThemeStore();
  const colors = getColors(resolvedMode);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary as string,
        tabBarInactiveTintColor: colors.textTertiary as string,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="🏠" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="🔍" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Guardados',
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="❤️" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alertas',
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="🔔" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="👤" size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ icon, size }: { icon: string; size: number }) {
  return (
    <Box alignItems="center" justifyContent="center">
      <Text variant="bodyLarge">{icon}</Text>
    </Box>
  );
}
