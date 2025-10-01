import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Grid,
    GridItem,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Progress,
    Badge,
    Select,
    Button,
    useColorModeValue,
    Spinner,
    Alert,
    AlertIcon,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer
} from '@chakra-ui/react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
    overview: {
        totalUsers: number;
        activeUsers: number;
        totalTodos: number;
        completedTodos: number;
        completionRate: number;
        averageResponseTime: number;
        errorRate: number;
    };
    trends: {
        userGrowth: Array<{ date: string; users: number }>;
        todoCompletion: Array<{ date: string; completed: number; created: number }>;
        performance: Array<{ date: string; responseTime: number; uptime: number }>;
    };
    categories: Array<{ name: string; value: number; color: string }>;
    priorities: Array<{ name: string; value: number; color: string }>;
    topUsers: Array<{ name: string; todos: number; completionRate: number }>;
    recentActivity: Array<{ type: string; description: string; timestamp: string; user: string }>;
}

interface AnalyticsDashboardProps {
    timeRange?: '7d' | '30d' | '90d' | '1y';
    onTimeRangeChange?: (range: string) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
    timeRange = '30d',
    onTimeRangeChange
}) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // Fetch analytics data
    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`/api/analytics?timeRange=${selectedTimeRange}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch analytics data');
                }

                const analyticsData = await response.json();
                setData(analyticsData.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalyticsData();
    }, [selectedTimeRange]);

    const handleTimeRangeChange = (range: string) => {
        setSelectedTimeRange(range);
        onTimeRangeChange?.(range);
    };

    if (loading) {
        return (
            <Box textAlign="center" py={8}>
                <Spinner size="xl" />
                <Text mt={4}>Loading analytics...</Text>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert status="error">
                <AlertIcon />
                <Box>
                    <Text fontWeight="bold">Error loading analytics!</Text>
                    <Text>{error}</Text>
                </Box>
            </Alert>
        );
    }

    if (!data) {
        return (
            <Alert status="info">
                <AlertIcon />
                <Text>No analytics data available</Text>
            </Alert>
        );
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    return (
        <Box>
            {/* Header */}
            <HStack justify="space-between" mb={6}>
                <Text fontSize="2xl" fontWeight="bold">
                    Analytics Dashboard
                </Text>
                <Select
                    value={selectedTimeRange}
                    onChange={(e) => handleTimeRangeChange(e.target.value)}
                    width="200px"
                >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="1y">Last year</option>
                </Select>
            </HStack>

            {/* Overview Stats */}
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4} mb={6}>
                <GridItem>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>Total Users</StatLabel>
                                <StatNumber>{data.overview.totalUsers.toLocaleString()}</StatNumber>
                                <StatHelpText>
                                    <StatArrow type="increase" />
                                    +12% from last month
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </GridItem>

                <GridItem>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>Active Users</StatLabel>
                                <StatNumber>{data.overview.activeUsers.toLocaleString()}</StatNumber>
                                <StatHelpText>
                                    <StatArrow type="increase" />
                                    +8% from last month
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </GridItem>

                <GridItem>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>TODO Completion Rate</StatLabel>
                                <StatNumber>{data.overview.completionRate}%</StatNumber>
                                <StatHelpText>
                                    <StatArrow type="increase" />
                                    +5% from last month
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </GridItem>

                <GridItem>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>Average Response Time</StatLabel>
                                <StatNumber>{data.overview.averageResponseTime}ms</StatNumber>
                                <StatHelpText>
                                    <StatArrow type="decrease" />
                                    -15% from last month
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </GridItem>
            </Grid>

            {/* Charts */}
            <Tabs>
                <TabList>
                    <Tab>Overview</Tab>
                    <Tab>User Growth</Tab>
                    <Tab>Performance</Tab>
                    <Tab>Categories</Tab>
                </TabList>

                <TabPanels>
                    {/* Overview Tab */}
                    <TabPanel>
                        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
                            <GridItem>
                                <Card>
                                    <CardHeader>
                                        <Text fontSize="lg" fontWeight="semibold">
                                            TODO Completion Trends
                                        </Text>
                                    </CardHeader>
                                    <CardBody>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={data.trends.todoCompletion}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line
                                                    type="monotone"
                                                    dataKey="completed"
                                                    stroke="#00C49F"
                                                    strokeWidth={2}
                                                    name="Completed"
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="created"
                                                    stroke="#0088FE"
                                                    strokeWidth={2}
                                                    name="Created"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardBody>
                                </Card>
                            </GridItem>

                            <GridItem>
                                <Card>
                                    <CardHeader>
                                        <Text fontSize="lg" fontWeight="semibold">
                                            TODO Categories
                                        </Text>
                                    </CardHeader>
                                    <CardBody>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={data.categories}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {data.categories.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardBody>
                                </Card>
                            </GridItem>
                        </Grid>
                    </TabPanel>

                    {/* User Growth Tab */}
                    <TabPanel>
                        <Card>
                            <CardHeader>
                                <Text fontSize="lg" fontWeight="semibold">
                                    User Growth Over Time
                                </Text>
                            </CardHeader>
                            <CardBody>
                                <ResponsiveContainer width="100%" height={400}>
                                    <AreaChart data={data.trends.userGrowth}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="users"
                                            stroke="#00C49F"
                                            fill="#00C49F"
                                            fillOpacity={0.6}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardBody>
                        </Card>
                    </TabPanel>

                    {/* Performance Tab */}
                    <TabPanel>
                        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
                            <GridItem>
                                <Card>
                                    <CardHeader>
                                        <Text fontSize="lg" fontWeight="semibold">
                                            Response Time Trends
                                        </Text>
                                    </CardHeader>
                                    <CardBody>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={data.trends.performance}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line
                                                    type="monotone"
                                                    dataKey="responseTime"
                                                    stroke="#FF8042"
                                                    strokeWidth={2}
                                                    name="Response Time (ms)"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardBody>
                                </Card>
                            </GridItem>

                            <GridItem>
                                <Card>
                                    <CardHeader>
                                        <Text fontSize="lg" fontWeight="semibold">
                                            System Uptime
                                        </Text>
                                    </CardHeader>
                                    <CardBody>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={data.trends.performance}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="uptime" fill="#00C49F" name="Uptime (%)" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardBody>
                                </Card>
                            </GridItem>
                        </Grid>
                    </TabPanel>

                    {/* Categories Tab */}
                    <TabPanel>
                        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
                            <GridItem>
                                <Card>
                                    <CardHeader>
                                        <Text fontSize="lg" fontWeight="semibold">
                                            TODO Priorities
                                        </Text>
                                    </CardHeader>
                                    <CardBody>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={data.priorities}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {data.priorities.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardBody>
                                </Card>
                            </GridItem>

                            <GridItem>
                                <Card>
                                    <CardHeader>
                                        <Text fontSize="lg" fontWeight="semibold">
                                            Top Users
                                        </Text>
                                    </CardHeader>
                                    <CardBody>
                                        <TableContainer>
                                            <Table size="sm">
                                                <Thead>
                                                    <Tr>
                                                        <Th>User</Th>
                                                        <Th>TODOs</Th>
                                                        <Th>Completion Rate</Th>
                                                    </Tr>
                                                </Thead>
                                                <Tbody>
                                                    {data.topUsers.map((user, index) => (
                                                        <Tr key={index}>
                                                            <Td>{user.name}</Td>
                                                            <Td>{user.todos}</Td>
                                                            <Td>
                                                                <HStack>
                                                                    <Progress
                                                                        value={user.completionRate}
                                                                        size="sm"
                                                                        width="100px"
                                                                        colorScheme="green"
                                                                    />
                                                                    <Text fontSize="sm">{user.completionRate}%</Text>
                                                                </HStack>
                                                            </Td>
                                                        </Tr>
                                                    ))}
                                                </Tbody>
                                            </Table>
                                        </TableContainer>
                                    </CardBody>
                                </Card>
                            </GridItem>
                        </Grid>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* Recent Activity */}
            <Card mt={6}>
                <CardHeader>
                    <Text fontSize="lg" fontWeight="semibold">
                        Recent Activity
                    </Text>
                </CardHeader>
                <CardBody>
                    <VStack align="stretch" spacing={3}>
                        {data.recentActivity.map((activity, index) => (
                            <HStack key={index} justify="space-between">
                                <HStack>
                                    <Badge colorScheme="blue">{activity.type}</Badge>
                                    <Text fontSize="sm">{activity.description}</Text>
                                </HStack>
                                <HStack>
                                    <Text fontSize="sm" color="gray.500">
                                        {activity.user}
                                    </Text>
                                    <Text fontSize="sm" color="gray.500">
                                        {new Date(activity.timestamp).toLocaleString()}
                                    </Text>
                                </HStack>
                            </HStack>
                        ))}
                    </VStack>
                </CardBody>
            </Card>
        </Box>
    );
};

export default AnalyticsDashboard;
