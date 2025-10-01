import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Input,
    Textarea,
    Select,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    Progress,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    useDisclosure,
    FormControl,
    FormLabel,
    FormHelperText,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    SimpleGrid,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, getTranslationStats } from '../../i18n/i18n';

interface TranslationKey {
    key: string;
    namespace: string;
    translations: { [languageCode: string]: string };
    status: 'complete' | 'partial' | 'missing';
    lastModified: string;
}

interface TranslationStats {
    totalKeys: number;
    completedKeys: number;
    missingKeys: number;
    completionRate: number;
}

const TranslationManager: React.FC = () => {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
    const [selectedNamespace, setSelectedNamespace] = useState('common');
    const [searchTerm, setSearchTerm] = useState('');
    const [translationKeys, setTranslationKeys] = useState<TranslationKey[]>([]);
    const [editingKey, setEditingKey] = useState<TranslationKey | null>(null);
    const [newTranslation, setNewTranslation] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const namespaces = ['common', 'navigation', 'forms', 'errors', 'messages', 'admin', 'community'];

    useEffect(() => {
        loadTranslationKeys();
    }, [selectedLanguage, selectedNamespace]);

    const loadTranslationKeys = async () => {
        setIsLoading(true);
        try {
            // 실제로는 API에서 번역 키들을 가져옴
            const mockKeys: TranslationKey[] = [
                {
                    key: 'welcome',
                    namespace: 'common',
                    translations: {
                        'ko': '환영합니다',
                        'en': 'Welcome',
                        'ja': 'いらっしゃいませ',
                        'zh-CN': '欢迎',
                        'es': 'Bienvenido'
                    },
                    status: 'complete',
                    lastModified: '2023-10-01'
                },
                {
                    key: 'login',
                    namespace: 'forms',
                    translations: {
                        'ko': '로그인',
                        'en': 'Login',
                        'ja': 'ログイン'
                    },
                    status: 'partial',
                    lastModified: '2023-10-02'
                },
                {
                    key: 'newFeature',
                    namespace: 'messages',
                    translations: {
                        'ko': '새로운 기능'
                    },
                    status: 'missing',
                    lastModified: '2023-10-03'
                }
            ];

            const filteredKeys = mockKeys.filter(key =>
                key.namespace === selectedNamespace &&
                key.key.toLowerCase().includes(searchTerm.toLowerCase())
            );

            setTranslationKeys(filteredKeys);
        } catch (error) {
            toast({
                title: '번역 키를 불러오는데 실패했습니다.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getTranslationStats = (): TranslationStats => {
        const totalKeys = translationKeys.length;
        const completedKeys = translationKeys.filter(key => key.status === 'complete').length;
        const missingKeys = translationKeys.filter(key => key.status === 'missing').length;
        const completionRate = totalKeys > 0 ? (completedKeys / totalKeys) * 100 : 0;

        return {
            totalKeys,
            completedKeys,
            missingKeys,
            completionRate
        };
    };

    const handleEditTranslation = (key: TranslationKey) => {
        setEditingKey(key);
        setNewTranslation(key.translations[selectedLanguage] || '');
        onOpen();
    };

    const handleSaveTranslation = async () => {
        if (!editingKey) return;

        try {
            // 실제로는 API에 번역을 저장함
            const updatedKeys = translationKeys.map(key => {
                if (key.key === editingKey.key && key.namespace === editingKey.namespace) {
                    return {
                        ...key,
                        translations: {
                            ...key.translations,
                            [selectedLanguage]: newTranslation
                        },
                        status: newTranslation ? 'complete' : 'missing',
                        lastModified: new Date().toISOString().split('T')[0]
                    };
                }
                return key;
            });

            setTranslationKeys(updatedKeys);

            toast({
                title: '번역이 저장되었습니다.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            onClose();
        } catch (error) {
            toast({
                title: '번역 저장에 실패했습니다.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'complete': return 'green';
            case 'partial': return 'yellow';
            case 'missing': return 'red';
            default: return 'gray';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'complete': return '완료';
            case 'partial': return '부분';
            case 'missing': return '누락';
            default: return '알 수 없음';
        }
    };

    const stats = getTranslationStats();

    return (
        <Box p={6} maxW="1200px" mx="auto">
            <VStack spacing={6} align="stretch">
                <Box>
                    <Text fontSize="2xl" fontWeight="bold" mb={2}>
                        번역 관리 시스템
                    </Text>
                    <Text color="gray.600">
                        다국어 번역을 관리하고 번역 완성도를 모니터링합니다.
                    </Text>
                </Box>

                {/* 통계 */}
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
                    <Stat p={4} shadow="sm" borderWidth="1px" borderRadius="md">
                        <StatLabel>전체 키</StatLabel>
                        <StatNumber>{stats.totalKeys}</StatNumber>
                        <StatHelpText>번역 키 수</StatHelpText>
                    </Stat>
                    <Stat p={4} shadow="sm" borderWidth="1px" borderRadius="md">
                        <StatLabel>완료된 키</StatLabel>
                        <StatNumber color="green.500">{stats.completedKeys}</StatNumber>
                        <StatHelpText>번역 완료</StatHelpText>
                    </Stat>
                    <Stat p={4} shadow="sm" borderWidth="1px" borderRadius="md">
                        <StatLabel>누락된 키</StatLabel>
                        <StatNumber color="red.500">{stats.missingKeys}</StatNumber>
                        <StatHelpText>번역 필요</StatHelpText>
                    </Stat>
                    <Stat p={4} shadow="sm" borderWidth="1px" borderRadius="md">
                        <StatLabel>완성도</StatLabel>
                        <StatNumber color="blue.500">{stats.completionRate.toFixed(1)}%</StatNumber>
                        <StatHelpText>
                            <Progress value={stats.completionRate} size="sm" colorScheme="blue" />
                        </StatHelpText>
                    </Stat>
                </SimpleGrid>

                {/* 필터 및 검색 */}
                <HStack spacing={4}>
                    <Select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        width="200px"
                    >
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>
                                {lang.flag} {lang.nativeName}
                            </option>
                        ))}
                    </Select>

                    <Select
                        value={selectedNamespace}
                        onChange={(e) => setSelectedNamespace(e.target.value)}
                        width="150px"
                    >
                        {namespaces.map(ns => (
                            <option key={ns} value={ns}>
                                {ns}
                            </option>
                        ))}
                    </Select>

                    <Input
                        placeholder="번역 키 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        width="300px"
                    />

                    <Button onClick={loadTranslationKeys} isLoading={isLoading}>
                        새로고침
                    </Button>
                </HStack>

                {/* 번역 테이블 */}
                <Box shadow="sm" borderWidth="1px" borderRadius="md" overflow="hidden">
                    <Table variant="simple" size="sm">
                        <Thead bg="gray.50">
                            <Tr>
                                <Th>번역 키</Th>
                                <Th>현재 번역</Th>
                                <Th>상태</Th>
                                <Th>마지막 수정</Th>
                                <Th>작업</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {translationKeys.map((key, index) => (
                                <Tr key={`${key.namespace}.${key.key}`}>
                                    <Td>
                                        <VStack align="start" spacing={0}>
                                            <Text fontWeight="medium">{key.key}</Text>
                                            <Text fontSize="xs" color="gray.500">{key.namespace}</Text>
                                        </VStack>
                                    </Td>
                                    <Td>
                                        <Text maxW="300px" isTruncated>
                                            {key.translations[selectedLanguage] || '번역 없음'}
                                        </Text>
                                    </Td>
                                    <Td>
                                        <Badge colorScheme={getStatusColor(key.status)} variant="subtle">
                                            {getStatusText(key.status)}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <Text fontSize="sm" color="gray.500">
                                            {key.lastModified}
                                        </Text>
                                    </Td>
                                    <Td>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEditTranslation(key)}
                                        >
                                            편집
                                        </Button>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>

                {/* 번역 편집 모달 */}
                <Modal isOpen={isOpen} onClose={onClose} size="lg">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>
                            번역 편집: {editingKey?.key}
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <VStack spacing={4}>
                                <FormControl>
                                    <FormLabel>언어</FormLabel>
                                    <Select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
                                        {SUPPORTED_LANGUAGES.map(lang => (
                                            <option key={lang.code} value={lang.code}>
                                                {lang.flag} {lang.nativeName}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>번역</FormLabel>
                                    <Textarea
                                        value={newTranslation}
                                        onChange={(e) => setNewTranslation(e.target.value)}
                                        placeholder="번역을 입력하세요..."
                                        rows={4}
                                    />
                                    <FormHelperText>
                                        현재 번역: {editingKey?.translations[selectedLanguage] || '없음'}
                                    </FormHelperText>
                                </FormControl>
                            </VStack>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={onClose}>
                                취소
                            </Button>
                            <Button colorScheme="blue" onClick={handleSaveTranslation}>
                                저장
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </VStack>
        </Box>
    );
};

export default TranslationManager;
