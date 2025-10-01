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
    TableContainer,
    Input,
    InputGroup,
    InputLeftElement,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Switch,
    Divider
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
import { SearchIcon, SettingsIcon, EditIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';

interface User {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
    createdAt: string;
    lastLoginAt?: string;
    profileImage?: string;
}

interface DashboardData {
    overview: {
        totalUsers: number;
        activeUsers: number;
        newUsersToday: number;
        inactiveUsers: number;
    };
    usersByRole: Record<string, number>;
    usersByStatus: Record<string, number>;
    activity: {
        recentLogins: number;
        todayRegistrations: number;
        dailyRegistrations: Array<{ date: string; count: number }>;
    };
    systemStatus: {
        database: string;
        redis: string;
        server: string;
        uptime: number;
        memory: {
            rss: number;
            heapTotal: number;
            heapUsed: number;
            external: number;
        };
    };
}

interface AdminDashboardProps {
    timeRange?: '7d' | '30d' | '90d' | '1y';
    onTimeRangeChange?: (range: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    timeRange = '30d',
    onTimeRangeChange
}) => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch overview data
                const overviewResponse = await fetch('/api/dashboard/overview');
                const overviewData = await overviewResponse.json();

                // Fetch activity data
                const activityResponse = await fetch('/api/dashboard/activity', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const activityData = await activityResponse.json();

                // Fetch system status
                const systemResponse = await fetch('/api/dashboard/system-status', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const systemData = await systemResponse.json();

                // Fetch users
                const usersResponse = await fetch('/api/dashboard/users', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const usersData = await usersResponse.json();

                setData({
                    overview: overviewData.data,
                    activity: activityData.data,
                    systemStatus: systemData.data
                });
                setUsers(usersData.data.users || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleTimeRangeChange = (range: string) => {
        setSelectedTimeRange(range);
        onTimeRangeChange?.(range);
    };

    const handleUserEdit = (user: User) => {
        setSelectedUser(user);
        setIsUserModalOpen(true);
    };

    const handleUserDelete = async (userId: string) => {
        if (window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
            try {
                const response = await fetch(`/api/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    setUsers(users.filter(user => user.id !== userId));
                }
            } catch (err) {
                console.error('Failed to delete user:', err);
            }
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    if (loading) {
        return (
            <Box textAlign="center" py={8}>
                <Spinner size="xl" />
                <Text mt={4}>Loading admin dashboard...</Text>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert status="error">
                <AlertIcon />
                <Box>
                    <Text fontWeight="bold">Error loading dashboard!</Text>
                    <Text>{error}</Text>
                </Box>
            </Alert>
        );
    }

    if (!data) {
        return (
            <Alert status="info">
                <AlertIcon />
                <Text>No dashboard data available</Text>
            </Alert>
        );
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    const roleData = Object.entries(data.overview.usersByRole || {}).map(([role, count]) => ({
        name: role,
        value: count,
        color: COLORS[Object.keys(data.overview.usersByRole || {}).indexOf(role) % COLORS.length]
    }));

    const statusData = Object.entries(data.overview.usersByStatus || {}).map(([status, count]) => ({
        name: status,
        value: count,
        color: COLORS[Object.keys(data.overview.usersByStatus || {}).indexOf(status) % COLORS.length]
    }));

    return (
        <Box>
            {/* Header */}
            <HStack justify="space-between" mb={6}>
                <Text fontSize="2xl" fontWeight="bold">
                    관리자 대시보드
                </Text>
                <HStack>
                    <Select
                        value={selectedTimeRange}
                        onChange={(e) => handleTimeRangeChange(e.target.value)}
                        width="200px"
                    >
                        <option value="7d">최근 7일</option>
                        <option value="30d">최근 30일</option>
                        <option value="90d">최근 90일</option>
                        <option value="1y">최근 1년</option>
                    </Select>
                    <Button
                        leftIcon={<SettingsIcon />}
                        colorScheme="blue"
                        variant="outline"
                    >
                        설정
                    </Button>
                </HStack>
            </HStack>

            {/* Overview Stats */}
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4} mb={6}>
                <GridItem>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>총 사용자</StatLabel>
                                <StatNumber>{data.overview.totalUsers.toLocaleString()}</StatNumber>
                                <StatHelpText>
                                    <StatArrow type="increase" />
                                    +{data.overview.newUsersToday} 오늘
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </GridItem>

                <GridItem>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>활성 사용자</StatLabel>
                                <StatNumber>{data.overview.activeUsers.toLocaleString()}</StatNumber>
                                <StatHelpText>
                                    <StatArrow type="increase" />
                                    {data.activity.recentLogins} 최근 24시간
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </GridItem>

                <GridItem>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>오늘 신규 가입</StatLabel>
                                <StatNumber>{data.overview.newUsersToday.toLocaleString()}</StatNumber>
                                <StatHelpText>
                                    <StatArrow type="increase" />
                                    +{data.activity.todayRegistrations} 증가
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </GridItem>

                <GridItem>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>시스템 업타임</StatLabel>
                                <StatNumber>{Math.floor(data.systemStatus.uptime / 3600)}h</StatNumber>
                                <StatHelpText>
                                    <StatArrow type="increase" />
                                    {data.systemStatus.database} DB
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </GridItem>
            </Grid>

            {/* Charts and Tables */}
            <Tabs>
                <TabList>
                    <Tab>개요</Tab>
                    <Tab>사용자 관리</Tab>
                    <Tab>시스템 상태</Tab>
                    <Tab>활동 분석</Tab>
                </TabList>

                <TabPanels>
                    {/* Overview Tab */}
                    <TabPanel>
                        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
                            <GridItem>
                                <Card>
                                    <CardHeader>
                                        <Text fontSize="lg" fontWeight="semibold">
                                            사용자 등급별 분포
                                        </Text>
                                    </CardHeader>
                                    <CardBody>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={roleData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {roleData.map((entry, index) => (
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
                                            사용자 상태별 분포
                                        </Text>
                                    </CardHeader>
                                    <CardBody>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={statusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {statusData.map((entry, index) => (
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

                    {/* User Management Tab */}
                    <TabPanel>
                        <Card>
                            <CardHeader>
                                <HStack justify="space-between">
                                    <Text fontSize="lg" fontWeight="semibold">
                                        사용자 관리
                                    </Text>
                                    <HStack>
                                        <InputGroup width="300px">
                                            <InputLeftElement>
                                                <SearchIcon color="gray.300" />
                                            </InputLeftElement>
                                            <Input
                                                placeholder="사용자 검색..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </InputGroup>
                                        <Select
                                            value={roleFilter}
                                            onChange={(e) => setRoleFilter(e.target.value)}
                                            width="150px"
                                        >
                                            <option value="all">모든 등급</option>
                                            <option value="owner">Owner</option>
                                            <option value="admin">Admin</option>
                                            <option value="vip">VIP</option>
                                            <option value="user">User</option>
                                        </Select>
                                        <Select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            width="150px"
                                        >
                                            <option value="all">모든 상태</option>
                                            <option value="active">활성</option>
                                            <option value="inactive">비활성</option>
                                            <option value="banned">차단</option>
                                        </Select>
                                    </HStack>
                                </HStack>
                            </CardHeader>
                            <CardBody>
                                <TableContainer>
                                    <Table size="sm">
                                        <Thead>
                                            <Tr>
                                                <Th>사용자</Th>
                                                <Th>등급</Th>
                                                <Th>상태</Th>
                                                <Th>가입일</Th>
                                                <Th>최근 로그인</Th>
                                                <Th>액션</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {filteredUsers.map((user) => (
                                                <Tr key={user.id}>
                                                    <Td>
                                                        <VStack align="start" spacing={1}>
                                                            <Text fontWeight="bold">{user.username}</Text>
                                                            <Text fontSize="sm" color="gray.500">{user.email}</Text>
                                                        </VStack>
                                                    </Td>
                                                    <Td>
                                                        <Badge colorScheme="blue">{user.role}</Badge>
                                                    </Td>
                                                    <Td>
                                                        <Badge colorScheme={user.status === 'active' ? 'green' : 'red'}>
                                                            {user.status}
                                                        </Badge>
                                                    </Td>
                                                    <Td>
                                                        <Text fontSize="sm">
                                                            {new Date(user.createdAt).toLocaleDateString()}
                                                        </Text>
                                                    </Td>
                                                    <Td>
                                                        <Text fontSize="sm">
                                                            {user.lastLoginAt
                                                                ? new Date(user.lastLoginAt).toLocaleDateString()
                                                                : '없음'
                                                            }
                                                        </Text>
                                                    </Td>
                                                    <Td>
                                                        <HStack>
                                                            <IconButton
                                                                aria-label="사용자 보기"
                                                                icon={<ViewIcon />}
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleUserEdit(user)}
                                                            />
                                                            <IconButton
                                                                aria-label="사용자 편집"
                                                                icon={<EditIcon />}
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleUserEdit(user)}
                                                            />
                                                            <IconButton
                                                                aria-label="사용자 삭제"
                                                                icon={<DeleteIcon />}
                                                                size="sm"
                                                                variant="ghost"
                                                                colorScheme="red"
                                                                onClick={() => handleUserDelete(user.id)}
                                                            />
                                                        </HStack>
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </TableContainer>
                            </CardBody>
                        </Card>
                    </TabPanel>

                    {/* System Status Tab */}
                    <TabPanel>
                        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
                            <GridItem>
                                <Card>
                                    <CardHeader>
                                        <Text fontSize="lg" fontWeight="semibold">
                                            시스템 상태
                                        </Text>
                                    </CardHeader>
                                    <CardBody>
                                        <VStack align="stretch" spacing={4}>
                                            <HStack justify="space-between">
                                                <Text>데이터베이스</Text>
                                                <Badge colorScheme="green">{data.systemStatus.database}</Badge>
                                            </HStack>
                                            <HStack justify="space-between">
                                                <Text>Redis</Text>
                                                <Badge colorScheme="green">{data.systemStatus.redis}</Badge>
                                            </HStack>
                                            <HStack justify="space-between">
                                                <Text>서버</Text>
                                                <Badge colorScheme="green">{data.systemStatus.server}</Badge>
                                            </HStack>
                                            <Divider />
                                            <HStack justify="space-between">
                                                <Text>업타임</Text>
                                                <Text>{Math.floor(data.systemStatus.uptime / 3600)}시간</Text>
                                            </HStack>
                                        </VStack>
                                    </CardBody>
                                </Card>
                            </GridItem>

                            <GridItem>
                                <Card>
                                    <CardHeader>
                                        <Text fontSize="lg" fontWeight="semibold">
                                            메모리 사용량
                                        </Text>
                                    </CardHeader>
                                    <CardBody>
                                        <VStack align="stretch" spacing={4}>
                                            <HStack justify="space-between">
                                                <Text>RSS</Text>
                                                <Text>{(data.systemStatus.memory.rss / 1024 / 1024).toFixed(2)} MB</Text>
                                            </HStack>
                                            <HStack justify="space-between">
                                                <Text>Heap Total</Text>
                                                <Text>{(data.systemStatus.memory.heapTotal / 1024 / 1024).toFixed(2)} MB</Text>
                                            </HStack>
                                            <HStack justify="space-between">
                                                <Text>Heap Used</Text>
                                                <Text>{(data.systemStatus.memory.heapUsed / 1024 / 1024).toFixed(2)} MB</Text>
                                            </HStack>
                                            <HStack justify="space-between">
                                                <Text>External</Text>
                                                <Text>{(data.systemStatus.memory.external / 1024 / 1024).toFixed(2)} MB</Text>
                                            </HStack>
                                        </VStack>
                                    </CardBody>
                                </Card>
                            </GridItem>
                        </Grid>
                    </TabPanel>

                    {/* Activity Analysis Tab */}
                    <TabPanel>
                        <Card>
                            <CardHeader>
                                <Text fontSize="lg" fontWeight="semibold">
                                    일별 신규 가입자 추이
                                </Text>
                            </CardHeader>
                            <CardBody>
                                <ResponsiveContainer width="100%" height={400}>
                                    <AreaChart data={data.activity.dailyRegistrations}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#00C49F"
                                            fill="#00C49F"
                                            fillOpacity={0.6}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardBody>
                        </Card>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* User Edit Modal */}
            <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>사용자 편집</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedUser && (
                            <VStack spacing={4}>
                                <FormControl>
                                    <FormLabel>사용자명</FormLabel>
                                    <Input value={selectedUser.username} isReadOnly />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>이메일</FormLabel>
                                    <Input value={selectedUser.email} isReadOnly />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>등급</FormLabel>
                                    <Select value={selectedUser.role}>
                                        <option value="user">User</option>
                                        <option value="vip">VIP</option>
                                        <option value="admin">Admin</option>
                                        <option value="owner">Owner</option>
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>상태</FormLabel>
                                    <Select value={selectedUser.status}>
                                        <option value="active">활성</option>
                                        <option value="inactive">비활성</option>
                                        <option value="banned">차단</option>
                                    </Select>
                                </FormControl>
                            </VStack>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={() => setIsUserModalOpen(false)}>
                            취소
                        </Button>
                        <Button colorScheme="blue">
                            저장
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default AdminDashboard;
