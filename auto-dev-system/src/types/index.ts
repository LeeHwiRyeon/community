// 자동 개발 시스템 핵심 타입 정의

export interface Goal {
    id: string;
    description: string;
    category: 'web-app' | 'mobile-app' | 'api' | 'desktop-app' | 'microservice';
    complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
    requirements: Requirement[];
    constraints: Constraint[];
    timeline: number; // days
    budget?: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface Requirement {
    id: string;
    type: 'functional' | 'non-functional' | 'technical' | 'business';
    description: string;
    priority: number;
    dependencies: string[];
    acceptanceCriteria: string[];
}

export interface Constraint {
    type: 'technology' | 'performance' | 'security' | 'compliance' | 'budget';
    description: string;
    value: string | number;
    mandatory: boolean;
}

export interface DevelopmentPlan {
    id: string;
    goalId: string;
    phases: Phase[];
    estimatedDuration: number;
    requiredResources: Resource[];
    riskAssessment: Risk[];
    successMetrics: Metric[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Phase {
    id: string;
    name: string;
    description: string;
    order: number;
    tasks: Task[];
    dependencies: string[];
    estimatedDuration: number;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface Task {
    id: string;
    name: string;
    description: string;
    type: 'analysis' | 'design' | 'development' | 'testing' | 'deployment' | 'optimization';
    priority: number;
    estimatedDuration: number;
    dependencies: string[];
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    assignedTo?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Resource {
    id: string;
    type: 'human' | 'computing' | 'storage' | 'network' | 'external-service';
    name: string;
    description: string;
    cost: number;
    availability: number; // percentage
    skills?: string[];
}

export interface Risk {
    id: string;
    description: string;
    probability: number; // 0-1
    impact: number; // 0-1
    mitigation: string;
    contingency: string;
}

export interface Metric {
    name: string;
    description: string;
    target: number;
    unit: string;
    measurement: 'automatic' | 'manual';
}

export interface TechStack {
    frontend: Technology[];
    backend: Technology[];
    database: Technology[];
    infrastructure: Technology[];
    testing: Technology[];
    monitoring: Technology[];
}

export interface Technology {
    name: string;
    version: string;
    category: string;
    description: string;
    pros: string[];
    cons: string[];
    learningCurve: number; // 1-5
    community: number; // 1-5
    performance: number; // 1-5
}

export interface ProjectStructure {
    id: string;
    name: string;
    type: 'monolith' | 'microservices' | 'serverless';
    directories: Directory[];
    files: ProjectFile[];
    dependencies: Dependency[];
    scripts: Script[];
}

export interface Directory {
    name: string;
    path: string;
    purpose: string;
    children: Directory[];
}

export interface ProjectFile {
    name: string;
    path: string;
    type: 'source' | 'config' | 'test' | 'documentation' | 'asset';
    content: string;
    language: string;
    size: number;
}

export interface Dependency {
    name: string;
    version: string;
    type: 'production' | 'development' | 'peer';
    description: string;
}

export interface Script {
    name: string;
    command: string;
    description: string;
    category: 'build' | 'test' | 'deploy' | 'dev';
}

export interface CodeFile {
    id: string;
    name: string;
    path: string;
    content: string;
    language: string;
    size: number;
    complexity: number;
    quality: number;
    lastModified: Date;
}

export interface TestResult {
    id: string;
    testType: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
    passed: number;
    failed: number;
    skipped: number;
    coverage: number;
    duration: number;
    issues: Issue[];
    recommendations: string[];
    createdAt: Date;
}

export interface Issue {
    id: string;
    type: 'error' | 'warning' | 'info';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    file: string;
    line: number;
    column: number;
    rule: string;
    fix?: string;
}

export interface PerformanceResult {
    id: string;
    metric: string;
    value: number;
    unit: string;
    threshold: number;
    status: 'pass' | 'fail' | 'warning';
    recommendations: string[];
    timestamp: Date;
}

export interface OptimizationSuggestion {
    id: string;
    type: 'code' | 'database' | 'cache' | 'bundle' | 'network';
    description: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    code: string;
    before: string;
    after: string;
    metrics: PerformanceResult[];
}

export interface UXInsight {
    id: string;
    type: 'usability' | 'accessibility' | 'performance' | 'engagement';
    description: string;
    severity: 'low' | 'medium' | 'high';
    component: string;
    suggestion: string;
    impact: number;
}

export interface UserFeedback {
    id: string;
    userId: string;
    type: 'bug' | 'feature' | 'improvement' | 'complaint';
    content: string;
    rating: number;
    category: string;
    priority: 'low' | 'medium' | 'high';
    status: 'new' | 'in-progress' | 'resolved' | 'closed';
    createdAt: Date;
}

export interface Bug {
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'new' | 'assigned' | 'in-progress' | 'resolved' | 'closed';
    component: string;
    environment: string;
    steps: string[];
    expected: string;
    actual: string;
    reporter: string;
    assignee?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface FixResult {
    success: boolean;
    changes: CodeChange[];
    tests: TestResult;
    confidence: number;
    message: string;
}

export interface CodeChange {
    file: string;
    line: number;
    before: string;
    after: string;
    type: 'addition' | 'deletion' | 'modification';
}

export interface Notification {
    id: string;
    type: 'bug' | 'performance' | 'deployment' | 'test' | 'optimization';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    recipients: string[];
    status: 'sent' | 'delivered' | 'read' | 'failed';
    createdAt: Date;
}

export interface WorkflowStep {
    id: string;
    name: string;
    type: 'analysis' | 'generation' | 'testing' | 'optimization' | 'deployment';
    status: 'pending' | 'running' | 'completed' | 'failed';
    input: any;
    output: any;
    error?: string;
    duration: number;
    startedAt: Date;
    completedAt?: Date;
}

export interface Workflow {
    id: string;
    goalId: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
    steps: WorkflowStep[];
    currentStep: number;
    progress: number;
    createdAt: Date;
    updatedAt: Date;
}
