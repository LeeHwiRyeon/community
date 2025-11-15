/**
 * 신고 처리 대시보드
 * 콘텐츠 신고 관리 및 처리
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Flag,
    Check,
    Close,
    Visibility,
    MoreVert,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Report {
    id: number;
    type: string;
    target_id: number;
    target_title: string;
    reporter_id: number;
    reporter_name: string;
    reason: string;
    status: string;
    created_at: string;
}

const ReportDashboard: React.FC = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState('pending');
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [action, setAction] = useState<'approve' | 'reject'>('reject');
    const [note, setNote] = useState('');

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    const fetchReports = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await axios.get(`${API_BASE_URL}/api/admin-simple/reports`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                params: {
                    status: filterStatus,
                    limit: 50,
                },
            });

            if (response.data.success) {
                setReports(response.data.reports);
                setError(null);
            }
        } catch (err: any) {
            console.error('신고 목록 조회 실패:', err);
            setError(err.response?.data?.message || '신고 목록을 불러올 수 없습니다');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [filterStatus]);

    const handleOpenDialog = (report: Report) => {
        setSelectedReport(report);
        setDialogOpen(true);
        setAction('reject');
        setNote('');
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedReport(null);
        setNote('');
    };

    const handleProcessReport = async () => {
        if (!selectedReport) return;

        try {
            setProcessing(true);
            const token = localStorage.getItem('token');

            const response = await axios.put(
                `${API_BASE_URL}/api/admin-simple/reports/${selectedReport.id}`,
                {
                    status: action === 'approve' ? 'resolved' : 'rejected',
                    action,
                    note,
                },
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            );

            if (response.data.success) {
                // 목록 새로고침
                await fetchReports();
                handleCloseDialog();
            }
        } catch (err: any) {
            console.error('신고 처리 실패:', err);
            alert(err.response?.data?.message || '신고 처리 중 오류가 발생했습니다');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusColor = (status: string): 'default' | 'warning' | 'success' | 'error' => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'resolved':
                return 'success';
            case 'rejected':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: '대기중',
            resolved: '처리완료',
            rejected: '기각',
        };
        return labels[status] || status;
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            post: '게시글',
            comment: '댓글',
            user: '사용자',
        };
        return labels[type] || type;
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: ko });
        } catch {
            return dateString;
        }
    };

    if (error && reports.length === 0) {
        return (
            <Card>
                <CardContent>
                    <Alert severity="warning">{error}</Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                    <Flag color="error" />
                    신고 관리
                </Typography>
                <TextField
                    select
                    size="small"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="all">전체</MenuItem>
                    <MenuItem value="pending">대기중</MenuItem>
                    <MenuItem value="resolved">처리완료</MenuItem>
                    <MenuItem value="rejected">기각</MenuItem>
                </TextField>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                </Box>
            ) : reports.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" align="center">
                            신고 내역이 없습니다.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell width={80}>타입</TableCell>
                                <TableCell>대상</TableCell>
                                <TableCell>신고자</TableCell>
                                <TableCell>사유</TableCell>
                                <TableCell width={100}>상태</TableCell>
                                <TableCell width={150}>신고일</TableCell>
                                <TableCell width={100}>액션</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reports.map((report) => (
                                <TableRow key={report.id}>
                                    <TableCell>
                                        <Chip
                                            label={getTypeLabel(report.type)}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {report.target_title || `${report.type} #${report.target_id}`}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {report.reporter_name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                            {report.reason}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getStatusLabel(report.status)}
                                            color={getStatusColor(report.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="textSecondary">
                                            {formatDate(report.created_at)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" gap={0.5}>
                                            {report.status === 'pending' && (
                                                <>
                                                    <Tooltip title="처리">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleOpenDialog(report)}
                                                        >
                                                            <Check fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                            <Tooltip title="상세보기">
                                                <IconButton size="small">
                                                    <Visibility fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* 신고 처리 다이얼로그 */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>신고 처리</DialogTitle>
                <DialogContent>
                    {selectedReport && (
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                신고 대상
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                {selectedReport.target_title || `${selectedReport.type} #${selectedReport.target_id}`}
                            </Typography>

                            <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
                                신고 사유
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                {selectedReport.reason}
                            </Typography>

                            <TextField
                                select
                                fullWidth
                                label="처리 방법"
                                value={action}
                                onChange={(e) => setAction(e.target.value as 'approve' | 'reject')}
                                sx={{ mt: 2 }}
                            >
                                <MenuItem value="reject">신고 승인 (콘텐츠 삭제)</MenuItem>
                                <MenuItem value="approve">신고 기각 (콘텐츠 유지)</MenuItem>
                            </TextField>

                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="처리 메모"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="처리 사유를 입력하세요"
                                sx={{ mt: 2 }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} disabled={processing}>
                        취소
                    </Button>
                    <Button
                        onClick={handleProcessReport}
                        variant="contained"
                        disabled={processing}
                        startIcon={processing ? <CircularProgress size={16} /> : <Check />}
                    >
                        처리
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ReportDashboard;
