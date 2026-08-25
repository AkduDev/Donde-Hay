/**
 * Dónde Hay - Tabs Layout
 * Layout de navegación por tabs
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/theme/colors';

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
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon iconName={focused ? 'home' : 'home-outline'} color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon iconName={focused ? 'search' : 'search-outline'} color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Guardados',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon iconName={focused ? 'heart' : 'heart-outline'} color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alertas',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon iconName={focused ? 'notifications' : 'notifications-outline'} color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon iconName={focused ? 'person' : 'person-outline'} color={color as string} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  iconName,
  color,
  size,
}: {
  iconName: string;
  color: string;
  size: number;
}) {
  return <Ionicons name={iconName as any} size={size} color={color} />;
}
