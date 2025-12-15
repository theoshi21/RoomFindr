'use client';

import { useState, useCallback, useMemo } from 'react';
import { validateEmail, validatePhone } from '@/lib/utils';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  email?: boolean;
  phone?: boolean;
  min?: number;
  max?: number;
}

export interface FormField {
  value: any;
  error?: string;
  touched: boolean;
  rules?: ValidationRule;
}

export interface FormState {
  [key: string]: FormField;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, ValidationRule>> = {}
) {
  const [formState, setFormState] = useState<FormState>(() => {
    const state: FormState = {};
    Object.keys(initialValues).forEach(key => {
      state[key] = {
        value: initialValues[key],
        touched: false,
        rules: validationRules[key],
      };
    });
    return state;
  });

  const validateField = useCallback((name: string, value: any, rules?: ValidationRule): string | null => {
    if (!rules) return null;

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return 'This field is required';
    }

    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    // String validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return `Must be at least ${rules.minLength} characters`;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return `Must be no more than ${rules.maxLength} characters`;
      }
      if (rules.email && !validateEmail(value)) {
        return 'Please enter a valid email address';
      }
      if (rules.phone && !validatePhone(value)) {
        return 'Please enter a valid phone number';
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        return 'Please enter a valid format';
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return `Must be at least ${rules.min}`;
      }
      if (rules.max !== undefined && value > rules.max) {
        return `Must be no more than ${rules.max}`;
      }
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, []);

  const setValue = useCallback((name: string, value: any) => {
    setFormState(prev => {
      const field = prev[name];
      const error = validateField(name, value, field?.rules);
      
      return {
        ...prev,
        [name]: {
          ...field,
          value,
          error: error || undefined,
          touched: true,
        },
      };
    });
  }, [validateField]);

  const setError = useCallback((name: string, error: string) => {
    setFormState(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        error,
      },
    }));
  }, []);

  const clearError = useCallback((name: string) => {
    setFormState(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        error: undefined,
      },
    }));
  }, []);

  const setTouched = useCallback((name: string, touched = true) => {
    setFormState(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        touched,
      },
    }));
  }, []);

  const validateAll = useCallback(() => {
    const errors: Record<string, string> = {};
    let hasErrors = false;

    Object.keys(formState).forEach(name => {
      const field = formState[name];
      const error = validateField(name, field.value, field.rules);
      if (error) {
        errors[name] = error;
        hasErrors = true;
      }
    });

    setFormState(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(name => {
        newState[name] = {
          ...newState[name],
          error: errors[name] || undefined,
          touched: true,
        };
      });
      return newState;
    });

    return !hasErrors;
  }, [formState, validateField]);

  const reset = useCallback(() => {
    setFormState(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(name => {
        newState[name] = {
          ...newState[name],
          value: initialValues[name as keyof T],
          error: undefined,
          touched: false,
        };
      });
      return newState;
    });
  }, [initialValues]);

  const values = useMemo(() => {
    const vals: Partial<T> = {};
    Object.keys(formState).forEach(key => {
      vals[key as keyof T] = formState[key].value;
    });
    return vals as T;
  }, [formState]);

  const errors = useMemo(() => {
    const errs: Partial<Record<keyof T, string>> = {};
    Object.keys(formState).forEach(key => {
      if (formState[key].error) {
        errs[key as keyof T] = formState[key].error;
      }
    });
    return errs;
  }, [formState]);

  const isValid = useMemo(() => {
    return Object.values(formState).every(field => !field.error);
  }, [formState]);

  const isDirty = useMemo(() => {
    return Object.keys(formState).some(key => {
      return formState[key].value !== initialValues[key as keyof T];
    });
  }, [formState, initialValues]);

  const getFieldProps = useCallback((name: string) => {
    const field = formState[name];
    return {
      value: field?.value ?? '',
      error: field?.touched ? field?.error : undefined,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setValue(name, e.target.value);
      },
      onBlur: () => setTouched(name),
    };
  }, [formState, setValue, setTouched]);

  return {
    values,
    errors,
    formState,
    isValid,
    isDirty,
    setValue,
    setError,
    clearError,
    setTouched,
    validateAll,
    reset,
    getFieldProps,
  };
}