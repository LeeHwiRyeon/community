// Animation System for Action Feedback
// Provides smooth visual feedback for user actions

import { keyframes } from '@chakra-ui/react';

// Keyframe animations
export const actionAnimations = {
    // Button press animation
    buttonPress: keyframes`
    0% { transform: scale(1); }
    50% { transform: scale(0.95); }
    100% { transform: scale(1); }
  `,

    // Success pulse animation
    successPulse: keyframes`
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
    50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
  `,

    // Error shake animation
    errorShake: keyframes`
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  `,

    // Slide in from right
    slideInRight: keyframes`
    0% { transform: translateX(100%); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  `,

    // Slide in from left
    slideInLeft: keyframes`
    0% { transform: translateX(-100%); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  `,

    // Fade in with scale
    fadeInScale: keyframes`
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  `,

    // Bounce animation
    bounce: keyframes`
    0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
    40%, 43% { transform: translateY(-10px); }
    70% { transform: translateY(-5px); }
  `,

    // Glow effect
    glow: keyframes`
    0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
    50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
  `,

    // Progress bar fill
    progressFill: keyframes`
    0% { width: 0%; }
    100% { width: 100%; }
  `,

    // Spinner rotation
    spin: keyframes`
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  `
};

// Animation durations
export const animationDurations = {
    fast: '0.15s',
    normal: '0.3s',
    slow: '0.5s',
    verySlow: '1s'
};

// Animation easing functions
export const animationEasing = {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
};

// Predefined animation styles for different action types
export const actionAnimationStyles = {
    // Post creation - success with bounce
    postCreate: {
        animation: `${actionAnimations.successPulse} ${animationDurations.normal} ${animationEasing.easeOut}`,
        transform: 'scale(1)',
        transition: 'all 0.3s ease'
    },

    // Comment addition - gentle slide in
    commentAdd: {
        animation: `${actionAnimations.slideInRight} ${animationDurations.fast} ${animationEasing.easeOut}`,
        transform: 'translateX(0)',
        transition: 'all 0.15s ease'
    },

    // Like action - quick bounce
    likeAdd: {
        animation: `${actionAnimations.bounce} ${animationDurations.fast} ${animationEasing.bounce}`,
        transform: 'translateY(0)',
        transition: 'all 0.15s ease'
    },

    // Share action - glow effect
    shareAction: {
        animation: `${actionAnimations.glow} ${animationDurations.slow} ${animationEasing.easeInOut}`,
        boxShadow: '0 0 10px rgba(147, 51, 234, 0.5)',
        transition: 'all 0.5s ease'
    },

    // Follow action - fade in with scale
    followUser: {
        animation: `${actionAnimations.fadeInScale} ${animationDurations.normal} ${animationEasing.easeOut}`,
        transform: 'scale(1)',
        opacity: 1,
        transition: 'all 0.3s ease'
    },

    // Bookmark action - button press
    bookmarkAdd: {
        animation: `${actionAnimations.buttonPress} ${animationDurations.fast} ${animationEasing.easeOut}`,
        transform: 'scale(1)',
        transition: 'all 0.15s ease'
    },

    // Page navigation - slide in from left/right
    pageNext: {
        animation: `${actionAnimations.slideInLeft} ${animationDurations.normal} ${animationEasing.easeOut}`,
        transform: 'translateX(0)',
        opacity: 1,
        transition: 'all 0.3s ease'
    },

    pagePrev: {
        animation: `${actionAnimations.slideInRight} ${animationDurations.normal} ${animationEasing.easeOut}`,
        transform: 'translateX(0)',
        opacity: 1,
        transition: 'all 0.3s ease'
    },

    // Error state - shake animation
    error: {
        animation: `${actionAnimations.errorShake} ${animationDurations.normal} ${animationEasing.easeOut}`,
        transform: 'translateX(0)',
        transition: 'all 0.3s ease'
    },

    // Loading state - spinner
    loading: {
        animation: `${actionAnimations.spin} ${animationDurations.verySlow} ${animationEasing.easeInOut}`,
        transform: 'rotate(0deg)',
        transition: 'all 1s ease'
    }
};

// Utility functions for animations
export const animationUtils = {
    // Apply animation to element
    applyAnimation: (element: HTMLElement, animationType: keyof typeof actionAnimationStyles) => {
        const styles = actionAnimationStyles[animationType];
        Object.assign(element.style, styles);
    },

    // Remove animation from element
    removeAnimation: (element: HTMLElement) => {
        element.style.animation = '';
        element.style.transform = '';
        element.style.transition = '';
        element.style.boxShadow = '';
        element.style.opacity = '';
    },

    // Create ripple effect on button click
    createRipple: (event: React.MouseEvent<HTMLButtonElement>, color: string = 'rgba(59, 130, 246, 0.3)') => {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        const ripple = document.createElement('div');
        ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: ${color};
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;

        // Add ripple keyframes if not already added
        if (!document.getElementById('ripple-keyframes')) {
            const style = document.createElement('style');
            style.id = 'ripple-keyframes';
            style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
            document.head.appendChild(style);
        }

        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    },

    // Show success notification with animation
    showSuccessNotification: (message: string, duration: number = 3000) => {
        const notification = document.createElement('div');
        notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Slide in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Slide out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    },

    // Show error notification with animation
    showErrorNotification: (message: string, duration: number = 3000) => {
        const notification = document.createElement('div');
        notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Slide in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Slide out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }
};

// Action type to animation mapping
export const actionAnimationMap: Record<string, keyof typeof actionAnimationStyles> = {
    'POST_CREATE': 'postCreate',
    'COMMENT_ADD': 'commentAdd',
    'LIKE_ADD': 'likeAdd',
    'SHARE_ACTION': 'shareAction',
    'FOLLOW_USER': 'followUser',
    'BOOKMARK_ADD': 'bookmarkAdd',
    'PAGE_NEXT': 'pageNext',
    'PAGE_PREV': 'pagePrev',
    'ERROR': 'error',
    'LOADING': 'loading'
};

// Get animation style for action type
export const getAnimationForAction = (actionType: string): keyof typeof actionAnimationStyles => {
    return actionAnimationMap[actionType] || 'postCreate';
};
