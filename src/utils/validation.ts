/**
 * Dónde Hay - Validation Utilities
 * Validación de formularios y datos
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// ============================================
// EMAIL
// ============================================

export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) {
    return { isValid: false, error: 'El email es requerido' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Email no válido' };
  }

  return { isValid: true };
}

// ============================================
// CONTRASEÑA
// ============================================

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'La contraseña es requerida' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Mínimo 8 caracteres' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Debe incluir una mayúscula' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Debe incluir un número' };
  }

  return { isValid: true };
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string
): ValidationResult {
  if (!confirmation) {
    return { isValid: false, error: 'Confirma tu contraseña' };
  }

  if (password !== confirmation) {
    return { isValid: false, error: 'Las contraseñas no coinciden' };
  }

  return { isValid: true };
}

// ============================================
// TELÉFONO
// ============================================

export function validatePhone(phone: string): ValidationResult {
  if (!phone.trim()) {
    return { isValid: true }; // Opcional
  }

  const cleaned = phone.replace(/\D/g, '');
  
  // Cuba: 8 dígitos o +53 + 8 dígitos
  if (cleaned.length !== 8 && !(cleaned.startsWith('53') && cleaned.length === 10)) {
    return { isValid: false, error: 'Teléfono no válido (formato: XXXXXXXX)' };
  }

  return { isValid: true };
}

// ============================================
// NOMBRE
// ============================================

export function validateName(name: string): ValidationResult {
  if (!name.trim()) {
    return { isValid: false, error: 'El nombre es requerido' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Mínimo 2 caracteres' };
  }

  if (name.trim().length > 100) {
    return { isValid: false, error: 'Máximo 100 caracteres' };
  }

  return { isValid: true };
}

// ============================================
// BÚSQUEDA
// ============================================

export function validateSearchQuery(query: string): ValidationResult {
  if (!query.trim()) {
    return { isValid: false, error: 'Ingresa un término de búsqueda' };
  }

  if (query.trim().length < 2) {
    return { isValid: false, error: 'Mínimo 2 caracteres' };
  }

  if (query.trim().length > 200) {
    return { isValid: false, error: 'Máximo 200 caracteres' };
  }

  return { isValid: true };
}

// ============================================
// PRECIO
// ============================================

export function validatePriceRange(
  min?: number,
  max?: number
): ValidationResult {
  if (min !== undefined && max !== undefined && min > max) {
    return { isValid: false, error: 'El precio mínimo no puede ser mayor al máximo' };
  }

  if (min !== undefined && min < 0) {
    return { isValid: false, error: 'El precio no puede ser negativo' };
  }

  return { isValid: true };
}

// ============================================
// FORMULARIO GENÉRICO
// ============================================

export type ValidationRules<T> = {
  [K in keyof T]?: (value: T[K]) => ValidationResult;
};

export function validateForm<T extends Record<string, unknown>>(
  data: T,
  rules: ValidationRules<T>
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(rules)) {
    if (validator) {
      const result = validator(data[field as keyof T]);
      if (!result.isValid) {
        errors[field as keyof T] = result.error;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
}
