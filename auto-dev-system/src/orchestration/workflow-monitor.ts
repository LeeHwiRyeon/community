import fs from 'fs/promises';
import path from 'path';
import { Workflow, WorkflowStep } from '@/types';

export class WorkflowMonitor {
    private projectPath: string;
    private monitoringData: Map<string, WorkflowMonitoringData> = new Map();
    private alerts: WorkflowAlert[] = [];
    private metrics: WorkflowMetrics = {
        totalWorkflows: 0,
        successfulWorkflows: 0,
        failedWorkflows: 0,
        averageExecutionTime: 0,
        averageSuccessRate: 0,
        resourceUsage: {
            cpu: 0,
            memory: 0,
            disk: 0
        }
    };

    constructor(projectPath: string = './generated-projects') {
        this.projectPath = projectPath;
    }

    /**
     * 워크플로우 모니터링 시작
     */
    async startMonitoring(workflow: Workflow): Promise<void> {
        console.log(`📊 워크플로우 모니터링 시작: ${workflow.id}`);

        const monitoringData: WorkflowMonitoringData = {
            workflowId: workflow.id,
            startTime: new Date(),
            endTime: null,
            status: 'running',
            steps: [],
            metrics: {
                executionTime: 0,
                memoryUsage: [],
                cpuUsage: [],
                errorCount: 0,
                warningCount: 0
            },
            alerts: [],
            logs: []
        };

        this.monitoringData.set(workflow.id, monitoringData);

        // 모니터링 간격 설정 (1초마다)
        const monitoringInterval = setInterval(() => {
            this.updateMonitoringData(workflow.id);
        }, 1000);

        // 워크플로우 완료 시 모니터링 중단
        const checkCompletion = setInterval(() => {
            const data = this.monitoringData.get(workflow.id);
            if (data && (data.status === 'completed' || data.status === 'failed')) {
                clearInterval(monitoringInterval);
                clearInterval(checkCompletion);
                this.finalizeMonitoring(workflow.id);
            }
        }, 1000);
    }

    /**
     * 모니터링 데이터 업데이트
     */
    private updateMonitoringData(workflowId: string): void {
        const data = this.monitoringData.get(workflowId);
        if (!data) return;

        const now = new Date();
        const executionTime = now.getTime() - data.startTime.getTime();

        // 메모리 사용량 측정
        const memoryUsage = this.getMemoryUsage();
        data.metrics.memoryUsage.push({
            timestamp: now,
            value: memoryUsage
        });

        // CPU 사용량 측정
        const cpuUsage = this.getCPUUsage();
        data.metrics.cpuUsage.push({
            timestamp: now,
            value: cpuUsage
        });

        // 실행 시간 업데이트
        data.metrics.executionTime = executionTime;

        // 임계값 체크 및 알림 생성
        this.checkThresholds(workflowId, data);

        // 로그 생성
        this.generateLog(workflowId, data);
    }

    /**
     * 임계값 체크
     */
    private checkThresholds(workflowId: string, data: WorkflowMonitoringData): void {
        // 메모리 사용량 체크
        const currentMemory = data.metrics.memoryUsage[data.metrics.memoryUsage.length - 1]?.value || 0;
        if (currentMemory > 1000) { // 1GB
            this.createAlert(workflowId, 'high_memory_usage', 'High memory usage detected', 'warning');
        }

        // CPU 사용량 체크
        const currentCPU = data.metrics.cpuUsage[data.metrics.cpuUsage.length - 1]?.value || 0;
        if (currentCPU > 90) { // 90%
            this.createAlert(workflowId, 'high_cpu_usage', 'High CPU usage detected', 'warning');
        }

        // 실행 시간 체크
        if (data.metrics.executionTime > 300000) { // 5분
            this.createAlert(workflowId, 'long_execution', 'Workflow execution taking longer than expected', 'info');
        }

        // 에러 수 체크
        if (data.metrics.errorCount > 5) {
            this.createAlert(workflowId, 'high_error_count', 'High error count detected', 'error');
        }
    }

