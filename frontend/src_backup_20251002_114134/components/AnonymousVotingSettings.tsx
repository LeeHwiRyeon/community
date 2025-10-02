import React, { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Switch,
    FormControl,
    FormLabel,
    Alert,
    AlertIcon,
    Badge,
    Divider,
    useColorModeValue,
    Tooltip,
    Icon
} from '@chakra-ui/react';
import { LockIcon, UnlockIcon, InfoIcon } from '@chakra-ui/icons';

export interface AnonymousVotingSettings {
    allowAnonymous: boolean;
    showVoterCount: boolean;
    showVoterDetails: boolean;
    requireLogin: boolean;
    allowVoteChange: boolean;
    maxVotesPerIP?: number;
}

interface AnonymousVotingSettingsProps {
    settings: AnonymousVotingSettings;
    onSettingsChange: (settings: AnonymousVotingSettings) => void;
    disabled?: boolean;
    isAdmin?: boolean;
}

const AnonymousVotingSettings: React.FC<AnonymousVotingSettingsProps> = ({
    settings,
    onSettingsChange,
    disabled = false,
    isAdmin = false
}) => {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const infoBgColor = useColorModeValue('blue.50', 'blue.900');
    const infoBorderColor = useColorModeValue('blue.200', 'blue.700');

    const updateSetting = (key: keyof AnonymousVotingSettings, value: any) => {
        const newSettings = { ...settings, [key]: value };
        onSettingsChange(newSettings);
    };

    const getAnonymousStatus = () => {
        if (settings.allowAnonymous) {
            return {
                color: 'green',
                text: '익명 투표 허용',
                icon: <UnlockIcon />
            };
        } else {
            return {
                color: 'red',
                text: '실명 투표만',
                icon: <LockIcon />
            };
        }
    };

    const status = getAnonymousStatus();

    return (
        <Box className="anonymous-voting-settings">
            <VStack spacing={4} align="stretch">
                {/* 익명 투표 상태 표시 */}
                <Box p={3} bg={infoBgColor} borderRadius="md" border="1px solid" borderColor={infoBorderColor}>
                    <HStack spacing={2}>
                        <Icon as={InfoIcon} color="blue.500" />
                        <Text fontSize="sm" fontWeight="medium" color="blue.700">
                            현재 설정:
                        </Text>
                        <Badge colorScheme={status.color} variant="solid">
                            <HStack spacing={1}>
                                {status.icon}
                                <Text>{status.text}</Text>
                            </HStack>
                        </Badge>
                    </HStack>
                </Box>

                {/* 익명 투표 허용 설정 */}
                <FormControl>
                    <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                            <FormLabel mb={0} fontWeight="semibold">
                                익명 투표 허용
                            </FormLabel>
                            <Text fontSize="sm" color="gray.600">
                                사용자가 익명으로 투표할 수 있도록 허용합니다.
                            </Text>
                        </VStack>
                        <Switch
                            isChecked={settings.allowAnonymous}
                            onChange={(e) => updateSetting('allowAnonymous', e.target.checked)}
                            isDisabled={disabled}
                            colorScheme="blue"
                        />
                    </HStack>
                </FormControl>

                {settings.allowAnonymous && (
                    <>
                        <Divider />

                        {/* 투표자 수 표시 설정 */}
                        <FormControl>
                            <HStack justify="space-between">
                                <VStack align="start" spacing={1}>
                                    <FormLabel mb={0} fontWeight="medium">
                                        투표자 수 표시
                                    </FormLabel>
                                    <Text fontSize="sm" color="gray.600">
                                        총 투표자 수를 결과에 표시합니다.
                                    </Text>
                                </VStack>
                                <Switch
                                    isChecked={settings.showVoterCount}
                                    onChange={(e) => updateSetting('showVoterCount', e.target.checked)}
                                    isDisabled={disabled}
                                    colorScheme="blue"
                                />
                            </HStack>
                        </FormControl>

                        {/* 로그인 요구 설정 */}
                        <FormControl>
                            <HStack justify="space-between">
                                <VStack align="start" spacing={1}>
                                    <FormLabel mb={0} fontWeight="medium">
                                        로그인 요구
                                    </FormLabel>
                                    <Text fontSize="sm" color="gray.600">
                                        익명 투표라도 로그인이 필요합니다.
                                    </Text>
                                </VStack>
                                <Switch
                                    isChecked={settings.requireLogin}
                                    onChange={(e) => updateSetting('requireLogin', e.target.checked)}
                                    isDisabled={disabled}
                                    colorScheme="blue"
                                />
                            </HStack>
                        </FormControl>

                        {/* 투표 변경 허용 */}
                        <FormControl>
                            <HStack justify="space-between">
                                <VStack align="start" spacing={1}>
                                    <FormLabel mb={0} fontWeight="medium">
                                        투표 변경 허용
                                    </FormLabel>
                                    <Text fontSize="sm" color="gray.600">
                                        사용자가 투표를 변경할 수 있습니다.
                                    </Text>
                                </VStack>
                                <Switch
                                    isChecked={settings.allowVoteChange}
                                    onChange={(e) => updateSetting('allowVoteChange', e.target.checked)}
                                    isDisabled={disabled}
                                    colorScheme="blue"
                                />
                            </HStack>
                        </FormControl>

                        {/* IP당 최대 투표 수 설정 */}
                        <FormControl>
                            <HStack justify="space-between">
                                <VStack align="start" spacing={1}>
                                    <FormLabel mb={0} fontWeight="medium">
                                        IP당 최대 투표 수
                                    </FormLabel>
                                    <Text fontSize="sm" color="gray.600">
                                        같은 IP에서 최대 몇 번까지 투표할 수 있는지 설정합니다.
                                    </Text>
                                </VStack>
                                <Tooltip label="0으로 설정하면 제한 없음">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={settings.maxVotesPerIP || 0}
                                        onChange={(e) => updateSetting('maxVotesPerIP', parseInt(e.target.value) || 0)}
                                        disabled={disabled}
                                        style={{
                                            width: '80px',
                                            padding: '4px 8px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '4px',
                                            textAlign: 'center'
                                        }}
                                    />
                                </Tooltip>
                            </HStack>
                        </FormControl>

                        {/* 관리자 전용 설정 */}
                        {isAdmin && (
                            <>
                                <Divider />
                                <Text fontSize="sm" fontWeight="semibold" color="purple.600">
                                    관리자 전용 설정
                                </Text>

                                <FormControl>
                                    <HStack justify="space-between">
                                        <VStack align="start" spacing={1}>
                                            <FormLabel mb={0} fontWeight="medium">
                                                투표자 상세 정보 표시
                                            </FormLabel>
                                            <Text fontSize="sm" color="gray.600">
                                                관리자에게 투표자 상세 정보를 표시합니다.
                                            </Text>
                                        </VStack>
                                        <Switch
                                            isChecked={settings.showVoterDetails}
                                            onChange={(e) => updateSetting('showVoterDetails', e.target.checked)}
                                            isDisabled={disabled}
                                            colorScheme="purple"
                                        />
                                    </HStack>
                                </FormControl>
                            </>
                        )}

                        {/* 익명 투표 안내 */}
                        <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <VStack align="start" spacing={1}>
                                <Text fontSize="sm" fontWeight="medium">
                                    익명 투표 안내
                                </Text>
                                <Text fontSize="xs">
                                    • 익명 투표 시 투표자 정보는 저장되지 않습니다.<br />
                                    • 투표 결과는 집계되어 표시됩니다.<br />
                                    • 관리자는 필요시 투표 통계를 확인할 수 있습니다.
                                </Text>
                            </VStack>
                        </Alert>
                    </>
                )}

                {/* 실명 투표 안내 */}
                {!settings.allowAnonymous && (
                    <Alert status="warning" borderRadius="md">
                        <AlertIcon />
                        <VStack align="start" spacing={1}>
                            <Text fontSize="sm" fontWeight="medium">
                                실명 투표 모드
                            </Text>
                            <Text fontSize="xs">
                                • 모든 투표는 사용자 계정과 연결됩니다.<br />
                                • 투표 기록이 사용자 프로필에 저장됩니다.<br />
                                • 투표 결과에 투표자 정보가 표시될 수 있습니다.
                            </Text>
                        </VStack>
                    </Alert>
                )}
            </VStack>
        </Box>
    );
};

export default AnonymousVotingSettings;
