import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Badge,
    Progress,
    useColorModeValue,
    Divider,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    SimpleGrid
} from '@chakra-ui/react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Area,
    AreaChart
} from 'recharts';

export interface VotingResult {
    id: string;
    text: string;
    description?: string;
    votes: number;
    percentage: number;
    color?: string;
}

export interface VotingResultsData {
    poll: {
        id: string;
        title: string;
        type: string;
        status: string;
        totalVotes: number;
    };
    results: VotingResult[];
}

interface VotingResultsChartProps {
    data: VotingResultsData;
    chartType?: 'bar' | 'pie' | 'line' | 'area' | 'progress';
    showPercentage?: boolean;
    showVoteCount?: boolean;
    colorScheme?: string;
    height?: number;
}

const VotingResultsChart: React.FC<VotingResultsChartProps> = ({
    data,
    chartType = 'bar',
    showPercentage = true,
    showVoteCount = true,
    colorScheme = 'blue',
    height = 300
}) => {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // 색상 팔레트 생성
    const generateColors = (count: number) => {
        const baseColors = [
            '#3182CE', '#38A169', '#D69E2E', '#E53E3E', '#805AD5',
            '#319795', '#DD6B20', '#9F7AEA', '#2D3748', '#4A5568'
        ];

        return Array.from({ length: count }, (_, index) =>
            baseColors[index % baseColors.length]
        );
    };

    const colors = generateColors(data.results.length);
    const chartData = data.results.map((result, index) => ({
        ...result,
        color: colors[index]
    }));

    // 통계 정보 계산
    const totalVotes = data.poll.totalVotes;
    const maxVotes = Math.max(...data.results.map(r => r.votes));
    const minVotes = Math.min(...data.results.map(r => r.votes));
    const averageVotes = totalVotes / data.results.length;

    // 차트 렌더링
    const renderChart = () => {
        const commonProps = {
            data: chartData,
            height: height,
            margin: { top: 20, right: 30, left: 20, bottom: 5 }
        };

        switch (chartType) {
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="votes"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => [`${value}표`, '투표수']} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <LineChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="text" />
                            <YAxis />
                            <Tooltip formatter={(value: any) => [`${value}표`, '투표수']} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="votes"
                                stroke="#3182CE"
                                strokeWidth={2}
                                dot={{ fill: '#3182CE', strokeWidth: 2, r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <AreaChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="text" />
                            <YAxis />
                            <Tooltip formatter={(value: any) => [`${value}표`, '투표수']} />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="votes"
                                stroke="#3182CE"
                                fill="#3182CE"
                                fillOpacity={0.3}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'progress':
                return (
                    <VStack spacing={4} align="stretch">
                        {data.results.map((result, index) => (
                            <Box key={result.id}>
                                <HStack justify="space-between" mb={2}>
                                    <Text fontWeight="medium" fontSize="sm">
                                        {result.text}
                                    </Text>
                                    <HStack spacing={2}>
                                        {showVoteCount && (
                                            <Text fontSize="sm" color="gray.600">
                                                {result.votes}표
                                            </Text>
                                        )}
                                        {showPercentage && (
                                            <Badge colorScheme={colorScheme} variant="subtle">
                                                {result.percentage}%
                                            </Badge>
                                        )}
                                    </HStack>
                                </HStack>
                                <Progress
                                    value={result.percentage}
                                    colorScheme={colorScheme}
                                    size="lg"
                                    borderRadius="md"
                                    bg="gray.100"
                                />
                                {result.description && (
                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                        {result.description}
                                    </Text>
                                )}
                            </Box>
                        ))}
                    </VStack>
                );

            default: // bar
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <BarChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="text"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                fontSize={12}
                            />
                            <YAxis />
                            <Tooltip
                                formatter={(value: any) => [`${value}표`, '투표수']}
                                labelFormatter={(label) => `옵션: ${label}`}
                            />
                            <Legend />
                            <Bar dataKey="votes" fill="#3182CE" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                );
        }
    };

    return (
        <Box
            className="voting-results-chart"
            p={6}
            bg={bgColor}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="lg"
            boxShadow="sm"
        >
            <VStack spacing={4} align="stretch">
                {/* 헤더 */}
                <VStack spacing={2} align="start">
                    <Text fontSize="lg" fontWeight="bold">
                        {data.poll.title}
                    </Text>
                    <HStack spacing={4} fontSize="sm" color="gray.600">
                        <Text>총 {totalVotes}표</Text>
                        <Badge colorScheme={data.poll.status === 'active' ? 'green' : 'gray'}>
                            {data.poll.status === 'active' ? '진행중' : '종료'}
                        </Badge>
                    </HStack>
                </VStack>

                <Divider />

                {/* 통계 요약 */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                    <Stat>
                        <StatLabel>총 투표수</StatLabel>
                        <StatNumber>{totalVotes}</StatNumber>
                    </Stat>
                    <Stat>
                        <StatLabel>최고 득표</StatLabel>
                        <StatNumber>{maxVotes}</StatNumber>
                        <StatHelpText>표</StatHelpText>
                    </Stat>
                    <Stat>
                        <StatLabel>최저 득표</StatLabel>
                        <StatNumber>{minVotes}</StatNumber>
                        <StatHelpText>표</StatHelpText>
                    </Stat>
                    <Stat>
                        <StatLabel>평균 득표</StatLabel>
                        <StatNumber>{averageVotes.toFixed(1)}</StatNumber>
                        <StatHelpText>표</StatHelpText>
                    </Stat>
                </SimpleGrid>

                <Divider />

                {/* 차트 */}
                <Box>
                    {renderChart()}
                </Box>

                {/* 상세 결과 테이블 */}
                <Box>
                    <Text fontSize="md" fontWeight="semibold" mb={3}>
                        상세 결과
                    </Text>
                    <VStack spacing={2} align="stretch">
                        {data.results
                            .sort((a, b) => b.votes - a.votes)
                            .map((result, index) => (
                                <HStack
                                    key={result.id}
                                    p={3}
                                    bg={index < 3 ? `${colorScheme}.50` : 'gray.50'}
                                    borderRadius="md"
                                    border={index < 3 ? `2px solid` : '1px solid'}
                                    borderColor={index < 3 ? `${colorScheme}.200` : 'gray.200'}
                                >
                                    <Text
                                        fontWeight="bold"
                                        color={index < 3 ? `${colorScheme}.600` : 'gray.600'}
                                        minW="20px"
                                    >
                                        #{index + 1}
                                    </Text>
                                    <VStack align="start" spacing={1} flex={1}>
                                        <Text fontWeight="medium">{result.text}</Text>
                                        {result.description && (
                                            <Text fontSize="sm" color="gray.600">
                                                {result.description}
                                            </Text>
                                        )}
                                    </VStack>
                                    <VStack align="end" spacing={1}>
                                        <HStack spacing={2}>
                                            <Text fontWeight="bold" fontSize="lg">
                                                {result.votes}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">
                                                표
                                            </Text>
                                        </HStack>
                                        <Badge colorScheme={colorScheme} variant="subtle">
                                            {result.percentage}%
                                        </Badge>
                                    </VStack>
                                </HStack>
                            ))}
                    </VStack>
                </Box>
            </VStack>
        </Box>
    );
};

export default VotingResultsChart;
