import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  Flex,
  Divider
} from '@chakra-ui/react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Community Platform v1.1 - AUTOAGENTS 모니터링 대시보드
 * 
 * 기능:
 * - 실시간 에이전트 상태 모니터링
 * - 성능 메트릭 시각화
 * - 예측 분석 및 알림
 * - 워크플로우 시각화
 */

interface Agent {
  id: string;
  name: string;
  type: string;
  version: string;
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  health: 'excellent' | 'good' | 'warning' | 'critical';
  performance: {
    tasksCompleted: number;
    successRate: number;
    averageResponseTime: number;
    uptime: number;
    currentLoad?: number;
    queuedTasks?: number;
  };
  aiFeatures?: {
    [key: string]: boolean;
  };
  lastActivity: string;
}

interface SystemMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageProcessingTime: number;
  successRate: number;
  aiAccuracy: number;
  predictiveAccuracy: number;
  systemEfficiency: number;
  resourceUtilization: number;
  collaborationScore: number;
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  agentId?: string;
}

const AutoAgentsDashboard: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 색상 테마
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');

  // 데이터 로딩
  useEffect(() => {
    loadDashboardData();
    
    // 실시간 업데이트 (30초마다)
    const interval = setInterval(loadDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 실제 구현에서는 API 호출
      const mockData = generateMockData();
      
      setAgents(mockData.agents);
      setSystemMetrics(mockData.systemMetrics);
      setAlerts(mockData.alerts);
      setError(null);
      
    } catch (err) {
      setError('대시보드 데이터 로딩 실패');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 에이전트 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'gray';
      case 'error': return 'red';
      case 'maintenance': return 'yellow';
      default: return 'gray';
    }
  };

  // 헬스 상태 색상
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'green';
      case 'good': return 'blue';
      case 'warning': return 'yellow';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  // 성능 차트 데이터
  const getPerformanceChartData = () => {
    if (!agents.length) return null;

    return {
      labels: agents.map(agent => agent.name),
      datasets: [
        {
          label: '성공률 (%)',
          data: agents.map(agent => agent.performance.successRate),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: '응답시간 (초)',
          data: agents.map(agent => agent.performance.averageResponseTime),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  // 시스템 효율성 차트
  const getEfficiencyChartData = () => {
    if (!systemMetrics) return null;

    return {
      labels: ['AI 정확도', '예측 정확도', '시스템 효율성', '협업 점수'],
      datasets: [{
        data: [
          systemMetrics.aiAccuracy,
          systemMetrics.predictiveAccuracy,
          systemMetrics.systemEfficiency,
          systemMetrics.collaborationScore
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }]
    };
  };

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" color="blue.500" />
        <Text mt={4}>AUTOAGENTS 대시보드 로딩 중...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>오류 발생!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6} minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* 헤더 */}
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="xl" color={textColor} mb={2}>
            🤖 AUTOAGENTS 모니터링 대시보드 v2.0
          </Heading>
          <Text color="gray.600">
            실시간 에이전트 상태, 성능 메트릭, 예측 분석을 한눈에 확인하세요
          </Text>
        </Box>

        {/* 시스템 개요 */}
        {systemMetrics && (
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>총 작업 수</StatLabel>
                  <StatNumber>{systemMetrics.totalTasks.toLocaleString()}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    전체 처리된 작업
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>성공률</StatLabel>
                  <StatNumber>{systemMetrics.successRate.toFixed(1)}%</StatNumber>
                  <StatHelpText>
                    <StatArrow type={systemMetrics.successRate > 95 ? "increase" : "decrease"} />
                    작업 성공률
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>AI 정확도</StatLabel>
                  <StatNumber>{systemMetrics.aiAccuracy.toFixed(1)}%</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    AI 예측 정확도
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>시스템 효율성</StatLabel>
                  <StatNumber>{systemMetrics.systemEfficiency.toFixed(1)}%</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    전체 시스템 효율
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </Grid>
        )}

        {/* 알림 패널 */}
        {alerts.length > 0 && (
          <Card bg={cardBg} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">🚨 실시간 알림</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                {alerts.slice(0, 3).map(alert => (
                  <Alert key={alert.id} status={alert.type} borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>{alert.title}</AlertTitle>
                      <AlertDescription>{alert.message}</AlertDescription>
                    </Box>
                  </Alert>
                ))}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* 메인 대시보드 탭 */}
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>🤖 에이전트 상태</Tab>
            <Tab>📊 성능 분석</Tab>
            <Tab>🔮 예측 분석</Tab>
            <Tab>🔄 워크플로우</Tab>
          </TabList>

          <TabPanels>
            {/* 에이전트 상태 탭 */}
            <TabPanel>
              <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }} gap={6}>
                {agents.map(agent => (
                  <Card key={agent.id} bg={cardBg} borderColor={borderColor}>
                    <CardHeader>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Heading size="sm">{agent.name}</Heading>
                          <Text fontSize="xs" color="gray.500">{agent.type} v{agent.version}</Text>
                        </VStack>
                        <VStack spacing={1}>
                          <Badge colorScheme={getStatusColor(agent.status)}>
                            {agent.status}
                          </Badge>
                          <Badge colorScheme={getHealthColor(agent.health)}>
                            {agent.health}
                          </Badge>
                        </VStack>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        {/* 성능 메트릭 */}
                        <Box>
                          <Text fontSize="sm" fontWeight="bold" mb={2}>성능 지표</Text>
                          <VStack spacing={2} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="xs">완료된 작업</Text>
                              <Text fontSize="xs" fontWeight="bold">
                                {agent.performance.tasksCompleted.toLocaleString()}
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text fontSize="xs">성공률</Text>
                              <Text fontSize="xs" fontWeight="bold">
                                {agent.performance.successRate.toFixed(1)}%
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text fontSize="xs">응답시간</Text>
                              <Text fontSize="xs" fontWeight="bold">
                                {agent.performance.averageResponseTime.toFixed(1)}초
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text fontSize="xs">가동률</Text>
                              <Text fontSize="xs" fontWeight="bold">
                                {agent.performance.uptime.toFixed(2)}%
                              </Text>
                            </HStack>
                          </VStack>
                        </Box>

                        {/* 현재 부하 */}
                        {agent.performance.currentLoad !== undefined && (
                          <Box>
                            <Text fontSize="sm" fontWeight="bold" mb={2}>현재 부하</Text>
                            <Progress 
                              value={agent.performance.currentLoad} 
                              colorScheme={agent.performance.currentLoad > 80 ? 'red' : 'blue'}
                              size="sm"
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              {agent.performance.currentLoad.toFixed(1)}%
                            </Text>
                          </Box>
                        )}

                        {/* AI 기능 */}
                        {agent.aiFeatures && (
                          <Box>
                            <Text fontSize="sm" fontWeight="bold" mb={2}>AI 기능</Text>
                            <Flex wrap="wrap" gap={1}>
                              {Object.entries(agent.aiFeatures).map(([feature, enabled]) => (
                                <Badge 
                                  key={feature} 
                                  size="sm" 
                                  colorScheme={enabled ? 'green' : 'gray'}
                                >
                                  {feature}
                                </Badge>
                              ))}
                            </Flex>
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </Grid>
            </TabPanel>

            {/* 성능 분석 탭 */}
            <TabPanel>
              <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
                {/* 에이전트 성능 비교 */}
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">📊 에이전트 성능 비교</Heading>
                  </CardHeader>
                  <CardBody>
                    {getPerformanceChartData() && (
                      <Bar 
                        data={getPerformanceChartData()!} 
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { position: 'top' },
                            title: { display: true, text: '에이전트별 성능 지표' }
                          }
                        }}
                      />
                    )}
                  </CardBody>
                </Card>

                {/* 시스템 효율성 */}
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">🎯 시스템 효율성</Heading>
                  </CardHeader>
                  <CardBody>
                    {getEfficiencyChartData() && (
                      <Doughnut 
                        data={getEfficiencyChartData()!}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { position: 'bottom' },
                            title: { display: true, text: '시스템 효율성 분석' }
                          }
                        }}
                      />
                    )}
                  </CardBody>
                </Card>
              </Grid>
            </TabPanel>

            {/* 예측 분석 탭 */}
            <TabPanel>
              <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">🔮 워크로드 예측</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Alert status="info">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>다음 24시간 예측</AlertTitle>
                          <AlertDescription>
                            예상 작업량: 150-200개, 피크 시간: 14:00-16:00
                          </AlertDescription>
                        </Box>
                      </Alert>
                      
                      <Box>
                        <Text fontWeight="bold" mb={2}>예측 신뢰도</Text>
                        <Progress value={94.2} colorScheme="green" size="lg" />
                        <Text fontSize="sm" color="gray.500" mt={1}>94.2% 정확도</Text>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={cardBg} borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">⚠️ 장애 예측</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Alert status="warning">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>잠재적 위험 감지</AlertTitle>
                          <AlertDescription>
                            메모리 사용량 증가 패턴 감지 (위험도: 낮음)
                          </AlertDescription>
                        </Box>
                      </Alert>
                      
                      <Box>
                        <Text fontWeight="bold" mb={2}>예방 조치 권장</Text>
                        <VStack spacing={2} align="stretch">
                          <Text fontSize="sm">• 메모리 정리 스케줄링</Text>
                          <Text fontSize="sm">• 리소스 모니터링 강화</Text>
                          <Text fontSize="sm">• 자동 스케일링 준비</Text>
                        </VStack>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              </Grid>
            </TabPanel>

            {/* 워크플로우 탭 */}
            <TabPanel>
              <Card bg={cardBg} borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">🔄 활성 워크플로우</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {[1, 2, 3].map(i => (
                      <Box key={i} p={4} border="1px" borderColor={borderColor} borderRadius="md">
                        <HStack justify="space-between" mb={2}>
                          <Text fontWeight="bold">워크플로우 #{i}</Text>
                          <Badge colorScheme="blue">실행 중</Badge>
                        </HStack>
                        <Progress value={Math.random() * 100} colorScheme="blue" size="sm" />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          진행률: {Math.floor(Math.random() * 100)}% | 
                          예상 완료: {Math.floor(Math.random() * 10 + 1)}분 후
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* 액션 버튼들 */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <HStack spacing={4} justify="center">
              <Button colorScheme="blue" onClick={loadDashboardData}>
                🔄 새로고침
              </Button>
              <Button colorScheme="green">
                ⚙️ 시스템 최적화
              </Button>
              <Button colorScheme="orange">
                📊 상세 보고서
              </Button>
              <Button colorScheme="purple">
                🤖 에이전트 관리
              </Button>
            </HStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

