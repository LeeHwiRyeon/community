import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { CategoryPieChartProps } from '../../types/dashboard';
import './CategoryPieChart.css';

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="category-pie-chart">
                <h3>카테고리별 분포</h3>
                <div className="chart-skeleton">
                    <div className="skeleton-pie"></div>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="category-pie-chart">
                <h3>카테고리별 분포</h3>
                <div className="chart-empty">
                    <p>데이터가 없습니다</p>
                </div>
            </div>
        );
    }

    // 색상 팔레트
    const COLORS = [
        '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
        '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C',
        '#A4DE6C', '#D0ED57', '#8DD1E1', '#83A6ED'
    ];

    // 차트 데이터 변환
    const chartData = data.map((category, index) => ({
        name: category.category_name,
        value: category.total_posts || 0,
        percentage: parseFloat(category.percentage),
        color: COLORS[index % COLORS.length]
    }));

    // 커스텀 레이블
    const renderLabel = (entry: any) => {
        return `${entry.percentage}%`;
    };

    // 커스텀 툴팁
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const category = data.name;
            const categoryData = chartData.find(c => c.name === category);
            const fullData = data.name ?
                data :
                { ...data, ...chartData.find((c: any) => c.name === payload[0].name) };

            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{fullData.name}</p>
                    <p className="tooltip-value">게시물: {fullData.value}</p>
                    <p className="tooltip-percentage">비율: {fullData.percentage}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="category-pie-chart">
            <h3>카테고리별 게시물 분포</h3>
            <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>

            <div className="category-stats-list">
                {data.slice(0, 5).map((category, index) => (
                    <div key={category.category_id} className="category-stat-item">
                        <div
                            className="category-color"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <div className="category-info">
                            <div className="category-name">{category.category_name}</div>
                            <div className="category-metrics">
                                게시물 {category.total_posts} ·
                                댓글 {category.total_comments} ·
                                좋아요 {category.total_likes}
                            </div>
                        </div>
                        <div className="category-percentage">{category.percentage}%</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryPieChart;
