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
} from '../validation';

describe('validateEmail', () => {
  it('accepts valid email', () => {
    expect(validateEmail('test@example.com').isValid).toBe(true);
  });

  it('rejects empty email', () => {
    expect(validateEmail('').isValid).toBe(false);
  });

  it('rejects invalid email format', () => {
    expect(validateEmail('notanemail').isValid).toBe(false);
  });
});

describe('validatePassword', () => {
  it('accepts valid password', () => {
    expect(validatePassword('Password1').isValid).toBe(true);
  });

  it('rejects empty password', () => {
    expect(validatePassword('').isValid).toBe(false);
  });

  it('rejects short password', () => {
    expect(validatePassword('Pass1').isValid).toBe(false);
  });

  it('rejects password without uppercase', () => {
    expect(validatePassword('password1').isValid).toBe(false);
  });

  it('rejects password without number', () => {
    expect(validatePassword('Password').isValid).toBe(false);
  });
});

describe('validatePasswordConfirmation', () => {
  it('accepts matching passwords', () => {
    expect(validatePasswordConfirmation('Password1', 'Password1').isValid).toBe(true);
  });

  it('rejects empty confirmation', () => {
    expect(validatePasswordConfirmation('Password1', '').isValid).toBe(false);
  });

  it('rejects non-matching passwords', () => {
    expect(validatePasswordConfirmation('Password1', 'Password2').isValid).toBe(false);
  });
});

describe('validatePhone', () => {
  it('accepts valid 8-digit phone', () => {
    expect(validatePhone('12345678').isValid).toBe(true);
  });

  it('accepts valid +53 phone', () => {
    expect(validatePhone('5312345678').isValid).toBe(true);
  });

  it('accepts empty phone (optional)', () => {
    expect(validatePhone('').isValid).toBe(true);
  });

  it('rejects invalid phone', () => {
    expect(validatePhone('123').isValid).toBe(false);
  });
});

describe('validateName', () => {
  it('accepts valid name', () => {
    expect(validateName('John').isValid).toBe(true);
  });

  it('rejects empty name', () => {
    expect(validateName('').isValid).toBe(false);
  });

  it('rejects short name', () => {
    expect(validateName('A').isValid).toBe(false);
  });

  it('rejects long name', () => {
    expect(validateName('A'.repeat(101)).isValid).toBe(false);
  });
});

describe('validateSearchQuery', () => {
  it('accepts valid query', () => {
    expect(validateSearchQuery('iPhone 13').isValid).toBe(true);
  });

  it('rejects empty query', () => {
    expect(validateSearchQuery('').isValid).toBe(false);
  });

  it('rejects short query', () => {
    expect(validateSearchQuery('A').isValid).toBe(false);
  });
});

describe('validatePriceRange', () => {
  it('accepts valid range', () => {
    expect(validatePriceRange(100, 500).isValid).toBe(true);
  });

  it('accepts only min', () => {
    expect(validatePriceRange(100).isValid).toBe(true);
  });

  it('accepts only max', () => {
    expect(validatePriceRange(undefined, 500).isValid).toBe(true);
  });

  it('rejects min > max', () => {
    expect(validatePriceRange(500, 100).isValid).toBe(false);
  });

  it('rejects negative min', () => {
    expect(validatePriceRange(-100, 500).isValid).toBe(false);
  });
});

describe('validateForm', () => {
  it('validates form with rules', () => {
    const data = { email: 'test@example.com', name: 'John' };
    const rules = {
      email: validateEmail,
      name: validateName,
    };
    const result = validateForm(data, rules);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('returns errors for invalid form', () => {
    const data = { email: 'invalid', name: '' };
    const rules = {
      email: validateEmail,
      name: validateName,
    };
    const result = validateForm(data, rules);
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeTruthy();
    expect(result.errors.name).toBeTruthy();
  });
});
