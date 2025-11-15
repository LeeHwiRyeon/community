import React from 'react';
import {
    Box,
    Container,
    Heading,
    Text,
    SimpleGrid,
    Card,
    CardBody,
    Button,
    VStack,
    HStack,
    Icon,
    useColorModeValue
} from '@chakra-ui/react';
import { FiTrendingUp, FiUsers, FiMessageSquare, FiFileText } from 'react-icons/fi';
import RecommendedPosts from '../components/RecommendedPosts';
import { useAuthContext } from '../components/Auth/AuthProvider';

const Home: React.FC = () => {
    const { user } = useAuthContext();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    return (
        <Container maxWidth="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                {/* 헤더 */}
                <Box textAlign="center">
                    <Heading size="2xl" mb={4}>
                        🏠 Community Hub
                    </Heading>
                    <Text fontSize="xl" color="gray.600">
                        Welcome to TheNewsPaper Community Platform
                    </Text>
                </Box>

                {/* 기능 카드 */}
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                        <CardBody>
                            <VStack align="start" spacing={3}>
                                <HStack>
                                    <Icon as={FiFileText} boxSize={6} color="blue.500" />
                                    <Heading size="md">📰 Latest News</Heading>
                                </HStack>
                                <Text color="gray.600">
                                    Stay updated with the latest community news and announcements.
                                </Text>
                                <Button colorScheme="blue" size="sm">
                                    Read More
                                </Button>
                            </VStack>
                        </CardBody>
                    </Card>

                    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                        <CardBody>
                            <VStack align="start" spacing={3}>
                                <HStack>
                                    <Icon as={FiUsers} boxSize={6} color="green.500" />
                                    <Heading size="md">👥 Communities</Heading>
                                </HStack>
                                <Text color="gray.600">
                                    Join various communities and connect with like-minded people.
                                </Text>
                                <Button colorScheme="green" size="sm">
                                    Explore
                                </Button>
                            </VStack>
                        </CardBody>
                    </Card>

                    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                        <CardBody>
                            <VStack align="start" spacing={3}>
                                <HStack>
                                    <Icon as={FiMessageSquare} boxSize={6} color="purple.500" />
                                    <Heading size="md">💬 Discussions</Heading>
                                </HStack>
                                <Text color="gray.600">
                                    Participate in engaging discussions and share your thoughts.
                                </Text>
                                <Button colorScheme="purple" size="sm">
                                    Join Discussion
                                </Button>
                            </VStack>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                {/* 추천 게시물 섹션 */}
                <Box>
                    <RecommendedPosts
                        userId={user?.id}
                        limit={10}
                        recommendationType="hybrid"
                    />
                </Box>

                {/* 트렌딩 게시물 섹션 */}
                <Box>
                    <RecommendedPosts
                        limit={5}
                        showTrending={true}
                    />
                </Box>
            </VStack>
        </Container>
    );
};

export default Home;