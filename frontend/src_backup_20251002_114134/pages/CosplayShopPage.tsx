import React, { useState, useEffect } from 'react'
import { Box, Button, Grid, Heading, Text, VStack, HStack, Select, Input, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, useToast, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react'
import { useTheme, Theme } from '../contexts/ThemeContext'
import ProductDisplay from '../components/ProductDisplay'
import PromotionTools from '../components/PromotionTools'
import AnalyticsDashboard from '../components/AnalyticsDashboard'

const CosplayShopPage: React.FC = () => {
    const { currentTheme, setTheme, customizations, setCustomizations } = useTheme()
    const { isOpen, onOpen, onClose } = useDisclosure()
    const toast = useToast()
    const [themes, setThemes] = useState<Theme[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchThemes()
    }, [])

    const fetchThemes = async () => {
        try {
            const response = await fetch('/api/themes')
            const data = await response.json()
            setThemes(data)
        } catch (error) {
            console.error('Failed to fetch themes:', error)
            toast({
                title: '테마 로딩 실패',
                description: '테마 목록을 불러오지 못했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        } finally {
            setLoading(false)
        }
    }

    const handleThemeSelect = (theme: Theme) => {
        setTheme(theme)
    }

    const handleCustomizationChange = (key: keyof typeof customizations, value: string) => {
        setCustomizations({ [key]: value })
    }

    const handlePreview = () => {
        onOpen()
    }

    const handleSaveTheme = async () => {
        try {
            const response = await fetch('/api/themes/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    theme: currentTheme,
                    customizations: customizations
                }),
            })
            const data = await response.json()
            toast({
                title: '테마 저장 완료',
                description: data.message,
                status: 'success',
                duration: 3000,
                isClosable: true,
            })
        } catch (error) {
            console.error('Failed to save theme:', error)
            toast({
                title: '테마 저장 실패',
                description: '테마 저장 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    if (loading) {
        return <Box p={8}><Text>테마를 불러오는 중...</Text></Box>
    }

    return (
        <Box p={8} maxW="1200px" mx="auto">
            <Heading mb={6}>코스프레 상점</Heading>

            <Tabs variant="enclosed">
                <TabList>
                    <Tab>테마 설정</Tab>
                    <Tab>상품 전시</Tab>
                    <Tab>프로모션</Tab>
                    <Tab>분석</Tab>
                </TabList>

                <TabPanels>
                    <TabPanel>
                        <VStack spacing={6} align="stretch">
                            {/* 기본 테마 선택 */}
                            <Box>
                                <Heading size="md" mb={4}>기본 테마 선택</Heading>
                                <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                                    {themes.map((theme) => (
                                        <Box
                                            key={theme.id}
                                            p={4}
                                            borderWidth={2}
                                            borderColor={currentTheme.id === theme.id ? 'blue.500' : 'gray.200'}
                                            borderRadius="md"
                                            cursor="pointer"
                                            onClick={() => handleThemeSelect(theme)}
                                            bg={`linear-gradient(45deg, ${theme.primaryColor}, ${theme.secondaryColor})`}
                                            color="white"
                                        >
                                            <Text fontWeight="bold">{theme.name}</Text>
                                            <Text fontSize="sm">폰트: {theme.fontFamily.split(',')[0]}</Text>
                                            <Text fontSize="sm">레이아웃: {theme.layout}</Text>
                                        </Box>
                                    ))}
                                </Grid>
                            </Box>

                            {/* 커스터마이징 옵션 섹션 */}
                            <Box>
                                <Heading size="md" mb={4}>커스터마이징 옵션</Heading>
                                <VStack spacing={4} align="stretch">
                                    <HStack>
                                        <Text w="150px">기본 색상:</Text>
                                        <Input
                                            type="color"
                                            value={customizations.primaryColor}
                                            onChange={(e) => handleCustomizationChange('primaryColor', e.target.value)}
                                            w="100px"
                                        />
                                    </HStack>
                                    <HStack>
                                        <Text w="150px">보조 색상:</Text>
                                        <Input
                                            type="color"
                                            value={customizations.secondaryColor}
                                            onChange={(e) => handleCustomizationChange('secondaryColor', e.target.value)}
                                            w="100px"
                                        />
                                    </HStack>
                                    <HStack>
                                        <Text w="150px">폰트 패밀리:</Text>
                                        <Select value={customizations.fontFamily} onChange={(e) => handleCustomizationChange('fontFamily', e.target.value)}>
                                            <option value="Arial, sans-serif">Arial</option>
                                            <option value="Georgia, serif">Georgia</option>
                                            <option value="Helvetica, sans-serif">Helvetica</option>
                                            <option value="'Comic Sans MS', cursive">Comic Sans</option>
                                            <option value="'Courier New', monospace">Courier New</option>
                                        </Select>
                                    </HStack>
                                    <HStack>
                                        <Text w="150px">레이아웃:</Text>
                                        <Select value={customizations.layout} onChange={(e) => handleCustomizationChange('layout', e.target.value)}>
                                            <option value="grid">그리드</option>
                                            <option value="list">리스트</option>
                                        </Select>
                                    </HStack>
                                </VStack>
                            </Box>

                            {/* 액션 버튼 */}
                            <HStack spacing={4}>
                                <Button colorScheme="blue" onClick={handlePreview}>
                                    미리보기
                                </Button>
                                <Button colorScheme="green" onClick={handleSaveTheme}>
                                    테마 저장
                                </Button>
                            </HStack>
                        </VStack>
                    </TabPanel>

                    <TabPanel>
                        <ProductDisplay />
                    </TabPanel>

                    <TabPanel>
                        <PromotionTools />
                    </TabPanel>

                    <TabPanel>
                        <AnalyticsDashboard />
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* 미리보기 모달 */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay bg="transparent" />
                <ModalContent>
                    <ModalHeader>테마 미리보기</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <Box
                            p={4}
                            borderRadius="md"
                            style={{
                                background: `linear-gradient(45deg, ${customizations.primaryColor}, ${customizations.secondaryColor})`,
                                fontFamily: customizations.fontFamily,
                                color: 'white'
                            }}
                        >
                            <Heading size="lg" mb={4}>코스프레 상점</Heading>
                            <Text mb={4}>선택한 테마를 미리보기로 확인합니다.</Text>
                            <Box display={customizations.layout === 'grid' ? 'grid' : 'flex'} gridTemplateColumns={customizations.layout === 'grid' ? 'repeat(3, 1fr)' : undefined} gap={4}>
                                {[1, 2, 3].map((item) => (
                                    <Box key={item} p={3} bg="rgba(255,255,255,0.2)" borderRadius="md">
                                        상품 {item}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    )
}

export default CosplayShopPage


