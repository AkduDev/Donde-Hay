/**
 * Dónde Hay - FilterSheet Component
 * Bottom Sheet para filtros de búsqueda avanzados
 */

import React, { useState, useMemo } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Sheet, SheetProps } from '@/components/ui/Sheet';
import { Badge } from '@/components/ui/Badge';
import { Divider } from '@/components/ui/Divider';
import { Spacing } from '@/theme/spacing';
import { getColors } from '@/theme/colors';
import { useThemeStore } from '@/store/themeStore';

// ============================================
// TIPOS
// ============================================

export interface FilterState {
  minPrice?: number;
  maxPrice?: number;
  currency: 'USD' | 'CUP' | 'MLC';
  provinceId?: string;
  municipalityId?: string;
  sourceIds: string[];
  categoryId?: string;
  condition: 'new' | 'used' | 'any';
  postedWithin: 'day' | 'week' | 'month' | 'any';
}

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface FilterSheetProps extends Omit<SheetProps, 'children' | 'title'> {
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onReset: () => void;
  provinces?: FilterOption[];
  municipalities?: FilterOption[];
  sources?: FilterOption[];
  categories?: FilterOption[];
  testID?: string;
}

// ============================================
// CONSTANTES
// ============================================

const CURRENCIES: { id: FilterState['currency']; label: string; symbol: string }[] = [
  { id: 'USD', label: 'USD', symbol: '$' },
  { id: 'CUP', label: 'CUP', symbol: '₱' },
  { id: 'MLC', label: 'MLC', symbol: 'M' },
];

const CONDITIONS: { id: FilterState['condition']; label: string }[] = [
  { id: 'any', label: 'Cualquiera' },
  { id: 'new', label: 'Nuevo' },
  { id: 'used', label: 'Usado' },
];

const POSTED_WITHIN: { id: FilterState['postedWithin']; label: string }[] = [
  { id: 'any', label: 'Cualquier fecha' },
  { id: 'day', label: 'Últimas 24 horas' },
  { id: 'week', label: 'Última semana' },
  { id: 'month', label: 'Último mes' },
];

const PRICE_PRESETS = [50, 100, 200, 500, 1000, 2000];

// ============================================
// COMPONENTE
// ============================================

