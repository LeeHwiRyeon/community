import React, { useState } from 'react'
import { Box, Button, VStack, HStack, Text, Input, Select, Badge, Grid, Card, CardBody, Heading, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, FormControl, FormLabel } from '@chakra-ui/react'
import Countdown from 'react-countdown'

// Mock promotion data
const mockPromotions = [
    {
        id: 1,
        type: 'flash_sale',
        title: '번개 세일',
        description: '1시간 동안 모든 상품 50% 할인',
        discount: 50,
        endTime: Date.now() + 3600000, // 1 hour from now
        isActive: true
    },
    {
        id: 2,
        type: 'coupon',
        title: '봄맞이 쿠폰',
        description: '₩10,000 이상 구매 시 ₩5,000 할인',
        discount: 5000,
        endTime: Date.now() + 86400000 * 7, // 7 days from now
        isActive: true
    }
]

interface Coupon {
    id: string
    code: string
    discount: number
    type: 'percentage' | 'fixed'
    minPurchase: number
    expiryDate: string
    isActive: boolean
}

const PromotionTools: React.FC = () => {
    const [promotions, setPromotions] = useState(mockPromotions)
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discount: 0,
        type: 'percentage' as 'percentage' | 'fixed',
        minPurchase: 0,
        expiryDate: ''
    })
    const { isOpen, onOpen, onClose } = useDisclosure()
    const toast = useToast()

    const handleCreateCoupon = () => {
        const coupon: Coupon = {
            id: Date.now().toString(),
            code: newCoupon.code,
            discount: newCoupon.discount,
            type: newCoupon.type,
            minPurchase: newCoupon.minPurchase,
            expiryDate: newCoupon.expiryDate,
            isActive: true
        }
        setCoupons([...coupons, coupon])
        setNewCoupon({
            code: '',
            discount: 0,
            type: 'percentage',
            minPurchase: 0,
            expiryDate: ''
        })
        onClose()
        toast({
            title: '쿠폰 생성 성공',
            description: '새 쿠폰이 생성되었습니다.',
            status: 'success',
            duration: 3000,
            isClosable: true,
        })
    }

    const handleCreateFlashSale = () => {
        const flashSale = {
            id: Date.now(),
            type: 'flash_sale',
            title: '긴급 세일',
            description: '30분 동안 모든 상품 30% 할인',
            discount: 30,
            endTime: Date.now() + 1800000, // 30 minutes
            isActive: true
        }
        setPromotions([...promotions, flashSale])
        toast({
            title: '번개 세일 생성',
            description: '번개 세일이 시작되었습니다.',
            status: 'success',
            duration: 3000,
            isClosable: true,
        })
    }

    const CountdownRenderer = ({ hours, minutes, seconds, completed }: any) => {
        if (completed) {
            return <Text color="red.500" fontWeight="bold">종료됨</Text>
        }
        return (
            <HStack spacing={1}>
                <Badge colorScheme="red" fontSize="md" p={1}>
                    {hours.toString().padStart(2, '0')}
                </Badge>
                <Text>:</Text>
                <Badge colorScheme="red" fontSize="md" p={1}>
                    {minutes.toString().padStart(2, '0')}
                </Badge>
                <Text>:</Text>
                <Badge colorScheme="red" fontSize="md" p={1}>
                    {seconds.toString().padStart(2, '0')}
                </Badge>
            </HStack>
        )
    }

    return (
        <Box>
            <VStack spacing={6} align="stretch">
                <HStack justify="space-between" align="center">
                    <Heading size="lg">프로모션 및 마케팅 도구</Heading>
                    <HStack>
                        <Button colorScheme="purple" onClick={onOpen}>
                            쿠폰 생성
                        </Button>
                        <Button colorScheme="orange" onClick={handleCreateFlashSale}>
                            번개 세일 시작
                        </Button>
                    </HStack>
                </HStack>

                {/* Active Promotions */}
                <Box>
                    <Heading size="md" mb={4}>활성 프로모션</Heading>
                    <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={4}>
                        {promotions.filter(p => p.isActive).map((promo) => (
                            <Card key={promo.id}>
                                <CardBody>
                                    <VStack align="stretch" spacing={3}>
                                        <HStack justify="space-between">
                                            <Badge colorScheme={promo.type === 'flash_sale' ? 'red' : 'green'}>
                                                {promo.type === 'flash_sale' ? '번개 세일' : '쿠폰'}
                                            </Badge>
                                            <Text fontSize="sm" color="gray.500">
                                                {promo.discount}{promo.type === 'flash_sale' ? '%' : '원'} 할인
                                            </Text>
                                        </HStack>

                                        <Heading size="sm">{promo.title}</Heading>
                                        <Text fontSize="sm">{promo.description}</Text>

                                        {promo.type === 'flash_sale' && (
                                            <Box>
                                                <Text fontSize="sm" mb={1}>남은 시간:</Text>
                                                <Countdown
                                                    date={promo.endTime}
                                                    renderer={CountdownRenderer}
                                                />
                                            </Box>
                                        )}

                                        <HStack spacing={2}>
                                            <Button size="sm" colorScheme="blue" flex={1}>
                                                공유하기
                                            </Button>
                                            <Button size="sm" variant="outline" flex={1}>
                                                수정
                                            </Button>
                                        </HStack>
                                    </VStack>
                                </CardBody>
                            </Card>
                        ))}
                    </Grid>
                </Box>

                {/* Coupons List */}
                <Box>
                    <Heading size="md" mb={4}>쿠폰 목록</Heading>
                    <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={4}>
                        {coupons.map((coupon) => (
                            <Card key={coupon.id}>
                                <CardBody>
                                    <VStack align="stretch" spacing={2}>
                                        <HStack justify="space-between">
                                            <Badge colorScheme="green">쿠폰</Badge>
                                            <Text fontWeight="bold" fontSize="lg">
                                                {coupon.code}
                                            </Text>
                                        </HStack>

                                        <Text>
                                            {coupon.type === 'percentage'
                                                ? `${coupon.discount}% 할인`
                                                : `${coupon.discount.toLocaleString()}원 할인`
                                            }
                                        </Text>

                                        <Text fontSize="sm" color="gray.600">
                                            최소 구매금액: ₩{coupon.minPurchase.toLocaleString()}
                                        </Text>

                                        <Text fontSize="sm" color="gray.600">
                                            만료일: {new Date(coupon.expiryDate).toLocaleDateString()}
                                        </Text>

                                        <HStack spacing={2}>
                                            <Button size="sm" colorScheme="blue" flex={1}>
                                                복사
                                            </Button>
                                            <Button size="sm" variant="outline" flex={1}>
                                                비활성화
                                            </Button>
                                        </HStack>
                                    </VStack>
                                </CardBody>
                            </Card>
                        ))}
                    </Grid>
                </Box>

                {/* Social Sharing */}
                <Box>
                    <Heading size="md" mb={4}>소셜 공유</Heading>
                    <HStack spacing={4}>
                        <Button colorScheme="facebook" leftIcon={<Text>📘</Text>}>
                            Facebook 공유
                        </Button>
                        <Button colorScheme="twitter" leftIcon={<Text>🐦</Text>}>
                            Twitter 공유
                        </Button>
                        <Button colorScheme="pink" leftIcon={<Text>📷</Text>}>
                            Instagram 공유
                        </Button>
                    </HStack>
                </Box>

                {/* Newsletter */}
                <Box>
                    <Heading size="md" mb={4}>이메일 뉴스레터</Heading>
                    <VStack align="stretch" spacing={4}>
                        <Text>구독자 수: 1,234명</Text>
                        <HStack>
                            <Input placeholder="뉴스레터 제목" />
                            <Button colorScheme="blue">보내기</Button>
                        </HStack>
                    </VStack>
                </Box>
            </VStack>

            {/* Create Coupon Modal */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay bg="transparent" />
                <ModalContent>
                    <ModalHeader>쿠폰 생성</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>쿠폰 코드</FormLabel>
                                <Input
                                    value={newCoupon.code}
                                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                                    placeholder="SPRING2024"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>할인 유형</FormLabel>
                                <Select
                                    value={newCoupon.type}
                                    onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as 'percentage' | 'fixed' })}
                                >
                                    <option value="percentage">퍼센트 할인</option>
                                    <option value="fixed">고정 금액 할인</option>
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>할인 값</FormLabel>
                                <Input
                                    type="number"
                                    value={newCoupon.discount}
                                    onChange={(e) => setNewCoupon({ ...newCoupon, discount: Number(e.target.value) })}
                                    placeholder={newCoupon.type === 'percentage' ? '30' : '5000'}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>최소 구매금액</FormLabel>
                                <Input
                                    type="number"
                                    value={newCoupon.minPurchase}
                                    onChange={(e) => setNewCoupon({ ...newCoupon, minPurchase: Number(e.target.value) })}
                                    placeholder="10000"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>만료일</FormLabel>
                                <Input
                                    type="date"
                                    value={newCoupon.expiryDate}
                                    onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                                />
                            </FormControl>

                            <Button colorScheme="blue" onClick={handleCreateCoupon} w="100%">
                                쿠폰 생성
                            </Button>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    )
}

export default PromotionTools