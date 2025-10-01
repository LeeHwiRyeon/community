import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { OptimizationSuggestion, Issue } from '@/types';

export class DatabaseOptimizer {
    private openai: OpenAI;
    private projectPath: string;

    constructor(apiKey: string, projectPath: string = './generated-projects') {
        this.openai = new OpenAI({ apiKey });
        this.projectPath = projectPath;
    }

    /**
     * 데이터베이스 최적화 실행
     */
    async optimizeDatabase(
        databaseType: string,
        schemaFiles: string[]
    ): Promise<DatabaseOptimizationResult> {
        console.log('🗄️ 데이터베이스 최적화 시작...');

        try {
            // 1. 데이터베이스 분석
            const analysis = await this.analyzeDatabase(databaseType, schemaFiles);

            // 2. 최적화 제안 생성
            const suggestions = await this.generateDatabaseOptimizationSuggestions(analysis);

            // 3. 인덱스 최적화
            const indexOptimizations = await this.optimizeIndexes(analysis);

            // 4. 쿼리 최적화
            const queryOptimizations = await this.optimizeQueries(analysis);

            // 5. 스키마 최적화
            const schemaOptimizations = await this.optimizeSchema(analysis);

            // 6. 성능 측정
            const performanceMetrics = await this.measureDatabasePerformance(analysis);

            // 7. 최적화 리포트 생성
            const report = await this.generateDatabaseOptimizationReport(
                analysis,
                suggestions,
                performanceMetrics
            );

            console.log('✅ 데이터베이스 최적화 완료');

            return {
                analysis,
                suggestions,
                indexOptimizations,
                queryOptimizations,
                schemaOptimizations,
                performanceMetrics,
                report,
                summary: this.generateDatabaseOptimizationSummary(analysis, suggestions, performanceMetrics)
            };

        } catch (error) {
            console.error('❌ 데이터베이스 최적화 실패:', error);
            throw error;
        }
    }

    /**
     * 데이터베이스 분석
     */
    private async analyzeDatabase(
        databaseType: string,
        schemaFiles: string[]
    ): Promise<DatabaseAnalysis> {
        console.log('🔍 데이터베이스 분석 중...');

        const analysis: DatabaseAnalysis = {
            databaseType,
            tables: [],
            indexes: [],
            queries: [],
            performance: {
                slowQueries: [],
                missingIndexes: [],
                unusedIndexes: [],
                tableScans: []
            },
            normalization: {
                issues: [],
                recommendations: []
            },
            security: {
                vulnerabilities: [],
                accessControl: []
            },
            scalability: {
                bottlenecks: [],
                partitioning: [],
                sharding: []
            }
        };

        // 스키마 파일 분석
        for (const schemaFile of schemaFiles) {
            const schemaContent = await fs.readFile(schemaFile, 'utf-8');
            const fileAnalysis = await this.analyzeSchemaFile(schemaContent, databaseType);

            analysis.tables.push(...fileAnalysis.tables);
            analysis.indexes.push(...fileAnalysis.indexes);
            analysis.queries.push(...fileAnalysis.queries);
        }

        // 성능 분석
        analysis.performance = await this.analyzePerformance(analysis);

        // 정규화 분석
        analysis.normalization = await this.analyzeNormalization(analysis);

        // 보안 분석
        analysis.security = await this.analyzeSecurity(analysis);

        // 확장성 분석
        analysis.scalability = await this.analyzeScalability(analysis);

        return analysis;
    }

    /**
     * 스키마 파일 분석
     */
    private async analyzeSchemaFile(
        schemaContent: string,
        databaseType: string
    ): Promise<SchemaFileAnalysis> {
        const tables: TableInfo[] = [];
        const indexes: IndexInfo[] = [];
        const queries: QueryInfo[] = [];

        // 테이블 추출
        const tableMatches = schemaContent.match(/CREATE TABLE\s+(\w+)\s*\([\s\S]*?\)/gi);
        if (tableMatches) {
            for (const tableMatch of tableMatches) {
                const tableInfo = this.extractTableInfo(tableMatch, databaseType);
                tables.push(tableInfo);
            }
        }

        // 인덱스 추출
        const indexMatches = schemaContent.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(\w+)/gi);
        if (indexMatches) {
            for (const indexMatch of indexMatches) {
                const indexInfo = this.extractIndexInfo(indexMatch);
                indexes.push(indexInfo);
            }
        }

