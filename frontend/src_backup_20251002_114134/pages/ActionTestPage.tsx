import React from 'react';
import {
    Box,
    VStack,
    Text,
    Divider,
    Container,
    Heading,
    Badge,
    HStack
} from '@chakra-ui/react';
import UnifiedRequestForm from '../components/UnifiedRequestForm';

const ActionTestPage: React.FC = () => {
    return (
        <Container maxW="6xl" py={8}>
            <VStack spacing={8} align="stretch">
                {/* Page Header */}
                <Box textAlign="center">
                    <Heading as="h1" size="2xl" mb={4}>
                        Unified Request Center
                    </Heading>
                    <Text fontSize="lg" color="gray.600" mb={4}>
                        Submit any type of request through a single, unified interface
                    </Text>
                    <HStack spacing={4} justify="center" wrap="wrap">
                        <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                            All-in-One
                        </Badge>
                        <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                            Smart Forms
                        </Badge>
                        <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                            Auto-Translation
                        </Badge>
                        <Badge colorScheme="orange" fontSize="sm" px={3} py={1}>
                            Scheduled Actions
                        </Badge>
                    </HStack>
                </Box>

                <Divider />

                {/* Unified Request Form */}
                <Box>
                    <UnifiedRequestForm />
                </Box>

                {/* Instructions */}
                <Box p={6} bg="gray.50" borderRadius="lg">
                    <VStack spacing={4} align="start">
                        <Heading as="h3" size="md" color="gray.700">
                            How to Use
                        </Heading>
                        <VStack spacing={2} align="start">
                            <Text fontSize="sm" color="gray.600">
                                • <strong>Basic Request:</strong> Submit posts, comments, likes, and other standard requests
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                                • <strong>Scheduled Request:</strong> Schedule requests to be executed at specific times
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                                • <strong>Bulk Request:</strong> Submit multiple requests at once using CSV or JSON
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                                • <strong>Template Request:</strong> Use pre-defined templates for common request types
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                                • <strong>Auto-Translation:</strong> Korean input is automatically translated to English
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                                • <strong>Keyboard Shortcuts:</strong> Use Ctrl+S to submit, Ctrl+R to reset, Ctrl+H for help
                            </Text>
                        </VStack>
                    </VStack>
                </Box>
            </VStack>
        </Container>
    );
};

export default ActionTestPage;
