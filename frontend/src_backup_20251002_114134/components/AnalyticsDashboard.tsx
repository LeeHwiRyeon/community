import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Grid,
    GridItem,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Progress,
    Badge,
    Divider,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Card,
    CardHeader,
    CardBody,
    Heading,
    Button,
    Switch,
    FormControl,
    FormLabel,
    useColorModeValue,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Flex,
    Spacer,
    IconButton,
    Tooltip,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure
} from '@chakra-ui/react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';
import {
    DownloadIcon,
    DeleteIcon,
    RefreshIcon,
    InfoIcon
} from '@chakra-ui/icons';
import { analyticsManager, ActionAnalytics, UsagePattern } from '../utils/analytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AnalyticsDashboard: React.FC = () => {
    const [analytics, setAnalytics] = useState<ActionAnalytics | null>(null);
    const [usagePatterns, setUsagePatterns] = useState<UsagePattern | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnabled, setIsEnabled] = useState(analyticsManager.isAnalyticsEnabled());
    const { isOpen, onOpen, onClose } = useDisclosure();

    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = () => {
        setIsLoading(true);
        try {
            const analyticsData = analyticsManager.getAnalytics();
            const patterns = analyticsManager.getUsagePatterns();
            setAnalytics(analyticsData);
            setUsagePatterns(patterns);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleAnalytics = () => {
        const newState = !isEnabled;
        setIsEnabled(newState);
        analyticsManager.setEnabled(newState);
    };

    const handleClearData = () => {
        analyticsManager.clearAnalytics();
        loadAnalytics();
    };

    const handleExportData = (format: 'json' | 'csv') => {
        const data = analyticsManager.exportData(format);
        const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <Box p={8} textAlign="center">
                <Text>Loading analytics...</Text>
            </Box>
        );
    }

    if (!analytics) {
        return (
            <Alert status="error">
                <AlertIcon />
                <AlertTitle>Failed to load analytics!</AlertTitle>
                <AlertDescription>Unable to load analytics data. Please try refreshing the page.</AlertDescription>
            </Alert>
        );
    }

    // Prepare chart data
    const actionTypeData = Object.entries(analytics.actionsByType).map(([type, count]) => ({
        name: type.replace('POST_CREATE', 'Post').replace('COMMENT_ADD', 'Comment').replace('LIKE_ADD', 'Like').replace('SHARE_ACTION', 'Share').replace('FOLLOW_USER', 'Follow').replace('BOOKMARK_ADD', 'Bookmark'),
        value: count,
        count
    }));

    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        actions: analytics.actionsByHour[i] || 0
    }));

    const dailyData = Object.entries(analytics.actionsByDay).map(([day, count]) => ({
        day: day.substring(0, 3),
        actions: count
    }));

    return (
        <Box p={6}>
            <VStack spacing={6} align="stretch">
                {/* Header */}
                <Flex justify="space-between" align="center">
                    <Box>
                        <Heading size="lg" mb={2}>Action Analytics Dashboard</Heading>
                        <Text color="gray.600">Track usage patterns and performance metrics</Text>
                    </Box>
                    <HStack spacing={3}>
                        <FormControl display="flex" alignItems="center" width="auto">
                            <FormLabel htmlFor="analytics-toggle" mb="0" fontSize="sm">
                                Analytics
                            </FormLabel>
                            <Switch
                                id="analytics-toggle"
                                isChecked={isEnabled}
                                onChange={handleToggleAnalytics}
                                colorScheme="blue"
                            />
                        </FormControl>
                        <Tooltip label="Refresh data">
                            <IconButton
                                aria-label="Refresh analytics"
                                icon={<RefreshIcon />}
                                onClick={loadAnalytics}
                                size="sm"
                                variant="outline"
                            />
                        </Tooltip>
                        <Button
                            leftIcon={<DownloadIcon />}
                            size="sm"
                            variant="outline"
                            onClick={onOpen}
                        >
                            Export
                        </Button>
                        <Tooltip label="Clear all data">
                            <IconButton
                                aria-label="Clear analytics data"
                                icon={<DeleteIcon />}
                                onClick={handleClearData}
                                size="sm"
                                variant="outline"
                                colorScheme="red"
                            />
                        </Tooltip>
                    </HStack>
                </Flex>

                {/* Key Metrics */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
                    <GridItem>
                        <Card bg={cardBg} borderColor={borderColor}>
                            <CardBody>
                                <Stat>
                                    <StatLabel>Total Actions</StatLabel>
                                    <StatNumber>{analytics.totalActions}</StatNumber>
                                    <StatHelpText>
                                        <StatArrow type="increase" />
                                        Last 7 days
                                    </StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                    </GridItem>

                    <GridItem>
                        <Card bg={cardBg} borderColor={borderColor}>
                            <CardBody>
                                <Stat>
                                    <StatLabel>Total Sessions</StatLabel>
                                    <StatNumber>{analytics.totalSessions}</StatNumber>
                                    <StatHelpText>
                                        Average: {analytics.averageActionsPerSession} actions/session
                                    </StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                    </GridItem>

                    <GridItem>
                        <Card bg={cardBg} borderColor={borderColor}>
                            <CardBody>
                                <Stat>
                                    <StatLabel>Keyboard Usage</StatLabel>
                                    <StatNumber>{analytics.keyboardShortcutUsage}%</StatNumber>
                                    <StatHelpText>
                                        Actions via shortcuts
                                    </StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                    </GridItem>

                    <GridItem>
                        <Card bg={cardBg} borderColor={borderColor}>
                            <CardBody>
                                <Stat>
                                    <StatLabel>Error Rate</StatLabel>
                                    <StatNumber>{analytics.errorRate}%</StatNumber>
                                    <StatHelpText>
                                        Failed actions
                                    </StatHelpText>
                                </Stat>
                            </CardBody>
                        </Card>
                    </GridItem>
                </Grid>

                {/* Charts Row */}
                <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
                    {/* Action Types Pie Chart */}
                    <Card bg={cardBg} borderColor={borderColor}>
                        <CardHeader>
                            <Heading size="md">Action Distribution</Heading>
                        </CardHeader>
                        <CardBody>
                            <Box height="300px">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={actionTypeData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {actionTypeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardBody>
                    </Card>

                    {/* Hourly Usage Bar Chart */}
                    <Card bg={cardBg} borderColor={borderColor}>
                        <CardHeader>
                            <Heading size="md">Hourly Usage Pattern</Heading>
                        </CardHeader>
                        <CardBody>
                            <Box height="300px">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={hourlyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="hour" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Bar dataKey="actions" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardBody>
                    </Card>
                </Grid>

                {/* Usage Patterns and Recent Activity */}
                <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
                    {/* Usage Patterns */}
                    <Card bg={cardBg} borderColor={borderColor}>
                        <CardHeader>
                            <Heading size="md">Usage Patterns</Heading>
                        </CardHeader>
                        <CardBody>
                            {usagePatterns && (
                                <VStack spacing={4} align="stretch">
                                    <HStack justify="space-between">
                                        <Text fontWeight="semibold">Time of Day:</Text>
                                        <Badge colorScheme="blue" textTransform="capitalize">
                                            {usagePatterns.timeOfDay}
                                        </Badge>
                                    </HStack>

                                    <HStack justify="space-between">
                                        <Text fontWeight="semibold">Day of Week:</Text>
                                        <Badge colorScheme="green" textTransform="capitalize">
                                            {usagePatterns.dayOfWeek}
                                        </Badge>
                                    </HStack>

                                    <HStack justify="space-between">
                                        <Text fontWeight="semibold">Usage Frequency:</Text>
                                        <Badge
                                            colorScheme={usagePatterns.frequency === 'high' ? 'red' : usagePatterns.frequency === 'medium' ? 'yellow' : 'gray'}
                                            textTransform="capitalize"
                                        >
                                            {usagePatterns.frequency}
                                        </Badge>
                                    </HStack>

                                    <Divider />

                                    <Box>
                                        <Text fontWeight="semibold" mb={2}>Preferred Actions:</Text>
                                        <HStack spacing={2} wrap="wrap">
                                            {usagePatterns.preferredActions.map((action, index) => (
                                                <Badge key={index} colorScheme="purple">
                                                    {action.replace('POST_CREATE', 'Post').replace('COMMENT_ADD', 'Comment').replace('LIKE_ADD', 'Like').replace('SHARE_ACTION', 'Share').replace('FOLLOW_USER', 'Follow').replace('BOOKMARK_ADD', 'Bookmark')}
                                                </Badge>
                                            ))}
                                        </HStack>
                                    </Box>

                                    <HStack justify="space-between">
                                        <Text fontWeight="semibold">Avg Session Length:</Text>
                                        <Text>{Math.floor(usagePatterns.averageSessionLength / 60)}m {usagePatterns.averageSessionLength % 60}s</Text>
                                    </HStack>
                                </VStack>
                            )}
                        </CardBody>
                    </Card>

                    {/* Recent Activity */}
                    <Card bg={cardBg} borderColor={borderColor}>
                        <CardHeader>
                            <Heading size="md">Recent Activity</Heading>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={2} align="stretch" maxHeight="300px" overflowY="auto">
                                {analyticsManager.getRecentActivity().map((action, index) => (
                                    <HStack key={index} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                                        <VStack align="start" spacing={0}>
                                            <Text fontSize="sm" fontWeight="semibold">
                                                {action.actionType.replace('POST_CREATE', 'Post').replace('COMMENT_ADD', 'Comment').replace('LIKE_ADD', 'Like').replace('SHARE_ACTION', 'Share').replace('FOLLOW_USER', 'Follow').replace('BOOKMARK_ADD', 'Bookmark')}
                                            </Text>
                                            <Text fontSize="xs" color="gray.500">
                                                {new Date(action.timestamp).toLocaleTimeString()}
                                            </Text>
                                        </VStack>
                                        <Badge colorScheme="blue" fontSize="xs">
                                            {(action as any).method || 'click'}
                                        </Badge>
                                    </HStack>
                                ))}
                                {analyticsManager.getRecentActivity().length === 0 && (
                                    <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                                        No recent activity
                                    </Text>
                                )}
                            </VStack>
                        </CardBody>
                    </Card>
                </Grid>

                {/* Detailed Statistics */}
                <Card bg={cardBg} borderColor={borderColor}>
                    <CardHeader>
                        <Heading size="md">Detailed Statistics</Heading>
                    </CardHeader>
                    <CardBody>
                        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                            <Box>
                                <Text fontWeight="semibold" mb={3}>Action Types Breakdown</Text>
                                <VStack spacing={2} align="stretch">
                                    {Object.entries(analytics.actionsByType).map(([type, count]) => (
                                        <HStack key={type} justify="space-between">
                                            <Text fontSize="sm">
                                                {type.replace('POST_CREATE', 'Post').replace('COMMENT_ADD', 'Comment').replace('LIKE_ADD', 'Like').replace('SHARE_ACTION', 'Share').replace('FOLLOW_USER', 'Follow').replace('BOOKMARK_ADD', 'Bookmark')}
                                            </Text>
                                            <HStack spacing={2}>
                                                <Text fontSize="sm" fontWeight="semibold">{count}</Text>
                                                <Progress
                                                    value={(count / analytics.totalActions) * 100}
                                                    size="sm"
                                                    width="100px"
                                                    colorScheme="blue"
                                                />
                                            </HStack>
                                        </HStack>
                                    ))}
                                </VStack>
                            </Box>

                            <Box>
                                <Text fontWeight="semibold" mb={3}>System Information</Text>
                                <VStack spacing={2} align="stretch">
                                    <HStack justify="space-between">
                                        <Text fontSize="sm">Most Used Action:</Text>
                                        <Badge colorScheme="green">
                                            {analytics.mostUsedAction.replace('POST_CREATE', 'Post').replace('COMMENT_ADD', 'Comment').replace('LIKE_ADD', 'Like').replace('SHARE_ACTION', 'Share').replace('FOLLOW_USER', 'Follow').replace('BOOKMARK_ADD', 'Bookmark')}
                                        </Badge>
                                    </HStack>

                                    <HStack justify="space-between">
                                        <Text fontSize="sm">Least Used Action:</Text>
                                        <Badge colorScheme="red">
                                            {analytics.leastUsedAction.replace('POST_CREATE', 'Post').replace('COMMENT_ADD', 'Comment').replace('LIKE_ADD', 'Like').replace('SHARE_ACTION', 'Share').replace('FOLLOW_USER', 'Follow').replace('BOOKMARK_ADD', 'Bookmark')}
                                        </Badge>
                                    </HStack>

                                    <HStack justify="space-between">
                                        <Text fontSize="sm">Peak Usage Hour:</Text>
                                        <Text fontSize="sm" fontWeight="semibold">{analytics.peakUsageHour}:00</Text>
                                    </HStack>

                                    <HStack justify="space-between">
                                        <Text fontSize="sm">Sound Enabled:</Text>
                                        <Text fontSize="sm" fontWeight="semibold">{analytics.soundEnabledUsage}%</Text>
                                    </HStack>

                                    <HStack justify="space-between">
                                        <Text fontSize="sm">First Action:</Text>
                                        <Text fontSize="sm" fontWeight="semibold">{analytics.firstActionTime}</Text>
                                    </HStack>

                                    <HStack justify="space-between">
                                        <Text fontSize="sm">Last Action:</Text>
                                        <Text fontSize="sm" fontWeight="semibold">{analytics.lastActionTime}</Text>
                                    </HStack>
                                </VStack>
                            </Box>
                        </Grid>
                    </CardBody>
                </Card>
            </VStack>

            {/* Export Modal */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Export Analytics Data</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4}>
                            <Text>Choose export format:</Text>
                            <HStack spacing={4}>
                                <Button onClick={() => handleExportData('json')} colorScheme="blue">
                                    Export as JSON
                                </Button>
                                <Button onClick={() => handleExportData('csv')} colorScheme="green">
                                    Export as CSV
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default AnalyticsDashboard;