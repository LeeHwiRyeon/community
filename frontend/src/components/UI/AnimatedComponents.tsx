import React from 'react';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

interface AnimatedListProps {
    children: React.ReactNode;
    staggerDelay?: number;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: {
        opacity: 0,
        y: 20,
        scale: 0.95,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 12,
        },
    },
};

export const AnimatedList: React.FC<AnimatedListProps> = ({
    children,
    staggerDelay = 0.1,
}) => {
    const modifiedContainerVariants = {
        ...containerVariants,
        visible: {
            ...containerVariants.visible,
            transition: {
                staggerChildren: staggerDelay,
            },
        },
    };

    return (
        <motion.div
            variants={modifiedContainerVariants}
            initial="hidden"
            animate="visible"
        >
            {children}
        </motion.div>
    );
};

interface AnimatedListItemProps {
    children: React.ReactNode;
    onClick?: () => void;
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
    children,
    onClick,
}) => {
    return (
        <motion.div
            variants={itemVariants}
            whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 },
            }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
};

// 페이드 인 애니메이션
export const FadeIn: React.FC<{ children: React.ReactNode; delay?: number }> = ({
    children,
    delay = 0
}) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay }}
        >
            {children}
        </motion.div>
    );
};

// 슬라이드 업 애니메이션
export const SlideUp: React.FC<{ children: React.ReactNode; delay?: number }> = ({
    children,
    delay = 0
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.6,
                delay,
                type: 'spring',
                stiffness: 100,
            }}
        >
            {children}
        </motion.div>
    );
};

// 스케일 애니메이션
export const ScaleIn: React.FC<{ children: React.ReactNode; delay?: number }> = ({
    children,
    delay = 0
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                duration: 0.4,
                delay,
                type: 'spring',
                stiffness: 200,
            }}
        >
            {children}
        </motion.div>
    );
};

// 호버 애니메이션 (카드용)
export const HoverCard: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
}> = ({ children, onClick }) => {
    return (
        <motion.div
            whileHover={{
                y: -5,
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                transition: { duration: 0.3 },
            }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            {children}
        </motion.div>
    );
};
