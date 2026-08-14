/**
 * Dónde Hay - Input Component
 * Input con label, error, helper text, icon leading/trailing
 */

import React, { forwardRef, useId, useState } from 'react';
import {
  TextInput,
  TextInputProps,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Box } from './Box';
import { Text as TextComponent } from './Text';
import { BorderRadius } from '@/theme/radius';
import { Spacing } from '@/theme/spacing';
import { ColorPalette, getColors } from '@/theme/colors';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<TextInputProps, 'style' | 'onChangeText' | 'value' | 'defaultValue'> {
  // Label & Helper
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;

  // Value control
  value?: string;
  defaultValue?: string;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;

  // State
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;

  // Size
  size?: InputSize;

  // Icons
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightIconOnPress?: () => void;

  // Visual
  mode?: 'light' | 'dark';
  testID?: string;

  // Style overrides
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  helperStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;

  // Input specific
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  autoCompleteType?: TextInputProps['autoCompleteType'];
  keyboardType?: TextInputProps['keyboardType'];
  textContentType?: TextInputProps['textContentType'];
  secureTextEntry?: boolean;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
}

const sizeConfig: Record<InputSize, {
  height: number;
  paddingX: keyof typeof Spacing;
  paddingY: keyof typeof Spacing;
  fontSize: number;
  borderRadius: keyof typeof BorderRadius;
  iconSize: number;
}> = {
  sm: {
    height: 40,
    paddingX: '3',
    paddingY: '1',
    fontSize: 13,
    borderRadius: 'sm',
    iconSize: 18,
  },
  md: {
    height: 48,
    paddingX: '4',
    paddingY: '1',
    fontSize: 14,
    borderRadius: 'md',
    iconSize: 20,
  },
  lg: {
    height: 56,
    paddingX: '5',
    paddingY: '2',
    fontSize: 16,
    borderRadius: 'lg',
    iconSize: 22,
  },
};

const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      placeholder,
      helperText,
      errorText,
      value,
      defaultValue,
      onChangeText,
      onBlur,
      onFocus,
      disabled = false,
      required = false,
      readOnly = false,
      size = 'md',
      leftIcon,
      rightIcon,
      rightIconOnPress,
      mode = 'light',
      testID,
      style,
      inputStyle,
      labelStyle,
      helperStyle,
      errorStyle,
      containerStyle,
      autoCapitalize = 'sentences',
      autoCorrect = false,
      autoCompleteType,
      keyboardType,
      textContentType,
      secureTextEntry = false,
      maxLength,
      multiline = false,
      numberOfLines,
      ...rest
    }: InputProps,
    ref
  ) => {
    const colors = getColors(mode);
    const sConfig = sizeConfig[size];
    const inputId = useId();
    const [focused, setFocused] = useState(false);
    const [localValue, setLocalValue] = useState(defaultValue ?? '');
    const [showPassword, setShowPassword] = useState(false);

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : localValue;
    const hasError = !!errorText;
    const hasHelper = !!helperText && !hasError;

    const handleChangeText = (text: string) => {
      if (!isControlled) setLocalValue(text);
      onChangeText?.(text);
    };

    const handleBlur = () => {
      setFocused(false);
      onBlur?.();
    };

    const handleFocus = () => {
      setFocused(true);
      onFocus?.();
    };

    const handleRightIconPress = () => {
      if (secureTextEntry) {
        setShowPassword(!showPassword);
      } else if (rightIconOnPress) {
        rightIconOnPress();
      }
    };

    const getBorderColor = () => {
      if (hasError) return colors.error;
      if (focused) return colors.primary;
      if (disabled) return colors.disabled;
      return colors.inputBorder;
    };

    const getBackgroundColor = () => {
      if (disabled) return colors.disabledBackground;
      return colors.inputBackground;
    };

    const inputContainerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      height: multiline ? undefined : sConfig.height,
      minHeight: sConfig.height,
      paddingHorizontal: Spacing[sConfig.paddingX],
      paddingVertical: Spacing[sConfig.paddingY],
      borderRadius: BorderRadius[sConfig.borderRadius],
      backgroundColor: getBackgroundColor(),
      borderWidth: 1.5,
      borderColor: getBorderColor(),
      gap: Spacing[2],
      flex: 1,
    };

    const inputStyleComputed: TextStyle = {
      flex: 1,
      fontSize: sConfig.fontSize,
      color: disabled ? colors.textSecondary : colors.text,
      placeholderTextColor: colors.inputPlaceholder,
      paddingVertical: 0,
      paddingHorizontal: 0,
      minHeight: multiline ? sConfig.height * (numberOfLines || 3) : undefined,
    };

    return (
      <Box
        testID={testID ? `${testID}-container` : undefined}
        style={containerStyle}
        gap={Spacing[2]}
        mode={mode}
      >
        {label && (
          <TextComponent
            variant="labelSmall"
            color={hasError ? 'error' : focused ? 'primary' : 'textSecondary'}
            style={labelStyle}
            testID={testID ? `${testID}-label` : undefined}
            mode={mode}
          >
            {label} {required && <TextComponent color="error" mode={mode}>*</TextComponent>}
          </TextComponent>
        )}

        <Box
          style={inputContainerStyle}
          testID={testID ? `${testID}-input-wrapper` : undefined}
          mode={mode}
        >
          {leftIcon && (
            <Box
              testID={testID ? `${testID}-left-icon` : undefined}
              mode={mode}
            >
              {React.isValidElement(leftIcon)
                ? React.cloneElement(leftIcon as React.ReactElement, {
                    color: focused ? colors.primary : colors.textSecondary,
                    size: sConfig.iconSize,
                  })
                : leftIcon}
            </Box>
          )}

          <TextInput
            ref={ref}
            id={inputId}
            value={currentValue}
            onChangeText={handleChangeText}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            placeholderTextColor={colors.inputPlaceholder}
            disabled={disabled}
            readOnly={readOnly}
            secureTextEntry={secureTextEntry && !showPassword}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            autoCompleteType={autoCompleteType}
            keyboardType={keyboardType}
            textContentType={textContentType}
            maxLength={maxLength}
            multiline={multiline}
            numberOfLines={numberOfLines}
            style={[
              inputStyleComputed,
              inputStyle,
            ]}
            testID={testID ? `${testID}-input` : undefined}
            accessibilityLabel={label}
            accessibilityHint={helperText}
            accessibilityInvalid={hasError}
            accessibilityRequired={required}
            {...rest}
          />

          {rightIcon && (
            <Pressable
              onPress={handleRightIconPress}
              testID={testID ? `${testID}-right-icon` : undefined}
              accessibilityLabel={secureTextEntry ? (showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña') : undefined}
            >
              <Box mode={mode}>
                {React.isValidElement(rightIcon)
                  ? React.cloneElement(rightIcon as React.ReactElement, {
                      color: focused ? colors.primary : colors.textSecondary,
                      size: sConfig.iconSize,
                    })
                  : rightIcon}
              </Box>
            </Pressable>
          )}
        </Box>

        {(hasError || hasHelper) && (
          <TextComponent
            variant="bodySmall"
            color={hasError ? 'error' : 'textSecondary'}
            style={hasError ? errorStyle : helperStyle}
            testID={testID ? `${testID}-${hasError ? 'error' : 'helper'}` : undefined}
            mode={mode}
          >
            {hasError ? errorText : helperText}
          </TextComponent>
        )}
      </Box>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps, InputSize };

// Import Pressable
import { Pressable } from 'react-native';