/**
 * Dónde Hay - LocationPicker Component
 * Selector de ubicación: provincia/municipios o ubicación del dispositivo
 */

import React, { useState } from 'react';
import { Pressable, ScrollView, Alert } from 'react-native';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useProvinces, useMunicipalities } from '@/hooks/use-locations';
import { useDeviceLocation } from '@/hooks/use-device-location';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/theme/colors';
import type { Province, Municipality } from '@/services/locations.service';

export interface LocationPickerProps {
  selectedLocationId: string | null;
  onSelect: (locationId: string) => void;
  mode?: 'light' | 'dark';
}

export function LocationPicker({
  selectedLocationId,
  onSelect,
  mode: propMode,
}: LocationPickerProps) {
  const { resolvedMode } = useThemeStore();
  const mode = propMode ?? resolvedMode;
  const colors = getColors(mode);

  const { data: provinces, isLoading: provincesLoading } = useProvinces();
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);

  const { data: municipalities, isLoading: municipalitiesLoading } =
    useMunicipalities(selectedProvince?.id || '');

  const { location: deviceLocation, loading: deviceLoading, getCurrentLocation } =
    useDeviceLocation({ enableHighAccuracy: true });

  const handleUseDeviceLocation = async () => {
    const loc = await getCurrentLocation();
    if (!loc) {
      Alert.alert(
        'Ubicación no disponible',
        'No se pudo obtener tu ubicación actual'
      );
      return;
    }
    // For device location, we'd ideally reverse geocode to get the nearest location
    // For now, we'll select the first province as a fallback
    Alert.alert(
      'Ubicación detectada',
      'Selecciona tu provincia y municipio más cercano'
    );
  };

  const handleSelectProvince = (province: Province) => {
    setSelectedProvince(province);
  };

  const handleSelectMunicipality = (municipality: Municipality) => {
    onSelect(municipality.id);
  };

  if (provincesLoading) {
    return (
      <Box alignItems="center" py="lg" mode={mode}>
        <Spinner size="md" mode={mode} />
        <Box mt="sm">
          <Text variant="bodySmall" color="textSecondary" mode={mode}>
            Cargando ubicaciones...
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box gap="md" mode={mode}>
      <Box flexDirection="row" justifyContent="space-between" alignItems="center">
        <Text variant="titleSmall" color="text" mode={mode}>
          Ubicación
        </Text>
        <Button
          variant="ghost"
          size="sm"
          onPress={handleUseDeviceLocation}
          loading={deviceLoading}
          mode={mode}
        >
          Mi ubicación
        </Button>
      </Box>

      {/* Step 1: Province selector */}
      <Box gap="xs" mode={mode}>
        <Text variant="bodySmall" color="textSecondary" mode={mode}>
          Provincia
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {provinces?.map((province) => {
            const isSelected = selectedProvince?.id === province.id;
            return (
              <Pressable
                key={province.id}
                onPress={() => handleSelectProvince(province)}
              >
                <Box
                  py="xs"
                  px="sm"
                  borderRadius="md"
                  borderWidth={1}
                  borderColor={
                    isSelected ? colors.primary : colors.border
                  }
                  bg={isSelected ? 'primaryContainer' : 'surface'}
                  mode={mode}
                >
                  <Text
                    variant="bodySmall"
                    color={isSelected ? 'primary' : 'text'}
                    mode={mode}
                  >
                    {province.name}
                  </Text>
                </Box>
              </Pressable>
            );
          })}
        </ScrollView>
      </Box>

      {/* Step 2: Municipality selector (shown when province selected) */}
      {selectedProvince && (
        <Box gap="xs" mode={mode}>
          <Text variant="bodySmall" color="textSecondary" mode={mode}>
            Municipio
          </Text>

          {municipalitiesLoading ? (
            <Box alignItems="center" py="md" mode={mode}>
              <Spinner size="sm" mode={mode} />
            </Box>
          ) : (
            <ScrollView
              style={{ maxHeight: 200 }}
              showsVerticalScrollIndicator={false}
            >
              <Box gap="xs" mode={mode}>
                {municipalities?.map((municipality) => {
                  const isSelected = selectedLocationId === municipality.id;
                  return (
                    <Pressable
                      key={municipality.id}
                      onPress={() => handleSelectMunicipality(municipality)}
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
                          {municipality.name}
                        </Text>
                        {isSelected && (
                          <Text variant="bodySmall" color="primary" mode={mode}>
                            ✓
                          </Text>
                        )}
                      </Box>
                    </Pressable>
                  );
                })}

                {municipalities?.length === 0 && (
                  <Box alignItems="center" py="md" mode={mode}>
                    <Text variant="bodySmall" color="textSecondary" mode={mode}>
                      No hay municipios disponibles
                    </Text>
                  </Box>
                )}
              </Box>
            </ScrollView>
          )}
        </Box>
      )}

      {!selectedProvince && (
        <Box
          alignItems="center"
          py="lg"
          borderWidth={1}
          borderColor={colors.border}
          borderRadius="md"
          style={{ borderStyle: 'dashed' }}
        >
          <Text variant="bodyMedium" color="textSecondary" mode={mode}>
            Selecciona una provincia para ver los municipios
          </Text>
        </Box>
      )}
    </Box>
  );
}
