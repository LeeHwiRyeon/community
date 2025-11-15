import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OverviewCards from './OverviewCards';
import ActivityChart from './ActivityChart';
import LeaderboardTable from './LeaderboardTable';
import CategoryPieChart from './CategoryPieChart';
import ActivityFeed from './ActivityFeed';
import axios from 'axios';
import type {
    DashboardOverview,
    TimeSeriesDataPoint,
    LeaderboardEntry,
    CategoryStat,
    ActivityFeedItem
} from '../../types/dashboard';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [overview, setOverview] = useState<DashboardOverview | null>(null);
    const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [categories, setCategories] = useState<CategoryStat[]>([]);
    const [activities, setActivities] = useState<ActivityFeedItem[]>([]);

    const [loading, setLoading] = useState({
        overview: true,
        timeseries: true,
        leaderboard: true,
        categories: true,
        activities: true
    });

    const [timeRange, setTimeRange] = useState(30); // 기본 30일
    const [leaderboardType, setLeaderboardType] = useState('posts');
    const [error, setError] = useState<string | null>(null);

    // API 호출 함수
    const fetchOverview = async () => {
        try {
            setLoading(prev => ({ ...prev, overview: true }));
            const response = await axios.get('/api/dashboard/overview');
            setOverview(response.data.data);
        } catch (err: any) {
            console.error('개요 조회 오류:', err);
            if (err.response?.status === 403) {
                setError('관리자 권한이 필요합니다');
                setTimeout(() => navigate('/'), 2000);
            }
        } finally {
            setLoading(prev => ({ ...prev, overview: false }));
        }
    };

    const fetchTimeSeriesData = async () => {
        try {
            setLoading(prev => ({ ...prev, timeseries: true }));
            const response = await axios.get('/api/dashboard/timeseries', {
                params: { days: timeRange, metric: 'all' }
            });
            setTimeSeriesData(response.data.data.timeseries);
        } catch (err) {
            console.error('시계열 데이터 조회 오류:', err);
        } finally {
            setLoading(prev => ({ ...prev, timeseries: false }));
        }
    };

    const fetchLeaderboard = async () => {
        try {
            setLoading(prev => ({ ...prev, leaderboard: true }));
            const response = await axios.get('/api/dashboard/leaderboard', {
                params: { type: leaderboardType, limit: 10 }
            });
            setLeaderboard(response.data.data.leaderboard);
        } catch (err) {
            console.error('리더보드 조회 오류:', err);
        } finally {
            setLoading(prev => ({ ...prev, leaderboard: false }));
        }
    };

    const fetchCategories = async () => {
        try {
            setLoading(prev => ({ ...prev, categories: true }));
            const response = await axios.get('/api/dashboard/categories', {
                params: { days: timeRange }
            });
            setCategories(response.data.data.categories);
        } catch (err) {
            console.error('카테고리 통계 조회 오류:', err);
        } finally {
            setLoading(prev => ({ ...prev, categories: false }));
        }
    };

    const fetchActivities = async () => {
        try {
            setLoading(prev => ({ ...prev, activities: true }));
            const response = await axios.get('/api/dashboard/activity-feed', {
                params: { limit: 50, hours: 24 }
            });
            setActivities(response.data.data.activities);
        } catch (err) {
            console.error('활동 피드 조회 오류:', err);
        } finally {
            setLoading(prev => ({ ...prev, activities: false }));
        }
    };

    const handleRefreshStats = async () => {
        try {
            await axios.post('/api/dashboard/refresh-stats');
            // 모든 데이터 재조회
            fetchOverview();
            fetchTimeSeriesData();
            fetchLeaderboard();
            fetchCategories();
            fetchActivities();
        } catch (err) {
            console.error('통계 갱신 오류:', err);
            alert('통계 갱신 중 오류가 발생했습니다');
        }
    };

    // 초기 데이터 로드
    useEffect(() => {
        fetchOverview();
        fetchTimeSeriesData();
        fetchLeaderboard();
        fetchCategories();
        fetchActivities();
    }, []);

    // 시간 범위 변경 시 재조회
    useEffect(() => {
        fetchTimeSeriesData();
        fetchCategories();
    }, [timeRange]);

    // 리더보드 타입 변경 시 재조회
    useEffect(() => {
        fetchLeaderboard();
    }, [leaderboardType]);

    if (error) {
        return (
            <div className="dashboard-error">
                <h2>접근 거부</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h1>관리자 대시보드</h1>
                <div className="dashboard-controls">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(Number(e.target.value))}
                        className="time-range-select"
                    >
                        <option value={7}>최근 7일</option>
                        <option value={30}>최근 30일</option>
                        <option value={90}>최근 90일</option>
                        <option value={180}>최근 6개월</option>
                        <option value={365}>최근 1년</option>
                    </select>
                    <button onClick={handleRefreshStats} className="refresh-button">
                        통계 갱신
                    </button>
                </div>
            </div>

            {/* 개요 카드 */}
            <OverviewCards
                overview={overview}
                loading={loading.overview}
            />

            {/* 차트 그리드 */}
            <div className="dashboard-grid">
                {/* 활동 차트 */}
                <div className="dashboard-card chart-card">
                    <ActivityChart
                        data={timeSeriesData}
                        metric="all"
                        loading={loading.timeseries}
                    />
                </div>

                {/* 카테고리 파이 차트 */}
                <div className="dashboard-card pie-chart-card">
                    <CategoryPieChart
                        data={categories}
                        loading={loading.categories}
                    />
                </div>
            </div>

            {/* 리더보드 및 활동 피드 */}
            <div className="dashboard-grid-2">
                {/* 리더보드 */}
                <div className="dashboard-card leaderboard-card">
                    <LeaderboardTable
                        data={leaderboard}
                        type={leaderboardType}
                        loading={loading.leaderboard}
                        onTypeChange={setLeaderboardType}
                    />
                </div>

                {/* 활동 피드 */}
                <div className="dashboard-card activity-feed-card">
                    <ActivityFeed
                        activities={activities}
                        loading={loading.activities}
                        onRefresh={fetchActivities}
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
