import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { CodeFile, Issue } from '@/types';

export class BugDetector {
    private openai: OpenAI;
    private projectPath: string;

    constructor(apiKey: string, projectPath: string = './generated-projects') {
        this.openai = new OpenAI({ apiKey });
        this.projectPath = projectPath;
    }

    /**
     * 버그 감지 실행
     */
    async detectBugs(sourceFiles: CodeFile[]): Promise<BugDetectionResult> {
        console.log('🐛 버그 감지 시작...');

        try {
            // 1. 정적 분석 기반 버그 감지
            const staticAnalysisBugs = await this.performStaticAnalysis(sourceFiles);

            // 2. 런타임 에러 분석
            const runtimeBugs = await this.analyzeRuntimeErrors(sourceFiles);

            // 3. 로그 기반 버그 감지
            const logBasedBugs = await this.analyzeLogsForBugs();

            // 4. 테스트 실패 분석
            const testFailureBugs = await this.analyzeTestFailures();

            // 5. 성능 관련 버그 감지
            const performanceBugs = await this.detectPerformanceBugs(sourceFiles);

            // 6. 보안 취약점 감지
            const securityBugs = await this.detectSecurityVulnerabilities(sourceFiles);

            // 7. 메모리 누수 감지
            const memoryBugs = await this.detectMemoryLeaks(sourceFiles);

            // 8. 동시성 버그 감지
            const concurrencyBugs = await this.detectConcurrencyBugs(sourceFiles);

            // 9. 버그 통합 및 중복 제거
            const integratedBugs = await this.integrateBugs({
                staticAnalysisBugs,
                runtimeBugs,
                logBasedBugs,
                testFailureBugs,
                performanceBugs,
                securityBugs,
                memoryBugs,
                concurrencyBugs
            });

            // 10. 버그 우선순위 결정
            const prioritizedBugs = await this.prioritizeBugs(integratedBugs);

            // 11. 감지 리포트 생성
            const report = await this.generateDetectionReport(prioritizedBugs);

            console.log('✅ 버그 감지 완료');

            return {
                staticAnalysisBugs,
                runtimeBugs,
                logBasedBugs,
                testFailureBugs,
                performanceBugs,
                securityBugs,
                memoryBugs,
                concurrencyBugs,
                integratedBugs,
                prioritizedBugs,
                report,
                summary: this.generateDetectionSummary(prioritizedBugs)
            };

        } catch (error) {
            console.error('❌ 버그 감지 실패:', error);
            throw error;
        }
    }

    /**
     * 정적 분석 기반 버그 감지
     */
    private async performStaticAnalysis(sourceFiles: CodeFile[]): Promise<Bug[]> {
        console.log('🔍 정적 분석 기반 버그 감지 중...');

        const bugs: Bug[] = [];

        for (const file of sourceFiles) {
            const fileBugs = await this.analyzeFileForBugs(file);
            bugs.push(...fileBugs);
        }

        return bugs;
    }

    /**
     * 파일별 버그 분석
     */
    private async analyzeFileForBugs(file: CodeFile): Promise<Bug[]> {
        const bugs: Bug[] = [];
        const content = file.content;

        // 1. 문법 오류 감지
        const syntaxBugs = this.detectSyntaxErrors(content, file);
        bugs.push(...syntaxBugs);

        // 2. 논리 오류 감지
        const logicBugs = this.detectLogicErrors(content, file);
        bugs.push(...logicBugs);

        // 3. 타입 오류 감지
        const typeBugs = this.detectTypeErrors(content, file);
        bugs.push(...typeBugs);

        // 4. 리소스 누수 감지
        const resourceBugs = this.detectResourceLeaks(content, file);
        bugs.push(...resourceBugs);

        // 5. 예외 처리 누락 감지
        const exceptionBugs = this.detectMissingExceptionHandling(content, file);
        bugs.push(...exceptionBugs);

        // 6. 무한 루프 감지
        const infiniteLoopBugs = this.detectInfiniteLoops(content, file);
        bugs.push(...infiniteLoopBugs);

        // 7. null 포인터 참조 감지
        const nullPointerBugs = this.detectNullPointerReferences(content, file);
        bugs.push(...nullPointerBugs);

        // 8. 배열 경계 초과 감지
        const arrayBugs = this.detectArrayBoundsViolations(content, file);
        bugs.push(...arrayBugs);

        return bugs;
    }

