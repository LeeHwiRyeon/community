import React from 'react';
import { DesignSystem } from '../../styles/design-system';

interface ModernCardProps {
    children: React.ReactNode;
    variant?: 'elevated' | 'outlined' | 'glass' | 'gradient';
    padding?: 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
}

const ModernCard: React.FC<ModernCardProps> = ({
    children,
    variant = 'elevated',
    padding = 'md',
    hover = true,
    onClick,
    className = '',
    style = {},
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'elevated':
                return {
                    background: 'white',
                    boxShadow: DesignSystem.shadows.lg,
                };
            case 'outlined':
                return {
                    background: 'white',
                    border: `1px solid ${DesignSystem.colors.neutral[200]}`,
                    boxShadow: 'none',
                };
            case 'glass':
                return {
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                };
            case 'gradient':
                return {
                    background: DesignSystem.colors.gradients.primary,
                    color: 'white',
                };
            default:
                return {};
        }
    };

    const getPaddingStyles = () => {
        switch (padding) {
            case 'sm':
                return { padding: DesignSystem.spacing[4] };
            case 'md':
                return { padding: DesignSystem.spacing[6] };
            case 'lg':
                return { padding: DesignSystem.spacing[8] };
            default:
                return {};
        }
    };

    const cardStyles: React.CSSProperties = {
        ...DesignSystem.components.card.base,
        ...getVariantStyles(),
        ...getPaddingStyles(),
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        ...style,
    };

    const hoverStyles = hover ? {
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: DesignSystem.shadows['2xl'],
        },
    } : {};

    return (
        <div
            className={`modern-card ${className}`}
            style={cardStyles}
            onClick={onClick}
        >
            {/* Background Pattern */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: variant === 'gradient'
                        ? 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)'
                        : 'none',
                    opacity: 0.1,
                    pointerEvents: 'none',
                }}
            />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </div>

            {/* Hover Effect */}
            {hover && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        pointerEvents: 'none',
                    }}
                    className="hover-overlay"
                />
            )}

            <style>{`
        .modern-card:hover .hover-overlay {
          opacity: 1;
        }
        
        .modern-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
        </div>
    );
};

export default ModernCard;
