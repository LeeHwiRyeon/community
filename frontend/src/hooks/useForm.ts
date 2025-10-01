/**
 * Custom hook for form handling
 */

import { useState, useCallback, useRef } from 'react';

export interface UseFormOptions<T> {
    initialValues: T;
    validate?: (values: T) => Partial<Record<keyof T, string>>;
    onSubmit?: (values: T) => void | Promise<void>;
}

export function useForm<T extends Record<string, any>>(
    options: UseFormOptions<T>
): {
    values: T;
    errors: Partial<Record<keyof T, string>>;
    touched: Partial<Record<keyof T, boolean>>;
    isSubmitting: boolean;
    isValid: boolean;
    setValue: (name: keyof T, value: any) => void;
    setValues: (values: Partial<T>) => void;
    setError: (name: keyof T, error: string) => void;
    setErrors: (errors: Partial<Record<keyof T, string>>) => void;
    setTouched: (name: keyof T, touched: boolean) => void;
    setTouchedFields: (touched: Partial<Record<keyof T, boolean>>) => void;
    handleChange: (name: keyof T) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleBlur: (name: keyof T) => (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleSubmit: (event?: React.FormEvent) => Promise<void>;
    reset: () => void;
    validate: () => boolean;
} {
    const { initialValues, validate, onSubmit } = options;
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [touchedState, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);

    const setValue = useCallback((name: keyof T, value: any) => {
        setValues(prev => ({ ...prev, [name]: value }));
    }, []);

    const setValuesCallback = useCallback((newValues: Partial<T>) => {
        setValues(prev => ({ ...prev, ...newValues }));
    }, []);

    const setError = useCallback((name: keyof T, error: string) => {
        setErrors(prev => ({ ...prev, [name]: error }));
    }, []);

    const setErrorsCallback = useCallback((newErrors: Partial<Record<keyof T, string>>) => {
        setErrors(prev => ({ ...prev, ...newErrors }));
    }, []);

    const setTouched = useCallback((name: keyof T, touchedValue: boolean) => {
        setTouched(prev => ({ ...prev, [name]: touchedValue }));
    }, []);

    const setTouchedFields = useCallback((newTouched: Partial<Record<keyof T, boolean>>) => {
        setTouched(prev => ({ ...prev, ...newTouched }));
    }, []);

    const handleChange = useCallback((name: keyof T) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = event.target.type === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value;
        setValue(name, value);
    }, [setValue]);

    const handleBlur = useCallback((name: keyof T) => (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setTouched(name, true);
    }, [setTouched]);

    const validateForm = useCallback((): boolean => {
        if (!validate) return true;

        const validationErrors = validate(values);
        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    }, [values, validate]);

    const handleSubmit = useCallback(async (event?: React.FormEvent) => {
        if (event) {
            event.preventDefault();
        }

        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setIsSubmitting(true);

        try {
            const isValid = validateForm();
            if (isValid && onSubmit) {
                await onSubmit(values);
            }
        } finally {
            isSubmittingRef.current = false;
            setIsSubmitting(false);
        }
    }, [values, validateForm, onSubmit]);

    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
        isSubmittingRef.current = false;
    }, [initialValues]);

    const isValid = Object.keys(errors).length === 0;

    return {
        values,
        errors,
        touched,
        isSubmitting,
        isValid,
        setValue,
        setValues: setValuesCallback,
        setError,
        setErrors: setErrorsCallback,
        setTouched,
        setTouchedFields,
        handleChange,
        handleBlur,
        handleSubmit,
        reset,
        validate: validateForm,
    };
}

export default useForm;