    /**
     * 알림 생성
     */
    private createAlert(workflowId: string, type: string, message: string, severity: 'info' | 'warning' | 'error'): void {
        const alert: WorkflowAlert = {
            id: this.generateId(),
            workflowId,
            type,
            message,
            severity,
            timestamp: new Date(),
            acknowledged: false
        };

        this.alerts.push(alert);

        const data = this.monitoringData.get(workflowId);
        if (data) {
            data.alerts.push(alert);
        }

        console.log(`🚨 워크플로우 알림: ${workflowId} - ${message}`);
    }

    /**
     * 로그 생성
     */
    private generateLog(workflowId: string, data: WorkflowMonitoringData): void {
        const log: WorkflowLog = {
            id: this.generateId(),
            workflowId,
            level: 'info',
            message: `Workflow ${workflowId} is running`,
            timestamp: new Date(),
            metadata: {
                executionTime: data.metrics.executionTime,
                memoryUsage: data.metrics.memoryUsage[data.metrics.memoryUsage.length - 1]?.value || 0,
                cpuUsage: data.metrics.cpuUsage[data.metrics.cpuUsage.length - 1]?.value || 0,
                errorCount: data.metrics.errorCount,
                warningCount: data.metrics.warningCount
            }
        };

        data.logs.push(log);
    }

    /**
     * 워크플로우 완료 시 모니터링 종료
     */
    private finalizeMonitoring(workflowId: string): void {
        const data = this.monitoringData.get(workflowId);
        if (!data) return;

        data.endTime = new Date();
        data.status = 'completed';

        // 최종 메트릭 계산
        this.calculateFinalMetrics(workflowId, data);

        // 모니터링 리포트 생성
        this.generateMonitoringReport(workflowId, data);

        console.log(`📊 워크플로우 모니터링 완료: ${workflowId}`);
    }

    /**
     * 최종 메트릭 계산
     */
    private calculateFinalMetrics(workflowId: string, data: WorkflowMonitoringData): void {
        // 평균 메모리 사용량
        const avgMemory = data.metrics.memoryUsage.reduce((sum, usage) => sum + usage.value, 0) / data.metrics.memoryUsage.length;

        // 평균 CPU 사용량
        const avgCPU = data.metrics.cpuUsage.reduce((sum, usage) => sum + usage.value, 0) / data.metrics.cpuUsage.length;

        // 최대 메모리 사용량
        const maxMemory = Math.max(...data.metrics.memoryUsage.map(usage => usage.value));

        // 최대 CPU 사용량
        const maxCPU = Math.max(...data.metrics.cpuUsage.map(usage => usage.value));

        data.metrics.averageMemoryUsage = avgMemory;
        data.metrics.averageCPUUsage = avgCPU;
        data.metrics.maxMemoryUsage = maxMemory;
        data.metrics.maxCPUUsage = maxCPU;
    }

