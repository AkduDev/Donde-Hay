/**
 * Dónde Hay - Search Tab
 * Tab de búsqueda con historial y sugerencias
 */

import React, { useState } from 'react';
import { ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { SearchBar, SearchSuggestion } from '@/components/search/SearchBar';
import { useThemeStore } from '@/store/themeStore';

const RECENT_SEARCHES = [
  'iPhone 13',
  'Laptop HP',
  'PS5',
];

const TRENDING_SEARCHES: SearchSuggestion[] = [
  { id: '1', text: 'iPhone 13', type: 'trending', icon: '🔥' },
  { id: '2', text: 'Laptop HP', type: 'trending', icon: '🔥' },
  { id: '3', text: 'PS5', type: 'trending', icon: '🔥' },
  { id: '4', text: 'Toyota Corolla', type: 'trending', icon: '🔥' },
  { id: '5', text: 'Samsung Galaxy S23', type: 'trending', icon: '🔥' },
  { id: '6', text: 'Nintendo Switch', type: 'trending', icon: '🔥' },
];

const CATEGORIES: SearchSuggestion[] = [
  { id: 'cat1', text: 'Tecnología', type: 'category', icon: '📱' },
  { id: 'cat2', text: 'Computación', type: 'category', icon: '💻' },
  { id: 'cat3', text: 'Vehículos', type: 'category', icon: '🚗' },
  { id: 'cat4', text: 'Hogar', type: 'category', icon: '🏠' },
  { id: 'cat5', text: 'Ropa', type: 'category', icon: '👕' },
  { id: 'cat6', text: 'Videojuegos', type: 'category', icon: '🎮' },
];

export default function SearchTabScreen() {
  const router = useRouter();
  const { resolvedMode } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');

  const allSuggestions: SearchSuggestion[] = [
    ...RECENT_SEARCHES.map((text, i) => ({
      id: `recent-${i}`,
      text,
      type: 'history' as const,
      icon: '🕐',
    })),
    ...TRENDING_SEARCHES,
    ...CATEGORIES,
  ];

  const handleSearch = (query: string) => {
    router.push({
      pathname: '/search',
      params: { query },
    });
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'category') {
      router.push({
        pathname: '/search',
        params: { category: suggestion.text.toLowerCase() },
      });
    } else {
      handleSearch(suggestion.text);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Box flex={1} bg="background" mode={resolvedMode}>
        {/* Header */}
        <Box px="md" py="sm" mode={resolvedMode}>
          <Box mb="md">
            <Text variant="titleLarge" color="text">
              🔍 Buscar
            </Text>
          </Box>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmit={handleSearch}
            onSuggestionPress={handleSuggestionPress}
            suggestions={allSuggestions}
            showSuggestions={true}
            placeholder="Buscar productos..."
            autoFocus
          />
        </Box>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Recent Searches */}
          {RECENT_SEARCHES.length > 0 && (
            <Box px="md" mt="lg" mode={resolvedMode}>
              <Box mb="sm">
                <Text variant="titleMedium" color="text">
                  🕐 Búsquedas recientes
                </Text>
              </Box>
              <Box gap="xs">
                {RECENT_SEARCHES.map((search, index) => (
                  <Pressable
                    key={index}
                    onPress={() => handleSearch(search)}
                  >
                    <Box
                      flexDirection="row"
                      alignItems="center"
                      gap="sm"
                      p="sm"
                      bg="surfaceVariant"
                      borderRadius="md"
                      mode={resolvedMode}
                    >
                      <Text variant="bodySmall" color="textSecondary" mode={resolvedMode}>
                        🕐
                      </Text>
                      <Text variant="bodyMedium" color="text" mode={resolvedMode}>
                        {search}
                      </Text>
                    </Box>
                  </Pressable>
                ))}
              </Box>
            </Box>
          )}

          {/* Trending */}
          <Box px="md" mt="lg" mode={resolvedMode}>
            <Box mb="sm">
              <Text variant="titleMedium" color="text">
                🔥 Tendencias
              </Text>
            </Box>
            <Box flexDirection="row" flexWrap="wrap" gap="xs">
              {TRENDING_SEARCHES.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleSearch(item.text)}
                >
                  <Box
                    flexDirection="row"
                    alignItems="center"
                    gap="xxs"
                    px="sm"
                    py="xs"
                    bg="surfaceVariant"
                    borderRadius="md"
                    mode={resolvedMode}
                  >
                    <Text variant="bodySmall" mode={resolvedMode}>
                      {item.icon}
                    </Text>
                    <Text variant="bodySmall" color="text" mode={resolvedMode}>
                      {item.text}
                    </Text>
                  </Box>
                </Pressable>
              ))}
            </Box>
          </Box>

          {/* Categories */}
          <Box px="md" mt="lg" mb="xl" mode={resolvedMode}>
            <Box mb="sm">
              <Text variant="titleMedium" color="text">
                📂 Categorías
              </Text>
            </Box>
            <Box gap="xs">
              {CATEGORIES.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => handleSuggestionPress(category)}
                >
                  <Box
                    flexDirection="row"
                    alignItems="center"
                    gap="sm"
                    p="sm"
                    bg="surfaceVariant"
                    borderRadius="md"
                    mode={resolvedMode}
                  >
                    <Text variant="bodyLarge" mode={resolvedMode}>
                      {category.icon}
                    </Text>
                    <Text variant="bodyMedium" color="text" mode={resolvedMode}>
                      {category.text}
                    </Text>
                  </Box>
                </Pressable>
              ))}
            </Box>
          </Box>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
