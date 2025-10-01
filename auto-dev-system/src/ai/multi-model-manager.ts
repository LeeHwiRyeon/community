import { GoalAnalyzer, DevelopmentPlan } from '../types';

// AI 모델 설정 인터페이스
export interface AIModelConfig {
    name: string;
    provider: 'openai' | 'anthropic' | 'google' | 'azure';
    model: string;
    apiKey: string;
    baseUrl?: string;
    maxTokens: number;
    temperature: number;
    contextWindow: number;
    costPerToken: number;
    capabilities: string[];
    priority: number;
}

// 모델 응답 인터페이스
export interface ModelResponse {
    model: string;
    content: string;
    tokens: number;
    cost: number;
    latency: number;
    quality: number;
}

// 다중 AI 모델 관리자
export class MultiModelManager {
    private models: Map<string, AIModelConfig> = new Map();
    private fallbackChain: string[] = [];
    private performanceMetrics: Map<string, any> = new Map();

    constructor() {
        this.initializeDefaultModels();
    }

    // 기본 모델 초기화
    private initializeDefaultModels(): void {
        // GPT-4 (주 모델)
        this.addModel({
            name: 'gpt-4',
            provider: 'openai',
            model: 'gpt-4-turbo-preview',
            apiKey: process.env.OPENAI_API_KEY || '',
            maxTokens: 4096,
            temperature: 0.7,
            contextWindow: 128000,
            costPerToken: 0.00003,
            capabilities: ['code-generation', 'analysis', 'planning', 'refactoring'],
            priority: 1
        });

        // Claude-3 (대안 모델)
        this.addModel({
            name: 'claude-3',
            provider: 'anthropic',
            model: 'claude-3-sonnet-20240229',
            apiKey: process.env.ANTHROPIC_API_KEY || '',
            maxTokens: 4096,
            temperature: 0.7,
            contextWindow: 200000,
            costPerToken: 0.000015,
            capabilities: ['code-generation', 'analysis', 'reasoning', 'documentation'],
            priority: 2
        });

        // Gemini-Pro (경제적 모델)
        this.addModel({
            name: 'gemini-pro',
            provider: 'google',
            model: 'gemini-pro',
            apiKey: process.env.GOOGLE_API_KEY || '',
            maxTokens: 2048,
            temperature: 0.7,
            contextWindow: 32000,
            costPerToken: 0.0000005,
            capabilities: ['code-generation', 'analysis', 'quick-tasks'],
            priority: 3
        });

        // 폴백 체인 설정
        this.fallbackChain = ['gpt-4', 'claude-3', 'gemini-pro'];
    }

    // 모델 추가
    addModel(config: AIModelConfig): void {
        this.models.set(config.name, config);
        this.performanceMetrics.set(config.name, {
            totalRequests: 0,
            successfulRequests: 0,
            averageLatency: 0,
            averageQuality: 0,
            totalCost: 0,
            lastUsed: null
        });
    }

    // 작업 유형에 따른 최적 모델 선택
    selectOptimalModel(taskType: string, complexity: 'low' | 'medium' | 'high'): string {
        const availableModels = Array.from(this.models.values())
            .filter(model => model.capabilities.includes(taskType))
            .sort((a, b) => a.priority - b.priority);

        if (availableModels.length === 0) {
            return this.fallbackChain[0];
        }

        // 복잡도에 따른 모델 선택
        switch (complexity) {
            case 'high':
                return availableModels.find(m => m.name === 'gpt-4')?.name || availableModels[0].name;
            case 'medium':
                return availableModels.find(m => m.name === 'claude-3')?.name || availableModels[0].name;
            case 'low':
                return availableModels.find(m => m.name === 'gemini-pro')?.name || availableModels[0].name;
            default:
                return availableModels[0].name;
        }
    }

