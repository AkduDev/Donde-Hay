/**
 * Dónde Hay - Validation Utilities Tests
 */

import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validatePhone,
  validateName,
  validateSearchQuery,
  validatePriceRange,
  validateForm,
  type ValidationRules,
} from '../validation';

describe('validateEmail', () => {
  it('accepts a valid email', () => {
    expect(validateEmail('usuario@correo.cu').isValid).toBe(true);
  });

  it('rejects empty email', () => {
    const result = validateEmail('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('El email es requerido');
  });

  it('rejects malformed email', () => {
    expect(validateEmail('no-es-un-email').isValid).toBe(false);
  });
});

describe('validatePassword', () => {
  it('accepts a strong password', () => {
    expect(validatePassword('Contrasena1').isValid).toBe(true);
  });

  it('rejects short password', () => {
    const result = validatePassword('Ab1');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Mínimo 8 caracteres');
  });

  it('requires uppercase', () => {
    expect(validatePassword('contrasena1').isValid).toBe(false);
  });

  it('requires a number', () => {
    expect(validatePassword('Contrasena').isValid).toBe(false);
  });

  it('rejects empty password', () => {
    expect(validatePassword('').isValid).toBe(false);
  });
});

describe('validatePasswordConfirmation', () => {
  it('accepts matching passwords', () => {
    expect(validatePasswordConfirmation('Contrasena1', 'Contrasena1').isValid).toBe(true);
  });

  it('rejects empty confirmation', () => {
    const result = validatePasswordConfirmation('Contrasena1', '');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Confirma tu contraseña');
  });

  it('rejects mismatch', () => {
    const result = validatePasswordConfirmation('Contrasena1', 'Otra123');
    expect(result.isValid).toBe(false);
  });
});

describe('validatePhone', () => {
  it('accepts empty phone (optional)', () => {
    expect(validatePhone('').isValid).toBe(true);
  });

  it('accepts 8-digit phone', () => {
    expect(validatePhone('51234567').isValid).toBe(true);
  });

  it('accepts +53 8-digit phone', () => {
    expect(validatePhone('+53 51234567').isValid).toBe(true);
  });

  it('rejects invalid phone', () => {
    expect(validatePhone('123').isValid).toBe(false);
  });
});

describe('validateName', () => {
  it('accepts a valid name', () => {
    expect(validateName('Ana María').isValid).toBe(true);
  });

  it('rejects short name', () => {
    const result = validateName('A');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Mínimo 2 caracteres');
  });

  it('rejects empty name', () => {
    expect(validateName('').isValid).toBe(false);
  });
});

describe('validateSearchQuery', () => {
  it('accepts a query', () => {
    expect(validateSearchQuery('iPhone').isValid).toBe(true);
  });

  it('rejects empty query', () => {
    expect(validateSearchQuery('').isValid).toBe(false);
  });

  it('rejects too-short query', () => {
    expect(validateSearchQuery('a').isValid).toBe(false);
  });
});

describe('validatePriceRange', () => {
  it('accepts valid range', () => {
    expect(validatePriceRange(100, 500).isValid).toBe(true);
  });

  it('rejects min > max', () => {
    const result = validatePriceRange(600, 100);
    expect(result.isValid).toBe(false);
  });

  it('rejects negative price', () => {
    expect(validatePriceRange(-5).isValid).toBe(false);
  });
});

describe('validateForm', () => {
  const rules: ValidationRules<{ email: string; password: string }> = {
    email: validateEmail,
    password: validatePassword,
  };

  it('returns valid with no errors', () => {
    const result = validateForm({ email: 'u@c.cu', password: 'Contrasena1' }, rules);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('collects field errors', () => {
    const result = validateForm({ email: 'malo', password: 'short' }, rules);
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBe('Email no válido');
    expect(result.errors.password).toBe('Mínimo 8 caracteres');
  });
});