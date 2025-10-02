/**
 * Custom hook for notification functionality
 */

import { useState, useEffect, useCallback } from 'react';

export interface NotificationOptions {
    title: string;
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    requireInteraction?: boolean;
    silent?: boolean;
    timestamp?: number;
    vibrate?: number[];
    actions?: NotificationAction[];
    dir?: 'auto' | 'ltr' | 'rtl';
    lang?: string;
    renotify?: boolean;
    sticky?: boolean;
}

export interface UseNotificationOptions {
    onShow?: (notification: Notification) => void;
    onClick?: (notification: Notification) => void;
    onClose?: (notification: Notification) => void;
    onError?: (error: Error) => void;
}

export function useNotification(
    options: UseNotificationOptions = {}
): {
    isSupported: boolean;
    permission: NotificationPermission;
    requestPermission: () => Promise<NotificationPermission>;
    show: (options: NotificationOptions) => Promise<Notification | null>;
    close: (tag?: string) => void;
    closeAll: () => void;
} {
    const { onShow, onClick, onClose, onError } = options;
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        const supported = 'Notification' in window;
        setIsSupported(supported);

        if (supported) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
        if (!isSupported) return 'denied';

        try {
            const newPermission = await Notification.requestPermission();
            setPermission(newPermission);
            return newPermission;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            onError?.(err);
            return 'denied';
        }
    }, [isSupported, onError]);

    const show = useCallback(async (notificationOptions: NotificationOptions): Promise<Notification | null> => {
        if (!isSupported || permission !== 'granted') {
            await requestPermission();
            if (permission !== 'granted') return null;
        }

        try {
            const notification = new Notification(notificationOptions.title, {
                body: notificationOptions.body,
                icon: notificationOptions.icon,
                badge: notificationOptions.badge,
                tag: notificationOptions.tag,
                data: notificationOptions.data,
                requireInteraction: notificationOptions.requireInteraction,
                silent: notificationOptions.silent,
                timestamp: notificationOptions.timestamp,
                vibrate: notificationOptions.vibrate,
                actions: notificationOptions.actions,
                dir: notificationOptions.dir,
                lang: notificationOptions.lang,
                renotify: notificationOptions.renotify,
                sticky: notificationOptions.sticky,
            });

            notification.onclick = () => {
                onClick?.(notification);
            };

            notification.onclose = () => {
                onClose?.(notification);
            };

            onShow?.(notification);
            return notification;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            onError?.(err);
            return null;
        }
    }, [isSupported, permission, requestPermission, onShow, onClick, onClose, onError]);

    const close = useCallback((tag?: string) => {
        if (!isSupported) return;

        if (tag) {
            // Close specific notification by tag
            const notifications = document.querySelectorAll(`[data-notification-tag="${tag}"]`);
            notifications.forEach(notification => {
                if (notification instanceof Notification) {
                    notification.close();
                }
            });
        } else {
            // Close all notifications
            closeAll();
        }
    }, [isSupported]);

    const closeAll = useCallback(() => {
        if (!isSupported) return;

        // Close all notifications
        const notifications = document.querySelectorAll('[data-notification]');
        notifications.forEach(notification => {
            if (notification instanceof Notification) {
                notification.close();
            }
        });
    }, [isSupported]);

    return {
        isSupported,
        permission,
        requestPermission,
        show,
        close,
        closeAll,
    };
}

export default useNotification;
