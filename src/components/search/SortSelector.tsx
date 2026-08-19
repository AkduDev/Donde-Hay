/**
 * Dónde Hay - SortSelector Component
 * Selector de ordenamiento de resultados
 */

import React, { useState } from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Modal } from '@/components/ui/Modal';
import { getColors } from '@/theme/colors';
import { useThemeStore } from '@/store/themeStore';

export type SortOption =
  | 'relevance'
  | 'recent'
  | 'price-asc'
  | 'price-desc'
  | 'distance';

export interface SortSelectorProps {
  value: SortOption;
  onChange: (sort: SortOption) => void;
  style?: StyleProp<ViewStyle>;
  mode?: 'light' | 'dark';
  testID?: string;
}

const SORT_OPTIONS: { id: SortOption; label: string; icon: string }[] = [
  { id: 'relevance', label: 'Más relevantes', icon: '🎯' },
  { id: 'recent', label: 'Más recientes', icon: '🕐' },
  { id: 'price-asc', label: 'Precio: menor a mayor', icon: '📈' },
  { id: 'price-desc', label: 'Precio: mayor a menor', icon: '📉' },
  { id: 'distance', label: 'Más cerca de ti', icon: '📍' },
];

const SortSelector = ({
  value,
  onChange,
  style,
  testID,
}: SortSelectorProps) => {
  const { resolvedMode } = useThemeStore();
  const colors = getColors(resolvedMode);
  const [modalVisible, setModalVisible] = useState(false);

  const currentOption = SORT_OPTIONS.find((opt) => opt.id === value) ?? SORT_OPTIONS[0]!;

  const handleSelect = (sort: SortOption) => {
    onChange(sort);
    setModalVisible(false);
  };

  const triggerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  };

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [
          triggerStyle,
          { opacity: pressed ? 0.7 : 1 },
          style,
        ]}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel="Cambiar ordenamiento"
        accessibilityHint={`Actualmente: ${currentOption.label}`}
      >
        <Text variant="bodySmall" mode={resolvedMode}>
          {currentOption.icon}
        </Text>
        <Text variant="labelMedium" color="textSecondary" mode={resolvedMode}>
          {currentOption.label}
        </Text>
        <Text variant="bodySmall" color="textTertiary" mode={resolvedMode}>
          ▾
        </Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Ordenar por"
        size="sm"
        mode={resolvedMode}
        testID={`${testID}-modal`}
      >
        <Box gap="xxs" p="xs">
          {SORT_OPTIONS.map((option) => {
            const isActive = option.id === value;
            return (
              <Pressable
                key={option.id}
                onPress={() => handleSelect(option.id)}
                testID={`${testID}-option-${option.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: pressed
                    ? colors.surfaceVariant
                    : isActive
                      ? colors.primaryContainer
                      : 'transparent',
                })}
              >
                <Text variant="bodyLarge" mode={resolvedMode}>
                  {option.icon}
                </Text>
                <Box flex={1}>
                  <Text
                    variant="bodyMedium"
                    color={isActive ? 'primary' : 'text'}
                    fontWeight={isActive ? '600' : '400'}
                  >
                    {option.label}
                  </Text>
                </Box>
                {isActive && (
                  <Text variant="bodyLarge" color="primary" mode={resolvedMode}>
                    ✓
                  </Text>
                )}
              </Pressable>
            );
          })}
        </Box>
      </Modal>
    </>
  );
};

SortSelector.displayName = 'SortSelector';

export { SortSelector };