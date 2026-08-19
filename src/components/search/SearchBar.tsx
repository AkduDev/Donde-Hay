/**
 * Dónde Hay - SearchBar Component
 * Barra de búsqueda con sugerencias, historial y acciones
 */

import React, { forwardRef, useState, useEffect } from 'react';
import {
  TextInput,
  TextInputProps,
  ViewStyle,
  StyleProp,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { BorderRadius } from '@/theme/radius';
import { Spacing } from '@/theme/spacing';
import { getColors } from '@/theme/colors';
import { useThemeStore } from '@/store/themeStore';

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'history' | 'trending' | 'suggestion' | 'category';
  icon?: string;
}

export interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  // Value
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: (query: string) => void;
  onClear?: () => void;

  // Suggestions
  suggestions?: SearchSuggestion[];
  onSuggestionPress?: (suggestion: SearchSuggestion) => void;
  showSuggestions?: boolean;
  isLoadingSuggestions?: boolean;

  // Visual
  autoFocus?: boolean;
  placeholder?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onBackPress?: () => void;
  showBackButton?: boolean;

  // Layout
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const SearchBar = forwardRef<TextInput, SearchBarProps>(
  (
    {
      value,
      onChangeText,
      onSubmit,
      onClear,
      suggestions = [],
      onSuggestionPress,
      showSuggestions = true,
      isLoadingSuggestions = false,
      autoFocus = false,
      placeholder = 'Buscar productos...',
      leftIcon,
      rightIcon,
      onBackPress,
      showBackButton = false,
      style,
      testID,
      ...rest
    }: SearchBarProps,
    ref
  ) => {
    const { resolvedMode } = useThemeStore();
    const colors = getColors(resolvedMode);
    const [isFocused, setIsFocused] = useState(false);
    const [showSuggestionList, setShowSuggestionList] = useState(false);

    // Filtrar sugerencias por el texto actual
    const filteredSuggestions = value.trim()
      ? suggestions.filter((s) =>
          s.text.toLowerCase().includes(value.toLowerCase())
        )
      : suggestions;

    const handleSubmit = () => {
      if (value.trim()) {
        onSubmit?.(value.trim());
        setShowSuggestionList(false);
      }
    };

    const handleClear = () => {
      onChangeText('');
      onClear?.();
    };

    const handleSuggestionPress = (suggestion: SearchSuggestion) => {
      onChangeText(suggestion.text);
      onSubmit?.(suggestion.text);
      setShowSuggestionList(false);
    };

    const handleFocus = () => {
      setIsFocused(true);
      setShowSuggestionList(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
      // Delay para permitir presionar sugerencias
      setTimeout(() => setShowSuggestionList(false), 150);
    };

    const containerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: BorderRadius.xl,
      borderWidth: 1.5,
      borderColor: isFocused ? colors.inputBorderFocus : colors.inputBorder,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      gap: Spacing.xs,
      height: 48,
    };

    const inputStyle = {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      paddingVertical: 0,
      paddingHorizontal: 0,
    };

    const renderSuggestion = ({ item }: { item: SearchSuggestion }) => {
      const icons: Record<SearchSuggestion['type'], string> = {
        history: '🕐',
        trending: '🔥',
        suggestion: '🔍',
        category: '📂',
      };

      return (
        <Pressable
          onPress={() => handleSuggestionPress(item)}
          testID={`${testID}-suggestion-${item.id}`}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
            backgroundColor: pressed ? colors.surfaceVariant : 'transparent',
          })}
        >
          <Text variant="bodyMedium" mode={resolvedMode}>
            {item.icon || icons[item.type]}
          </Text>
          <Box flex={1}>
            <Text variant="bodyMedium" color="text">
              {item.text}
            </Text>
          </Box>
          {item.type === 'history' && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                // TODO: Remove from history
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text variant="bodySmall" color="textTertiary" mode={resolvedMode}>
                ✕
              </Text>
            </Pressable>
          )}
        </Pressable>
      );
    };

    return (
      <Box position="relative" style={style} testID={testID} mode={resolvedMode}>
        <Box style={containerStyle} mode={resolvedMode}>
          {/* Back button opcional */}
          {showBackButton && onBackPress && (
            <Pressable
              onPress={onBackPress}
              testID={`${testID}-back`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Volver"
            >
              <Text variant="headlineSmall" mode={resolvedMode}>←</Text>
            </Pressable>
          )}

          {/* Left icon (default: lupa) */}
          {leftIcon || (
            <Text variant="bodyLarge" color="textSecondary" mode={resolvedMode}>
              🔍
            </Text>
          )}

          {/* Input */}
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={handleSubmit}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoFocus={autoFocus}
            placeholder={placeholder}
            placeholderTextColor={colors.inputPlaceholder}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            style={inputStyle}
            testID={`${testID}-input`}
            accessibilityLabel="Campo de búsqueda"
            {...rest}
          />

          {/* Clear button */}
          {value.length > 0 && (
            <Pressable
              onPress={handleClear}
              testID={`${testID}-clear`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Limpiar búsqueda"
            >
              <Box
                width={20}
                height={20}
                borderRadius="full"
                bg="surfaceContainerHigh"
                alignItems="center"
                justifyContent="center"
                mode={resolvedMode}
              >
                <Text variant="labelSmall" color="textSecondary" mode={resolvedMode}>
                  ✕
                </Text>
              </Box>
            </Pressable>
          )}

          {/* Loading indicator */}
          {isLoadingSuggestions && (
            <ActivityIndicator size="small" color={colors.primary} testID={`${testID}-loading`} />
          )}

          {/* Right icon custom */}
          {rightIcon}
        </Box>

        {/* Suggestions dropdown */}
        {showSuggestions && showSuggestionList && filteredSuggestions.length > 0 && (
          <Box
            position="absolute"
            top={56}
            left={0}
            right={0}
            bg="surface"
            borderRadius="lg"
            borderWidth={1}
            borderColor="border"
            shadow="lg"
            overflow="hidden"
            mode={resolvedMode}
            testID={`${testID}-suggestions`}
            style={{ maxHeight: 300, elevation: 8 }}
          >
            <FlatList
              data={filteredSuggestions}
              keyExtractor={(item) => item.id}
              renderItem={renderSuggestion}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => (
                <Box height={1} bg="divider" mode={resolvedMode} />
              )}
            />
          </Box>
        )}
      </Box>
    );
  }
);

SearchBar.displayName = 'SearchBar';

export { SearchBar };