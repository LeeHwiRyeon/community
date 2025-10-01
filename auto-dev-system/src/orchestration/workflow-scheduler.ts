import fs from 'fs/promises';
import path from 'path';
import { Workflow, WorkflowStep, Goal } from '@/types';

export class WorkflowScheduler {
    private projectPath: string;
    private scheduledWorkflows: Map<string, ScheduledWorkflow> = new Map();
    private cronJobs: Map<string, any> = new Map();

    constructor(projectPath: string = './generated-projects') {
        this.projectPath = projectPath;
    }

    /**
     * 워크플로우 스케줄링
     */
    async scheduleWorkflow(
        workflow: Workflow,
        schedule: WorkflowSchedule
    ): Promise<ScheduledWorkflow> {
        console.log(`📅 워크플로우 스케줄링: ${workflow.id}`);

        const scheduledWorkflow: ScheduledWorkflow = {
            id: this.generateId(),
            workflowId: workflow.id,
            workflow,
            schedule,
            status: 'scheduled',
            nextExecution: this.calculateNextExecution(schedule),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.scheduledWorkflows.set(scheduledWorkflow.id, scheduledWorkflow);

        // 크론 작업 설정
        if (schedule.type === 'cron') {
            await this.setupCronJob(scheduledWorkflow);
        }

        // 일회성 작업 설정
        if (schedule.type === 'once') {
            await this.setupOneTimeJob(scheduledWorkflow);
        }

        // 반복 작업 설정
        if (schedule.type === 'interval') {
            await this.setupIntervalJob(scheduledWorkflow);
        }

        console.log(`✅ 워크플로우 스케줄링 완료: ${scheduledWorkflow.id}`);
        return scheduledWorkflow;
    }

    /**
     * 크론 작업 설정
     */
    private async setupCronJob(scheduledWorkflow: ScheduledWorkflow): Promise<void> {
        console.log(`⏰ 크론 작업 설정: ${scheduledWorkflow.id}`);

        // 실제 구현에서는 node-cron 또는 다른 크론 라이브러리 사용
        const cronExpression = scheduledWorkflow.schedule.cronExpression;

        // 크론 작업 등록 (의사코드)
        this.cronJobs.set(scheduledWorkflow.id, {
            expression: cronExpression,
            callback: () => this.executeScheduledWorkflow(scheduledWorkflow.id)
        });
    }

    /**
     * 일회성 작업 설정
     */
    private async setupOneTimeJob(scheduledWorkflow: ScheduledWorkflow): Promise<void> {
        console.log(`⏰ 일회성 작업 설정: ${scheduledWorkflow.id}`);

        const delay = scheduledWorkflow.nextExecution.getTime() - Date.now();

        if (delay > 0) {
            setTimeout(() => {
                this.executeScheduledWorkflow(scheduledWorkflow.id);
            }, delay);
        } else {
            // 즉시 실행
            await this.executeScheduledWorkflow(scheduledWorkflow.id);
        }
    }

    /**
     * 반복 작업 설정
     */
    private async setupIntervalJob(scheduledWorkflow: ScheduledWorkflow): Promise<void> {
        console.log(`⏰ 반복 작업 설정: ${scheduledWorkflow.id}`);

        const interval = scheduledWorkflow.schedule.interval;

        const intervalId = setInterval(() => {
            this.executeScheduledWorkflow(scheduledWorkflow.id);
        }, interval);

        this.cronJobs.set(scheduledWorkflow.id, {
            type: 'interval',
            intervalId,
            callback: () => this.executeScheduledWorkflow(scheduledWorkflow.id)
        });
    }

    /**
     * 스케줄된 워크플로우 실행
     */
    private async executeScheduledWorkflow(scheduledWorkflowId: string): Promise<void> {
        const scheduledWorkflow = this.scheduledWorkflows.get(scheduledWorkflowId);
        if (!scheduledWorkflow) {
            console.error(`❌ 스케줄된 워크플로우를 찾을 수 없습니다: ${scheduledWorkflowId}`);
            return;
        }

        console.log(`🚀 스케줄된 워크플로우 실행: ${scheduledWorkflowId}`);

        try {
            // 워크플로우 실행 (실제 구현에서는 WorkflowEngine 사용)
            scheduledWorkflow.status = 'running';
            scheduledWorkflow.updatedAt = new Date();

            // 실행 로직 (의사코드)
            await this.runWorkflow(scheduledWorkflow.workflow);

            scheduledWorkflow.status = 'completed';
            scheduledWorkflow.lastExecution = new Date();
            scheduledWorkflow.nextExecution = this.calculateNextExecution(scheduledWorkflow.schedule);

            console.log(`✅ 스케줄된 워크플로우 완료: ${scheduledWorkflowId}`);

        } catch (error) {
            console.error(`❌ 스케줄된 워크플로우 실행 실패: ${scheduledWorkflowId}`, error);

            scheduledWorkflow.status = 'failed';
            scheduledWorkflow.lastError = error instanceof Error ? error.message : 'Unknown error';
            scheduledWorkflow.updatedAt = new Date();
        }
    }

    /**
     * 워크플로우 실행 (의사코드)
     */
    private async runWorkflow(workflow: Workflow): Promise<void> {
        // 실제 구현에서는 WorkflowEngine.executeWorkflow 호출
        console.log(`🔄 워크플로우 실행: ${workflow.id}`);

        // 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    /**
     * 다음 실행 시간 계산
     */
    private calculateNextExecution(schedule: WorkflowSchedule): Date {
        const now = new Date();

        switch (schedule.type) {
            case 'once':
                return schedule.executeAt || now;

            case 'interval':
                return new Date(now.getTime() + schedule.interval);

            case 'cron':
                return this.calculateNextCronExecution(schedule.cronExpression!, now);

            default:
                return now;
        }
    }

    /**
     * 크론 표현식 기반 다음 실행 시간 계산
     */
    private calculateNextCronExecution(cronExpression: string, from: Date): Date {
        // 실제 구현에서는 cron-parser 라이브러리 사용
        // 예시: 5분 후 실행
        return new Date(from.getTime() + 5 * 60 * 1000);
    }

    /**
     * 스케줄된 워크플로우 조회
     */
    getScheduledWorkflows(): ScheduledWorkflow[] {
        return Array.from(this.scheduledWorkflows.values());
    }

    /**
     * 스케줄된 워크플로우 상태 조회
     */
    getScheduledWorkflowStatus(scheduledWorkflowId: string): ScheduledWorkflowStatus | null {
        const scheduledWorkflow = this.scheduledWorkflows.get(scheduledWorkflowId);
        if (!scheduledWorkflow) {
            return null;
        }

        return {
            id: scheduledWorkflow.id,
            workflowId: scheduledWorkflow.workflowId,
            status: scheduledWorkflow.status,
            nextExecution: scheduledWorkflow.nextExecution,
            lastExecution: scheduledWorkflow.lastExecution,
            lastError: scheduledWorkflow.lastError,
            createdAt: scheduledWorkflow.createdAt,
            updatedAt: scheduledWorkflow.updatedAt
        };
    }

    /**
     * 스케줄된 워크플로우 수정
     */
    async updateScheduledWorkflow(
        scheduledWorkflowId: string,
        updates: Partial<WorkflowSchedule>
    ): Promise<boolean> {
        const scheduledWorkflow = this.scheduledWorkflows.get(scheduledWorkflowId);
        if (!scheduledWorkflow) {
            return false;
        }

        // 기존 크론 작업 제거
        const existingJob = this.cronJobs.get(scheduledWorkflowId);
        if (existingJob) {
            if (existingJob.intervalId) {
                clearInterval(existingJob.intervalId);
            }
            this.cronJobs.delete(scheduledWorkflowId);
        }

        // 스케줄 업데이트
        scheduledWorkflow.schedule = { ...scheduledWorkflow.schedule, ...updates };
        scheduledWorkflow.nextExecution = this.calculateNextExecution(scheduledWorkflow.schedule);
        scheduledWorkflow.updatedAt = new Date();

        // 새로운 크론 작업 설정
        if (scheduledWorkflow.schedule.type === 'cron') {
            await this.setupCronJob(scheduledWorkflow);
        } else if (scheduledWorkflow.schedule.type === 'interval') {
            await this.setupIntervalJob(scheduledWorkflow);
        }

        console.log(`✅ 스케줄된 워크플로우 수정: ${scheduledWorkflowId}`);
        return true;
    }

    /**
     * 스케줄된 워크플로우 삭제
     */
    async deleteScheduledWorkflow(scheduledWorkflowId: string): Promise<boolean> {
        const scheduledWorkflow = this.scheduledWorkflows.get(scheduledWorkflowId);
        if (!scheduledWorkflow) {
            return false;
        }

        // 크론 작업 제거
        const job = this.cronJobs.get(scheduledWorkflowId);
        if (job) {
            if (job.intervalId) {
                clearInterval(job.intervalId);
            }
            this.cronJobs.delete(scheduledWorkflowId);
        }

        // 스케줄된 워크플로우 제거
        this.scheduledWorkflows.delete(scheduledWorkflowId);

        console.log(`🗑️ 스케줄된 워크플로우 삭제: ${scheduledWorkflowId}`);
        return true;
    }

    /**
     * 스케줄된 워크플로우 일시정지
     */
    async pauseScheduledWorkflow(scheduledWorkflowId: string): Promise<boolean> {
        const scheduledWorkflow = this.scheduledWorkflows.get(scheduledWorkflowId);
        if (!scheduledWorkflow) {
            return false;
        }

        // 크론 작업 일시정지
        const job = this.cronJobs.get(scheduledWorkflowId);
        if (job && job.intervalId) {
            clearInterval(job.intervalId);
        }

        scheduledWorkflow.status = 'paused';
        scheduledWorkflow.updatedAt = new Date();

        console.log(`⏸️ 스케줄된 워크플로우 일시정지: ${scheduledWorkflowId}`);
        return true;
    }

    /**
     * 스케줄된 워크플로우 재개
     */
    async resumeScheduledWorkflow(scheduledWorkflowId: string): Promise<boolean> {
        const scheduledWorkflow = this.scheduledWorkflows.get(scheduledWorkflowId);
        if (!scheduledWorkflow) {
            return false;
        }

        // 크론 작업 재개
        if (scheduledWorkflow.schedule.type === 'cron') {
            await this.setupCronJob(scheduledWorkflow);
        } else if (scheduledWorkflow.schedule.type === 'interval') {
            await this.setupIntervalJob(scheduledWorkflow);
        }

        scheduledWorkflow.status = 'scheduled';
        scheduledWorkflow.updatedAt = new Date();

        console.log(`▶️ 스케줄된 워크플로우 재개: ${scheduledWorkflowId}`);
        return true;
    }

    /**
     * 스케줄 통계 조회
     */
    getScheduleStatistics(): ScheduleStatistics {
        const scheduledWorkflows = Array.from(this.scheduledWorkflows.values());

        return {
            total: scheduledWorkflows.length,
            active: scheduledWorkflows.filter(w => w.status === 'scheduled' || w.status === 'running').length,
            paused: scheduledWorkflows.filter(w => w.status === 'paused').length,
            completed: scheduledWorkflows.filter(w => w.status === 'completed').length,
            failed: scheduledWorkflows.filter(w => w.status === 'failed').length,
            nextExecution: this.getNextExecutionTime(scheduledWorkflows)
        };
    }

    /**
     * 다음 실행 시간 조회
     */
    private getNextExecutionTime(scheduledWorkflows: ScheduledWorkflow[]): Date | null {
        const activeWorkflows = scheduledWorkflows.filter(w =>
            w.status === 'scheduled' || w.status === 'running'
        );

        if (activeWorkflows.length === 0) {
            return null;
        }

        const nextExecutions = activeWorkflows
            .map(w => w.nextExecution)
            .filter(date => date !== null)
            .sort((a, b) => a.getTime() - b.getTime());

        return nextExecutions[0] || null;
    }

    /**
     * 스케줄 리포트 생성
     */
    async generateScheduleReport(): Promise<string> {
        const statistics = this.getScheduleStatistics();
        const scheduledWorkflows = this.getScheduledWorkflows();

        const report = {
            statistics,
            scheduledWorkflows: scheduledWorkflows.map(w => ({
                id: w.id,
                workflowId: w.workflowId,
                status: w.status,
                schedule: w.schedule,
                nextExecution: w.nextExecution,
                lastExecution: w.lastExecution,
                lastError: w.lastError
            })),
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(this.projectPath, 'workflow-schedule-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return reportPath;
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

// 타입 정의
interface ScheduledWorkflow {
    id: string;
    workflowId: string;
    workflow: Workflow;
    schedule: WorkflowSchedule;
    status: 'scheduled' | 'running' | 'completed' | 'failed' | 'paused';
    nextExecution: Date;
    lastExecution?: Date;
    lastError?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface WorkflowSchedule {
    type: 'once' | 'interval' | 'cron';
    executeAt?: Date;
    interval?: number; // milliseconds
    cronExpression?: string;
    timezone?: string;
    enabled?: boolean;
}

interface ScheduledWorkflowStatus {
    id: string;
    workflowId: string;
    status: string;
    nextExecution: Date;
    lastExecution?: Date;
    lastError?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface ScheduleStatistics {
    total: number;
    active: number;
    paused: number;
    completed: number;
    failed: number;
    nextExecution: Date | null;
}
