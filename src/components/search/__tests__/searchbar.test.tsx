/**
 * Dónde Hay - SearchBar Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, userEvent } from '@testing-library/react-native';
import { SearchBar, SearchSuggestion } from '@/components/search/SearchBar';
import { useThemeStore } from '@/store/themeStore';

jest.setTimeout(30000);

beforeEach(() => {
  useThemeStore.setState({ resolvedMode: 'light', isLoading: false });
});

const suggestions: SearchSuggestion[] = [
  { id: '1', type: 'trending', text: 'iPhone 13' },
  { id: '2', type: 'trending', text: 'PS5' },
];

const PLACEHOLDER = '¿Qué quieres encontrar?';

describe('SearchBar', () => {
  it('renders placeholder', async () => {
    await render(
      <SearchBar value="" onChangeText={() => {}} placeholder={PLACEHOLDER} />
    );
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toBeTruthy();
  });

  it('propagates text changes', async () => {
    const onChangeText = jest.fn();
    await render(
      <SearchBar value="" onChangeText={onChangeText} placeholder={PLACEHOLDER} />
    );
    fireEvent.changeText(screen.getByPlaceholderText(PLACEHOLDER), 'iphone');
    expect(onChangeText).toHaveBeenCalledWith('iphone');
  });

  it('submits the trimmed query', async () => {
    const onSubmit = jest.fn();
    await render(
      <SearchBar
        value="  iphone  "
        onChangeText={() => {}}
        onSubmit={onSubmit}
        placeholder={PLACEHOLDER}
      />
    );
    fireEvent(screen.getByPlaceholderText(PLACEHOLDER), 'submitEditing');
    expect(onSubmit).toHaveBeenCalledWith('iphone');
  });

  it('does not submit an empty query', async () => {
    const onSubmit = jest.fn();
    await render(
      <SearchBar
        value=""
        onChangeText={() => {}}
        onSubmit={onSubmit}
        placeholder={PLACEHOLDER}
      />
    );
    fireEvent(screen.getByPlaceholderText(PLACEHOLDER), 'submitEditing');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows filtered suggestions on focus and submits on press', async () => {
    const onSubmit = jest.fn();
    const onChangeText = jest.fn();
    await render(
      <SearchBar
        value="iphon"
        onChangeText={onChangeText}
        onSubmit={onSubmit}
        suggestions={suggestions}
        placeholder={PLACEHOLDER}
        testID="sb"
      />
    );
    const input = screen.getByPlaceholderText(PLACEHOLDER);
    const user = userEvent.setup();
    await user.type(input, 'i');
    fireEvent.press(screen.getByTestId('sb-suggestion-1'));
    expect(onChangeText).toHaveBeenCalledWith('iPhone 13');
    expect(onSubmit).toHaveBeenCalledWith('iPhone 13');
  });
});