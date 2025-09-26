import React, { useState } from 'react'
import { Box, Image, Text, VStack, HStack, Button, Grid, Badge, IconButton, useDisclosure, Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton } from '@chakra-ui/react'
import Slider from 'react-slick'
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from '@chakra-ui/icons'
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"

// Mock product data
const mockProducts = [
    {
        id: 1,
        name: '코스프레 의상 A',
        price: 89000,
        image: 'https://via.placeholder.com/300x400?text=Product+A',
        category: '의상',
        rating: 4.5,
        reviews: 23,
        isNew: true,
        discount: 10
    },
    {
        id: 2,
        name: '코스프레 액세서리 B',
        price: 25000,
        image: 'https://via.placeholder.com/300x400?text=Product+B',
        category: '액세서리',
        rating: 4.8,
        reviews: 45,
        isNew: false,
        discount: 0
    },
    {
        id: 3,
        name: '코스프레 소품 C',
        price: 15000,
        image: 'https://via.placeholder.com/300x400?text=Product+C',
        category: '소품',
        rating: 4.2,
        reviews: 12,
        isNew: true,
        discount: 15
    },
    {
        id: 4,
        name: '코스프레 의상 D',
        price: 120000,
        image: 'https://via.placeholder.com/300x400?text=Product+D',
        category: '의상',
        rating: 4.7,
        reviews: 67,
        isNew: false,
        discount: 5
    }
]

const heroBanners = [
    { id: 1, image: 'https://via.placeholder.com/1200x400?text=Hero+Banner+1', title: '봄 시즌 코스프레 컬렉션' },
    { id: 2, image: 'https://via.placeholder.com/1200x400?text=Hero+Banner+2', title: '인기 캐릭터 의상 특가' },
    { id: 3, image: 'https://via.placeholder.com/1200x400?text=Hero+Banner+3', title: '새로운 액세서리 출시' }
]

interface ProductCardProps {
    product: typeof mockProducts[0]
    onZoom: (image: string) => void
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onZoom }) => {
    return (
        <Box
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            bg="white"
            shadow="md"
            transition="all 0.3s"
            _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
            cursor="pointer"
        >
            <Box position="relative">
                <Image
                    src={product.image}
                    alt={product.name}
                    w="100%"
                    h="300px"
                    objectFit="cover"
                    onClick={() => onZoom(product.image)}
                />
                {product.isNew && (
                    <Badge position="absolute" top={2} left={2} colorScheme="green">
                        NEW
                    </Badge>
                )}
                {product.discount > 0 && (
                    <Badge position="absolute" top={2} right={2} colorScheme="red">
                        -{product.discount}%
                    </Badge>
                )}
            </Box>

            <VStack p={4} align="stretch" spacing={2}>
                <Text fontSize="sm" color="gray.500">{product.category}</Text>
                <Text fontWeight="bold" fontSize="lg" noOfLines={2}>
                    {product.name}
                </Text>

                <HStack justify="space-between" align="center">
                    <VStack align="start" spacing={0}>
                        <Text fontSize="xl" fontWeight="bold" color="red.500">
                            {product.discount > 0 ? (
                                <>
                                    <Text as="span" textDecoration="line-through" color="gray.500" fontSize="md">
                                        ₩{product.price.toLocaleString()}
                                    </Text>
                                    {' '}
                                    ₩{Math.floor(product.price * (1 - product.discount / 100)).toLocaleString()}
                                </>
                            ) : (
                                `₩${product.price.toLocaleString()}`
                            )}
                        </Text>
                    </VStack>

                    <HStack>
                        <StarIcon color="yellow.400" />
                        <Text fontSize="sm">{product.rating} ({product.reviews})</Text>
                    </HStack>
                </HStack>

                <Button colorScheme="blue" size="sm" w="100%">
                    장바구니 담기
                </Button>
            </VStack>
        </Box>
    )
}

const ProductDisplay: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('전체')
    const [zoomedImage, setZoomedImage] = useState<string | null>(null)
    const { isOpen, onOpen, onClose } = useDisclosure()

    const categories = ['전체', '의상', '액세서리', '소품']

    const filteredProducts = selectedCategory === '전체'
        ? mockProducts
        : mockProducts.filter(product => product.category === selectedCategory)

    const heroSettings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 4000,
        nextArrow: <ChevronRightIcon />,
        prevArrow: <ChevronLeftIcon />
    }

    const productSettings = {
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 1,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1,
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                }
            }
        ]
    }

    const handleZoom = (image: string) => {
        setZoomedImage(image)
        onOpen()
    }

    return (
        <Box>
            {/* Hero Banner Slider */}
            <Box mb={8}>
                <Slider {...heroSettings}>
                    {heroBanners.map((banner) => (
                        <Box key={banner.id} position="relative">
                            <Image
                                src={banner.image}
                                alt={banner.title}
                                w="100%"
                                h="400px"
                                objectFit="cover"
                            />
                            <Box
                                position="absolute"
                                bottom={0}
                                left={0}
                                right={0}
                                bg="rgba(0,0,0,0.7)"
                                p={6}
                            >
                                <Text fontSize="2xl" fontWeight="bold" color="white">
                                    {banner.title}
                                </Text>
                            </Box>
                        </Box>
                    ))}
                </Slider>
            </Box>

            {/* Category Filter */}
            <HStack spacing={4} mb={6} wrap="wrap">
                {categories.map((category) => (
                    <Button
                        key={category}
                        variant={selectedCategory === category ? 'solid' : 'outline'}
                        colorScheme="blue"
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category}
                    </Button>
                ))}
            </HStack>

            {/* Recommended Products */}
            <Box mb={8}>
                <Text fontSize="2xl" fontWeight="bold" mb={4}>추천 상품</Text>
                <Slider {...productSettings}>
                    {filteredProducts.map((product) => (
                        <Box key={product.id} px={2}>
                            <ProductCard product={product} onZoom={handleZoom} />
                        </Box>
                    ))}
                </Slider>
            </Box>

            {/* Product Grid */}
            <Box>
                <Text fontSize="2xl" fontWeight="bold" mb={4}>전체 상품</Text>
                <Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={6}>
                    {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} onZoom={handleZoom} />
                    ))}
                </Grid>
            </Box>

            {/* Image Zoom Modal */}
            {zoomedImage && (
                <Modal isOpen={isOpen} onClose={onClose} size="xl">
                    <ModalOverlay bg="transparent" />
                    <ModalContent>
                        <ModalCloseButton />
                        <ModalBody p={0}>
                            <Image
                                src={zoomedImage}
                                alt="Zoomed product"
                                w="100%"
                                h="auto"
                                objectFit="contain"
                            />
                        </ModalBody>
                    </ModalContent>
                </Modal>
            )}
        </Box>
    )
}

export default ProductDisplay