    /**
     * 모니터링 리포트 생성
     */
    private async generateMonitoringReport(workflowId: string, data: WorkflowMonitoringData): Promise<void> {
        const report = {
            workflowId,
            summary: {
                startTime: data.startTime,
                endTime: data.endTime,
                duration: data.metrics.executionTime,
                status: data.status,
                totalSteps: data.steps.length,
                errorCount: data.metrics.errorCount,
                warningCount: data.metrics.warningCount
            },
            metrics: data.metrics,
            alerts: data.alerts,
            logs: data.logs.slice(-100), // 최근 100개 로그만
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(this.projectPath, `workflow-monitoring-${workflowId}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    }

    /**
     * 워크플로우 상태 조회
     */
    getWorkflowStatus(workflowId: string): WorkflowStatus | null {
        const data = this.monitoringData.get(workflowId);
        if (!data) return null;

        return {
            workflowId,
            status: data.status,
            startTime: data.startTime,
            endTime: data.endTime,
            executionTime: data.metrics.executionTime,
            currentStep: data.steps[data.steps.length - 1]?.name || null,
            progress: this.calculateProgress(data),
            memoryUsage: data.metrics.memoryUsage[data.metrics.memoryUsage.length - 1]?.value || 0,
            cpuUsage: data.metrics.cpuUsage[data.metrics.cpuUsage.length - 1]?.value || 0,
            errorCount: data.metrics.errorCount,
            warningCount: data.metrics.warningCount
        };
    }

    /**
     * 진행률 계산
     */
    private calculateProgress(data: WorkflowMonitoringData): number {
        if (data.steps.length === 0) return 0;

        const completedSteps = data.steps.filter(step => step.status === 'completed').length;
        return (completedSteps / data.steps.length) * 100;
    }

    /**
     * 실시간 메트릭 조회
     */
    getRealTimeMetrics(workflowId: string): RealTimeMetrics | null {
        const data = this.monitoringData.get(workflowId);
        if (!data) return null;

        const latestMemory = data.metrics.memoryUsage[data.metrics.memoryUsage.length - 1];
        const latestCPU = data.metrics.cpuUsage[data.metrics.cpuUsage.length - 1];

        return {
            workflowId,
            timestamp: new Date(),
            memoryUsage: latestMemory?.value || 0,
            cpuUsage: latestCPU?.value || 0,
            executionTime: data.metrics.executionTime,
            errorCount: data.metrics.errorCount,
            warningCount: data.metrics.warningCount,
            status: data.status
        };
    }

    /**
     * 알림 조회
     */
    getAlerts(workflowId?: string): WorkflowAlert[] {
        if (workflowId) {
            return this.alerts.filter(alert => alert.workflowId === workflowId);
        }
        return this.alerts;
    }

    /**
     * 알림 확인
     */
    acknowledgeAlert(alertId: string): boolean {
        const alert = this.alerts.find(a => a.id === alertId);
        if (!alert) return false;

        alert.acknowledged = true;
        alert.acknowledgedAt = new Date();

        console.log(`✅ 알림 확인: ${alertId}`);
        return true;
    }

    /**
     * 워크플로우 로그 조회
     */
    getWorkflowLogs(workflowId: string, limit: number = 100): WorkflowLog[] {
        const data = this.monitoringData.get(workflowId);
        if (!data) return [];

        return data.logs.slice(-limit);
    }

    /**
     * 전체 메트릭 조회
     */
    getOverallMetrics(): WorkflowMetrics {
        const allData = Array.from(this.monitoringData.values());

        this.metrics.totalWorkflows = allData.length;
        this.metrics.successfulWorkflows = allData.filter(d => d.status === 'completed').length;
        this.metrics.failedWorkflows = allData.filter(d => d.status === 'failed').length;

        if (allData.length > 0) {
            this.metrics.averageExecutionTime = allData.reduce((sum, d) => sum + d.metrics.executionTime, 0) / allData.length;
            this.metrics.averageSuccessRate = this.metrics.successfulWorkflows / this.metrics.totalWorkflows;
        }

        // 리소스 사용량 계산
        const allMemoryUsage = allData.flatMap(d => d.metrics.memoryUsage.map(u => u.value));
        const allCPUUsage = allData.flatMap(d => d.metrics.cpuUsage.map(u => u.value));

        this.metrics.resourceUsage.memory = allMemoryUsage.length > 0 ?
            allMemoryUsage.reduce((sum, usage) => sum + usage, 0) / allMemoryUsage.length : 0;
        this.metrics.resourceUsage.cpu = allCPUUsage.length > 0 ?
            allCPUUsage.reduce((sum, usage) => sum + usage, 0) / allCPUUsage.length : 0;

        return this.metrics;
    }

    /**
     * 대시보드 데이터 생성
     */
    generateDashboardData(): DashboardData {
        const allData = Array.from(this.monitoringData.values());
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const recentWorkflows = allData.filter(d => d.startTime >= last24Hours);

        return {
            overview: {
                totalWorkflows: allData.length,
                activeWorkflows: allData.filter(d => d.status === 'running').length,
                successfulWorkflows: allData.filter(d => d.status === 'completed').length,
                failedWorkflows: allData.filter(d => d.status === 'failed').length,
                averageExecutionTime: allData.length > 0 ?
                    allData.reduce((sum, d) => sum + d.metrics.executionTime, 0) / allData.length : 0
            },
            recentActivity: recentWorkflows.map(d => ({
                workflowId: d.workflowId,
                status: d.status,
                startTime: d.startTime,
                executionTime: d.metrics.executionTime
            })),
            alerts: this.alerts.filter(a => !a.acknowledged).slice(-10),
            resourceUsage: {
                memory: this.metrics.resourceUsage.memory,
                cpu: this.metrics.resourceUsage.cpu,
                disk: this.metrics.resourceUsage.disk
            },
            trends: this.calculateTrends(allData)
        };
    }

    /**
     * 트렌드 계산
     */
    private calculateTrends(allData: WorkflowMonitoringData[]): TrendData[] {
        const trends: TrendData[] = [];

        // 실행 시간 트렌드
        const executionTimes = allData.map(d => d.metrics.executionTime);
        if (executionTimes.length > 1) {
            const avgExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
            trends.push({
                metric: 'execution_time',
                current: avgExecutionTime,
                trend: 'stable',
                change: 0
            });
        }

        // 성공률 트렌드
        const successRate = allData.filter(d => d.status === 'completed').length / allData.length;
        trends.push({
            metric: 'success_rate',
            current: successRate,
            trend: 'stable',
            change: 0
        });

        return trends;
    }

    // 헬퍼 메서드들
    private getMemoryUsage(): number {
        return process.memoryUsage().heapUsed / 1024 / 1024; // MB
    }

    private getCPUUsage(): number {
        // 실제 구현에서는 CPU 사용량 측정
        return Math.random() * 100; // 0-100%
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

// 타입 정의
interface WorkflowMonitoringData {
    workflowId: string;
    startTime: Date;
    endTime: Date | null;
    status: 'running' | 'completed' | 'failed';
    steps: WorkflowStepMonitoringData[];
    metrics: WorkflowStepMetrics;
    alerts: WorkflowAlert[];
    logs: WorkflowLog[];
}

interface WorkflowStepMonitoringData {
    stepName: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime: Date;
    endTime: Date | null;
    duration: number;
    memoryUsage: number;
    cpuUsage: number;
}

interface WorkflowStepMetrics {
    executionTime: number;
    memoryUsage: UsageDataPoint[];
    cpuUsage: UsageDataPoint[];
    errorCount: number;
    warningCount: number;
    averageMemoryUsage?: number;
    averageCPUUsage?: number;
    maxMemoryUsage?: number;
    maxCPUUsage?: number;
}

interface UsageDataPoint {
    timestamp: Date;
    value: number;
}

interface WorkflowAlert {
    id: string;
    workflowId: string;
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    timestamp: Date;
    acknowledged: boolean;
    acknowledgedAt?: Date;
}

interface WorkflowLog {
    id: string;
    workflowId: string;
    level: 'info' | 'warning' | 'error' | 'debug';
    message: string;
    timestamp: Date;
    metadata: Record<string, any>;
}

interface WorkflowStatus {
    workflowId: string;
    status: string;
    startTime: Date;
    endTime: Date | null;
    executionTime: number;
    currentStep: string | null;
    progress: number;
    memoryUsage: number;
    cpuUsage: number;
    errorCount: number;
    warningCount: number;
}

interface RealTimeMetrics {
    workflowId: string;
    timestamp: Date;
    memoryUsage: number;
    cpuUsage: number;
    executionTime: number;
    errorCount: number;
    warningCount: number;
    status: string;
}

interface WorkflowMetrics {
    totalWorkflows: number;
    successfulWorkflows: number;
    failedWorkflows: number;
    averageExecutionTime: number;
    averageSuccessRate: number;
    resourceUsage: {
        cpu: number;
        memory: number;
        disk: number;
    };
}

interface DashboardData {
    overview: {
        totalWorkflows: number;
        activeWorkflows: number;
        successfulWorkflows: number;
        failedWorkflows: number;
        averageExecutionTime: number;
    };
    recentActivity: Array<{
        workflowId: string;
        status: string;
        startTime: Date;
        executionTime: number;
    }>;
    alerts: WorkflowAlert[];
    resourceUsage: {
        memory: number;
        cpu: number;
        disk: number;
    };
    trends: TrendData[];
}

interface TrendData {
    metric: string;
    current: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
}
