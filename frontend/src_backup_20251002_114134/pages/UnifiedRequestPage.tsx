import React from 'react';
import {
    Box,
    VStack,
    Text,
    Divider,
    Container,
    Heading,
    Badge,
    HStack,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription
} from '@chakra-ui/react';
import UnifiedRequestForm from '../components/UnifiedRequestForm';

interface UnifiedRequestPageProps {
    defaultTab?: number;
}

const UnifiedRequestPage: React.FC<UnifiedRequestPageProps> = ({ defaultTab = 0 }) => {
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

                {/* Main Content with Tabs */}
                <Tabs defaultIndex={defaultTab}>
                    <TabList>
                        <Tab>Basic Requests</Tab>
                        <Tab>Scheduled Requests</Tab>
                        <Tab>Bulk Requests</Tab>
                        <Tab>Template Requests</Tab>
                        <Tab>Request History</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel px={0}>
                            <VStack spacing={4} align="stretch">
                                <Alert status="info">
                                    <AlertIcon />
                                    <AlertTitle>Basic Requests</AlertTitle>
                                    <AlertDescription>
                                        Submit standard requests like posts, comments, likes, and shares.
                                    </AlertDescription>
                                </Alert>
                                <UnifiedRequestForm />
                            </VStack>
                        </TabPanel>

                        <TabPanel px={0}>
                            <VStack spacing={4} align="stretch">
                                <Alert status="warning">
                                    <AlertIcon />
                                    <AlertTitle>Scheduled Requests</AlertTitle>
                                    <AlertDescription>
                                        Schedule requests to be executed at specific times or recurring intervals.
                                    </AlertDescription>
                                </Alert>
                                <UnifiedRequestForm />
                            </VStack>
                        </TabPanel>

                        <TabPanel px={0}>
                            <VStack spacing={4} align="stretch">
                                <Alert status="success">
                                    <AlertIcon />
                                    <AlertTitle>Bulk Requests</AlertTitle>
                                    <AlertDescription>
                                        Submit multiple requests at once using CSV or JSON format.
                                    </AlertDescription>
                                </Alert>
                                <UnifiedRequestForm />
                            </VStack>
                        </TabPanel>

                        <TabPanel px={0}>
                            <VStack spacing={4} align="stretch">
                                <Alert status="purple">
                                    <AlertIcon />
                                    <AlertTitle>Template Requests</AlertTitle>
                                    <AlertDescription>
                                        Use pre-defined templates for common request types.
                                    </AlertDescription>
                                </Alert>
                                <UnifiedRequestForm />
                            </VStack>
                        </TabPanel>

                        <TabPanel px={0}>
                            <VStack spacing={4} align="stretch">
                                <Alert status="blue">
                                    <AlertIcon />
                                    <AlertTitle>Request History</AlertTitle>
                                    <AlertDescription>
                                        View and manage all your submitted requests.
                                    </AlertDescription>
                                </Alert>
                                <UnifiedRequestForm />
                            </VStack>
                        </TabPanel>
                    </TabPanels>
                </Tabs>

                {/* Instructions */}
                <Box p={6} bg="gray.50" borderRadius="lg">
                    <VStack spacing={4} align="start">
                        <Heading as="h3" size="md" color="gray.700">
                            How to Use the Unified Request Center
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
                            <Text fontSize="sm" color="gray.600">
                                • <strong>Request History:</strong> All requests are saved and can be viewed in the history tab
                            </Text>
                        </VStack>
                    </VStack>
                </Box>
            </VStack>
        </Container>
    );
};

export default UnifiedRequestPage;
