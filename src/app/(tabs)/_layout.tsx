/**
 * Dónde Hay - Tabs Layout
 * Layout de navegación por tabs
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/theme/colors';

export default function TabsLayout() {
  const { resolvedMode } = useThemeStore();
  const colors = getColors(resolvedMode);
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary as string,
        tabBarInactiveTintColor: colors.textTertiary as string,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
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
          tabBarAccessibilityLabel: 'Inicio',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon iconName={focused ? 'home' : 'home-outline'} color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarAccessibilityLabel: 'Buscar productos',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon iconName={focused ? 'search' : 'search-outline'} color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Guardados',
          tabBarAccessibilityLabel: 'Productos guardados',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon iconName={focused ? 'heart' : 'heart-outline'} color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alertas',
          tabBarAccessibilityLabel: 'Alertas de precio',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon iconName={focused ? 'notifications' : 'notifications-outline'} color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="nearby"
        options={{
          title: 'Mapa',
          tabBarAccessibilityLabel: 'Productos cerca de ti',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon iconName={focused ? 'map' : 'map-outline'} color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarAccessibilityLabel: 'Perfil de usuario',
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
