/**
 * Dónde Hay - UI Primitives Smoke Tests
 * Verifica que los primitivos del design system renderizan en el entorno de test.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Box, Text, Badge } from '@/components/ui';
import { useThemeStore } from '@/store/themeStore';

beforeEach(() => {
  useThemeStore.setState({ resolvedMode: 'light', isLoading: false });
});

describe('UI primitives smoke', () => {
  it('renders Text with children', async () => {
    await render(<Text variant="bodyMedium">Hola mundo</Text>);
    expect(screen.getByText('Hola mundo')).toBeTruthy();
  });

  it('renders Badge with label and variant accent', async () => {
    await render(
      <Badge variant="accent" size="sm" testID="badge-smoke">
        Reciente
      </Badge>
    );
    expect(screen.getByText('Reciente')).toBeTruthy();
  });

  it('renders Box with testID', async () => {
    await render(
      <Box testID="box-smoke" p="sm">
        <Text variant="bodySmall">contenido</Text>
      </Box>
    );
    expect(screen.getByTestId('box-smoke')).toBeTruthy();
  });
});