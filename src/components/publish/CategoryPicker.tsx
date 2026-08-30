/**
 * Dónde Hay - CategoryPicker Component
 * Selector de categorías con búsqueda y subcategorías
 */

import React, { useState } from 'react';
import { Pressable, FlatList } from 'react-native';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useCategories } from '@/hooks/use-categories';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/theme/colors';
import type { Category } from '@/services/categories.service';

export interface CategoryPickerProps {
  selectedCategoryId: string | null;
  onSelect: (categoryId: string) => void;
  mode?: 'light' | 'dark';
}

type PickerCategory = Category & { children?: Category[] };

function groupCategories(categories: Category[], searchQuery: string): PickerCategory[] {
  const q = searchQuery.trim().toLowerCase();

  if (q) {
    return categories
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q)
      )
      .map((c) => ({ ...c }));
  }

  return categories
    .filter((c) => !c.parentId)
    .map((parent) => ({
      ...parent,
      children: categories.filter((c) => c.parentId === parent.id),
    }));
}

export function CategoryPicker({
  selectedCategoryId,
  onSelect,
  mode: propMode,
}: CategoryPickerProps) {
  const { resolvedMode } = useThemeStore();
  const mode = propMode ?? resolvedMode;
  const colors = getColors(mode);

  const { data: categories, isLoading } = useCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedParent, setExpandedParent] = useState<string | null>(null);

  // Group categories: parents with children
  const groupedCategories = groupCategories(categories ?? [], searchQuery);

  const handleSelect = (categoryId: string) => {
    onSelect(categoryId);
  };

  const toggleExpand = (parentId: string) => {
    setExpandedParent((prev) => (prev === parentId ? null : parentId));
  };

  if (isLoading) {
    return (
      <Box alignItems="center" py="lg" mode={mode}>
        <Spinner size="md" mode={mode} />
        <Box mt="sm">
          <Text variant="bodySmall" color="textSecondary" mode={mode}>
            Cargando categorías...
          </Text>
        </Box>
      </Box>
    );
  }

  // Flat search mode
  if (searchQuery.trim()) {
    return (
      <Box gap="md" mode={mode}>
        <Text variant="titleSmall" color="text" mode={mode}>
          Categoría
        </Text>
        <Input
          placeholder="Buscar categoría..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          mode={mode}
        />
        <FlatList
          data={groupedCategories}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Pressable onPress={() => handleSelect(item.id)}>
              <Box
                py="sm"
                px="md"
                borderRadius="md"
                borderWidth={1}
                borderColor={
                  selectedCategoryId === item.id
                    ? colors.primary
                    : colors.border
                }
                bg={selectedCategoryId === item.id ? 'primaryContainer' : 'surface'}
                mb="xs"
                mode={mode}
              >
                <Text
                  variant="bodyMedium"
                  color={selectedCategoryId === item.id ? 'primary' : 'text'}
                  mode={mode}
                >
                  {item.name}
                </Text>
              </Box>
            </Pressable>
          )}
          ListEmptyComponent={
            <Box alignItems="center" py="md" mode={mode}>
              <Text variant="bodySmall" color="textSecondary" mode={mode}>
                No se encontraron categorías
              </Text>
            </Box>
          }
        />
      </Box>
    );
  }

  // Grouped mode
  return (
    <Box gap="md" mode={mode}>
      <Text variant="titleSmall" color="text" mode={mode}>
        Categoría
      </Text>
      <Input
        placeholder="Buscar categoría..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        mode={mode}
      />

      <FlatList
        data={groupedCategories}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item: parent }) => {
          const hasChildren = parent.children && parent.children.length > 0;
          const isExpanded = expandedParent === parent.id;
          const isSelected = selectedCategoryId === parent.id;

          return (
            <Box mb="xs" mode={mode}>
              <Pressable
                onPress={() => {
                  if (hasChildren) {
                    toggleExpand(parent.id);
                  } else {
                    handleSelect(parent.id);
                  }
                }}
              >
                <Box
                  py="sm"
                  px="md"
                  borderRadius="md"
                  borderWidth={1}
                  borderColor={
                    isSelected ? colors.primary : colors.border
                  }
                  bg={isSelected ? 'primaryContainer' : 'surface'}
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mode={mode}
                >
                  <Text
                    variant="bodyMedium"
                    color={isSelected ? 'primary' : 'text'}
                    mode={mode}
                  >
                    {parent.icon ? `${parent.icon} ` : ''}{parent.name}
                  </Text>
                  {hasChildren && (
                    <Text variant="bodySmall" color="textSecondary" mode={mode}>
                      {isExpanded ? '▾' : '▸'}
                    </Text>
                  )}
                </Box>
              </Pressable>

              {/* Subcategories */}
              {hasChildren && isExpanded && (
                <Box ml="md" mt="xs" gap="xs" mode={mode}>
                  {parent.children?.map((child) => {
                    const isChildSelected = selectedCategoryId === child.id;
                    return (
                      <Pressable
                        key={child.id}
                        onPress={() => handleSelect(child.id)}
                      >
                        <Box
                          py="xs"
                          px="sm"
                          borderRadius="sm"
                          borderWidth={1}
                          borderColor={
                            isChildSelected
                              ? colors.primary
                              : colors.border
                          }
                          bg={isChildSelected ? 'primaryContainer' : 'surface'}
                          mode={mode}
                        >
                          <Text
                            variant="bodySmall"
                            color={isChildSelected ? 'primary' : 'text'}
                            mode={mode}
                          >
                            {child.name}
                          </Text>
                        </Box>
                      </Pressable>
                    );
                  })}
                </Box>
              )}
            </Box>
          );
        }}
        ListEmptyComponent={
          <Box alignItems="center" py="md" mode={mode}>
            <Text variant="bodySmall" color="textSecondary" mode={mode}>
              No se encontraron categorías
            </Text>
          </Box>
        }
      />
    </Box>
  );
}
