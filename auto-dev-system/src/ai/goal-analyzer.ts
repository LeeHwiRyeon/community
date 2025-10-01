import OpenAI from 'openai';
import { Goal, DevelopmentPlan, Phase, Task, Resource, Risk, Metric, TechStack, Technology } from '@/types';

export class GoalAnalyzer {
    private openai: OpenAI;
    private techStackDatabase: Technology[];

    constructor(apiKey: string) {
        this.openai = new OpenAI({ apiKey });
        this.techStackDatabase = this.initializeTechStackDatabase();
    }

    /**
     * 목표를 분석하고 개발 계획을 생성합니다.
     */
    async analyzeGoal(goal: Goal): Promise<DevelopmentPlan> {
        try {
            // 1. 목표 분석
            const analysis = await this.performGoalAnalysis(goal);

            // 2. 기술 스택 추천
            const techStack = await this.recommendTechStack(goal);

            // 3. 개발 계획 생성
            const phases = await this.generatePhases(goal, analysis, techStack);

            // 4. 리소스 요구사항 계산
            const resources = await this.calculateResources(goal, phases);

            // 5. 리스크 평가
            const risks = await this.assessRisks(goal, techStack);

            // 6. 성공 지표 정의
            const metrics = await this.defineSuccessMetrics(goal);

            return {
                id: this.generateId(),
                goalId: goal.id,
                phases,
                estimatedDuration: phases.reduce((total, phase) => total + phase.estimatedDuration, 0),
                requiredResources: resources,
                riskAssessment: risks,
                successMetrics: metrics,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        } catch (error) {
            throw new Error(`목표 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
    }

    /**
     * 목표 상세 분석 수행
     */
    private async performGoalAnalysis(goal: Goal): Promise<any> {
        const prompt = `
다음 목표를 분석해주세요:

목표: ${goal.description}
카테고리: ${goal.category}
복잡도: ${goal.complexity}
요구사항: ${goal.requirements.map(r => r.description).join(', ')}
제약사항: ${goal.constraints.map(c => c.description).join(', ')}

다음 항목들을 분석해주세요:
1. 기술적 복잡도 (1-10)
2. 예상 개발 시간 (일)
3. 필요한 기술 스택
4. 주요 기능 모듈
5. 아키텍처 패턴
6. 성능 요구사항
7. 보안 요구사항
8. 확장성 요구사항

JSON 형태로 응답해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000
        });

        return JSON.parse(response.choices[0].message.content || '{}');
    }

    /**
     * 기술 스택 추천
     */
    async recommendTechStack(goal: Goal): Promise<TechStack> {
        const analysis = await this.performGoalAnalysis(goal);

        return {
            frontend: this.selectTechnologies('frontend', goal, analysis),
            backend: this.selectTechnologies('backend', goal, analysis),
            database: this.selectTechnologies('database', goal, analysis),
            infrastructure: this.selectTechnologies('infrastructure', goal, analysis),
            testing: this.selectTechnologies('testing', goal, analysis),
            monitoring: this.selectTechnologies('monitoring', goal, analysis)
        };
    }

    /**
     * 기술 스택 선택 로직
     */
    private selectTechnologies(category: string, goal: Goal, analysis: any): Technology[] {
        const candidates = this.techStackDatabase.filter(tech =>
            tech.category === category &&
            this.isTechnologySuitable(tech, goal, analysis)
        );

        // 점수 기반 정렬
        return candidates
            .map(tech => ({
                ...tech,
                score: this.calculateTechnologyScore(tech, goal, analysis)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3); // 상위 3개 선택
    }

    /**
     * 기술 적합성 검사
     */
    private isTechnologySuitable(tech: Technology, goal: Goal, analysis: any): boolean {
        // 복잡도 기반 필터링
        if (goal.complexity === 'simple' && tech.learningCurve > 3) return false;
        if (goal.complexity === 'enterprise' && tech.community < 3) return false;

        // 성능 요구사항 기반 필터링
        if (analysis.performanceRequirements === 'high' && tech.performance < 4) return false;

        return true;
    }

    /**
     * 기술 점수 계산
     */
    private calculateTechnologyScore(tech: Technology, goal: Goal, analysis: any): number {
        let score = 0;

        // 기본 점수
        score += tech.performance * 0.3;
        score += tech.community * 0.2;
        score += (6 - tech.learningCurve) * 0.2; // 낮은 학습 곡선이 좋음

        // 목표별 가중치
        if (goal.complexity === 'simple') {
            score += (6 - tech.learningCurve) * 0.3;
        } else if (goal.complexity === 'enterprise') {
            score += tech.community * 0.3;
        }

        return score;
    }

    /**
     * 개발 단계 생성
     */
    private async generatePhases(goal: Goal, analysis: any, techStack: TechStack): Promise<Phase[]> {
        const phases: Phase[] = [];

        // 1. 분석 및 설계 단계
        phases.push({
            id: this.generateId(),
            name: '분석 및 설계',
            description: '요구사항 분석, 아키텍처 설계, 기술 스택 검증',
            order: 1,
            tasks: await this.generateAnalysisTasks(goal, analysis),
            dependencies: [],
            estimatedDuration: Math.ceil(goal.timeline * 0.15),
            status: 'pending'
        });

        // 2. 개발 단계
        phases.push({
            id: this.generateId(),
            name: '핵심 개발',
            description: '주요 기능 개발, API 구현, 데이터베이스 설계',
            order: 2,
            tasks: await this.generateDevelopmentTasks(goal, techStack),
            dependencies: [phases[0].id],
            estimatedDuration: Math.ceil(goal.timeline * 0.6),
            status: 'pending'
        });

        // 3. 테스트 단계
        phases.push({
            id: this.generateId(),
            name: '테스트 및 검증',
            description: '단위 테스트, 통합 테스트, 성능 테스트, 보안 테스트',
            order: 3,
            tasks: await this.generateTestingTasks(goal),
            dependencies: [phases[1].id],
            estimatedDuration: Math.ceil(goal.timeline * 0.15),
            status: 'pending'
        });

        // 4. 배포 및 최적화 단계
        phases.push({
            id: this.generateId(),
            name: '배포 및 최적화',
            description: '프로덕션 배포, 성능 최적화, 모니터링 설정',
            order: 4,
            tasks: await this.generateDeploymentTasks(goal),
            dependencies: [phases[2].id],
            estimatedDuration: Math.ceil(goal.timeline * 0.1),
            status: 'pending'
        });

        return phases;
    }

    /**
     * 분석 작업 생성
     */
    private async generateAnalysisTasks(goal: Goal, analysis: any): Promise<Task[]> {
        return [
            {
                id: this.generateId(),
                name: '요구사항 상세 분석',
                description: '기능적/비기능적 요구사항 상세 분석 및 검증',
                type: 'analysis',
                priority: 1,
                estimatedDuration: 2,
                dependencies: [],
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: this.generateId(),
                name: '아키텍처 설계',
                description: '시스템 아키텍처 및 컴포넌트 설계',
                type: 'design',
                priority: 1,
                estimatedDuration: 3,
                dependencies: [],
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: this.generateId(),
                name: '기술 스택 검증',
                description: '선택된 기술 스택의 적합성 검증 및 프로토타입',
                type: 'analysis',
                priority: 2,
                estimatedDuration: 2,
                dependencies: [],
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
    }

    /**
     * 개발 작업 생성
     */
    private async generateDevelopmentTasks(goal: Goal, techStack: TechStack): Promise<Task[]> {
        const tasks: Task[] = [];

        // 프론트엔드 개발
        if (techStack.frontend.length > 0) {
            tasks.push({
                id: this.generateId(),
                name: '프론트엔드 개발',
                description: '사용자 인터페이스 및 사용자 경험 구현',
                type: 'development',
                priority: 1,
                estimatedDuration: Math.ceil(goal.timeline * 0.3),
                dependencies: [],
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // 백엔드 개발
        if (techStack.backend.length > 0) {
            tasks.push({
                id: this.generateId(),
                name: '백엔드 API 개발',
                description: '서버 로직, API 엔드포인트, 비즈니스 로직 구현',
                type: 'development',
                priority: 1,
                estimatedDuration: Math.ceil(goal.timeline * 0.4),
                dependencies: [],
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // 데이터베이스 개발
        if (techStack.database.length > 0) {
            tasks.push({
                id: this.generateId(),
                name: '데이터베이스 설계 및 구현',
                description: '데이터베이스 스키마 설계, 마이그레이션, 최적화',
                type: 'development',
                priority: 1,
                estimatedDuration: Math.ceil(goal.timeline * 0.2),
                dependencies: [],
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        return tasks;
    }

    /**
     * 테스트 작업 생성
     */
    private async generateTestingTasks(goal: Goal): Promise<Task[]> {
        return [
            {
                id: this.generateId(),
                name: '단위 테스트 작성 및 실행',
                description: '개별 컴포넌트 및 함수 단위 테스트',
                type: 'testing',
                priority: 1,
                estimatedDuration: 3,
                dependencies: [],
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: this.generateId(),
                name: '통합 테스트 실행',
                description: '컴포넌트 간 통합 및 API 테스트',
                type: 'testing',
                priority: 1,
                estimatedDuration: 2,
                dependencies: [],
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: this.generateId(),
                name: 'E2E 테스트 실행',
                description: '사용자 시나리오 기반 End-to-End 테스트',
                type: 'testing',
                priority: 2,
                estimatedDuration: 2,
                dependencies: [],
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: this.generateId(),
                name: '성능 테스트',
                description: '로드 테스트, 스트레스 테스트, 성능 벤치마킹',
                type: 'testing',
                priority: 2,
                estimatedDuration: 2,
                dependencies: [],
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
    }

    /**
     * 배포 작업 생성
     */
    private async generateDeploymentTasks(goal: Goal): Promise<Task[]> {
        return [
            {
                id: this.generateId(),
                name: '프로덕션 배포',
                description: '프로덕션 환경 배포 및 설정',
                type: 'deployment',
                priority: 1,
                estimatedDuration: 1,
                dependencies: [],
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: this.generateId(),
                name: '성능 최적화',
                description: '코드 최적화, 캐싱 전략, 데이터베이스 튜닝',
                type: 'optimization',
                priority: 2,
                estimatedDuration: 2,
                dependencies: [],
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: this.generateId(),
                name: '모니터링 설정',
                description: '로깅, 메트릭 수집, 알림 시스템 설정',
                type: 'deployment',
                priority: 2,
                estimatedDuration: 1,
                dependencies: [],
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
    }

    /**
     * 리소스 요구사항 계산
     */
    private async calculateResources(goal: Goal, phases: Phase[]): Promise<Resource[]> {
        const resources: Resource[] = [];

        // 개발자 리소스
        const totalDuration = phases.reduce((total, phase) => total + phase.estimatedDuration, 0);
        const developerCount = Math.ceil(totalDuration / 30); // 30일 기준

        resources.push({
            id: this.generateId(),
            type: 'human',
            name: '시니어 개발자',
            description: '프로젝트 리드 및 핵심 개발',
            cost: developerCount * 100000, // 월 10만원 가정
            availability: 100,
            skills: ['TypeScript', 'Node.js', 'React', 'PostgreSQL']
        });

        // 인프라 리소스
        resources.push({
            id: this.generateId(),
            type: 'computing',
            name: '클라우드 서버',
            description: 'AWS EC2 또는 동등한 클라우드 인스턴스',
            cost: 50000, // 월 5만원 가정
            availability: 99.9
        });

        return resources;
    }

    /**
     * 리스크 평가
     */
    private async assessRisks(goal: Goal, techStack: TechStack): Promise<Risk[]> {
        const risks: Risk[] = [];

        // 기술적 리스크
        if (techStack.frontend.some(tech => tech.learningCurve > 4)) {
            risks.push({
                id: this.generateId(),
                description: '높은 학습 곡선의 프론트엔드 기술',
                probability: 0.6,
                impact: 0.7,
                mitigation: '사전 교육 및 프로토타입 개발',
                contingency: '대체 기술 스택 준비'
            });
        }

        // 일정 리스크
        if (goal.complexity === 'complex' || goal.complexity === 'enterprise') {
            risks.push({
                id: this.generateId(),
                description: '복잡한 요구사항으로 인한 일정 지연',
                probability: 0.5,
                impact: 0.8,
                mitigation: '단계별 개발 및 조기 검증',
                contingency: '기능 우선순위 조정'
            });
        }

        return risks;
    }

    /**
     * 성공 지표 정의
     */
    private async defineSuccessMetrics(goal: Goal): Promise<Metric[]> {
        return [
            {
                name: '코드 커버리지',
                description: '테스트 코드 커버리지 비율',
                target: 90,
                unit: '%',
                measurement: 'automatic'
            },
            {
                name: '성능 점수',
                description: 'Lighthouse 성능 점수',
                target: 90,
                unit: '점',
                measurement: 'automatic'
            },
            {
                name: '사용자 만족도',
                description: '사용자 피드백 기반 만족도',
                target: 4.5,
                unit: '점 (5점 만점)',
                measurement: 'manual'
            },
            {
                name: '버그 발생률',
                description: '프로덕션 환경 버그 발생률',
                target: 0.1,
                unit: '버그/일',
                measurement: 'automatic'
            }
        ];
    }

    /**
     * 기술 스택 데이터베이스 초기화
     */
    private initializeTechStackDatabase(): Technology[] {
        return [
            // Frontend Technologies
            {
                name: 'React',
                version: '18.2.0',
                category: 'frontend',
                description: '사용자 인터페이스 구축을 위한 JavaScript 라이브러리',
                pros: ['컴포넌트 기반', '풍부한 생태계', '가상 DOM'],
                cons: ['학습 곡선', '보일러플레이트 코드'],
                learningCurve: 3,
                community: 5,
                performance: 4
            },
            {
                name: 'Vue.js',
                version: '3.3.0',
                category: 'frontend',
                description: '점진적 프레임워크',
                pros: ['쉬운 학습', '유연한 구조', '성능'],
                cons: ['상대적으로 작은 생태계'],
                learningCurve: 2,
                community: 4,
                performance: 4
            },
            {
                name: 'Angular',
                version: '16.0.0',
                category: 'frontend',
                description: '엔터프라이즈급 프론트엔드 프레임워크',
                pros: ['완전한 프레임워크', 'TypeScript 지원', '엔터프라이즈 기능'],
                cons: ['높은 학습 곡선', '복잡성'],
                learningCurve: 4,
                community: 4,
                performance: 4
            },
            // Backend Technologies
            {
                name: 'Node.js',
                version: '20.0.0',
                category: 'backend',
                description: 'JavaScript 런타임',
                pros: ['JavaScript 통합', '비동기 처리', '풍부한 패키지'],
                cons: ['단일 스레드', 'CPU 집약적 작업 부적합'],
                learningCurve: 2,
                community: 5,
                performance: 3
            },
            {
                name: 'Python',
                version: '3.11.0',
                category: 'backend',
                description: '다목적 프로그래밍 언어',
                pros: ['읽기 쉬운 코드', '풍부한 라이브러리', 'AI/ML 지원'],
                cons: ['성능', 'GIL 제약'],
                learningCurve: 2,
                community: 5,
                performance: 2
            },
            {
                name: 'Go',
                version: '1.21.0',
                category: 'backend',
                description: '고성능 시스템 프로그래밍 언어',
                pros: ['빠른 컴파일', '고성능', '동시성'],
                cons: ['상대적으로 새로운 언어', '제한적인 라이브러리'],
                learningCurve: 3,
                community: 3,
                performance: 5
            },
            // Database Technologies
            {
                name: 'PostgreSQL',
                version: '15.0',
                category: 'database',
                description: '오픈소스 관계형 데이터베이스',
                pros: ['ACID 준수', '확장성', 'JSON 지원'],
                cons: ['복잡한 설정', '메모리 사용량'],
                learningCurve: 3,
                community: 4,
                performance: 4
            },
            {
                name: 'MongoDB',
                version: '7.0',
                category: 'database',
                description: 'NoSQL 문서 데이터베이스',
                pros: ['유연한 스키마', '수평 확장', 'JSON 네이티브'],
                cons: ['ACID 제한', '메모리 사용량'],
                learningCurve: 2,
                community: 4,
                performance: 4
            },
            {
                name: 'Redis',
                version: '7.0',
                category: 'database',
                description: '인메모리 데이터 구조 저장소',
                pros: ['빠른 성능', '다양한 데이터 타입', '클러스터링'],
                cons: ['메모리 제한', '영속성 제한'],
                learningCurve: 2,
                community: 4,
                performance: 5
            }
        ];
    }

    /**
     * 고유 ID 생성
     */
    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}
