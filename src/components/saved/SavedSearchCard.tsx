/**
 * Dónde Hay - SavedSearchCard Component
 * Card para mostrar búsquedas guardadas
 */

import React from 'react';
import { TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/theme/colors';
import type { SavedSearch } from '@/types';

export interface SavedSearchCardProps {
  search: SavedSearch;
  onPress?: (search: SavedSearch) => void;
  onDelete?: (search: SavedSearch) => void;
  onToggleNotification?: (search: SavedSearch, enabled: boolean) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const SavedSearchCard = React.memo(function SavedSearchCard({
  search,
  onPress,
  onDelete,
  onToggleNotification,
  style,
  testID,
}: SavedSearchCardProps) {
  const { resolvedMode } = useThemeStore();

  const handlePress = () => {
    onPress?.(search);
  };

  const handleDelete = () => {
    onDelete?.(search);
  };

  const handleToggleNotification = () => {
    onToggleNotification?.(search, !search.notifyEnabled);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      testID={testID}
      style={style}
    >
      <Box
        p="md"
        bg="surface"
        borderRadius="md"
        mode={resolvedMode}
        style={{
          borderWidth: 1,
          borderColor: getColors(resolvedMode).divider,
        }}
      >
        {/* Header */}
        <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1} mr="sm">
            <Text variant="titleMedium" color="text" numberOfLines={1}>
              {search.name || 'Búsqueda guardada'}
            </Text>
            <Box mt="xs">
              <Text variant="bodySmall" color="textSecondary" numberOfLines={1}>
                {typeof search.query === 'string' ? search.query : JSON.stringify(search.query)}
              </Text>
            </Box>
          </Box>
          <TouchableOpacity onPress={handleDelete}>
            <Text variant="bodyMedium" color="error">
              ✕
            </Text>
          </TouchableOpacity>
        </Box>

        {/* Footer */}
        <Box flexDirection="row" justifyContent="space-between" alignItems="center" mt="md">
          <Text variant="bodySmall" color="textTertiary">
            {formatDate(search.createdAt)}
          </Text>
          <TouchableOpacity onPress={handleToggleNotification}>
            <Box
              flexDirection="row"
              alignItems="center"
              px="sm"
              py="xs"
              bg={search.notifyEnabled ? 'primaryContainer' : 'surfaceVariant'}
              borderRadius="sm"
            >
              <Text
                variant="labelSmall"
                color={search.notifyEnabled ? 'primary' : 'textSecondary'}
              >
                {search.notifyEnabled ? '🔔 Notificaciones' : '🔕 Silenciado'}
              </Text>
            </Box>
          </TouchableOpacity>
        </Box>
      </Box>
    </TouchableOpacity>
  );
});
