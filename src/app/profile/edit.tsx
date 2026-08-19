/**
 * Dónde Hay - Profile Edit Screen
 * Editar información del perfil
 */

import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { resolvedMode } = useThemeStore();
  const { user, updateUser } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const validate = () => {
    const newErrors: { name?: string; phone?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (phone && !/^\+?[\d\s-]{8,}$/.test(phone)) {
      newErrors.phone = 'Número de teléfono inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: name.trim(),
          phone: phone.trim() || undefined,
        },
      });

      if (error) throw error;

      updateUser({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });

      Alert.alert('Éxito', 'Perfil actualizado correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Box flex={1} bg="background" mode={resolvedMode}>
        {/* Header */}
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          px="md"
          py="sm"
          mode={resolvedMode}
          style={{ borderBottomWidth: 1, borderBottomColor: resolvedMode === 'dark' ? '#333' : '#e5e7eb' }}
        >
          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
          >
            ← Volver
          </Button>
          <Text variant="titleMedium" color="text">
            Editar perfil
          </Text>
          <Box width={60} />
        </Box>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <Box alignItems="center" py="xl" mode={resolvedMode}>
            <Box position="relative" mode={resolvedMode}>
              <Avatar
                size="xl"
                name={user?.name || 'Usuario'}
                source={user?.avatarUrl ? { uri: user.avatarUrl } : undefined}
                mode={resolvedMode}
              />
              <Box
                position="absolute"
                bottom={0}
                right={0}
                width={32}
                height={32}
                borderRadius="full"
                bg="primary"
                alignItems="center"
                justifyContent="center"
                borderWidth={2}
                borderColor="surface"
                mode={resolvedMode}
              >
                <Text variant="bodySmall" color="onPrimary">
                  📷
                </Text>
              </Box>
            </Box>
            <Box mt="md">
              <Text variant="bodyMedium" color="textSecondary">
                Toca para cambiar foto
              </Text>
            </Box>
          </Box>

          {/* Form */}
          <Box px="md" mode={resolvedMode}>
            <Box mb="md" mode={resolvedMode}>
              <Box mb="xs">
                <Text variant="labelMedium" color="textSecondary">
                  Nombre completo
                </Text>
              </Box>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre"
                errorText={errors.name}
                mode={resolvedMode}
              />
            </Box>

            <Box mb="md" mode={resolvedMode}>
              <Box mb="xs">
                <Text variant="labelMedium" color="textSecondary">
                  Email
                </Text>
              </Box>
              <Input
                value={user?.email || ''}
                placeholder="Email"
                editable={false}
                mode={resolvedMode}
              />
              <Box mt="xs">
                <Text variant="bodySmall" color="textTertiary">
                  El email no se puede cambiar
                </Text>
              </Box>
            </Box>

            <Box mb="md" mode={resolvedMode}>
              <Box mb="xs">
                <Text variant="labelMedium" color="textSecondary">
                  Teléfono (opcional)
                </Text>
              </Box>
              <Input
                value={phone}
                onChangeText={setPhone}
                placeholder="+53 5555 5555"
                keyboardType="phone-pad"
                errorText={errors.phone}
                mode={resolvedMode}
              />
            </Box>

            <Box mt="lg" mode={resolvedMode}>
              <Button
                variant="primary"
                size="lg"
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </Box>
          </Box>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
