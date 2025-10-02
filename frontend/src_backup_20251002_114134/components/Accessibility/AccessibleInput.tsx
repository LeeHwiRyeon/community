import React, { forwardRef } from 'react';
import { Input, InputProps } from '@chakra-ui/react';

interface AccessibleInputProps extends InputProps {
    ariaLabel?: string;
    ariaDescribedBy?: string;
    ariaInvalid?: boolean;
    ariaRequired?: boolean;
    ariaAutocomplete?: 'none' | 'inline' | 'list' | 'both';
    ariaExpanded?: boolean;
    ariaControls?: string;
    ariaActivedescendant?: string;
    errorMessage?: string;
    helperText?: string;
    required?: boolean;
}

const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
    ({
        ariaLabel,
        ariaDescribedBy,
        ariaInvalid,
        ariaRequired,
        ariaAutocomplete,
        ariaExpanded,
        ariaControls,
        ariaActivedescendant,
        errorMessage,
        helperText,
        required,
        id,
        ...props
    }, ref) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
        const errorId = errorMessage ? `${inputId}-error` : undefined;
        const helperId = helperText ? `${inputId}-helper` : undefined;
        const describedBy = [ariaDescribedBy, helperId, errorId].filter(Boolean).join(' ');

        return (
            <div>
                <Input
                    ref={ref}
                    id={inputId}
                    aria-label={ariaLabel}
                    aria-describedby={describedBy || undefined}
                    aria-invalid={ariaInvalid || !!errorMessage}
                    aria-required={ariaRequired || required}
                    aria-autocomplete={ariaAutocomplete}
                    aria-expanded={ariaExpanded}
                    aria-controls={ariaControls}
                    aria-activedescendant={ariaActivedescendant}
                    required={required}
                    _focus={{
                        boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.6)',
                        outline: 'none',
                    }}
                    _focusVisible={{
                        boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.6)',
                    }}
                    {...props}
                />
                {helperText && (
                    <div id={helperId} className="helper-text" style={{ fontSize: '0.875rem', color: '#718096', marginTop: '0.25rem' }}>
                        {helperText}
                    </div>
                )}
                {errorMessage && (
                    <div
                        id={errorId}
                        className="error-message"
                        role="alert"
                        style={{ fontSize: '0.875rem', color: '#E53E3E', marginTop: '0.25rem' }}
                    >
                        {errorMessage}
                    </div>
                )}
            </div>
        );
    }
);

AccessibleInput.displayName = 'AccessibleInput';

export default AccessibleInput;
