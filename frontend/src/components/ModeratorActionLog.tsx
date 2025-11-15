import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Badge,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Select,
    useColorModeValue,
    Spinner
} from '@chakra-ui/react';
import { apiClient } from '../utils/apiClient';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ModeratorAction {
    id: number;
    moderator_username: string;
    moderator_display_name: string;
    action_type: string;
    target_type: string;
    target_id: number;
    reason: string;
    details: string | null;
    ip_address: string;
    created_at: string;
}

const ModeratorActionLog: React.FC = () => {
    const [actions, setActions] = useState<ModeratorAction[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionTypeFilter, setActionTypeFilter] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    useEffect(() => {
        loadActions();
    }, [actionTypeFilter, page]);

    const loadActions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: ((page - 1) * limit).toString()
            });

            if (actionTypeFilter) {
                params.append('actionType', actionTypeFilter);
            }

            const response = await apiClient.get(`/api/moderator/logs?${params.toString()}`);
            setActions(response.data.data || []);
            setTotal(response.data.pagination?.total || 0);
        } catch (error) {
            console.error('활동 로그 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionTypeLabel = (actionType: string) => {
        const labels: Record<string, string> = {
            'ban': '차단',
            'unban': '차단 해제',
            'warn': '경고',
            'delete': '삭제',
            'delete_permanent': '영구 삭제',
            'restore': '복구',
            'restrict': '제한',
            'unrestrict': '제한 해제',
            'assign_moderator': '모더레이터 임명',
            'resolve_report': '신고 처리',
            'update_report': '신고 업데이트'
        };
        return labels[actionType] || actionType;
    };

    const getActionTypeColor = (actionType: string) => {
        if (['ban', 'delete', 'delete_permanent'].includes(actionType)) return 'red';
        if (['unban', 'restore', 'unrestrict'].includes(actionType)) return 'green';
        if (['warn', 'restrict'].includes(actionType)) return 'orange';
        return 'blue';
    };

    return (
        <Box>
            {/* 필터 */}
            <HStack spacing={4} mb={4}>
                <Select
                    value={actionTypeFilter}
                    onChange={(e) => setActionTypeFilter(e.target.value)}
                    maxW="200px"
                >
                    <option value="">전체 작업</option>
                    <option value="ban">차단</option>
                    <option value="unban">차단 해제</option>
                    <option value="warn">경고</option>
                    <option value="delete">삭제</option>
                    <option value="restore">복구</option>
                    <option value="resolve_report">신고 처리</option>
                </Select>

                <Button onClick={loadActions} isLoading={loading}>
                    새로고침
                </Button>
            </HStack>

            {/* 로그 테이블 */}
            <Box
                bg={bgColor}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={borderColor}
                overflowX="auto"
            >
                {loading ? (
                    <Box textAlign="center" py={10}>
                        <Spinner />
                    </Box>
                ) : actions.length === 0 ? (
                    <Box textAlign="center" py={10}>
                        <Text color="gray.500">활동 로그가 없습니다</Text>
                    </Box>
                ) : (
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th>시간</Th>
                                <Th>모더레이터</Th>
                                <Th>작업</Th>
                                <Th>대상</Th>
                                <Th>사유</Th>
                                <Th>IP</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {actions.map((action) => (
                                <Tr key={action.id}>
                                    <Td>
                                        <Text fontSize="sm">
                                            {format(new Date(action.created_at), 'PPp', { locale: ko })}
                                        </Text>
                                    </Td>
                                    <Td>
                                        <VStack align="start" spacing={0}>
                                            <Text fontWeight="bold">
                                                {action.moderator_display_name}
                                            </Text>
                                            <Text fontSize="xs" color="gray.500">
                                                @{action.moderator_username}
                                            </Text>
                                        </VStack>
                                    </Td>
                                    <Td>
                                        <Badge colorScheme={getActionTypeColor(action.action_type)}>
                                            {getActionTypeLabel(action.action_type)}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <VStack align="start" spacing={0}>
                                            <Text fontSize="sm">{action.target_type}</Text>
                                            <Text fontSize="xs" color="gray.500">
                                                #{action.target_id}
                                            </Text>
                                        </VStack>
                                    </Td>
                                    <Td>
                                        <Text noOfLines={2} maxW="250px">
                                            {action.reason || '-'}
                                        </Text>
                                    </Td>
                                    <Td>
                                        <Text fontSize="sm" color="gray.500">
                                            {action.ip_address || '-'}
                                        </Text>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                )}
            </Box>

            {/* 페이지네이션 */}
            {total > limit && (
                <HStack justify="center" mt={4} spacing={2}>
                    <Button
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        isDisabled={page === 1}
                    >
                        이전
                    </Button>
                    <Text>
                        {page} / {Math.ceil(total / limit)}
                    </Text>
                    <Button
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        isDisabled={page >= Math.ceil(total / limit)}
                    >
                        다음
                    </Button>
                </HStack>
            )}
        </Box>
    );
};

export default ModeratorActionLog;
