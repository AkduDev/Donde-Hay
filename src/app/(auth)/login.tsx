/**
 * Dónde Hay - Login Screen
 * Pantalla de inicio de sesión
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
import { useLogin } from '@/hooks/use-auth';
import { validateEmail, validatePassword } from '@/utils/validation';

export default function LoginScreen() {
  const router = useRouter();
  const { resolvedMode } = useThemeStore();
  const loginMutation = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      newErrors.email = emailResult.error;
    }

    const passwordResult = validatePassword(password);
    if (!passwordResult.isValid) {
      newErrors.password = passwordResult.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setErrors({});
    loginMutation.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => {
          router.replace('/(tabs)' as any);
        },
        onError: (error: { message?: string }) => {
          setErrors({ general: error.message || 'Credenciales incorrectas' });
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
          <Box flex={1} px="md" py="xl" justifyContent="center">
            {/* Header */}
            <Box alignItems="center" mb="xl">
              <Box mb="sm">
                <Text variant="headlineLarge" color="primary" fontWeight="bold" mode={resolvedMode}>
                  Dónde Hay
                </Text>
              </Box>
              <Box mb="xxs">
                <Text variant="titleLarge" color="text" mode={resolvedMode}>
                  Iniciar sesión
                </Text>
              </Box>
              <Text variant="bodyMedium" color="textSecondary" mode={resolvedMode}>
                Encuentra los mejores precios en Cuba
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
                placeholder="Tu contraseña"
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

              {/* Forgot Password */}
              <Box alignItems="flex-end">
                <Link href="/(auth)/forgot-password" asChild>
                  <Pressable>
                    <Text variant="bodySmall" color="primary" mode={resolvedMode}>
                      ¿Olvidaste tu contraseña?
                    </Text>
                  </Pressable>
                </Link>
              </Box>

              {/* Login Button */}
              <Button
                variant="primary"
                size="lg"
                onPress={handleLogin}
                loading={loginMutation.isPending}
                disabled={loginMutation.isPending}
                mode={resolvedMode}
              >
                Iniciar sesión
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

              {/* Register Link */}
              <Box alignItems="center">
                <Text variant="bodyMedium" color="textSecondary" mode={resolvedMode}>
                  ¿No tienes cuenta?{' '}
                </Text>
                <Link href="/(auth)/register" asChild>
                  <Pressable>
                    <Text variant="bodyMedium" color="primary" fontWeight="semiBold" mode={resolvedMode}>
                      Regístrate
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
