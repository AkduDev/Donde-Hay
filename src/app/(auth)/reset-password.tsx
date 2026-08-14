/**
 * Dónde Hay - Reset Password Screen
 * Pantalla para restablecer contraseña con token
 */

import React, { useState } from 'react';
import { ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useThemeStore } from '@/store/themeStore';
import { useResetPassword } from '@/hooks/use-auth';
import { validatePassword, validatePasswordConfirmation } from '@/utils/validation';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { resolvedMode } = useThemeStore();
  const resetPasswordMutation = useResetPassword();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

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

  const handleResetPassword = async () => {
    if (!validate()) return;
    if (!token) {
      setErrors({ general: 'Token no válido' });
      return;
    }

    resetPasswordMutation.mutate(
      { token, password },
      {
        onSuccess: () => {
          setSuccess(true);
        },
        onError: (error: { message?: string }) => {
          setErrors({ general: error.message || 'Error al restablecer la contraseña' });
        },
      }
    );
  };

  if (success) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Box flex={1} px="md" py="xl" justifyContent="center" alignItems="center">
          <Box mb="md" alignItems="center">
            <Text variant="displaySmall" mode={resolvedMode}>✅</Text>
          </Box>
          <Box mb="sm" alignItems="center">
            <Text variant="titleLarge" color="text" mode={resolvedMode} textAlign="center">
              Contraseña actualizada
            </Text>
          </Box>
          <Box mb="lg" alignItems="center">
            <Text variant="bodyMedium" color="textSecondary" mode={resolvedMode} textAlign="center">
              Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </Text>
          </Box>
          <Button
            variant="primary"
            size="lg"
            onPress={() => router.replace('/(auth)/login')}
            mode={resolvedMode}
          >
            Iniciar sesión
          </Button>
        </Box>
      </SafeAreaView>
    );
  }

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
            {/* Back Button */}
            <Box mb="lg">
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Box flexDirection="row" alignItems="center" gap="xxs">
                    <Text variant="bodyMedium" color="primary" mode={resolvedMode}>
                      ← Volver
                    </Text>
                  </Box>
                </Pressable>
              </Link>
            </Box>

            {/* Header */}
            <Box mb="xl">
              <Box mb="sm">
                <Text variant="titleLarge" color="text" mode={resolvedMode}>
                  Nueva contraseña
                </Text>
              </Box>
              <Text variant="bodyMedium" color="textSecondary" mode={resolvedMode}>
                Ingresa tu nueva contraseña. Asegúrate de que sea segura y fácil de recordar.
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
                label="Nueva contraseña"
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

              <Button
                variant="primary"
                size="lg"
                onPress={handleResetPassword}
                loading={resetPasswordMutation.isPending}
                disabled={resetPasswordMutation.isPending}
                mode={resolvedMode}
              >
                Restablecer contraseña
              </Button>
            </Box>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
