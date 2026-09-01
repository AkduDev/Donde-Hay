/**
 * Dónde Hay - Controls Component Tests
 * Button + Input (design system)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useThemeStore } from '@/store/themeStore';

jest.setTimeout(20000);

beforeEach(() => {
  useThemeStore.setState({ resolvedMode: 'light', isLoading: false });
});

describe('Button', () => {
  it('renders children and fires onPress', async () => {
    const onPress = jest.fn();
    await render(
      <Button testID="btn" onPress={onPress}>
        Buscar
      </Button>
    );
    expect(screen.getByText('Buscar')).toBeTruthy();
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(
      <Button testID="btn" disabled onPress={onPress}>
        Enviar
      </Button>
    );
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading text and does not fire onPress while loading', async () => {
    const onPress = jest.fn();
    await render(
      <Button testID="btn" loading loadingText="Cargando..." onPress={onPress}>
        Guardar
      </Button>
    );
    expect(screen.getByText('Cargando...')).toBeTruthy();
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('exposes an accessible label', async () => {
    await render(
      <Button accessibilityLabel="Buscar productos" onPress={() => {}}>
        🔍
      </Button>
    );
    expect(screen.getByLabelText('Buscar productos')).toBeTruthy();
  });
});

describe('Input', () => {
  it('renders label and placeholder', async () => {
    await render(<Input label="Nombre" placeholder="Escribe tu nombre" />);
    expect(screen.getByText('Nombre')).toBeTruthy();
    expect(screen.getByPlaceholderText('Escribe tu nombre')).toBeTruthy();
  });

  it('propagates text changes', async () => {
    const onChangeText = jest.fn();
    await render(
      <Input label="Nombre" placeholder="Nombre" onChangeText={onChangeText} />
    );
    fireEvent.changeText(screen.getByPlaceholderText('Nombre'), 'John');
    expect(onChangeText).toHaveBeenCalledWith('John');
  });

  it('marks secure inputs as password by default', async () => {
    await render(
      <Input label="Contraseña" placeholder="••••" secureTextEntry />
    );
    expect(screen.getByPlaceholderText('••••').props.secureTextEntry).toBe(true);
  });
});