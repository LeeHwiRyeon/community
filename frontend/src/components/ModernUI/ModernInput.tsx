import React, { useState } from 'react';
import { DesignSystem } from '../../styles/design-system';

interface ModernInputProps {
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    disabled?: boolean;
    error?: boolean;
    success?: boolean;
    label?: string;
    helperText?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    style?: React.CSSProperties;
}

const ModernInput: React.FC<ModernInputProps> = ({
    type = 'text',
    placeholder,
    value = '',
    onChange,
    onFocus,
    onBlur,
    disabled = false,
    error = false,
    success = false,
    label,
    helperText,
    icon,
    iconPosition = 'left',
    size = 'md',
    className = '',
    style = {},
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return {
                    padding: '0.5rem 0.75rem',
                    fontSize: DesignSystem.typography.fontSize.sm,
                };
            case 'md':
                return {
                    padding: '0.75rem 1rem',
                    fontSize: DesignSystem.typography.fontSize.base,
                };
            case 'lg':
                return {
                    padding: '1rem 1.25rem',
                    fontSize: DesignSystem.typography.fontSize.lg,
                };
            default:
                return {};
        }
    };

    const getStateStyles = () => {
        if (error) {
            return {
                borderColor: DesignSystem.colors.accent.error,
                '&:focus': {
                    borderColor: DesignSystem.colors.accent.error,
                    boxShadow: `0 0 0 3px ${DesignSystem.colors.accent.error}20`,
                },
            };
        }
        if (success) {
            return {
                borderColor: DesignSystem.colors.accent.success,
                '&:focus': {
                    borderColor: DesignSystem.colors.accent.success,
                    boxShadow: `0 0 0 3px ${DesignSystem.colors.accent.success}20`,
                },
            };
        }
        if (isFocused) {
            return {
                borderColor: DesignSystem.colors.primary[500],
                boxShadow: `0 0 0 3px ${DesignSystem.colors.primary[500]}20`,
            };
        }
        return {};
    };

    const inputStyles: React.CSSProperties = {
        ...DesignSystem.components.input.base,
        ...getSizeStyles(),
        ...getStateStyles(),
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'text',
        ...style,
    };

    const containerStyles: React.CSSProperties = {
        position: 'relative',
        width: '100%',
    };

    const iconStyles: React.CSSProperties = {
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        color: DesignSystem.colors.neutral[400],
        pointerEvents: 'none',
        ...(iconPosition === 'left' ? { left: '1rem' } : { right: '1rem' }),
    };

    const inputWithIconStyles: React.CSSProperties = {
        ...inputStyles,
        ...(iconPosition === 'left'
            ? { paddingLeft: '3rem' }
            : { paddingRight: '3rem' }
        ),
    };

    return (
        <div className={`modern-input-container ${className}`} style={containerStyles}>
            {label && (
                <label
                    style={{
                        display: 'block',
                        marginBottom: DesignSystem.spacing[2],
                        fontSize: DesignSystem.typography.fontSize.sm,
                        fontWeight: DesignSystem.typography.fontWeight.medium,
                        color: DesignSystem.colors.neutral[700],
                    }}
                >
                    {label}
                </label>
            )}

            <div style={{ position: 'relative' }}>
                {icon && iconPosition === 'left' && (
                    <div style={iconStyles}>{icon}</div>
                )}

                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    onFocus={(e) => {
                        setIsFocused(true);
                        onFocus?.();
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        onBlur?.();
                    }}
                    disabled={disabled}
                    style={icon ? inputWithIconStyles : inputStyles}
                />

                {icon && iconPosition === 'right' && (
                    <div style={iconStyles}>{icon}</div>
                )}

                {/* Focus Indicator */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: DesignSystem.colors.primary[500],
                        transform: isFocused ? 'scaleX(1)' : 'scaleX(0)',
                        transformOrigin: 'left',
                        transition: 'transform 0.3s ease',
                    }}
                />
            </div>

            {helperText && (
                <div
                    style={{
                        marginTop: DesignSystem.spacing[1],
                        fontSize: DesignSystem.typography.fontSize.sm,
                        color: error
                            ? DesignSystem.colors.accent.error
                            : success
                                ? DesignSystem.colors.accent.success
                                : DesignSystem.colors.neutral[500],
                    }}
                >
                    {helperText}
                </div>
            )}

            <style>{`
        input:focus {
          outline: none;
        }
        
        input::placeholder {
          color: ${DesignSystem.colors.neutral[400]};
          transition: color 0.2s ease;
        }
        
        input:focus::placeholder {
          color: ${DesignSystem.colors.neutral[300]};
        }
      `}</style>
        </div>
    );
};

export default ModernInput;
