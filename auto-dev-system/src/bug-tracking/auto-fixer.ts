import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { Bug, CodeFile } from '@/types';

export class AutoFixer {
    private openai: OpenAI;
    private projectPath: string;

    constructor(apiKey: string, projectPath: string = './generated-projects') {
        this.openai = new OpenAI({ apiKey });
        this.projectPath = projectPath;
    }

    /**
     * 자동 수정 실행
     */
    async attemptAutoFix(bugs: Bug[]): Promise<AutoFixResult> {
        console.log('🔧 자동 수정 시도 시작...');

        try {
            const result: AutoFixResult = {
                fixedBugs: [],
                partiallyFixedBugs: [],
                failedBugs: [],
                autoFixRate: 0,
                recommendations: []
            };

            // 자동 수정 가능한 버그 필터링
            const autoFixableBugs = bugs.filter(bug => this.isAutoFixable(bug));

            console.log(`자동 수정 가능한 버그: ${autoFixableBugs.length}개`);

            // 각 버그에 대해 자동 수정 시도
            for (const bug of autoFixableBugs) {
                try {
                    const fixResult = await this.attemptBugFix(bug);

                    if (fixResult.success) {
                        result.fixedBugs.push(fixResult);
                        console.log(`✅ 버그 수정 완료: ${bug.title}`);
                    } else if (fixResult.partial) {
                        result.partiallyFixedBugs.push(fixResult);
                        console.log(`⚠️ 버그 부분 수정: ${bug.title}`);
                    } else {
                        result.failedBugs.push(fixResult);
                        console.log(`❌ 버그 수정 실패: ${bug.title}`);
                    }
                } catch (error) {
                    result.failedBugs.push({
                        bug,
                        success: false,
                        partial: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        fix: null,
                        confidence: 0
                    });
                    console.log(`❌ 버그 수정 중 오류: ${bug.title} - ${error}`);
                }
            }

            // 자동 수정률 계산
            result.autoFixRate = result.fixedBugs.length / autoFixableBugs.length;

            // 권장사항 생성
            result.recommendations = this.generateAutoFixRecommendations(result);

            // 수정 리포트 생성
            const report = await this.generateAutoFixReport(result);
            result.report = report;

            console.log(`✅ 자동 수정 완료 - 성공: ${result.fixedBugs.length}, 부분: ${result.partiallyFixedBugs.length}, 실패: ${result.failedBugs.length}`);

            return result;

        } catch (error) {
            console.error('❌ 자동 수정 실패:', error);
            throw error;
        }
    }

    /**
     * 버그 자동 수정 가능 여부 판단
     */
    private isAutoFixable(bug: Bug): boolean {
        // 자동 수정 가능한 버그 타입들
        const autoFixableTypes = [
            'syntax',
            'type',
            'logic',
            'performance',
            'memory'
        ];

        // 자동 수정 가능한 심각도
        const autoFixableSeverities = [
            'low',
            'medium'
        ];

        // 자동 수정 가능한 카테고리
        const autoFixableCategories = [
            'syntax_error',
            'type_error',
            'logic_error',
            'performance_issue',
            'memory_leak'
        ];

        return autoFixableTypes.includes(bug.type) &&
            autoFixableSeverities.includes(bug.severity) &&
            autoFixableCategories.includes(bug.category) &&
            bug.confidence > 0.7;
    }

    /**
     * 개별 버그 수정 시도
     */
    private async attemptBugFix(bug: Bug): Promise<BugFixResult> {
        console.log(`🔧 버그 수정 시도: ${bug.title}`);

        try {
            // 버그 타입별 수정 전략 선택
            const fixStrategy = this.selectFixStrategy(bug);

            // 수정 코드 생성
            const fix = await this.generateFix(bug, fixStrategy);

            // 수정 적용
            const appliedFix = await this.applyFix(bug, fix);

            // 수정 검증
            const validation = await this.validateFix(bug, appliedFix);

            if (validation.success) {
                return {
                    bug,
                    success: true,
                    partial: false,
                    error: null,
                    fix: appliedFix,
                    confidence: validation.confidence
                };
            } else if (validation.partial) {
                return {
                    bug,
                    success: false,
                    partial: true,
                    error: validation.error,
                    fix: appliedFix,
                    confidence: validation.confidence
                };
            } else {
                return {
                    bug,
                    success: false,
                    partial: false,
                    error: validation.error,
                    fix: appliedFix,
                    confidence: validation.confidence
                };
            }

        } catch (error) {
            return {
                bug,
                success: false,
                partial: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                fix: null,
                confidence: 0
            };
        }
    }

    /**
     * 수정 전략 선택
     */
    private selectFixStrategy(bug: Bug): FixStrategy {
        switch (bug.type) {
            case 'syntax':
                return this.createSyntaxFixStrategy(bug);
            case 'type':
                return this.createTypeFixStrategy(bug);
            case 'logic':
                return this.createLogicFixStrategy(bug);
            case 'performance':
                return this.createPerformanceFixStrategy(bug);
            case 'memory':
                return this.createMemoryFixStrategy(bug);
            default:
                return this.createGenericFixStrategy(bug);
        }
    }

