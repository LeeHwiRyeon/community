import React, { useState, useEffect } from 'react';
import { performanceOptimizer } from '../../utils/PerformanceOptimizer';
import { usePerformanceMonitoring } from '../../hooks/usePerformanceOptimization';

/**
 * 📊 성능 대시보드 컴포넌트
 * 
 * 실시간 성능 메트릭 모니터링 및 최적화 제안
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */
const PerformanceDashboard: React.FC = () => {
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [metrics, setMetrics] = useState<any>({});
    const [recommendations, setRecommendations] = useState<string[]>([]);

    const { metrics: liveMetrics, logPerformance } = usePerformanceMonitoring('PerformanceDashboard');

    useEffect(() => {
        if (isMonitoring) {
            performanceOptimizer.startMonitoring();
        }
    }, [isMonitoring]);

    useEffect(() => {
        setMetrics(liveMetrics);
        if (liveMetrics.recommendations) {
            setRecommendations(liveMetrics.recommendations);
        }
    }, [liveMetrics]);

    const handleStartMonitoring = () => {
        setIsMonitoring(true);
        performanceOptimizer.collectMetrics();
    };

    const handleStopMonitoring = () => {
        setIsMonitoring(false);
    };

    const handleGenerateReport = () => {
        const report = performanceOptimizer.generateReport();
        console.log('성능 리포트:', report);
        setMetrics(report.metrics);
        setRecommendations(report.recommendations);
    };

    const getMetricColor = (value: number, thresholds: { good: number; warning: number }) => {
        if (value <= thresholds.good) return '#10b981'; // green
        if (value <= thresholds.warning) return '#f59e0b'; // yellow
        return '#ef4444'; // red
    };

    const formatMetric = (value: number, unit: string = '') => {
        if (value === undefined || value === null) return 'N/A';
        return `${value.toFixed(2)}${unit}`;
    };

    return (
        <div style={{
            padding: '2rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            minHeight: '100vh',
            color: 'white'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '1rem',
                padding: '2rem',
                backdropFilter: 'blur(10px)'
            }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    marginBottom: '2rem',
                    textAlign: 'center'
                }}>
                    📊 성능 대시보드
                </h1>

                {/* 제어 패널 */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '2rem',
                    justifyContent: 'center'
                }}>
                    <button
                        onClick={handleStartMonitoring}
                        disabled={isMonitoring}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: isMonitoring ? '#6b7280' : '#10b981',
                            color: 'white',
                            cursor: isMonitoring ? 'not-allowed' : 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        {isMonitoring ? '모니터링 중...' : '모니터링 시작'}
                    </button>

                    <button
                        onClick={handleStopMonitoring}
                        disabled={!isMonitoring}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: !isMonitoring ? '#6b7280' : '#ef4444',
                            color: 'white',
                            cursor: !isMonitoring ? 'not-allowed' : 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        모니터링 중지
                    </button>

                    <button
                        onClick={handleGenerateReport}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: '#3b82f6',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        리포트 생성
                    </button>
                </div>

                {/* Core Web Vitals */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>LCP (Largest Contentful Paint)</h3>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: getMetricColor(metrics.LCP || 0, { good: 2500, warning: 4000 })
                        }}>
                            {formatMetric(metrics.LCP, 'ms')}
                        </div>
                        <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>
                            목표: &lt; 2.5초
                        </p>
                    </div>

                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>FID (First Input Delay)</h3>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: getMetricColor(metrics.FID || 0, { good: 100, warning: 300 })
                        }}>
                            {formatMetric(metrics.FID, 'ms')}
                        </div>
                        <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>
                            목표: &lt; 100ms
                        </p>
                    </div>

                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>CLS (Cumulative Layout Shift)</h3>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: getMetricColor(metrics.CLS || 0, { good: 0.1, warning: 0.25 })
                        }}>
                            {formatMetric(metrics.CLS)}
                        </div>
                        <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>
                            목표: &lt; 0.1
                        </p>
                    </div>
                </div>

                {/* 성능 메트릭 */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        textAlign: 'center'
                    }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>FPS</h4>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: getMetricColor(metrics.FPS || 0, { good: 60, warning: 30 })
                        }}>
                            {formatMetric(metrics.FPS)}
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        textAlign: 'center'
                    }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>메모리 사용량</h4>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#3b82f6'
                        }}>
                            {formatMetric(metrics.usedJSHeapSize / 1024 / 1024, 'MB')}
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        textAlign: 'center'
                    }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>총 메모리</h4>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#3b82f6'
                        }}>
                            {formatMetric(metrics.totalJSHeapSize / 1024 / 1024, 'MB')}
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        textAlign: 'center'
                    }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>메모리 한계</h4>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#3b82f6'
                        }}>
                            {formatMetric(metrics.jsHeapSizeLimit / 1024 / 1024, 'MB')}
                        </div>
                    </div>
                </div>

                {/* 최적화 권장사항 */}
                {recommendations.length > 0 && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        marginBottom: '2rem'
                    }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
                            💡 성능 최적화 권장사항
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {recommendations.map((recommendation, index) => (
                                <li key={index} style={{
                                    padding: '0.5rem 0',
                                    borderBottom: index < recommendations.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                                }}>
                                    {recommendation}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 실시간 상태 */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    textAlign: 'center'
                }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
                        🔍 모니터링 상태
                    </h3>
                    <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: isMonitoring ? '#10b981' : '#ef4444'
                    }}>
                        {isMonitoring ? '✅ 활성' : '❌ 비활성'}
                    </div>
                    <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>
                        마지막 업데이트: {new Date().toLocaleTimeString()}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PerformanceDashboard;