    // AI 요청 실행
    async executeRequest(
        prompt: string,
        taskType: string = 'general',
        complexity: 'low' | 'medium' | 'high' = 'medium',
        maxRetries: number = 3
    ): Promise<ModelResponse> {
        const selectedModel = this.selectOptimalModel(taskType, complexity);
        const modelConfig = this.models.get(selectedModel);

        if (!modelConfig) {
            throw new Error(`Model ${selectedModel} not found`);
        }

        let lastError: Error | null = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const startTime = Date.now();
                const response = await this.callModelAPI(modelConfig, prompt);
                const latency = Date.now() - startTime;

                const modelResponse: ModelResponse = {
                    model: selectedModel,
                    content: response.content,
                    tokens: response.tokens,
                    cost: response.tokens * modelConfig.costPerToken,
                    latency,
                    quality: this.assessResponseQuality(response.content, taskType)
                };

                // 성능 메트릭 업데이트
                this.updatePerformanceMetrics(selectedModel, modelResponse);

                return modelResponse;
            } catch (error) {
                lastError = error as Error;
                console.warn(`Attempt ${attempt + 1} failed for model ${selectedModel}:`, error);

                // 폴백 모델로 전환
                if (attempt < maxRetries - 1) {
                    const fallbackModel = this.getNextFallbackModel(selectedModel);
                    if (fallbackModel) {
                        const fallbackConfig = this.models.get(fallbackModel);
                        if (fallbackConfig) {
                            modelConfig.name = fallbackModel;
                            Object.assign(modelConfig, fallbackConfig);
                        }
                    }
                }
            }
        }

        throw new Error(`All models failed. Last error: ${lastError?.message}`);
    }

    // 모델 API 호출
    private async callModelAPI(config: AIModelConfig, prompt: string): Promise<any> {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
        };

        const requestBody = {
            model: config.model,
            messages: [
                {
                    role: 'system',
                    content: this.getSystemPrompt(config.name)
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: config.maxTokens,
            temperature: config.temperature
        };

        const baseUrl = config.baseUrl || this.getDefaultBaseUrl(config.provider);
        const response = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        return {
            content: data.choices[0].message.content,
            tokens: data.usage?.total_tokens || 0
        };
    }

    // 기본 API URL 가져오기
    private getDefaultBaseUrl(provider: string): string {
        const urls = {
            openai: 'https://api.openai.com',
            anthropic: 'https://api.anthropic.com',
            google: 'https://generativelanguage.googleapis.com',
            azure: 'https://your-azure-endpoint.openai.azure.com'
        };
        return urls[provider as keyof typeof urls] || urls.openai;
    }

    // 시스템 프롬프트 가져오기
    private getSystemPrompt(modelName: string): string {
        const prompts = {
            'gpt-4': 'You are an expert software developer and architect. Provide high-quality, production-ready code and detailed technical analysis.',
            'claude-3': 'You are a senior software engineer with expertise in code quality, architecture, and best practices. Focus on maintainable and scalable solutions.',
            'gemini-pro': 'You are a skilled developer. Provide clear, concise code and practical solutions.'
        };
        return prompts[modelName as keyof typeof prompts] || prompts['gpt-4'];
    }

    // 응답 품질 평가
    private assessResponseQuality(content: string, taskType: string): number {
        let quality = 0.5; // 기본 점수

        // 길이 기반 평가
        if (content.length > 100) quality += 0.1;
        if (content.length > 500) quality += 0.1;

        // 코드 품질 지표
        if (content.includes('function') || content.includes('class')) quality += 0.1;
        if (content.includes('//') || content.includes('/*')) quality += 0.1;
        if (content.includes('try') && content.includes('catch')) quality += 0.1;

        // 작업 유형별 평가
        switch (taskType) {
            case 'code-generation':
                if (content.includes('import') || content.includes('require')) quality += 0.1;
                if (content.includes('export') || content.includes('module.exports')) quality += 0.1;
                break;
            case 'analysis':
                if (content.includes('because') || content.includes('therefore')) quality += 0.1;
                if (content.includes('recommend') || content.includes('suggest')) quality += 0.1;
                break;
        }

        return Math.min(1.0, quality);
    }

    // 성능 메트릭 업데이트
    private updatePerformanceMetrics(modelName: string, response: ModelResponse): void {
        const metrics = this.performanceMetrics.get(modelName);
        if (!metrics) return;

        metrics.totalRequests++;
        metrics.successfulRequests++;
        metrics.averageLatency = (metrics.averageLatency + response.latency) / 2;
        metrics.averageQuality = (metrics.averageQuality + response.quality) / 2;
        metrics.totalCost += response.cost;
        metrics.lastUsed = new Date();

        this.performanceMetrics.set(modelName, metrics);
    }

    // 다음 폴백 모델 가져오기
    private getNextFallbackModel(currentModel: string): string | null {
        const currentIndex = this.fallbackChain.indexOf(currentModel);
        if (currentIndex === -1 || currentIndex >= this.fallbackChain.length - 1) {
            return null;
        }
        return this.fallbackChain[currentIndex + 1];
    }

    // 성능 통계 가져오기
    getPerformanceStats(): any {
        const stats: any = {};

        for (const [modelName, metrics] of this.performanceMetrics) {
            stats[modelName] = {
                ...metrics,
                successRate: metrics.totalRequests > 0 ? (metrics.successfulRequests / metrics.totalRequests) * 100 : 0,
                averageCostPerRequest: metrics.successfulRequests > 0 ? metrics.totalCost / metrics.successfulRequests : 0
            };
        }

        return stats;
    }

    // 모델 상태 확인
    async checkModelHealth(modelName: string): Promise<boolean> {
        const modelConfig = this.models.get(modelName);
        if (!modelConfig) return false;

        try {
            await this.callModelAPI(modelConfig, 'Hello, are you working?');
            return true;
        } catch (error) {
            console.error(`Health check failed for ${modelName}:`, error);
            return false;
        }
    }

    // 모든 모델 상태 확인
    async checkAllModelsHealth(): Promise<Map<string, boolean>> {
        const healthStatus = new Map<string, boolean>();

        for (const modelName of this.models.keys()) {
            const isHealthy = await this.checkModelHealth(modelName);
            healthStatus.set(modelName, isHealthy);
        }

        return healthStatus;
    }
}

// 싱글톤 인스턴스
export const multiModelManager = new MultiModelManager();