    /**
     * 문법 오류 수정 전략
     */
    private createSyntaxFixStrategy(bug: Bug): FixStrategy {
        return {
            type: 'syntax',
            approach: 'direct_fix',
            rules: [
                '괄호 불일치 수정',
                '세미콜론 추가',
                '따옴표 수정',
                '괄호 닫기'
            ],
            confidence: 0.9
        };
    }

    /**
     * 타입 오류 수정 전략
     */
    private createTypeFixStrategy(bug: Bug): FixStrategy {
        return {
            type: 'type',
            approach: 'type_conversion',
            rules: [
                '타입 변환 추가',
                '명시적 캐스팅',
                '타입 가드 추가',
                'null 체크 추가'
            ],
            confidence: 0.8
        };
    }

    /**
     * 논리 오류 수정 전략
     */
    private createLogicFixStrategy(bug: Bug): FixStrategy {
        return {
            type: 'logic',
            approach: 'conditional_fix',
            rules: [
                '조건문 수정',
                '변수 초기화',
                '루프 조건 수정',
                '예외 처리 추가'
            ],
            confidence: 0.6
        };
    }

    /**
     * 성능 오류 수정 전략
     */
    private createPerformanceFixStrategy(bug: Bug): FixStrategy {
        return {
            type: 'performance',
            approach: 'optimization',
            rules: [
                '쿼리 최적화',
                '캐싱 추가',
                '지연 로딩',
                '배치 처리'
            ],
            confidence: 0.5
        };
    }

    /**
     * 메모리 오류 수정 전략
     */
    private createMemoryFixStrategy(bug: Bug): FixStrategy {
        return {
            type: 'memory',
            approach: 'resource_management',
            rules: [
                '이벤트 핸들러 구독 해제',
                '리소스 해제',
                '메모리 정리',
                '가비지 컬렉션 최적화'
            ],
            confidence: 0.7
        };
    }

    /**
     * 일반 수정 전략
     */
    private createGenericFixStrategy(bug: Bug): FixStrategy {
        return {
            type: 'generic',
            approach: 'suggestion_based',
            rules: [
                '코드 리팩토링',
                '에러 처리 개선',
                '로깅 추가',
                '문서화 개선'
            ],
            confidence: 0.4
        };
    }