// 목 데이터 생성 함수
const generateMockData = () => {
  const agents: Agent[] = [
    {
      id: 'TODO_AGENT_V2',
      name: 'TODO 관리 에이전트 v2.0',
      type: 'TODO',
      version: '2.0',
      status: 'active',
      health: 'excellent',
      performance: {
        tasksCompleted: 2847,
        successRate: 99.2,
        averageResponseTime: 1.8,
        uptime: 99.95,
        currentLoad: 45.2,
        queuedTasks: 12
      },
      aiFeatures: {
        'NLP': true,
        'Prediction': true,
        'Learning': true,
        'Optimization': true
      },
      lastActivity: new Date().toISOString()
    },
    {
      id: 'SECURITY_AGENT_V2',
      name: '보안 관리 에이전트 v2.0',
      type: 'SECURITY',
      version: '2.0',
      status: 'active',
      health: 'excellent',
      performance: {
        tasksCompleted: 234,
        successRate: 98.8,
        averageResponseTime: 8.4,
        uptime: 99.98,
        currentLoad: 23.7,
        queuedTasks: 3
      },
      aiFeatures: {
        'ThreatIntel': true,
        'BehaviorAnalysis': true,
        'AnomalyDetection': true,
        'PredictiveModeling': true
      },
      lastActivity: new Date().toISOString()
    },
    {
      id: 'ANALYTICS_AGENT_V2',
      name: '분석 관리 에이전트 v2.0',
      type: 'ANALYTICS',
      version: '2.0',
      status: 'active',
      health: 'excellent',
      performance: {
        tasksCompleted: 456,
        successRate: 96.8,
        averageResponseTime: 4.2,
        uptime: 99.94,
        currentLoad: 67.3,
        queuedTasks: 8
      },
      aiFeatures: {
        'MachineLearning': true,
        'DeepLearning': true,
        'TimeSeriesAnalysis': true,
        'PatternRecognition': true
      },
      lastActivity: new Date().toISOString()
    },
    {
      id: 'INTEGRATION_AGENT_V2',
      name: '통합 관리 에이전트 v2.0',
      type: 'INTEGRATION',
      version: '2.0',
      status: 'active',
      health: 'good',
      performance: {
        tasksCompleted: 67,
        successRate: 98.9,
        averageResponseTime: 2.1,
        uptime: 99.97,
        currentLoad: 34.8,
        queuedTasks: 5
      },
      aiFeatures: {
        'AutoConfiguration': true,
        'ServiceDiscovery': true,
        'LoadBalancing': true,
        'FailoverAutomation': true
      },
      lastActivity: new Date().toISOString()
    },
    {
      id: 'MONITORING_AGENT_V2',
      name: '모니터링 관리 에이전트 v2.0',
      type: 'MONITORING',
      version: '2.0',
      status: 'active',
      health: 'excellent',
      performance: {
        tasksCompleted: 567,
        successRate: 99.9,
        averageResponseTime: 0.8,
        uptime: 100.0,
        currentLoad: 12.5,
        queuedTasks: 2
      },
      aiFeatures: {
        'PredictiveAnalytics': true,
        'AnomalyDetection': true,
        'AutoHealing': true,
        'IntelligentAlerting': true
      },
      lastActivity: new Date().toISOString()
    }
  ];

  const systemMetrics: SystemMetrics = {
    totalTasks: 4171,
    completedTasks: 4089,
    failedTasks: 82,
    averageProcessingTime: 3.46,
    successRate: 98.03,
    aiAccuracy: 94.5,
    predictiveAccuracy: 91.8,
    systemEfficiency: 96.8,
    resourceUtilization: 76.3,
    collaborationScore: 87.2
  };

  const alerts: Alert[] = [
    {
      id: 'alert_1',
      type: 'info',
      title: '시스템 최적화 완료',
      message: 'AI 기반 최적화로 처리 속도 15% 향상',
      timestamp: new Date().toISOString(),
      agentId: 'TODO_AGENT_V2'
    },
    {
      id: 'alert_2',
      type: 'warning',
      title: '메모리 사용량 증가',
      message: 'Analytics 에이전트 메모리 사용량 80% 도달',
      timestamp: new Date().toISOString(),
      agentId: 'ANALYTICS_AGENT_V2'
    },
    {
      id: 'alert_3',
      type: 'success',
      title: '예방적 복구 성공',
      message: '잠재적 네트워크 장애 사전 방지',
      timestamp: new Date().toISOString(),
      agentId: 'MONITORING_AGENT_V2'
    }
  ];

  return { agents, systemMetrics, alerts };
};

export default AutoAgentsDashboard;
