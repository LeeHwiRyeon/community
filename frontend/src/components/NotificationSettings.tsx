import React, { useState } from 'react';
import { Box, VStack, Text, Switch, Button } from '@chakra-ui/react';

const NotificationSettings: React.FC = () => {
    const [settings, setSettings] = useState({
        email: true,
        push: false,
        comments: true,
        mentions: true,
        follows: false,
    });

    const handleSettingChange = (key: string, value: boolean) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const requestPushPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                setSettings(prev => ({ ...prev, push: true }));
            }
        }
    };

    return (
        <Box p={4} borderWidth={1} borderRadius="md">
            <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="bold">알림 설정</Text>

                <VStack align="start" spacing={3}>
                    <Box>
                        <Text fontWeight="bold">이메일 알림</Text>
                        <Switch
                            isChecked={settings.email}
                            onChange={(e) => handleSettingChange('email', e.target.checked)}
                        />
                    </Box>

                    <Box>
                        <Text fontWeight="bold">브라우저 푸시 알림</Text>
                        <Switch
                            isChecked={settings.push}
                            onChange={(e) => handleSettingChange('push', e.target.checked)}
                        />
                        {!settings.push && (
                            <Button size="sm" mt={2} onClick={requestPushPermission}>
                                푸시 권한 요청
                            </Button>
                        )}
                    </Box>

                    <Box>
                        <Text fontWeight="bold">댓글 알림</Text>
                        <Switch
                            isChecked={settings.comments}
                            onChange={(e) => handleSettingChange('comments', e.target.checked)}
                        />
                    </Box>

                    <Box>
                        <Text fontWeight="bold">멘션 알림</Text>
                        <Switch
                            isChecked={settings.mentions}
                            onChange={(e) => handleSettingChange('mentions', e.target.checked)}
                        />
                    </Box>

                    <Box>
                        <Text fontWeight="bold">팔로우 알림</Text>
                        <Switch
                            isChecked={settings.follows}
                            onChange={(e) => handleSettingChange('follows', e.target.checked)}
                        />
                    </Box>
                </VStack>

                <Button colorScheme="blue">설정 저장</Button>
            </VStack>
        </Box>
    );
};

export default NotificationSettings;