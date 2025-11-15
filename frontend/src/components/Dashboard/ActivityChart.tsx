import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ActivityChartProps } from '../../types/dashboard';
import './ActivityChart.css';

const ActivityChart: React.FC<ActivityChartProps> = ({ data, metric, loading }) => {
    if (loading) {
        return (
            <div className="activity-chart">
                <h3>활동 추이</h3>
                <div className="chart-skeleton">
                    <div className="skeleton-chart"></div>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="activity-chart">
                <h3>활동 추이</h3>
                <div className="chart-empty">
                    <p>데이터가 없습니다</p>
                </div>
            </div>
        );
    }

    // 날짜 포맷팅
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    // 차트 데이터 변환
    const chartData = data.map(item => ({
        date: formatDate(item.stat_date),
        '활성 사용자': item.active_users || 0,
        '게시물': item.new_posts || 0,
        '댓글': item.new_comments || 0,
        '좋아요': item.new_likes || 0,
        '조회수': item.new_views || 0
    }));

    return (
        <div className="activity-chart">
            <h3>활동 추이</h3>
            <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ffc658" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff7c7c" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ff7c7c" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                        type="monotone"
                        dataKey="활성 사용자"
                        stroke="#8884d8"
                        fillOpacity={1}
                        fill="url(#colorUsers)"
                    />
                    <Area
                        type="monotone"
                        dataKey="게시물"
                        stroke="#82ca9d"
                        fillOpacity={1}
                        fill="url(#colorPosts)"
                    />
                    <Area
                        type="monotone"
                        dataKey="댓글"
                        stroke="#ffc658"
                        fillOpacity={1}
                        fill="url(#colorComments)"
                    />
                    <Area
                        type="monotone"
                        dataKey="좋아요"
                        stroke="#ff7c7c"
                        fillOpacity={1}
                        fill="url(#colorLikes)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ActivityChart;
