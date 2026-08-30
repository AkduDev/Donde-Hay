/**
 * Dónde Hay - Forgot Password Screen
 * Pantalla para solicitar recuperación de contraseña
 */

import React, { useState } from 'react';
import { ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useThemeStore } from '@/store/themeStore';
import { useForgotPassword } from '@/hooks/use-auth';
import { validateEmail } from '@/utils/validation';

export default function ForgotPasswordScreen() {
  const { resolvedMode } = useThemeStore();
  const forgotPasswordMutation = useForgotPassword();

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});
  const [sent, setSent] = useState(false);

  const validate = (): boolean => {
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      setErrors({ email: emailResult.error });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSendEmail = async () => {
    if (!validate()) return;

    forgotPasswordMutation.mutate(email.trim(), {
      onSuccess: () => {
        setSent(true);
      },
      onError: (error: { message?: string }) => {
        setErrors({ general: error.message || 'Error al enviar el email' });
      },
    });
  };

  if (sent) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Box flex={1} px="md" py="xl" justifyContent="center" alignItems="center">
          <Box mb="md" alignItems="center">
            <Text variant="displaySmall" mode={resolvedMode}>📬</Text>
          </Box>
          <Box mb="sm" alignItems="center">
            <Text variant="titleLarge" color="text" mode={resolvedMode} textAlign="center">
              Email enviado
            </Text>
          </Box>
          <Box mb="lg" alignItems="center">
            <Text variant="bodyMedium" color="textSecondary" mode={resolvedMode} textAlign="center">
              Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
            </Text>
          </Box>
          <Box mb="md" alignItems="center">
            <Text variant="bodySmall" color="textTertiary" mode={resolvedMode}>
              ¿No lo recibiste? Revisa tu carpeta de spam o intenta de nuevo.
            </Text>
          </Box>
          <Button
            variant="outline"
            size="md"
            onPress={() => {
              setSent(false);
              setEmail('');
            }}
            mode={resolvedMode}
          >
            Enviar de nuevo
          </Button>
          <Box mt="md">
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text variant="bodyMedium" color="primary" mode={resolvedMode}>
                  Volver al inicio de sesión
                </Text>
              </Pressable>
            </Link>
          </Box>
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
                  Recuperar contraseña
                </Text>
              </Box>
              <Text variant="bodyMedium" color="textSecondary" mode={resolvedMode}>
                Ingresa tu email y te enviaremos las instrucciones para restablecer tu contraseña.
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

              <Button
                variant="primary"
                size="lg"
                onPress={handleSendEmail}
                loading={forgotPasswordMutation.isPending}
                disabled={forgotPasswordMutation.isPending}
                mode={resolvedMode}
              >
                Enviar instrucciones
              </Button>
            </Box>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
