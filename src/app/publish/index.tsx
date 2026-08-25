/**
 * Dónde Hay - Publish Product Screen
 * Flujo multi-paso para publicar un producto
 */

import React, { useState, useCallback } from 'react';
import { ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ImagePicker } from '@/components/publish/ImagePicker';
import { CategoryPicker } from '@/components/publish/CategoryPicker';
import { LocationPicker } from '@/components/publish/LocationPicker';
import { usePublish } from '@/hooks/use-publish';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/theme/colors';

// ============================================
// TYPES
// ============================================

interface PublishFormState {
  // Step 1: Photos
  images: string[];
  // Step 2: Details
  name: string;
  brand: string;
  model: string;
  categoryId: string | null;
  description: string;
  // Step 3: Price
  price: string;
  currency: 'USD' | 'CUP' | 'MLC';
  // Step 4: Location
  locationId: string | null;
}

const INITIAL_STATE: PublishFormState = {
  images: [],
  name: '',
  brand: '',
  model: '',
  categoryId: null,
  description: '',
  price: '',
  currency: 'USD',
  locationId: null,
};

const STEPS = [
  { id: 1, label: 'Fotos' },
  { id: 2, label: 'Detalles' },
  { id: 3, label: 'Precio' },
  { id: 4, label: 'Ubicación' },
  { id: 5, label: 'Revisar' },
];

// ============================================
// COMPONENT
// ============================================