        // 쿼리 추출 (주석에서)
        const queryMatches = schemaContent.match(/--\s*Query:\s*(.+)/gi);
        if (queryMatches) {
            for (const queryMatch of queryMatches) {
                const queryInfo = this.extractQueryInfo(queryMatch);
                queries.push(queryInfo);
            }
        }

        return { tables, indexes, queries };
    }

    /**
     * 테이블 정보 추출
     */
    private extractTableInfo(tableMatch: string, databaseType: string): TableInfo {
        const nameMatch = tableMatch.match(/CREATE TABLE\s+(\w+)/i);
        const name = nameMatch ? nameMatch[1] : 'unknown';

        const columns = this.extractColumns(tableMatch);
        const constraints = this.extractConstraints(tableMatch);

        return {
            name,
            columns,
            constraints,
            rowCount: 0, // 실제 데이터가 없으므로 0
            size: 0,
            indexes: []
        };
    }

    /**
     * 컬럼 추출
     */
    private extractColumns(tableMatch: string): ColumnInfo[] {
        const columns: ColumnInfo[] = [];
        const columnMatches = tableMatch.match(/(\w+)\s+(\w+)(?:\s+([^,\n]+))?/g);

        if (columnMatches) {
            for (const columnMatch of columnMatches) {
                const parts = columnMatch.trim().split(/\s+/);
                if (parts.length >= 2) {
                    columns.push({
                        name: parts[0],
                        type: parts[1],
                        nullable: !columnMatch.includes('NOT NULL'),
                        primaryKey: columnMatch.includes('PRIMARY KEY'),
                        unique: columnMatch.includes('UNIQUE'),
                        foreignKey: columnMatch.includes('REFERENCES'),
                        defaultValue: this.extractDefaultValue(columnMatch)
                    });
                }
            }
        }

        return columns;
    }

    /**
     * 제약조건 추출
     */
    private extractConstraints(tableMatch: string): ConstraintInfo[] {
        const constraints: ConstraintInfo[] = [];

        // Primary Key
        if (tableMatch.includes('PRIMARY KEY')) {
            constraints.push({
                type: 'PRIMARY KEY',
                columns: this.extractConstraintColumns(tableMatch, 'PRIMARY KEY'),
                name: 'pk_' + this.extractTableName(tableMatch)
            });
        }

        // Foreign Key
        const fkMatches = tableMatch.match(/FOREIGN KEY\s*\([^)]+\)\s*REFERENCES\s+(\w+)\s*\([^)]+\)/gi);
        if (fkMatches) {
            for (const fkMatch of fkMatches) {
                constraints.push({
                    type: 'FOREIGN KEY',
                    columns: this.extractConstraintColumns(fkMatch, 'FOREIGN KEY'),
                    name: 'fk_' + this.extractTableName(tableMatch),
                    referencedTable: this.extractReferencedTable(fkMatch)
                });
            }
        }

        return constraints;
    }

    /**
     * 인덱스 정보 추출
     */
    private extractIndexInfo(indexMatch: string): IndexInfo {
        const nameMatch = indexMatch.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(\w+)/i);
        const name = nameMatch ? nameMatch[1] : 'unknown';

        return {
            name,
            table: 'unknown', // 실제 구현에서는 테이블명 추출 필요
            columns: [],
            unique: indexMatch.includes('UNIQUE'),
            type: 'BTREE',
            size: 0
        };
    }

    /**
     * 쿼리 정보 추출
     */
    private extractQueryInfo(queryMatch: string): QueryInfo {
        const query = queryMatch.replace(/--\s*Query:\s*/i, '').trim();

        return {
            sql: query,
            type: this.determineQueryType(query),
            complexity: this.calculateQueryComplexity(query),
            estimatedCost: 0,
            executionTime: 0
        };
    }

    /**
     * 성능 분석
     */
    private async analyzePerformance(analysis: DatabaseAnalysis): Promise<PerformanceAnalysis> {
        const performance: PerformanceAnalysis = {
            slowQueries: [],
            missingIndexes: [],
            unusedIndexes: [],
            tableScans: []
        };

        // 느린 쿼리 감지
        for (const query of analysis.queries) {
            if (query.complexity > 5) {
                performance.slowQueries.push({
                    id: this.generateId(),
                    type: 'warning',
                    severity: 'medium',
                    message: `복잡한 쿼리가 감지되었습니다: ${query.sql.substring(0, 50)}...`,
                    file: 'query-analysis',
                    line: 0,
                    column: 0,
                    rule: 'slow-query'
                });
            }
        }

        // 누락된 인덱스 감지
        for (const table of analysis.tables) {
            const hasPrimaryKey = table.constraints.some(c => c.type === 'PRIMARY KEY');
            if (!hasPrimaryKey) {
                performance.missingIndexes.push({
                    id: this.generateId(),
                    type: 'warning',
                    severity: 'high',
                    message: `테이블 ${table.name}에 Primary Key가 없습니다.`,
                    file: 'index-analysis',
                    line: 0,
                    column: 0,
                    rule: 'missing-primary-key'
                });
            }
        }

        return performance;
    }

    /**
     * 정규화 분석
     */
    private async analyzeNormalization(analysis: DatabaseAnalysis): Promise<NormalizationAnalysis> {
        const normalization: NormalizationAnalysis = {
            issues: [],
            recommendations: []
        };

        // 1NF 위반 감지 (반복 그룹)
        for (const table of analysis.tables) {
            for (const column of table.columns) {
                if (column.name.includes(',') || column.name.includes(';')) {
                    normalization.issues.push({
                        id: this.generateId(),
                        type: 'warning',
                        severity: 'medium',
                        message: `테이블 ${table.name}의 컬럼 ${column.name}이 1NF를 위반할 수 있습니다.`,
                        file: 'normalization-analysis',
                        line: 0,
                        column: 0,
                        rule: '1nf-violation'
                    });
                }
            }
        }

        // 2NF 위반 감지 (부분 함수 종속성)
        for (const table of analysis.tables) {
            const hasCompositeKey = table.constraints.some(c => c.type === 'PRIMARY KEY' && c.columns.length > 1);
            if (hasCompositeKey) {
                // 복합 키가 있는 경우 부분 함수 종속성 검사
                normalization.recommendations.push({
                    id: this.generateId(),
                    type: 'info',
                    severity: 'low',
                    message: `테이블 ${table.name}의 2NF 준수를 확인하세요.`,
                    file: 'normalization-analysis',
                    line: 0,
                    column: 0,
                    rule: '2nf-check'
                });
            }
        }

        return normalization;
    }

    /**
     * 보안 분석
     */
    private async analyzeSecurity(analysis: DatabaseAnalysis): Promise<SecurityAnalysis> {
        const security: SecurityAnalysis = {
            vulnerabilities: [],
            accessControl: []
        };

        // SQL 인젝션 취약점 감지
        for (const query of analysis.queries) {
            if (query.sql.includes('+') && !query.sql.includes('prepared')) {
                security.vulnerabilities.push({
                    id: this.generateId(),
                    type: 'error',
                    severity: 'high',
                    message: 'SQL 인젝션 취약점이 감지되었습니다. Prepared Statement를 사용하세요.',
                    file: 'security-analysis',
                    line: 0,
                    column: 0,
                    rule: 'sql-injection'
                });
            }
        }

        // 접근 제어 검사
        for (const table of analysis.tables) {
            if (table.name.includes('user') || table.name.includes('password')) {
                security.accessControl.push({
                    id: this.generateId(),
                    type: 'warning',
                    severity: 'medium',
                    message: `테이블 ${table.name}에 적절한 접근 제어가 설정되어 있는지 확인하세요.`,
                    file: 'security-analysis',
                    line: 0,
                    column: 0,
                    rule: 'access-control'
                });
            }
        }

        return security;
    }

    /**
     * 확장성 분석
     */
    private async analyzeScalability(analysis: DatabaseAnalysis): Promise<ScalabilityAnalysis> {
        const scalability: ScalabilityAnalysis = {
            bottlenecks: [],
            partitioning: [],
            sharding: []
        };

        // 병목 지점 감지
        for (const table of analysis.tables) {
            if (table.rowCount > 1000000) { // 100만 행 이상
                scalability.bottlenecks.push({
                    id: this.generateId(),
                    type: 'warning',
                    severity: 'medium',
                    message: `테이블 ${table.name}이 대용량입니다. 파티셔닝을 고려하세요.`,
                    file: 'scalability-analysis',
                    line: 0,
                    column: 0,
                    rule: 'large-table'
                });
            }
        }

        return scalability;
    }

    /**
     * 데이터베이스 최적화 제안 생성
     */
    private async generateDatabaseOptimizationSuggestions(
        analysis: DatabaseAnalysis
    ): Promise<OptimizationSuggestion[]> {
        const suggestions: OptimizationSuggestion[] = [];

        // 인덱스 최적화 제안
        if (analysis.performance.missingIndexes.length > 0) {
            suggestions.push({
                type: 'database',
                description: '누락된 인덱스를 추가하여 쿼리 성능을 향상시키세요.',
                severity: 'high',
                estimatedImpact: '쿼리 성능 50-80% 향상',
                suggestedChanges: await this.generateIndexOptimizationChanges(analysis)
            });
        }

        // 쿼리 최적화 제안
        if (analysis.performance.slowQueries.length > 0) {
            suggestions.push({
                type: 'database',
                description: '느린 쿼리를 최적화하여 응답 시간을 단축하세요.',
                severity: 'medium',
                estimatedImpact: '쿼리 응답 시간 30-50% 단축',
                suggestedChanges: await this.generateQueryOptimizationChanges(analysis)
            });
        }

        // 스키마 최적화 제안
        if (analysis.normalization.issues.length > 0) {
            suggestions.push({
                type: 'database',
                description: '데이터베이스 정규화를 개선하여 데이터 일관성을 향상시키세요.',
                severity: 'medium',
                estimatedImpact: '데이터 일관성 향상 및 저장 공간 절약',
                suggestedChanges: await this.generateSchemaOptimizationChanges(analysis)
            });
        }

        return suggestions;
    }

    /**
     * 인덱스 최적화
     */
    private async optimizeIndexes(analysis: DatabaseAnalysis): Promise<IndexOptimization[]> {
        const optimizations: IndexOptimization[] = [];

        // 누락된 인덱스 추가
        for (const table of analysis.tables) {
            const hasPrimaryKey = table.constraints.some(c => c.type === 'PRIMARY KEY');
            if (!hasPrimaryKey) {
                optimizations.push({
                    type: 'add',
                    table: table.name,
                    indexName: `idx_${table.name}_id`,
                    columns: ['id'],
                    sql: `ALTER TABLE ${table.name} ADD PRIMARY KEY (id);`
                });
            }
        }

        // 복합 인덱스 추가
        for (const query of analysis.queries) {
            if (query.complexity > 3) {
                const columns = this.extractQueryColumns(query.sql);
                if (columns.length > 1) {
                    optimizations.push({
                        type: 'add',
                        table: 'unknown', // 실제 구현에서는 테이블명 추출 필요
                        indexName: `idx_composite_${this.generateId()}`,
                        columns,
                        sql: `CREATE INDEX idx_composite_${this.generateId()} ON table_name (${columns.join(', ')});`
                    });
                }
            }
        }

        return optimizations;
    }

    /**
     * 쿼리 최적화
     */
    private async optimizeQueries(analysis: DatabaseAnalysis): Promise<QueryOptimization[]> {
        const optimizations: QueryOptimization[] = [];

        for (const query of analysis.queries) {
            if (query.complexity > 3) {
                const optimizedQuery = await this.optimizeQuery(query);
                optimizations.push({
                    original: query.sql,
                    optimized: optimizedQuery,
                    improvements: this.calculateQueryImprovements(query, optimizedQuery)
                });
            }
        }

        return optimizations;
    }

    /**
     * 개별 쿼리 최적화
     */
    private async optimizeQuery(query: QueryInfo): Promise<string> {
        const prompt = `
다음 SQL 쿼리를 최적화해주세요:

쿼리: ${query.sql}
복잡도: ${query.complexity}

다음 최적화를 적용하세요:
1. 인덱스 활용 최적화
2. JOIN 순서 최적화
3. 서브쿼리를 JOIN으로 변경
4. 불필요한 SELECT 컬럼 제거
5. WHERE 조건 최적화

최적화된 쿼리를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1000
        });

        return response.choices[0].message.content || query.sql;
    }

    /**
     * 스키마 최적화
     */
    private async optimizeSchema(analysis: DatabaseAnalysis): Promise<SchemaOptimization[]> {
        const optimizations: SchemaOptimization[] = [];

        // 테이블 정규화
        for (const table of analysis.tables) {
            if (this.needsNormalization(table)) {
                optimizations.push({
                    type: 'normalize',
                    table: table.name,
                    description: `테이블 ${table.name}을 정규화하여 데이터 일관성을 향상시킵니다.`,
                    sql: await this.generateNormalizationSQL(table)
                });
            }
        }

        // 데이터 타입 최적화
        for (const table of analysis.tables) {
            for (const column of table.columns) {
                if (this.canOptimizeDataType(column)) {
                    optimizations.push({
                        type: 'optimize_datatype',
                        table: table.name,
                        description: `컬럼 ${column.name}의 데이터 타입을 최적화합니다.`,
                        sql: `ALTER TABLE ${table.name} MODIFY COLUMN ${column.name} ${this.getOptimizedDataType(column)};`
                    });
                }
            }
        }

        return optimizations;
    }

    /**
     * 데이터베이스 성능 측정
     */
    private async measureDatabasePerformance(analysis: DatabaseAnalysis): Promise<DatabasePerformanceMetrics> {
        return {
            queryPerformance: {
                averageExecutionTime: this.calculateAverageExecutionTime(analysis.queries),
                slowestQuery: this.findSlowestQuery(analysis.queries),
                totalQueries: analysis.queries.length
            },
            indexEfficiency: {
                totalIndexes: analysis.indexes.length,
                unusedIndexes: analysis.performance.unusedIndexes.length,
                missingIndexes: analysis.performance.missingIndexes.length
            },
            storageEfficiency: {
                totalTables: analysis.tables.length,
                estimatedSize: this.calculateEstimatedSize(analysis.tables),
                normalizedTables: this.countNormalizedTables(analysis.tables)
            },
            scalability: {
                largeTables: analysis.tables.filter(t => t.rowCount > 1000000).length,
                partitioningCandidates: analysis.scalability.partitioning.length,
                shardingCandidates: analysis.scalability.sharding.length
            }
        };
    }

    /**
     * 데이터베이스 최적화 리포트 생성
     */
    private async generateDatabaseOptimizationReport(
        analysis: DatabaseAnalysis,
        suggestions: OptimizationSuggestion[],
        performanceMetrics: DatabasePerformanceMetrics
    ): Promise<string> {
        const report = {
            summary: this.generateDatabaseOptimizationSummary(analysis, suggestions, performanceMetrics),
            analysis,
            suggestions,
            performanceMetrics,
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(this.projectPath, 'database-optimization-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return reportPath;
    }

    /**
     * 데이터베이스 최적화 요약 생성
     */
    private generateDatabaseOptimizationSummary(
        analysis: DatabaseAnalysis,
        suggestions: OptimizationSuggestion[],
        performanceMetrics: DatabasePerformanceMetrics
    ): DatabaseOptimizationSummary {
        return {
            totalTables: analysis.tables.length,
            totalIndexes: analysis.indexes.length,
            totalQueries: analysis.queries.length,
            performanceScore: this.calculatePerformanceScore(analysis),
            securityScore: this.calculateSecurityScore(analysis),
            normalizationScore: this.calculateNormalizationScore(analysis),
            suggestionsCount: suggestions.length,
            criticalIssues: analysis.security.vulnerabilities.length,
            status: this.determineDatabaseOptimizationStatus(analysis, suggestions)
        };
    }

    // 헬퍼 메서드들
    private extractTableName(tableMatch: string): string {
        const match = tableMatch.match(/CREATE TABLE\s+(\w+)/i);
        return match ? match[1] : 'unknown';
    }

    private extractConstraintColumns(constraint: string, type: string): string[] {
        const match = constraint.match(new RegExp(`${type}\\s*\\(([^)]+)\\)`, 'i'));
        return match ? match[1].split(',').map(col => col.trim()) : [];
    }

    private extractReferencedTable(fkMatch: string): string {
        const match = fkMatch.match(/REFERENCES\s+(\w+)/i);
        return match ? match[1] : 'unknown';
    }

    private extractDefaultValue(columnMatch: string): string | null {
        const match = columnMatch.match(/DEFAULT\s+([^\s,]+)/i);
        return match ? match[1] : null;
    }

    private determineQueryType(query: string): string {
        const upperQuery = query.toUpperCase();
        if (upperQuery.startsWith('SELECT')) return 'SELECT';
        if (upperQuery.startsWith('INSERT')) return 'INSERT';
        if (upperQuery.startsWith('UPDATE')) return 'UPDATE';
        if (upperQuery.startsWith('DELETE')) return 'DELETE';
        return 'OTHER';
    }

    private calculateQueryComplexity(query: string): number {
        let complexity = 1;
        if (query.includes('JOIN')) complexity += 2;
        if (query.includes('WHERE')) complexity += 1;
        if (query.includes('GROUP BY')) complexity += 2;
        if (query.includes('ORDER BY')) complexity += 1;
        if (query.includes('HAVING')) complexity += 2;
        if (query.includes('UNION')) complexity += 3;
        if (query.includes('SUBQUERY')) complexity += 3;
        return complexity;
    }

    private extractQueryColumns(query: string): string[] {
        // 간단한 컬럼 추출 로직
        const columns: string[] = [];
        const selectMatch = query.match(/SELECT\s+([^FROM]+)/i);
        if (selectMatch) {
            const columnList = selectMatch[1];
            columns.push(...columnList.split(',').map(col => col.trim().split(' ')[0]));
        }
        return columns;
    }

    private needsNormalization(table: TableInfo): boolean {
        // 정규화 필요성 판단 로직
        return table.columns.length > 10;
    }

    private canOptimizeDataType(column: ColumnInfo): boolean {
        // 데이터 타입 최적화 가능성 판단
        return column.type === 'VARCHAR' && column.name.includes('id');
    }

    private getOptimizedDataType(column: ColumnInfo): string {
        if (column.name.includes('id')) return 'INT';
        if (column.type === 'VARCHAR') return 'VARCHAR(255)';
        return column.type;
    }

    private calculateAverageExecutionTime(queries: QueryInfo[]): number {
        return queries.reduce((sum, q) => sum + q.executionTime, 0) / queries.length;
    }

    private findSlowestQuery(queries: QueryInfo[]): QueryInfo | null {
        return queries.reduce((slowest, current) =>
            current.executionTime > slowest.executionTime ? current : slowest,
            queries[0] || null
        );
    }

    private calculateEstimatedSize(tables: TableInfo[]): number {
        return tables.reduce((sum, table) => sum + table.size, 0);
    }

    private countNormalizedTables(tables: TableInfo[]): number {
        return tables.filter(table => table.columns.length <= 10).length;
    }

    private calculatePerformanceScore(analysis: DatabaseAnalysis): number {
        const slowQueries = analysis.performance.slowQueries.length;
        const missingIndexes = analysis.performance.missingIndexes.length;
        return Math.max(0, 10 - (slowQueries + missingIndexes) * 2);
    }

    private calculateSecurityScore(analysis: DatabaseAnalysis): number {
        const vulnerabilities = analysis.security.vulnerabilities.length;
        return Math.max(0, 10 - vulnerabilities * 3);
    }

    private calculateNormalizationScore(analysis: DatabaseAnalysis): number {
        const issues = analysis.normalization.issues.length;
        return Math.max(0, 10 - issues * 2);
    }

    private determineDatabaseOptimizationStatus(
        analysis: DatabaseAnalysis,
        suggestions: OptimizationSuggestion[]
    ): 'excellent' | 'good' | 'fair' | 'poor' {
        const performanceScore = this.calculatePerformanceScore(analysis);
        const securityScore = this.calculateSecurityScore(analysis);
        const avgScore = (performanceScore + securityScore) / 2;

        if (avgScore >= 8 && suggestions.length === 0) return 'excellent';
        if (avgScore >= 6 && suggestions.length <= 2) return 'good';
        if (avgScore >= 4 && suggestions.length <= 5) return 'fair';
        return 'poor';
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

// 타입 정의
interface DatabaseAnalysis {
    databaseType: string;
    tables: TableInfo[];
    indexes: IndexInfo[];
    queries: QueryInfo[];
    performance: PerformanceAnalysis;
    normalization: NormalizationAnalysis;
    security: SecurityAnalysis;
    scalability: ScalabilityAnalysis;
}

interface TableInfo {
    name: string;
    columns: ColumnInfo[];
    constraints: ConstraintInfo[];
    rowCount: number;
    size: number;
    indexes: string[];
}

interface ColumnInfo {
    name: string;
    type: string;
    nullable: boolean;
    primaryKey: boolean;
    unique: boolean;
    foreignKey: boolean;
    defaultValue: string | null;
}

interface ConstraintInfo {
    type: string;
    columns: string[];
    name: string;
    referencedTable?: string;
}

interface IndexInfo {
    name: string;
    table: string;
    columns: string[];
    unique: boolean;
    type: string;
    size: number;
}

interface QueryInfo {
    sql: string;
    type: string;
    complexity: number;
    estimatedCost: number;
    executionTime: number;
}

interface PerformanceAnalysis {
    slowQueries: Issue[];
    missingIndexes: Issue[];
    unusedIndexes: Issue[];
    tableScans: Issue[];
}

interface NormalizationAnalysis {
    issues: Issue[];
    recommendations: Issue[];
}

interface SecurityAnalysis {
    vulnerabilities: Issue[];
    accessControl: Issue[];
}

interface ScalabilityAnalysis {
    bottlenecks: Issue[];
    partitioning: Issue[];
    sharding: Issue[];
}

interface SchemaFileAnalysis {
    tables: TableInfo[];
    indexes: IndexInfo[];
    queries: QueryInfo[];
}

interface IndexOptimization {
    type: 'add' | 'remove' | 'modify';
    table: string;
    indexName: string;
    columns: string[];
    sql: string;
}

interface QueryOptimization {
    original: string;
    optimized: string;
    improvements: string[];
}

interface SchemaOptimization {
    type: 'normalize' | 'optimize_datatype' | 'add_constraint';
    table: string;
    description: string;
    sql: string;
}

interface DatabasePerformanceMetrics {
    queryPerformance: {
        averageExecutionTime: number;
        slowestQuery: QueryInfo | null;
        totalQueries: number;
    };
    indexEfficiency: {
        totalIndexes: number;
        unusedIndexes: number;
        missingIndexes: number;
    };
    storageEfficiency: {
        totalTables: number;
        estimatedSize: number;
        normalizedTables: number;
    };
    scalability: {
        largeTables: number;
        partitioningCandidates: number;
        shardingCandidates: number;
    };
}

interface DatabaseOptimizationResult {
    analysis: DatabaseAnalysis;
    suggestions: OptimizationSuggestion[];
    indexOptimizations: IndexOptimization[];
    queryOptimizations: QueryOptimization[];
    schemaOptimizations: SchemaOptimization[];
    performanceMetrics: DatabasePerformanceMetrics;
    report: string;
    summary: DatabaseOptimizationSummary;
}

interface DatabaseOptimizationSummary {
    totalTables: number;
    totalIndexes: number;
    totalQueries: number;
    performanceScore: number;
    securityScore: number;
    normalizationScore: number;
    suggestionsCount: number;
    criticalIssues: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
}
