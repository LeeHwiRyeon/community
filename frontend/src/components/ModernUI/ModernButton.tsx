import React from 'react';
import { DesignSystem } from '../../styles/design-system';

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'warning' | 'error';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    onClick?: () => void;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
    style?: React.CSSProperties;
}

const ModernButton: React.FC<ModernButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    onClick,
    className = '',
    type = 'button',
    style = {},
    ...rest
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    background: DesignSystem.colors.gradients.primary,
                    color: 'white',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: DesignSystem.shadows.glow,
                    },
                };
            case 'secondary':
                return {
                    background: 'white',
                    color: DesignSystem.colors.primary[600],
                    border: `2px solid ${DesignSystem.colors.primary[600]}`,
                    '&:hover': {
                        background: DesignSystem.colors.primary[600],
                        color: 'white',
                    },
                };
            case 'ghost':
                return {
                    background: 'transparent',
                    color: DesignSystem.colors.primary[600],
                    '&:hover': {
                        background: `${DesignSystem.colors.primary[600]}10`,
                    },
                };
            case 'success':
                return {
                    background: DesignSystem.colors.gradients.success,
                    color: 'white',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
                    },
                };
            case 'warning':
                return {
                    background: DesignSystem.colors.gradients.warning,
                    color: 'white',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)',
                    },
                };
            case 'error':
                return {
                    background: DesignSystem.colors.gradients.error,
                    color: 'white',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)',
                    },
                };
            default:
                return {};
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return {
                    padding: '0.5rem 1rem',
                    fontSize: DesignSystem.typography.fontSize.sm,
                };
            case 'md':
                return {
                    padding: '0.75rem 1.5rem',
                    fontSize: DesignSystem.typography.fontSize.base,
                };
            case 'lg':
                return {
                    padding: '1rem 2rem',
                    fontSize: DesignSystem.typography.fontSize.lg,
                };
            default:
                return {};
        }
    };

    const buttonStyles: React.CSSProperties = {
        ...DesignSystem.components.button.base,
        ...getVariantStyles(),
        ...getSizeStyles(),
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        overflow: 'hidden',
        ...style,
    };

    const LoadingSpinner = () => (
        <div
            style={{
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTop: '2px solid currentColor',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
            }}
        />
    );

    return (
        <button
            type={type}
            style={buttonStyles}
            onClick={disabled || loading ? undefined : onClick}
            disabled={disabled || loading}
            {...rest}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                }}
            >
                {loading && <LoadingSpinner />}
                {!loading && icon && iconPosition === 'left' && icon}
                {!loading && children}
                {!loading && icon && iconPosition === 'right' && icon}
            </div>

            {/* Ripple Effect */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '0',
                    height: '0',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.3)',
                    transform: 'translate(-50%, -50%)',
                    transition: 'width 0.6s, height 0.6s',
                }}
                className="ripple"
            />

            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        button:hover .ripple {
          width: 300px;
          height: 300px;
        }
      `}</style>
        </button>
    );
};

export default ModernButton;
