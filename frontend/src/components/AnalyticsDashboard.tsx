import React, { useState, useEffect } from 'react'
import { Box, Grid, Card, CardBody, Heading, Text, VStack, HStack, Select, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, Badge, Button } from '@chakra-ui/react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
)

// Mock analytics data
const mockAnalytics = {
    totalRevenue: 12500000,
    totalOrders: 234,
    totalVisitors: 15420,
    conversionRate: 2.8,
    revenueChange: 12.5,
    ordersChange: 8.3,
    visitorsChange: -2.1,
    conversionChange: 5.2,

    salesData: {
        labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
        datasets: [{
            label: '매출 (₩)',
            data: [1800000, 2200000, 1900000, 2500000, 2800000, 3200000],
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1
        }]
    },

    visitorsData: {
        labels: ['월', '화', '수', '목', '금', '토', '일'],
        datasets: [{
            label: '방문자 수',
            data: [2100, 2400, 2200, 2600, 2800, 3200, 2900],
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
        }]
    },

    categoryData: {
        labels: ['의상', '액세서리', '소품', '기타'],
        datasets: [{
            data: [45, 25, 20, 10],
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 205, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
            ],
        }]
    },

    topProducts: [
        { name: '코스프레 의상 A', sales: 45, revenue: 4500000 },
        { name: '코스프레 액세서리 B', sales: 32, revenue: 1600000 },
        { name: '코스프레 소품 C', sales: 28, revenue: 420000 },
        { name: '코스프레 의상 D', sales: 24, revenue: 3600000 },
        { name: '코스프레 액세서리 E', sales: 18, revenue: 270000 },
    ]
}

const AnalyticsDashboard: React.FC = () => {
    const [timeRange, setTimeRange] = useState('7d')
    const [analytics, setAnalytics] = useState(mockAnalytics)

    useEffect(() => {
        // TODO: 실제 API에서 데이터 가져오기
        // fetchAnalytics(timeRange)
    }, [timeRange])

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: false,
            },
        },
    }

    const doughnutOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right' as const,
            },
        },
    }

    return (
        <Box>
            <VStack spacing={6} align="stretch">
                <HStack justify="space-between" align="center">
                    <Heading size="lg">상점 분석 및 통계 대시보드</Heading>
                    <HStack>
                        <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} w="150px">
                            <option value="7d">지난 7일</option>
                            <option value="30d">지난 30일</option>
                            <option value="90d">지난 90일</option>
                            <option value="1y">지난 1년</option>
                        </Select>
                        <Button colorScheme="blue">데이터 내보내기</Button>
                    </HStack>
                </HStack>

                {/* Key Metrics */}
                <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>총 매출</StatLabel>
                                <StatNumber>₩{analytics.totalRevenue.toLocaleString()}</StatNumber>
                                <StatHelpText>
                                    <StatArrow type={analytics.revenueChange > 0 ? 'increase' : 'decrease'} />
                                    {Math.abs(analytics.revenueChange)}%
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>총 주문 수</StatLabel>
                                <StatNumber>{analytics.totalOrders.toLocaleString()}</StatNumber>
                                <StatHelpText>
                                    <StatArrow type={analytics.ordersChange > 0 ? 'increase' : 'decrease'} />
                                    {Math.abs(analytics.ordersChange)}%
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>총 방문자 수</StatLabel>
                                <StatNumber>{analytics.totalVisitors.toLocaleString()}</StatNumber>
                                <StatHelpText>
                                    <StatArrow type={analytics.visitorsChange > 0 ? 'increase' : 'decrease'} />
                                    {Math.abs(analytics.visitorsChange)}%
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>전환율</StatLabel>
                                <StatNumber>{analytics.conversionRate}%</StatNumber>
                                <StatHelpText>
                                    <StatArrow type={analytics.conversionChange > 0 ? 'increase' : 'decrease'} />
                                    {Math.abs(analytics.conversionChange)}%
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </Grid>

                {/* Charts */}
                <Grid templateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={6}>
                    <Card>
                        <CardBody>
                            <Heading size="md" mb={4}>매출 추이</Heading>
                            <Line options={chartOptions} data={analytics.salesData} />
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <Heading size="md" mb={4}>일일 방문자 수</Heading>
                            <Bar options={chartOptions} data={analytics.visitorsData} />
                        </CardBody>
                    </Card>
                </Grid>

                <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
                    <Card>
                        <CardBody>
                            <Heading size="md" mb={4}>카테고리별 판매 비율</Heading>
                            <Doughnut options={doughnutOptions} data={analytics.categoryData} />
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <Heading size="md" mb={4}>인기 상품 TOP 5</Heading>
                            <VStack align="stretch" spacing={3}>
                                {analytics.topProducts.map((product, index) => (
                                    <HStack key={product.name} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                                        <HStack>
                                            <Badge colorScheme="blue" mr={2}>{index + 1}</Badge>
                                            <VStack align="start" spacing={0}>
                                                <Text fontWeight="bold" fontSize="sm">{product.name}</Text>
                                                <Text fontSize="xs" color="gray.600">
                                                    판매량: {product.sales}개 | 매출: ₩{product.revenue.toLocaleString()}
                                                </Text>
                                            </VStack>
                                        </HStack>
                                    </HStack>
                                ))}
                            </VStack>
                        </CardBody>
                    </Card>
                </Grid>

                {/* AI Insights */}
                <Card>
                    <CardBody>
                        <Heading size="md" mb={4}>AI 추천 인사이트</Heading>
                        <VStack align="stretch" spacing={3}>
                            <Box p={3} bg="blue.50" borderRadius="md">
                                <Text fontWeight="bold" color="blue.700">📈 매출 증가 기회</Text>
                                <Text fontSize="sm" color="blue.600">
                                    액세서리 카테고리의 판매량이 15% 증가했습니다. 재고를 늘리는 것을 고려해보세요.
                                </Text>
                            </Box>

                            <Box p={3} bg="green.50" borderRadius="md">
                                <Text fontWeight="bold" color="green.700">🎯 타겟 고객 분석</Text>
                                <Text fontSize="sm" color="green.600">
                                    20-30대 여성 고객의 전환율이 가장 높습니다. 이 그룹을 대상으로 한 마케팅을 강화해보세요.
                                </Text>
                            </Box>

                            <Box p={3} bg="orange.50" borderRadius="md">
                                <Text fontWeight="bold" color="orange.700">⚡ 즉시 액션 제안</Text>
                                <Text fontSize="sm" color="orange.600">
                                    주말 방문자가 평일보다 40% 높습니다. 주말 한정 프로모션을 고려해보세요.
                                </Text>
                            </Box>
                        </VStack>
                    </CardBody>
                </Card>

                {/* Google Analytics Integration Status */}
                <Card>
                    <CardBody>
                        <HStack justify="space-between" align="center">
                            <VStack align="start" spacing={1}>
                                <Heading size="md">Google Analytics 연동</Heading>
                                <Text fontSize="sm" color="gray.600">
                                    실시간 데이터를 확인하고 더 자세한 분석을 위해 Google Analytics와 연동해보세요.
                                </Text>
                            </VStack>
                            <Button colorScheme="red">
                                Analytics 연동하기
                            </Button>
                        </HStack>
                    </CardBody>
                </Card>
            </VStack>
        </Box>
    )
}

export default AnalyticsDashboard