export default function PublishScreen() {
  const { resolvedMode } = useThemeStore();
  const colors = getColors(resolvedMode);
  const router = useRouter();
  const publishMutation = usePublish();

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<PublishFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof PublishFormState, string>>>({});

  const updateField = <K extends keyof PublishFormState>(
    field: K,
    value: PublishFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // ============================================
  // VALIDATION
  // ============================================

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Partial<Record<keyof PublishFormState, string>> = {};

    switch (step) {
      case 2:
        if (!form.name.trim()) newErrors.name = 'El nombre es obligatorio';
        if (!form.categoryId) newErrors.categoryId = 'Selecciona una categoría';
        break;
      case 3:
        const price = parseFloat(form.price);
        if (isNaN(price) || price <= 0) newErrors.price = 'Ingresa un precio válido';
        break;
      case 4:
        if (!form.locationId) newErrors.locationId = 'Selecciona una ubicación';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const canGoNext = () => {
    return validateStep(currentStep);
  };

  const handleNext = () => {
    if (currentStep < 5 && canGoNext()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handlePublish = () => {
    if (!form.categoryId || !form.locationId) {
      Alert.alert('Error', 'Faltan datos obligatorios');
      return;
    }

    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Precio inválido');
      return;
    }

    publishMutation.mutate(
      {
        canonicalName: form.name.trim(),
        brand: form.brand.trim() || undefined,
        model: form.model.trim() || undefined,
        categoryId: form.categoryId,
        description: form.description.trim() || undefined,
        price,
        currency: form.currency,
        locationId: form.locationId,
        imageUris: form.images,
      },
      {
        onSuccess: (result) => {
          Alert.alert(
            '¡Publicado!',
            'Tu producto ha sido publicado correctamente',
            [
              {
                text: 'Ver producto',
                onPress: () => router.replace(`/product/${result.productId}`),
              },
            ]
          );
        },
        onError: (error) => {
          Alert.alert('Error', 'No se pudo publicar el producto. Intenta de nuevo.');
        },
      }
    );
  };

  // ============================================
  // STEP INDICATOR
  // ============================================

  const renderStepIndicator = () => (
    <Box flexDirection="row" justifyContent="center" gap="xs" py="md" px="md" mode={resolvedMode}>
      {STEPS.map((step) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        return (
          <Box key={step.id} alignItems="center" gap="xxs" mode={resolvedMode}>
            <Box
              w={32}
              h={32}
              borderRadius="full"
              bg={isActive ? 'primary' : isCompleted ? 'primary' : 'surfaceVariant'}
              alignItems="center"
              justifyContent="center"
              borderWidth={isActive ? 0 : 1}
              borderColor={colors.border}
              mode={resolvedMode}
            >
              <Text
                variant="labelSmall"
                color={isActive || isCompleted ? 'onPrimary' : 'textSecondary'}
                mode={resolvedMode}
              >
                {isCompleted ? '✓' : step.id}
              </Text>
            </Box>
            <Text
              variant="labelSmall"
              color={isActive ? 'primary' : 'textSecondary'}
              mode={resolvedMode}
            >
              {step.label}
            </Text>
          </Box>
        );
      })}
    </Box>
  );

  // ============================================
  // STEP CONTENT
  // ============================================

  const renderStep1 = () => (
    <ImagePicker
      images={form.images}
      onImagesChange={(images) => updateField('images', images)}
      mode={resolvedMode}
    />
  );

  const renderStep2 = () => (
    <Box gap="md" mode={resolvedMode}>
      <CategoryPicker
        selectedCategoryId={form.categoryId}
        onSelect={(categoryId) => updateField('categoryId', categoryId)}
        mode={resolvedMode}
      />

      <Box gap="xs" mode={resolvedMode}>
        <Text variant="titleSmall" color="text" mode={resolvedMode}>
          Nombre del producto *
        </Text>
        <Input
          placeholder="Ej: iPhone 15 Pro Max 256GB"
          value={form.name}
          onChangeText={(text) => updateField('name', text)}
          errorText={errors.name}
          mode={resolvedMode}
        />
      </Box>

      <Box gap="xs" mode={resolvedMode}>
        <Text variant="titleSmall" color="text" mode={resolvedMode}>
          Marca
        </Text>
        <Input
          placeholder="Ej: Apple, Samsung, Sony..."
          value={form.brand}
          onChangeText={(text) => updateField('brand', text)}
          mode={resolvedMode}
        />
      </Box>

      <Box gap="xs" mode={resolvedMode}>
        <Text variant="titleSmall" color="text" mode={resolvedMode}>
          Modelo
        </Text>
        <Input
          placeholder="Ej: 15 Pro Max, Galaxy S24..."
          value={form.model}
          onChangeText={(text) => updateField('model', text)}
          mode={resolvedMode}
        />
      </Box>

      <Box gap="xs" mode={resolvedMode}>
        <Text variant="titleSmall" color="text" mode={resolvedMode}>
          Descripción
        </Text>
        <Input
          placeholder="Describe el estado, características, etc."
          value={form.description}
          onChangeText={(text) => updateField('description', text)}
          multiline
          numberOfLines={4}
          mode={resolvedMode}
        />
      </Box>
    </Box>
  );

  const renderStep3 = () => (
    <Box gap="md" mode={resolvedMode}>
      <Box gap="xs" mode={resolvedMode}>
        <Text variant="titleSmall" color="text" mode={resolvedMode}>
          Moneda
        </Text>
        <Box flexDirection="row" gap="sm" mode={resolvedMode}>
          {(['USD', 'CUP', 'MLC'] as const).map((c) => (
            <Pressable key={c} onPress={() => updateField('currency', c)}>
              <Box
                py="sm"
                px="md"
                borderRadius="md"
                borderWidth={2}
                borderColor={
                  form.currency === c ? colors.primary : colors.border
                }
                bg={form.currency === c ? 'primaryContainer' : 'surface'}
                alignItems="center"
                mode={resolvedMode}
              >
                <Text
                  variant="labelMedium"
                  color={form.currency === c ? 'primary' : 'text'}
                  mode={resolvedMode}
                >
                  {c}
                </Text>
              </Box>
            </Pressable>
          ))}
        </Box>
      </Box>

      <Box gap="xs" mode={resolvedMode}>
        <Text variant="titleSmall" color="text" mode={resolvedMode}>
          Precio *
        </Text>
        <Box
          flexDirection="row"
          alignItems="center"
          borderWidth={1.5}
          borderColor={errors.price ? colors.error : colors.inputBorder}
          borderRadius="md"
          px="md"
          py="sm"
          mode={resolvedMode}
        >
          <Text variant="bodyLarge" color="textSecondary" mode={resolvedMode}>
            {form.currency === 'USD' ? '$' : form.currency === 'CUP' ? '₱' : '₮'}
          </Text>
          <Box flex={1} ml="xs" mode={resolvedMode}>
            <Input
              placeholder="0.00"
              value={form.price}
              onChangeText={(text) => updateField('price', text)}
              keyboardType="decimal-pad"
              errorText={errors.price}
              mode={resolvedMode}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const renderStep4 = () => (
    <LocationPicker
      selectedLocationId={form.locationId}
      onSelect={(locationId) => updateField('locationId', locationId)}
      mode={resolvedMode}
    />
  );

  const renderStep5 = () => (
    <Box gap="md" mode={resolvedMode}>
      <Text variant="titleMedium" color="text" mode={resolvedMode}>
        Revisa tu publicación
      </Text>

      {/* Images preview */}
      {form.images.length > 0 && (
        <Card variant="outlined" padding="md" mode={resolvedMode}>
          <Text variant="labelSmall" color="textSecondary" mode={resolvedMode}>
            {form.images.length} imagen{form.images.length !== 1 ? 'es' : ''}
          </Text>
        </Card>
      )}

      {/* Product details */}
      <Card variant="outlined" padding="md" mode={resolvedMode}>
        <Box gap="xs" mode={resolvedMode}>
          <Text variant="titleMedium" color="text" mode={resolvedMode}>
            {form.name || 'Sin nombre'}
          </Text>
          {form.brand && (
            <Text variant="bodySmall" color="textSecondary" mode={resolvedMode}>
              Marca: {form.brand}
            </Text>
          )}
          {form.model && (
            <Text variant="bodySmall" color="textSecondary" mode={resolvedMode}>
              Modelo: {form.model}
            </Text>
          )}
          {form.description && (
            <Text variant="bodySmall" color="textSecondary" mode={resolvedMode}>
              {form.description}
            </Text>
          )}
        </Box>
      </Card>

      {/* Price */}
      <Card variant="outlined" padding="md" mode={resolvedMode}>
        <Text variant="titleSmall" color="text" mode={resolvedMode}>
          Precio
        </Text>
        <Text variant="headlineSmall" color="primary" mode={resolvedMode}>
          {form.currency === 'USD' ? '$' : form.currency === 'CUP' ? '₱' : '₮'}
          {form.price || '0'} {form.currency}
        </Text>
      </Card>

      {/* Location */}
      {form.locationId && (
        <Card variant="outlined" padding="md" mode={resolvedMode}>
          <Text variant="labelSmall" color="textSecondary" mode={resolvedMode}>
            Ubicación seleccionada
          </Text>
        </Card>
      )}
    </Box>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  // ============================================
  // NAVIGATION BUTTONS
  // ============================================

  const renderNavigation = () => (
    <Box
      flexDirection="row"
      gap="sm"
      px="md"
      py="md"
      style={{ borderTopWidth: 1, borderTopColor: colors.divider }}
      mode={resolvedMode}
    >
      {currentStep > 1 && (
        <Box flex={1} mode={resolvedMode}>
          <Button
            variant="outline"
            onPress={handleBack}
            fullWidth
            mode={resolvedMode}
          >
            Atrás
          </Button>
        </Box>
      )}

      <Box flex={currentStep > 1 ? 1 : 2} mode={resolvedMode}>
        {currentStep === 5 ? (
          <Button
            variant="primary"
            onPress={handlePublish}
            loading={publishMutation.isPending}
            fullWidth
            mode={resolvedMode}
          >
            Publicar producto
          </Button>
        ) : (
          <Button
            variant="primary"
            onPress={handleNext}
            fullWidth
            mode={resolvedMode}
          >
            Siguiente
          </Button>
        )}
      </Box>
    </Box>
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Box flex={1} bg="background" mode={resolvedMode}>
        {/* Header */}
        <Box
          px="md"
          py="sm"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}
        >
          <Pressable onPress={() => router.back()}>
            <Text variant="titleLarge" color="text">
              ← Publicar
            </Text>
          </Pressable>
          <Text variant="bodySmall" color="textSecondary" mode={resolvedMode}>
            Paso {currentStep} de {STEPS.length}
          </Text>
        </Box>

        {/* Step indicator */}
        {renderStepIndicator()}

        {/* Content */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            <Box gap="md" mt="md">
              {renderCurrentStep()}
            </Box>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Navigation */}
        {renderNavigation()}
      </Box>
    </SafeAreaView>
  );
}