const FilterSheet = ({
  visible,
  onClose,
  filters,
  onApply,
  onReset,
  provinces = [],
  municipalities = [],
  sources = [],
  categories = [],
  testID,
  ...rest
}: FilterSheetProps) => {
  const { resolvedMode } = useThemeStore();
  const colors = getColors(resolvedMode);

  // Estado local para edición antes de aplicar
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Reset local filters cuando se abre el sheet
  React.useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (localFilters.minPrice !== undefined || localFilters.maxPrice !== undefined) count++;
    if (localFilters.provinceId) count++;
    if (localFilters.municipalityId) count++;
    if (localFilters.sourceIds.length > 0) count++;
    if (localFilters.categoryId) count++;
    if (localFilters.condition !== 'any') count++;
    if (localFilters.postedWithin !== 'any') count++;
    return count;
  }, [localFilters]);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
      // Reset municipality cuando cambia province
      ...(key === 'provinceId' && { municipalityId: undefined }),
    }));
  };

  const toggleSource = (sourceId: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      sourceIds: prev.sourceIds.includes(sourceId)
        ? prev.sourceIds.filter((id) => id !== sourceId)
        : [...prev.sourceIds, sourceId],
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      currency: 'USD',
      sourceIds: [],
      condition: 'any',
      postedWithin: 'any',
    };
    setLocalFilters(resetFilters);
    onReset();
  };

  // ============================================
  // SUB-COMPONENTES
  // ============================================

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <Text variant="titleMedium" color="text" mode={resolvedMode} mb={3}>
      {children}
    </Text>
  );

  const ChipButton = ({
    label,
    active,
    onPress,
    count,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
    count?: number;
  }) => (
    <Pressable
      onPress={onPress}
      testID={`${testID}-chip-${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Box
        px={4}
        py={2}
        borderRadius="full"
        borderWidth={1.5}
        borderColor={active ? 'primary' : 'border'}
        bg={active ? 'primaryContainer' : 'transparent'}
        mode={resolvedMode}
      >
        <Text
          variant="labelMedium"
          color={active ? 'primary' : 'textSecondary'}
          mode={resolvedMode}
        >
          {label}
          {count !== undefined ? ` (${count})` : ''}
        </Text>
      </Box>
    </Pressable>
  );

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Filtros"
      subtitle={activeFilterCount > 0 ? `${activeFilterCount} filtros activos` : 'Sin filtros activos'}
      snapPoints={['medium', 'large']}
      testID={testID}
      {...rest}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing[6] }}
      >
        {/* Moneda */}
        <Box mb={5}>
          <SectionTitle>Moneda</SectionTitle>
          <Box flexDirection="row" gap={2}>
            {CURRENCIES.map((currency) => (
              <ChipButton
                key={currency.id}
                label={`${currency.symbol} ${currency.label}`}
                active={localFilters.currency === currency.id}
                onPress={() => updateFilter('currency', currency.id)}
              />
            ))}
          </Box>
        </Box>

        {/* Rango de precio */}
        <Box mb={5}>
          <SectionTitle>Precio</SectionTitle>
          <Box flexDirection="row" gap={2} mb={3}>
            <Box
              flex={1}
              borderWidth={1.5}
              borderColor="border"
              borderRadius="md"
              px={3}
              py={2}
              mode={resolvedMode}
            >
              <Text variant="labelSmall" color="textSecondary" mode={resolvedMode}>
                Mínimo
              </Text>
              <Text variant="bodyLarge" color="text" mode={resolvedMode}>
                {localFilters.minPrice !== undefined
                  ? `${localFilters.currency === 'USD' ? '$' : '₱'}${localFilters.minPrice}`
                  : 'Cualquiera'}
              </Text>
            </Box>
            <Box
              flex={1}
              borderWidth={1.5}
              borderColor="border"
              borderRadius="md"
              px={3}
              py={2}
              mode={resolvedMode}
            >
              <Text variant="labelSmall" color="textSecondary" mode={resolvedMode}>
                Máximo
              </Text>
              <Text variant="bodyLarge" color="text" mode={resolvedMode}>
                {localFilters.maxPrice !== undefined
                  ? `${localFilters.currency === 'USD' ? '$' : '₱'}${localFilters.maxPrice}`
                  : 'Cualquiera'}
              </Text>
            </Box>
          </Box>
          <Box flexDirection="row" flexWrap="wrap" gap={2}>
            {PRICE_PRESETS.map((price) => (
              <ChipButton
                key={`max-${price}`}
                label={`Hasta $${price}`}
                active={localFilters.maxPrice === price}
                onPress={() =>
                  updateFilter('maxPrice', localFilters.maxPrice === price ? undefined : price)
                }
              />
            ))}
          </Box>
        </Box>

        {/* Ubicación */}
        {provinces.length > 0 && (
          <Box mb={5}>
            <SectionTitle>Ubicación</SectionTitle>
            <Text variant="labelSmall" color="textSecondary" mode={resolvedMode} mb={2}>
              Provincia
            </Text>
            <Box flexDirection="row" flexWrap="wrap" gap={2} mb={3}>
              {provinces.map((province) => (
                <ChipButton
                  key={province.id}
                  label={province.label}
                  count={province.count}
                  active={localFilters.provinceId === province.id}
                  onPress={() =>
                    updateFilter(
                      'provinceId',
                      localFilters.provinceId === province.id ? undefined : province.id
                    )
                  }
                />
              ))}
            </Box>

            {localFilters.provinceId && municipalities.length > 0 && (
              <>
                <Text variant="labelSmall" color="textSecondary" mode={resolvedMode} mb={2}>
                  Municipio
                </Text>
                <Box flexDirection="row" flexWrap="wrap" gap={2}>
                  {municipalities.map((municipality) => (
                    <ChipButton
                      key={municipality.id}
                      label={municipality.label}
                      active={localFilters.municipalityId === municipality.id}
                      onPress={() =>
                        updateFilter(
                          'municipalityId',
                          localFilters.municipalityId === municipality.id
                            ? undefined
                            : municipality.id
                        )
                      }
                    />
                  ))}
                </Box>
              </>
            )}
          </Box>
        )}

        {/* Fuentes */}
        {sources.length > 0 && (
          <Box mb={5}>
            <SectionTitle>Fuentes</SectionTitle>
            <Box flexDirection="row" flexWrap="wrap" gap={2}>
              {sources.map((source) => (
                <ChipButton
                  key={source.id}
                  label={source.label}
                  count={source.count}
                  active={localFilters.sourceIds.includes(source.id)}
                  onPress={() => toggleSource(source.id)}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Condición */}
        <Box mb={5}>
          <SectionTitle>Condición</SectionTitle>
          <Box flexDirection="row" gap={2}>
            {CONDITIONS.map((condition) => (
              <ChipButton
                key={condition.id}
                label={condition.label}
                active={localFilters.condition === condition.id}
                onPress={() => updateFilter('condition', condition.id)}
              />
            ))}
          </Box>
        </Box>

        {/* Fecha de publicación */}
        <Box mb={5}>
          <SectionTitle>Publicado</SectionTitle>
          <Box flexDirection="row" flexWrap="wrap" gap={2}>
            {POSTED_WITHIN.map((period) => (
              <ChipButton
                key={period.id}
                label={period.label}
                active={localFilters.postedWithin === period.id}
                onPress={() => updateFilter('postedWithin', period.id)}
              />
            ))}
          </Box>
        </Box>

        <Divider mode={resolvedMode} />

        {/* Acciones */}
        <Box flexDirection="row" gap={3} mt={4}>
          <Button
            variant="outline"
            size="lg"
            flex={1}
            onPress={handleReset}
            mode={resolvedMode}
            testID={`${testID}-reset`}
          >
            Limpiar
          </Button>
          <Button
            variant="primary"
            size="lg"
            flex={2}
            onPress={handleApply}
            mode={resolvedMode}
            testID={`${testID}-apply`}
          >
            Aplicar filtros
          </Button>
        </Box>
      </ScrollView>
    </Sheet>
  );
};

FilterSheet.displayName = 'FilterSheet';

export { FilterSheet };
export type { FilterSheetProps, FilterState };