    /**
     * 문법 오류 감지
     */
    private detectSyntaxErrors(content: string, file: CodeFile): Bug[] {
        const bugs: Bug[] = [];

        // 괄호 불일치 감지
        const bracketMismatch = this.checkBracketMismatch(content);
        if (bracketMismatch) {
            bugs.push({
                id: this.generateId(),
                type: 'syntax',
                severity: 'high',
                title: '괄호 불일치',
                description: '열린 괄호와 닫힌 괄호의 개수가 일치하지 않습니다.',
                file: file.name,
                line: bracketMismatch.line,
                column: bracketMismatch.column,
                code: bracketMismatch.code,
                suggestion: '괄호를 올바르게 닫아주세요.',
                confidence: 0.9,
                category: 'syntax_error',
                status: 'open',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // 세미콜론 누락 감지
        const missingSemicolons = this.detectMissingSemicolons(content);
        for (const missing of missingSemicolons) {
            bugs.push({
                id: this.generateId(),
                type: 'syntax',
                severity: 'medium',
                title: '세미콜론 누락',
                description: '문장 끝에 세미콜론이 누락되었습니다.',
                file: file.name,
                line: missing.line,
                column: missing.column,
                code: missing.code,
                suggestion: '문장 끝에 세미콜론을 추가하세요.',
                confidence: 0.8,
                category: 'syntax_error',
                status: 'open',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        return bugs;
    }

    /**
     * 논리 오류 감지
     */
    private detectLogicErrors(content: string, file: CodeFile): Bug[] {
        const bugs: Bug[] = [];

        // 조건문 오류 감지
        const conditionBugs = this.detectConditionErrors(content);
        for (const bug of conditionBugs) {
            bugs.push({
                id: this.generateId(),
                type: 'logic',
                severity: 'medium',
                title: '조건문 오류',
                description: bug.description,
                file: file.name,
                line: bug.line,
                column: bug.column,
                code: bug.code,
                suggestion: bug.suggestion,
                confidence: 0.7,
                category: 'logic_error',
                status: 'open',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // 변수 초기화 누락 감지
        const uninitializedVars = this.detectUninitializedVariables(content);
        for (const varBug of uninitializedVars) {
            bugs.push({
                id: this.generateId(),
                type: 'logic',
                severity: 'high',
                title: '초기화되지 않은 변수',
                description: `변수 '${varBug.variable}'이 초기화되지 않았습니다.`,
                file: file.name,
                line: varBug.line,
                column: varBug.column,
                code: varBug.code,
                suggestion: '변수를 사용하기 전에 초기화하세요.',
                confidence: 0.8,
                category: 'logic_error',
                status: 'open',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        return bugs;
    }

    /**
     * 타입 오류 감지
     */
    private detectTypeErrors(content: string, file: CodeFile): Bug[] {
        const bugs: Bug[] = [];

        // 타입 불일치 감지
        const typeMismatches = this.detectTypeMismatches(content);
        for (const mismatch of typeMismatches) {
            bugs.push({
                id: this.generateId(),
                type: 'type',
                severity: 'high',
                title: '타입 불일치',
                description: `타입 불일치: ${mismatch.expected}이 예상되지만 ${mismatch.actual}이 사용되었습니다.`,
                file: file.name,
                line: mismatch.line,
                column: mismatch.column,
                code: mismatch.code,
                suggestion: '올바른 타입을 사용하거나 타입 변환을 수행하세요.',
                confidence: 0.9,
                category: 'type_error',
                status: 'open',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        return bugs;
    }

    /**
     * 런타임 에러 분석
     */
    private async analyzeRuntimeErrors(sourceFiles: CodeFile[]): Promise<Bug[]> {
        console.log('⚡ 런타임 에러 분석 중...');

        const bugs: Bug[] = [];

        // 실제 구현에서는 런타임 로그 분석
        // 예시 데이터
        bugs.push({
            id: this.generateId(),
            type: 'runtime',
            severity: 'critical',
            title: 'NullReferenceException',
            description: '객체 참조가 null인 상태에서 메서드를 호출했습니다.',
            file: 'UserService.cs',
            line: 45,
            column: 12,
            code: 'user.Name.ToUpper()',
            suggestion: 'null 체크를 추가하거나 null 조건부 연산자를 사용하세요.',
            confidence: 0.95,
            category: 'runtime_error',
            status: 'open',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return bugs;
    }

    /**
     * 로그 기반 버그 감지
     */
    private async analyzeLogsForBugs(): Promise<Bug[]> {
        console.log('📝 로그 기반 버그 감지 중...');

        const bugs: Bug[] = [];

        // 실제 구현에서는 로그 파일 분석
        // 예시 데이터
        bugs.push({
            id: this.generateId(),
            type: 'log_based',
            severity: 'medium',
            title: '데이터베이스 연결 실패',
            description: '데이터베이스 연결이 반복적으로 실패하고 있습니다.',
            file: 'DatabaseService.cs',
            line: 0,
            column: 0,
            code: 'Connection.Open()',
            suggestion: '연결 문자열을 확인하고 재시도 로직을 추가하세요.',
            confidence: 0.8,
            category: 'connection_error',
            status: 'open',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return bugs;
    }

    /**
     * 테스트 실패 분석
     */
    private async analyzeTestFailures(): Promise<Bug[]> {
        console.log('🧪 테스트 실패 분석 중...');

        const bugs: Bug[] = [];

        // 실제 구현에서는 테스트 결과 분석
        // 예시 데이터
        bugs.push({
            id: this.generateId(),
            type: 'test_failure',
            severity: 'high',
            title: '단위 테스트 실패',
            description: 'UserServiceTest.Login_ValidCredentials_ReturnsSuccess 테스트가 실패했습니다.',
            file: 'UserService.cs',
            line: 0,
            column: 0,
            code: 'Login method',
            suggestion: '테스트 케이스를 검토하고 구현을 수정하세요.',
            confidence: 0.9,
            category: 'test_failure',
            status: 'open',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return bugs;
    }

    /**
     * 성능 관련 버그 감지
     */
    private async detectPerformanceBugs(sourceFiles: CodeFile[]): Promise<Bug[]> {
        console.log('⚡ 성능 관련 버그 감지 중...');

        const bugs: Bug[] = [];

        for (const file of sourceFiles) {
            const performanceBugs = this.analyzeFileForPerformanceBugs(file);
            bugs.push(...performanceBugs);
        }

        return bugs;
    }

    /**
     * 파일별 성능 버그 분석
     */
    private analyzeFileForPerformanceBugs(file: CodeFile): Bug[] {
        const bugs: Bug[] = [];
        const content = file.content;

        // N+1 쿼리 문제 감지
        const nPlusOneBugs = this.detectNPlusOneQueries(content);
        for (const bug of nPlusOneBugs) {
            bugs.push({
                id: this.generateId(),
                type: 'performance',
                severity: 'high',
                title: 'N+1 쿼리 문제',
                description: 'N+1 쿼리 문제가 감지되었습니다.',
                file: file.name,
                line: bug.line,
                column: bug.column,
                code: bug.code,
                suggestion: 'Eager loading 또는 배치 쿼리를 사용하세요.',
                confidence: 0.8,
                category: 'performance_issue',
                status: 'open',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // 무한 루프 감지
        const infiniteLoops = this.detectInfiniteLoops(content);
        for (const loop of infiniteLoops) {
            bugs.push({
                id: this.generateId(),
                type: 'performance',
                severity: 'critical',
                title: '무한 루프',
                description: '무한 루프가 감지되었습니다.',
                file: file.name,
                line: loop.line,
                column: loop.column,
                code: loop.code,
                suggestion: '루프 종료 조건을 확인하세요.',
                confidence: 0.9,
                category: 'performance_issue',
                status: 'open',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        return bugs;
    }

    /**
     * 보안 취약점 감지
     */
    private async detectSecurityVulnerabilities(sourceFiles: CodeFile[]): Promise<Bug[]> {
        console.log('🔒 보안 취약점 감지 중...');

        const bugs: Bug[] = [];

        for (const file of sourceFiles) {
            const securityBugs = this.analyzeFileForSecurityBugs(file);
            bugs.push(...securityBugs);
        }

        return bugs;
    }

    /**
     * 파일별 보안 버그 분석
     */
    private analyzeFileForSecurityBugs(file: CodeFile): Bug[] {
        const bugs: Bug[] = [];
        const content = file.content;

        // SQL 인젝션 감지
        const sqlInjectionBugs = this.detectSQLInjection(content);
        for (const bug of sqlInjectionBugs) {
            bugs.push({
                id: this.generateId(),
                type: 'security',
                severity: 'critical',
                title: 'SQL 인젝션 취약점',
                description: 'SQL 인젝션 공격에 취약한 코드가 감지되었습니다.',
                file: file.name,
                line: bug.line,
                column: bug.column,
                code: bug.code,
                suggestion: '매개변수화된 쿼리나 ORM을 사용하세요.',
                confidence: 0.95,
                category: 'security_vulnerability',
                status: 'open',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // XSS 취약점 감지
        const xssBugs = this.detectXSSVulnerabilities(content);
        for (const bug of xssBugs) {
            bugs.push({
                id: this.generateId(),
                type: 'security',
                severity: 'high',
                title: 'XSS 취약점',
                description: 'Cross-Site Scripting 공격에 취약한 코드가 감지되었습니다.',
                file: file.name,
                line: bug.line,
                column: bug.column,
                code: bug.code,
                suggestion: '입력값을 검증하고 이스케이프 처리하세요.',
                confidence: 0.9,
                category: 'security_vulnerability',
                status: 'open',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        return bugs;
    }

    /**
     * 메모리 누수 감지
     */
    private async detectMemoryLeaks(sourceFiles: CodeFile[]): Promise<Bug[]> {
        console.log('💾 메모리 누수 감지 중...');

        const bugs: Bug[] = [];

        for (const file of sourceFiles) {
            const memoryBugs = this.analyzeFileForMemoryLeaks(file);
            bugs.push(...memoryBugs);
        }

        return bugs;
    }

    /**
     * 파일별 메모리 누수 분석
     */
    private analyzeFileForMemoryLeaks(file: CodeFile): Bug[] {
        const bugs: Bug[] = [];
        const content = file.content;

        // 이벤트 핸들러 누락 감지
        const eventHandlerBugs = this.detectUnsubscribedEventHandlers(content);
        for (const bug of eventHandlerBugs) {
            bugs.push({
                id: this.generateId(),
                type: 'memory',
                severity: 'medium',
                title: '이벤트 핸들러 구독 해제 누락',
                description: '이벤트 핸들러가 구독 해제되지 않아 메모리 누수가 발생할 수 있습니다.',
                file: file.name,
                line: bug.line,
                column: bug.column,
                code: bug.code,
                suggestion: '이벤트 핸들러를 적절히 구독 해제하세요.',
                confidence: 0.7,
                category: 'memory_leak',
                status: 'open',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        return bugs;
    }

    /**
     * 동시성 버그 감지
     */
    private async detectConcurrencyBugs(sourceFiles: CodeFile[]): Promise<Bug[]> {
        console.log('🔄 동시성 버그 감지 중...');

        const bugs: Bug[] = [];

        for (const file of sourceFiles) {
            const concurrencyBugs = this.analyzeFileForConcurrencyBugs(file);
            bugs.push(...concurrencyBugs);
        }

        return bugs;
    }

    /**
     * 파일별 동시성 버그 분석
     */
    private analyzeFileForConcurrencyBugs(file: CodeFile): Bug[] {
        const bugs: Bug[] = [];
        const content = file.content;

        // 경쟁 상태 감지
        const raceConditionBugs = this.detectRaceConditions(content);
        for (const bug of raceConditionBugs) {
            bugs.push({
                id: this.generateId(),
                type: 'concurrency',
                severity: 'high',
                title: '경쟁 상태',
                description: '여러 스레드가 동일한 리소스에 접근할 때 경쟁 상태가 발생할 수 있습니다.',
                file: file.name,
                line: bug.line,
                column: bug.column,
                code: bug.code,
                suggestion: '락(lock) 또는 동기화 메커니즘을 사용하세요.',
                confidence: 0.8,
                category: 'concurrency_issue',
                status: 'open',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        return bugs;
    }

    /**
     * 버그 통합 및 중복 제거
     */
    private async integrateBugs(bugCategories: any): Promise<Bug[]> {
        console.log('🔗 버그 통합 및 중복 제거 중...');

        const allBugs: Bug[] = [];

        // 모든 카테고리의 버그 수집
        for (const category of Object.values(bugCategories)) {
            if (Array.isArray(category)) {
                allBugs.push(...category);
            }
        }

        // 중복 제거
        const uniqueBugs = this.removeDuplicateBugs(allBugs);

        // 유사한 버그 그룹화
        const groupedBugs = this.groupSimilarBugs(uniqueBugs);

        return groupedBugs;
    }

    /**
     * 버그 우선순위 결정
     */
    private async prioritizeBugs(bugs: Bug[]): Promise<PrioritizedBug[]> {
        console.log('⚡ 버그 우선순위 결정 중...');

        const prioritizedBugs: PrioritizedBug[] = [];

        for (const bug of bugs) {
            const priority = this.calculateBugPriority(bug);
            const effort = this.estimateBugFixEffort(bug);
            const impact = this.assessBugImpact(bug);

            prioritizedBugs.push({
                ...bug,
                priority,
                effort,
                impact,
                priorityScore: this.calculatePriorityScore(bug, priority, effort, impact)
            });
        }

        // 우선순위별 정렬
        return prioritizedBugs.sort((a, b) => b.priorityScore - a.priorityScore);
    }

    // 헬퍼 메서드들
    private checkBracketMismatch(content: string): any {
        // 실제 구현에서는 괄호 불일치 검사
        return null;
    }

    private detectMissingSemicolons(content: string): any[] {
        // 실제 구현에서는 세미콜론 누락 검사
        return [];
    }

    private detectConditionErrors(content: string): any[] {
        // 실제 구현에서는 조건문 오류 검사
        return [];
    }

    private detectUninitializedVariables(content: string): any[] {
        // 실제 구현에서는 초기화되지 않은 변수 검사
        return [];
    }

    private detectTypeMismatches(content: string): any[] {
        // 실제 구현에서는 타입 불일치 검사
        return [];
    }

    private detectResourceLeaks(content: string, file: CodeFile): Bug[] {
        // 실제 구현에서는 리소스 누수 검사
        return [];
    }

    private detectMissingExceptionHandling(content: string, file: CodeFile): Bug[] {
        // 실제 구현에서는 예외 처리 누락 검사
        return [];
    }

    private detectInfiniteLoops(content: string): any[] {
        // 실제 구현에서는 무한 루프 검사
        return [];
    }

    private detectNullPointerReferences(content: string, file: CodeFile): Bug[] {
        // 실제 구현에서는 null 포인터 참조 검사
        return [];
    }

    private detectArrayBoundsViolations(content: string, file: CodeFile): Bug[] {
        // 실제 구현에서는 배열 경계 초과 검사
        return [];
    }

    private detectNPlusOneQueries(content: string): any[] {
        // 실제 구현에서는 N+1 쿼리 문제 검사
        return [];
    }

    private detectSQLInjection(content: string): any[] {
        // 실제 구현에서는 SQL 인젝션 검사
        return [];
    }

    private detectXSSVulnerabilities(content: string): any[] {
        // 실제 구현에서는 XSS 취약점 검사
        return [];
    }

    private detectUnsubscribedEventHandlers(content: string): any[] {
        // 실제 구현에서는 이벤트 핸들러 구독 해제 누락 검사
        return [];
    }

    private detectRaceConditions(content: string): any[] {
        // 실제 구현에서는 경쟁 상태 검사
        return [];
    }

    private removeDuplicateBugs(bugs: Bug[]): Bug[] {
        // 실제 구현에서는 중복 버그 제거
        return bugs;
    }

    private groupSimilarBugs(bugs: Bug[]): Bug[] {
        // 실제 구현에서는 유사한 버그 그룹화
        return bugs;
    }

    private calculateBugPriority(bug: Bug): string {
        if (bug.severity === 'critical') return 'critical';
        if (bug.severity === 'high') return 'high';
        if (bug.severity === 'medium') return 'medium';
        return 'low';
    }

    private estimateBugFixEffort(bug: Bug): string {
        if (bug.type === 'syntax') return 'low';
        if (bug.type === 'logic') return 'medium';
        if (bug.type === 'security') return 'high';
        return 'medium';
    }

    private assessBugImpact(bug: Bug): string {
        if (bug.severity === 'critical') return 'high';
        if (bug.severity === 'high') return 'high';
        if (bug.severity === 'medium') return 'medium';
        return 'low';
    }

    private calculatePriorityScore(bug: Bug, priority: string, effort: string, impact: string): number {
        let score = 0;

        // 심각도 기반 점수
        switch (bug.severity) {
            case 'critical': score += 100; break;
            case 'high': score += 75; break;
            case 'medium': score += 50; break;
            case 'low': score += 25; break;
        }

        // 영향도 기반 점수
        switch (impact) {
            case 'high': score += 50; break;
            case 'medium': score += 25; break;
            case 'low': score += 10; break;
        }

        // 노력 기반 점수 (낮은 노력일수록 높은 점수)
        switch (effort) {
            case 'low': score += 30; break;
            case 'medium': score += 20; break;
            case 'high': score += 10; break;
        }

        return score;
    }

    private async generateDetectionReport(prioritizedBugs: PrioritizedBug[]): Promise<string> {
        const report = {
            summary: this.generateDetectionSummary(prioritizedBugs),
            bugs: prioritizedBugs,
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(this.projectPath, 'bug-detection-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return reportPath;
    }

    private generateDetectionSummary(prioritizedBugs: PrioritizedBug[]): BugDetectionSummary {
        const totalBugs = prioritizedBugs.length;
        const criticalBugs = prioritizedBugs.filter(b => b.severity === 'critical').length;
        const highBugs = prioritizedBugs.filter(b => b.severity === 'high').length;
        const mediumBugs = prioritizedBugs.filter(b => b.severity === 'medium').length;
        const lowBugs = prioritizedBugs.filter(b => b.severity === 'low').length;

        return {
            totalBugs,
            criticalBugs,
            highBugs,
            mediumBugs,
            lowBugs,
            averageConfidence: prioritizedBugs.reduce((sum, b) => sum + b.confidence, 0) / totalBugs,
            status: this.determineDetectionStatus(totalBugs, criticalBugs)
        };
    }

    private determineDetectionStatus(totalBugs: number, criticalBugs: number): 'excellent' | 'good' | 'fair' | 'poor' {
        if (totalBugs === 0) return 'excellent';
        if (criticalBugs === 0 && totalBugs <= 5) return 'good';
        if (criticalBugs <= 2 && totalBugs <= 15) return 'fair';
        return 'poor';
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

// 타입 정의
interface BugDetectionResult {
    staticAnalysisBugs: Bug[];
    runtimeBugs: Bug[];
    logBasedBugs: Bug[];
    testFailureBugs: Bug[];
    performanceBugs: Bug[];
    securityBugs: Bug[];
    memoryBugs: Bug[];
    concurrencyBugs: Bug[];
    integratedBugs: Bug[];
    prioritizedBugs: PrioritizedBug[];
    report: string;
    summary: BugDetectionSummary;
}

interface Bug {
    id: string;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    file: string;
    line: number;
    column: number;
    code: string;
    suggestion: string;
    confidence: number;
    category: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    createdAt: Date;
    updatedAt: Date;
}

interface PrioritizedBug extends Bug {
    priority: string;
    effort: string;
    impact: string;
    priorityScore: number;
}

interface BugDetectionSummary {
    totalBugs: number;
    criticalBugs: number;
    highBugs: number;
    mediumBugs: number;
    lowBugs: number;
    averageConfidence: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
}