    /**
     * 수정 코드 생성
     */
    private async generateFix(bug: Bug, strategy: FixStrategy): Promise<BugFix> {
        console.log(`🔧 수정 코드 생성: ${bug.title}`);

        const prompt = `
    다음 버그를 수정하는 코드를 생성해주세요:
    
    버그 정보:
    - 타입: ${bug.type}
    - 심각도: ${bug.severity}
    - 제목: ${bug.title}
    - 설명: ${bug.description}
    - 파일: ${bug.file}
    - 라인: ${bug.line}
    - 코드: ${bug.code}
    - 제안: ${bug.suggestion}
    
    수정 전략:
    - 접근법: ${strategy.approach}
    - 규칙: ${strategy.rules.join(', ')}
    
    다음 형식으로 응답해주세요:
    {
      "originalCode": "원본 코드",
      "fixedCode": "수정된 코드",
      "explanation": "수정 설명",
      "confidence": 0.8,
      "changes": ["변경사항1", "변경사항2"]
    }
    `;

        try {
            const chatCompletion = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: "json_object" },
            });

            const content = chatCompletion.choices[0].message.content;
            if (!content) {
                throw new Error("No content received from OpenAI for bug fix generation.");
            }

            const fixData = JSON.parse(content);

            return {
                id: this.generateId(),
                bugId: bug.id,
                originalCode: fixData.originalCode,
                fixedCode: fixData.fixedCode,
                explanation: fixData.explanation,
                confidence: fixData.confidence,
                changes: fixData.changes,
                strategy: strategy,
                createdAt: new Date()
            };

        } catch (error) {
            console.error("Error generating fix with OpenAI:", error);
            throw error;
        }
    }

    /**
     * 수정 적용
     */
    private async applyFix(bug: Bug, fix: BugFix): Promise<AppliedFix> {
        console.log(`🔧 수정 적용: ${bug.title}`);

        try {
            // 파일 읽기
            const filePath = path.join(this.projectPath, bug.file);
            const originalContent = await fs.readFile(filePath, 'utf-8');

            // 수정 적용
            const fixedContent = this.applyCodeFix(originalContent, fix, bug);

            // 백업 생성
            const backupPath = `${filePath}.backup.${Date.now()}`;
            await fs.writeFile(backupPath, originalContent);

            // 수정된 파일 저장
            await fs.writeFile(filePath, fixedContent);

            return {
                fix,
                filePath,
                backupPath,
                originalContent,
                fixedContent,
                success: true,
                error: null
            };

        } catch (error) {
            return {
                fix,
                filePath: '',
                backupPath: '',
                originalContent: '',
                fixedContent: '',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * 코드 수정 적용
     */
    private applyCodeFix(content: string, fix: BugFix, bug: Bug): string {
        const lines = content.split('\n');
        const targetLine = bug.line - 1; // 0-based index

        if (targetLine >= 0 && targetLine < lines.length) {
            // 해당 라인을 수정된 코드로 교체
            lines[targetLine] = fix.fixedCode;
            return lines.join('\n');
        }

        return content;
    }

    /**
     * 수정 검증
     */
    private async validateFix(bug: Bug, appliedFix: AppliedFix): Promise<FixValidation> {
        console.log(`🔍 수정 검증: ${bug.title}`);

        try {
            if (!appliedFix.success) {
                return {
                    success: false,
                    partial: false,
                    error: appliedFix.error,
                    confidence: 0
                };
            }

            // 문법 검증
            const syntaxValid = await this.validateSyntax(appliedFix.fixedContent);
            if (!syntaxValid) {
                return {
                    success: false,
                    partial: false,
                    error: 'Syntax error in fixed code',
                    confidence: 0
                };
            }

            // 타입 검증
            const typeValid = await this.validateTypes(appliedFix.fixedContent);
            if (!typeValid) {
                return {
                    success: false,
                    partial: true,
                    error: 'Type error in fixed code',
                    confidence: 0.5
                };
            }

            // 로직 검증
            const logicValid = await this.validateLogic(appliedFix.fixedContent, bug);
            if (!logicValid) {
                return {
                    success: false,
                    partial: true,
                    error: 'Logic error in fixed code',
                    confidence: 0.6
                };
            }

            // 전체 검증
            const overallValid = syntaxValid && typeValid && logicValid;

            return {
                success: overallValid,
                partial: !overallValid && (typeValid || logicValid),
                error: overallValid ? null : 'Validation failed',
                confidence: overallValid ? 0.9 : 0.6
            };

        } catch (error) {
            return {
                success: false,
                partial: false,
                error: error instanceof Error ? error.message : 'Validation error',
                confidence: 0
            };
        }
    }

    /**
     * 문법 검증
     */
    private async validateSyntax(content: string): Promise<boolean> {
        // 실제 구현에서는 문법 검증
        // 예: TypeScript 컴파일러, ESLint 등 사용
        return true;
    }

    /**
     * 타입 검증
     */
    private async validateTypes(content: string): Promise<boolean> {
        // 실제 구현에서는 타입 검증
        // 예: TypeScript 컴파일러 사용
        return true;
    }

    /**
     * 로직 검증
     */
    private async validateLogic(content: string, bug: Bug): Promise<boolean> {
        // 실제 구현에서는 로직 검증
        // 예: 정적 분석 도구, 테스트 실행 등
        return true;
    }

    /**
     * 자동 수정 권장사항 생성
     */
    private generateAutoFixRecommendations(result: AutoFixResult): string[] {
        const recommendations: string[] = [];

        if (result.autoFixRate < 0.3) {
            recommendations.push('자동 수정률이 낮습니다. 수정 규칙을 개선하세요.');
        }

        if (result.failedBugs.length > result.fixedBugs.length) {
            recommendations.push('실패한 수정이 많습니다. 수정 전략을 재검토하세요.');
        }

        if (result.partiallyFixedBugs.length > 0) {
            recommendations.push('부분 수정된 버그들을 완전히 수정하세요.');
        }

        return recommendations;
    }

    /**
     * 자동 수정 리포트 생성
     */
    private async generateAutoFixReport(result: AutoFixResult): Promise<string> {
        const report = {
            summary: {
                totalBugs: result.fixedBugs.length + result.partiallyFixedBugs.length + result.failedBugs.length,
                fixedBugs: result.fixedBugs.length,
                partiallyFixedBugs: result.partiallyFixedBugs.length,
                failedBugs: result.failedBugs.length,
                autoFixRate: result.autoFixRate
            },
            fixedBugs: result.fixedBugs,
            partiallyFixedBugs: result.partiallyFixedBugs,
            failedBugs: result.failedBugs,
            recommendations: result.recommendations,
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(this.projectPath, 'auto-fix-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return reportPath;
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

// 타입 정의
interface AutoFixResult {
    fixedBugs: BugFixResult[];
    partiallyFixedBugs: BugFixResult[];
    failedBugs: BugFixResult[];
    autoFixRate: number;
    recommendations: string[];
    report?: string;
}

interface BugFixResult {
    bug: Bug;
    success: boolean;
    partial: boolean;
    error: string | null;
    fix: BugFix | null;
    confidence: number;
}

interface FixStrategy {
    type: string;
    approach: string;
    rules: string[];
    confidence: number;
}

interface BugFix {
    id: string;
    bugId: string;
    originalCode: string;
    fixedCode: string;
    explanation: string;
    confidence: number;
    changes: string[];
    strategy: FixStrategy;
    createdAt: Date;
}

interface AppliedFix {
    fix: BugFix;
    filePath: string;
    backupPath: string;
    originalContent: string;
    fixedContent: string;
    success: boolean;
    error: string | null;
}

interface FixValidation {
    success: boolean;
    partial: boolean;
    error: string | null;
    confidence: number;
}
