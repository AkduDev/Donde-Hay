/**
 * Dónde Hay - Tabs Layout
 * Navegación principal con 5 tabs: Inicio, Buscar, Cerca, Guardados, Perfil
 */

import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getColors } from '@/theme/colors';
import { useThemeStore } from '@/store/themeStore';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: IconName;
  focusedName: IconName;
}

const TAB_ICONS: TabConfig[] = [
  { name: 'home-outline', focusedName: 'home' },
  { name: 'search-outline', focusedName: 'search' },
  { name: 'location-outline', focusedName: 'location' },
  { name: 'heart-outline', focusedName: 'heart' },
  { name: 'person-outline', focusedName: 'person' },
];

function TabIcon({ config, focused }: { config: TabConfig; focused: boolean }) {
  return (
    <Ionicons
      name={focused ? config.focusedName : config.name}
      size={24}
      color="currentColor"
    />
  );
}

export default function TabsLayout() {
  const { resolvedMode } = useThemeStore();
  const colors = getColors(resolvedMode);
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          borderTopWidth: 1,
          paddingTop: 4,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        sceneStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => <TabIcon config={TAB_ICONS[0]!} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ focused }) => <TabIcon config={TAB_ICONS[1]!} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="nearby"
        options={{
          title: 'Cerca',
          tabBarIcon: ({ focused }) => <TabIcon config={TAB_ICONS[2]!} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Guardados',
          tabBarIcon: ({ focused }) => <TabIcon config={TAB_ICONS[3]!} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon config={TAB_ICONS[4]!} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
