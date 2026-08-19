/**
 * Dónde Hay - Register Screen
 * Pantalla de registro de nuevo usuario
 */

import React, { useState } from 'react';
import { ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Divider } from '@/components/ui/Divider';
import { useThemeStore } from '@/store/themeStore';
import { useRegister } from '@/hooks/use-auth';
import {
  validateName,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from '@/utils/validation';

export default function RegisterScreen() {
  const router = useRouter();
  const { resolvedMode } = useThemeStore();
  const registerMutation = useRegister();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    const nameResult = validateName(name);
    if (!nameResult.isValid) {
      newErrors.name = nameResult.error;
    }

    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      newErrors.email = emailResult.error;
    }

    const passwordResult = validatePassword(password);
    if (!passwordResult.isValid) {
      newErrors.password = passwordResult.error;
    }

    const confirmResult = validatePasswordConfirmation(password, confirmPassword);
    if (!confirmResult.isValid) {
      newErrors.confirmPassword = confirmResult.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setErrors({});
    registerMutation.mutate(
      { name: name.trim(), email: email.trim(), password },
      {
        onSuccess: () => {
          router.replace('/(tabs)');
        },
        onError: (error: { message?: string }) => {
          setErrors({ general: error.message || 'Error al crear la cuenta' });
        },
      }
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Box flex={1} px="md" py="xl">
            {/* Header */}
            <Box alignItems="center" mb="xl">
              <Box mb="sm">
                <Text variant="headlineLarge" color="primary" fontWeight="bold" mode={resolvedMode}>
                  Dónde Hay
                </Text>
              </Box>
              <Box mb="xxs">
                <Text variant="titleLarge" color="text" mode={resolvedMode}>
                  Crear cuenta
                </Text>
              </Box>
              <Text variant="bodyMedium" color="textSecondary" mode={resolvedMode}>
                Únete a la comunidad de compraventa
              </Text>
            </Box>

            {/* Error Message */}
            {errors.general && (
              <Box mb="md" p="sm" borderRadius="md" bg="errorContainer">
                <Text variant="bodySmall" color="onErrorContainer" mode={resolvedMode}>
                  {errors.general}
                </Text>
              </Box>
            )}

            {/* Form */}
            <Box gap="md">
              <Input
                label="Nombre completo"
                placeholder="Tu nombre"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                errorText={errors.name}
                mode={resolvedMode}
              />

              <Input
                label="Email"
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                errorText={errors.email}
                mode={resolvedMode}
              />

              <Input
                label="Contraseña"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                errorText={errors.password}
                rightIcon={
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Text variant="bodySmall" color="textSecondary" mode={resolvedMode}>
                      {showPassword ? '🙈' : '👁️'}
                    </Text>
                  </Pressable>
                }
                mode={resolvedMode}
              />

              <Input
                label="Confirmar contraseña"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                errorText={errors.confirmPassword}
                mode={resolvedMode}
              />

              {/* Terms */}
              <Box>
                <Text variant="bodySmall" color="textSecondary" mode={resolvedMode}>
                  Al registrarte, aceptas nuestros{' '}
                  <Text variant="bodySmall" color="primary" mode={resolvedMode}>
                    Términos de uso
                  </Text>{' '}
                  y{' '}
                  <Text variant="bodySmall" color="primary" mode={resolvedMode}>
                    Política de privacidad
                  </Text>
                </Text>
              </Box>

              {/* Register Button */}
              <Button
                variant="primary"
                size="lg"
                onPress={handleRegister}
                loading={registerMutation.isPending}
                disabled={registerMutation.isPending}
                mode={resolvedMode}
              >
                Crear cuenta
              </Button>

              {/* Divider */}
              <Box flexDirection="row" alignItems="center" gap="sm" my="md">
                <Box flex={1}>
                  <Divider mode={resolvedMode} />
                </Box>
                <Text variant="bodySmall" color="textTertiary" mode={resolvedMode}>
                  o
                </Text>
                <Box flex={1}>
                  <Divider mode={resolvedMode} />
                </Box>
              </Box>

              {/* Login Link */}
              <Box alignItems="center">
                <Text variant="bodyMedium" color="textSecondary" mode={resolvedMode}>
                  ¿Ya tienes cuenta?{' '}
                </Text>
                <Link href="/(auth)/login" asChild>
                  <Pressable>
                    <Text variant="bodyMedium" color="primary" fontWeight="600" mode={resolvedMode}>
                      Inicia sesión
                    </Text>
                  </Pressable>
                </Link>
              </Box>
            </Box>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
