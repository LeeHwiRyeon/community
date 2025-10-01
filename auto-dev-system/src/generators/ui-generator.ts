import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import { CodeFile, TechStack, Goal } from '@/types';

export class UIGenerator {
    private openai: OpenAI;
    private outputDir: string;

    constructor(apiKey: string, outputDir: string = './generated-projects') {
        this.openai = new OpenAI({ apiKey });
        this.outputDir = outputDir;
    }

    /**
     * UI 컴포넌트 생성
     */
    async generateUIComponents(
        goal: Goal,
        techStack: TechStack,
        projectStructure: any
    ): Promise<CodeFile[]> {
        console.log('🎨 UI 컴포넌트 생성 중...');

        const generatedFiles: CodeFile[] = [];

        try {
            // 1. 메인 앱 컴포넌트 생성
            const appFile = await this.generateAppComponent(goal, techStack);
            generatedFiles.push(appFile);

            // 2. 페이지 컴포넌트들 생성
            const pageFiles = await this.generatePageComponents(goal, techStack);
            generatedFiles.push(...pageFiles);

            // 3. 공통 컴포넌트들 생성
            const commonFiles = await this.generateCommonComponents(goal, techStack);
            generatedFiles.push(...commonFiles);

            // 4. 레이아웃 컴포넌트들 생성
            const layoutFiles = await this.generateLayoutComponents(techStack);
            generatedFiles.push(...layoutFiles);

            // 5. 훅 파일들 생성
            const hookFiles = await this.generateHookFiles(goal, techStack);
            generatedFiles.push(...hookFiles);

            // 6. 스타일 파일들 생성
            const styleFiles = await this.generateStyleFiles(techStack);
            generatedFiles.push(...styleFiles);

            // 7. 설정 파일들 생성
            const configFiles = await this.generateConfigFiles(techStack);
            generatedFiles.push(...configFiles);

            // 파일들을 실제로 생성
            await this.writeFilesToDisk(generatedFiles, projectStructure);

            console.log(`✅ UI 컴포넌트 생성 완료: ${generatedFiles.length}개 파일`);
            return generatedFiles;

        } catch (error) {
            console.error('❌ UI 컴포넌트 생성 실패:', error);
            throw error;
        }
    }

    /**
     * 메인 앱 컴포넌트 생성
     */
    private async generateAppComponent(goal: Goal, techStack: TechStack): Promise<CodeFile> {
        const isReact = techStack.frontend.some(tech => tech.name === 'React');
        const isVue = techStack.frontend.some(tech => tech.name === 'Vue.js');
        const isAngular = techStack.frontend.some(tech => tech.name === 'Angular');

        let content = '';
        let filename = '';

        if (isReact) {
            filename = 'App.tsx';
            content = await this.generateReactApp(goal, techStack);
        } else if (isVue) {
            filename = 'App.vue';
            content = await this.generateVueApp(goal, techStack);
        } else if (isAngular) {
            filename = 'app.component.ts';
            content = await this.generateAngularApp(goal, techStack);
        } else {
            // 기본 React 앱
            filename = 'App.tsx';
            content = await this.generateReactApp(goal, techStack);
        }

        return {
            id: this.generateId(),
            name: filename,
            path: `src/${filename}`,
            content,
            language: this.getLanguageFromFilename(filename),
            size: content.length,
            complexity: this.calculateComplexity(content),
            quality: this.calculateQuality(content),
            lastModified: new Date()
        };
    }

    /**
     * React 앱 컴포넌트 생성
     */
    private async generateReactApp(goal: Goal, techStack: TechStack): Promise<string> {
        const prompt = `
다음 요구사항에 맞는 React 앱 컴포넌트를 생성해주세요:

목표: ${goal.description}
카테고리: ${goal.category}
복잡도: ${goal.complexity}
요구사항: ${goal.requirements.map(r => r.description).join(', ')}

기술 스택:
- Frontend: ${techStack.frontend.map(t => t.name).join(', ')}
- Styling: ${this.determineStylingFramework(techStack)}

다음 기능들을 포함해야 합니다:
1. React Router 설정
2. 전역 상태 관리 (Context API 또는 Redux)
3. 테마 설정
4. 반응형 레이아웃
5. 에러 바운더리
6. 로딩 상태 관리
7. TypeScript 타입 정의

완전한 App 컴포넌트를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content || this.getDefaultReactApp();
    }

    /**
     * Vue 앱 컴포넌트 생성
     */
    private async generateVueApp(goal: Goal, techStack: TechStack): Promise<string> {
        const prompt = `
다음 요구사항에 맞는 Vue.js 앱 컴포넌트를 생성해주세요:

목표: ${goal.description}
카테고리: ${goal.category}
복잡도: ${goal.complexity}

기술 스택:
- Frontend: ${techStack.frontend.map(t => t.name).join(', ')}
- Styling: ${this.determineStylingFramework(techStack)}

다음 기능들을 포함해야 합니다:
1. Vue Router 설정
2. Pinia 또는 Vuex 상태 관리
3. 컴포지션 API 사용
4. TypeScript 지원
5. 반응형 레이아웃
6. 에러 핸들링

완전한 App.vue 컴포넌트를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content || this.getDefaultVueApp();
    }

    /**
     * Angular 앱 컴포넌트 생성
     */
    private async generateAngularApp(goal: Goal, techStack: TechStack): Promise<string> {
        const prompt = `
다음 요구사항에 맞는 Angular 앱 컴포넌트를 생성해주세요:

목표: ${goal.description}
카테고리: ${goal.category}
복잡도: ${goal.complexity}

기술 스택:
- Frontend: ${techStack.frontend.map(t => t.name).join(', ')}
- Styling: ${this.determineStylingFramework(techStack)}

다음 기능들을 포함해야 합니다:
1. Angular Router 설정
2. 서비스 및 의존성 주입
3. 반응형 폼
4. HTTP 클라이언트
5. 에러 핸들링
6. TypeScript 사용

완전한 Angular 앱 컴포넌트를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content || this.getDefaultAngularApp();
    }

    /**
     * 페이지 컴포넌트들 생성
     */
    private async generatePageComponents(goal: Goal, techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];
        const pages = this.determinePages(goal);

        for (const page of pages) {
            const content = await this.generatePageContent(page, goal, techStack);
            const filename = this.getPageFilename(page, techStack);

            files.push({
                id: this.generateId(),
                name: filename,
                path: `src/pages/${filename}`,
                content,
                language: this.getLanguageFromFilename(filename),
                size: content.length,
                complexity: this.calculateComplexity(content),
                quality: this.calculateQuality(content),
                lastModified: new Date()
            });
        }

        return files;
    }

    /**
     * 목표에 따른 페이지 결정
     */
    private determinePages(goal: Goal): Array<{ name: string; description: string; features: string[] }> {
        const pages = [];

        // 기본 페이지들
        pages.push({
            name: 'Home',
            description: '홈페이지',
            features: ['헤로 섹션', '기능 소개', 'CTA 버튼']
        });

        // 목표별 페이지 추가
        if (goal.requirements.some(r => r.description.includes('인증') || r.description.includes('로그인'))) {
            pages.push({
                name: 'Login',
                description: '로그인 페이지',
                features: ['로그인 폼', '소셜 로그인', '비밀번호 찾기']
            });
            pages.push({
                name: 'Register',
                description: '회원가입 페이지',
                features: ['회원가입 폼', '이메일 인증', '약관 동의']
            });
        }

        if (goal.requirements.some(r => r.description.includes('프로필') || r.description.includes('사용자'))) {
            pages.push({
                name: 'Profile',
                description: '사용자 프로필 페이지',
                features: ['프로필 정보', '설정', '활동 내역']
            });
        }

        if (goal.requirements.some(r => r.description.includes('게시물') || r.description.includes('포스트'))) {
            pages.push({
                name: 'Posts',
                description: '게시물 목록 페이지',
                features: ['게시물 목록', '검색', '필터링', '페이지네이션']
            });
            pages.push({
                name: 'PostDetail',
                description: '게시물 상세 페이지',
                features: ['게시물 내용', '댓글', '좋아요', '공유']
            });
            pages.push({
                name: 'CreatePost',
                description: '게시물 작성 페이지',
                features: ['에디터', '이미지 업로드', '미리보기', '저장']
            });
        }

        if (goal.requirements.some(r => r.description.includes('댓글') || r.description.includes('코멘트'))) {
            pages.push({
                name: 'Comments',
                description: '댓글 관리 페이지',
                features: ['댓글 목록', '댓글 수정', '댓글 삭제']
            });
        }

        return pages;
    }

    /**
     * 페이지 내용 생성
     */
    private async generatePageContent(
        page: { name: string; description: string; features: string[] },
        goal: Goal,
        techStack: TechStack
    ): Promise<string> {
        const isReact = techStack.frontend.some(tech => tech.name === 'React');
        const isVue = techStack.frontend.some(tech => tech.name === 'Vue.js');
        const isAngular = techStack.frontend.some(tech => tech.name === 'Angular');

        const prompt = `
다음 페이지 컴포넌트를 생성해주세요:

페이지 이름: ${page.name}
설명: ${page.description}
기능: ${page.features.join(', ')}

목표: ${goal.description}
기술 스택: ${techStack.frontend.map(t => t.name).join(', ')}

다음 기능들을 포함해야 합니다:
1. ${isReact ? 'React 함수형 컴포넌트' : isVue ? 'Vue 컴포넌트' : 'Angular 컴포넌트'}
2. TypeScript 타입 정의
3. 반응형 디자인
4. 접근성 고려
5. 에러 핸들링
6. 로딩 상태
7. ${isReact ? 'React Hooks' : isVue ? 'Composition API' : 'Angular Services'} 사용

완전한 페이지 컴포넌트를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1500
        });

        return response.choices[0].message.content || this.getDefaultPageComponent(page, techStack);
    }

    /**
     * 공통 컴포넌트들 생성
     */
    private async generateCommonComponents(goal: Goal, techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];
        const components = this.determineCommonComponents(goal);

        for (const component of components) {
            const content = await this.generateComponentContent(component, techStack);
            const filename = this.getComponentFilename(component, techStack);

            files.push({
                id: this.generateId(),
                name: filename,
                path: `src/components/${filename}`,
                content,
                language: this.getLanguageFromFilename(filename),
                size: content.length,
                complexity: this.calculateComplexity(content),
                quality: this.calculateQuality(content),
                lastModified: new Date()
            });
        }

        return files;
    }

    /**
     * 공통 컴포넌트 결정
     */
    private determineCommonComponents(goal: Goal): Array<{ name: string; description: string; props: string[] }> {
        const components = [];

        // 기본 컴포넌트들
        components.push({
            name: 'Button',
            description: '재사용 가능한 버튼 컴포넌트',
            props: ['variant', 'size', 'disabled', 'onClick', 'children']
        });

        components.push({
            name: 'Input',
            description: '입력 필드 컴포넌트',
            props: ['type', 'placeholder', 'value', 'onChange', 'error']
        });

        components.push({
            name: 'Modal',
            description: '모달 다이얼로그 컴포넌트',
            props: ['isOpen', 'onClose', 'title', 'children']
        });

        components.push({
            name: 'Loading',
            description: '로딩 스피너 컴포넌트',
            props: ['size', 'color', 'text']
        });

        components.push({
            name: 'Alert',
            description: '알림 메시지 컴포넌트',
            props: ['type', 'message', 'onClose']
        });

        // 목표별 컴포넌트 추가
        if (goal.requirements.some(r => r.description.includes('인증'))) {
            components.push({
                name: 'LoginForm',
                description: '로그인 폼 컴포넌트',
                props: ['onSubmit', 'loading', 'error']
            });
        }

        if (goal.requirements.some(r => r.description.includes('게시물'))) {
            components.push({
                name: 'PostCard',
                description: '게시물 카드 컴포넌트',
                props: ['post', 'onEdit', 'onDelete', 'onLike']
            });
        }

        return components;
    }

    /**
     * 컴포넌트 내용 생성
     */
    private async generateComponentContent(
        component: { name: string; description: string; props: string[] },
        techStack: TechStack
    ): Promise<string> {
        const isReact = techStack.frontend.some(tech => tech.name === 'React');
        const isVue = techStack.frontend.some(tech => tech.name === 'Vue.js');
        const isAngular = techStack.frontend.some(tech => tech.name === 'Angular');

        const prompt = `
다음 컴포넌트를 생성해주세요:

컴포넌트 이름: ${component.name}
설명: ${component.description}
Props: ${component.props.join(', ')}

기술 스택: ${techStack.frontend.map(t => t.name).join(', ')}

다음 기능들을 포함해야 합니다:
1. ${isReact ? 'React 함수형 컴포넌트' : isVue ? 'Vue 컴포넌트' : 'Angular 컴포넌트'}
2. TypeScript 타입 정의
3. Props 인터페이스
4. 반응형 디자인
5. 접근성 고려
6. 에러 핸들링
7. 스타일링

완전한 컴포넌트를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1000
        });

        return response.choices[0].message.content || this.getDefaultComponent(component, techStack);
    }

    /**
     * 레이아웃 컴포넌트들 생성
     */
    private async generateLayoutComponents(techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];

        // 헤더 컴포넌트
        const headerContent = await this.generateHeaderComponent(techStack);
        files.push({
            id: this.generateId(),
            name: this.getComponentFilename({ name: 'Header', description: '', props: [] }, techStack),
            path: `src/layouts/Header.${this.getFileExtension(techStack)}`,
            content: headerContent,
            language: this.getLanguageFromFilename(this.getComponentFilename({ name: 'Header', description: '', props: [] }, techStack)),
            size: headerContent.length,
            complexity: this.calculateComplexity(headerContent),
            quality: this.calculateQuality(headerContent),
            lastModified: new Date()
        });

        // 푸터 컴포넌트
        const footerContent = await this.generateFooterComponent(techStack);
        files.push({
            id: this.generateId(),
            name: this.getComponentFilename({ name: 'Footer', description: '', props: [] }, techStack),
            path: `src/layouts/Footer.${this.getFileExtension(techStack)}`,
            content: footerContent,
            language: this.getLanguageFromFilename(this.getComponentFilename({ name: 'Footer', description: '', props: [] }, techStack)),
            size: footerContent.length,
            complexity: this.calculateComplexity(footerContent),
            quality: this.calculateQuality(footerContent),
            lastModified: new Date()
        });

        // 사이드바 컴포넌트
        const sidebarContent = await this.generateSidebarComponent(techStack);
        files.push({
            id: this.generateId(),
            name: this.getComponentFilename({ name: 'Sidebar', description: '', props: [] }, techStack),
            path: `src/layouts/Sidebar.${this.getFileExtension(techStack)}`,
            content: sidebarContent,
            language: this.getLanguageFromFilename(this.getComponentFilename({ name: 'Sidebar', description: '', props: [] }, techStack)),
            size: sidebarContent.length,
            complexity: this.calculateComplexity(sidebarContent),
            quality: this.calculateQuality(sidebarContent),
            lastModified: new Date()
        });

        return files;
    }

    /**
     * 훅 파일들 생성
     */
    private async generateHookFiles(goal: Goal, techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];
        const isReact = techStack.frontend.some(tech => tech.name === 'React');

        if (!isReact) return files; // React가 아니면 훅 생성 안함

        const hooks = [
            { name: 'useAuth', description: '인증 관련 훅' },
            { name: 'useApi', description: 'API 호출 훅' },
            { name: 'useLocalStorage', description: '로컬 스토리지 훅' },
            { name: 'useDebounce', description: '디바운스 훅' }
        ];

        for (const hook of hooks) {
            const content = await this.generateHookContent(hook, techStack);
            files.push({
                id: this.generateId(),
                name: `${hook.name}.ts`,
                path: `src/hooks/${hook.name}.ts`,
                content,
                language: 'typescript',
                size: content.length,
                complexity: this.calculateComplexity(content),
                quality: this.calculateQuality(content),
                lastModified: new Date()
            });
        }

        return files;
    }

    /**
     * 스타일 파일들 생성
     */
    private async generateStyleFiles(techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];
        const stylingFramework = this.determineStylingFramework(techStack);

        if (stylingFramework === 'Tailwind CSS') {
            // Tailwind 설정 파일
            const tailwindConfig = this.generateTailwindConfig();
            files.push({
                id: this.generateId(),
                name: 'tailwind.config.js',
                path: 'tailwind.config.js',
                content: tailwindConfig,
                language: 'javascript',
                size: tailwindConfig.length,
                complexity: this.calculateComplexity(tailwindConfig),
                quality: this.calculateQuality(tailwindConfig),
                lastModified: new Date()
            });

            // PostCSS 설정
            const postcssConfig = this.generatePostCSSConfig();
            files.push({
                id: this.generateId(),
                name: 'postcss.config.js',
                path: 'postcss.config.js',
                content: postcssConfig,
                language: 'javascript',
                size: postcssConfig.length,
                complexity: this.calculateComplexity(postcssConfig),
                quality: this.calculateQuality(postcssConfig),
                lastModified: new Date()
            });
        } else if (stylingFramework === 'Styled Components') {
            // Styled Components 설정
            const styledConfig = this.generateStyledComponentsConfig();
            files.push({
                id: this.generateId(),
                name: 'styled.config.js',
                path: 'styled.config.js',
                content: styledConfig,
                language: 'javascript',
                size: styledConfig.length,
                complexity: this.calculateComplexity(styledConfig),
                quality: this.calculateQuality(styledConfig),
                lastModified: new Date()
            });
        }

        // 글로벌 스타일
        const globalStyles = this.generateGlobalStyles(stylingFramework);
        files.push({
            id: this.generateId(),
            name: 'globals.css',
            path: 'src/styles/globals.css',
            content: globalStyles,
            language: 'css',
            size: globalStyles.length,
            complexity: this.calculateComplexity(globalStyles),
            quality: this.calculateQuality(globalStyles),
            lastModified: new Date()
        });

        return files;
    }

    /**
     * 설정 파일들 생성
     */
    private async generateConfigFiles(techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];
        const isReact = techStack.frontend.some(tech => tech.name === 'React');
        const isVue = techStack.frontend.some(tech => tech.name === 'Vue.js');
        const isAngular = techStack.frontend.some(tech => tech.name === 'Angular');

        if (isReact) {
            // React Router 설정
            const routerConfig = this.generateReactRouterConfig();
            files.push({
                id: this.generateId(),
                name: 'router.tsx',
                path: 'src/router.tsx',
                content: routerConfig,
                language: 'typescript',
                size: routerConfig.length,
                complexity: this.calculateComplexity(routerConfig),
                quality: this.calculateQuality(routerConfig),
                lastModified: new Date()
            });

            // Redux 설정
            const reduxConfig = this.generateReduxConfig();
            files.push({
                id: this.generateId(),
                name: 'store.ts',
                path: 'src/store/store.ts',
                content: reduxConfig,
                language: 'typescript',
                size: reduxConfig.length,
                complexity: this.calculateComplexity(reduxConfig),
                quality: this.calculateQuality(reduxConfig),
                lastModified: new Date()
            });
        } else if (isVue) {
            // Vue Router 설정
            const routerConfig = this.generateVueRouterConfig();
            files.push({
                id: this.generateId(),
                name: 'router.ts',
                path: 'src/router/index.ts',
                content: routerConfig,
                language: 'typescript',
                size: routerConfig.length,
                complexity: this.calculateComplexity(routerConfig),
                quality: this.calculateQuality(routerConfig),
                lastModified: new Date()
            });
        }

        return files;
    }

    // 헬퍼 메서드들
    private determineStylingFramework(techStack: TechStack): string {
        // 기술 스택에서 스타일링 프레임워크 추론
        if (techStack.frontend.some(tech => tech.name.includes('Tailwind'))) {
            return 'Tailwind CSS';
        } else if (techStack.frontend.some(tech => tech.name.includes('Styled'))) {
            return 'Styled Components';
        } else if (techStack.frontend.some(tech => tech.name.includes('Chakra'))) {
            return 'Chakra UI';
        } else if (techStack.frontend.some(tech => tech.name.includes('Material'))) {
            return 'Material-UI';
        } else {
            return 'CSS Modules';
        }
    }

    private getPageFilename(page: { name: string; description: string; features: string[] }, techStack: TechStack): string {
        const isReact = techStack.frontend.some(tech => tech.name === 'React');
        const isVue = techStack.frontend.some(tech => tech.name === 'Vue.js');
        const isAngular = techStack.frontend.some(tech => tech.name === 'Angular');

        if (isReact) {
            return `${page.name}.tsx`;
        } else if (isVue) {
            return `${page.name}.vue`;
        } else if (isAngular) {
            return `${page.name.toLowerCase()}.component.ts`;
        } else {
            return `${page.name}.tsx`;
        }
    }

    private getComponentFilename(component: { name: string; description: string; props: string[] }, techStack: TechStack): string {
        const isReact = techStack.frontend.some(tech => tech.name === 'React');
        const isVue = techStack.frontend.some(tech => tech.name === 'Vue.js');
        const isAngular = techStack.frontend.some(tech => tech.name === 'Angular');

        if (isReact) {
            return `${component.name}.tsx`;
        } else if (isVue) {
            return `${component.name}.vue`;
        } else if (isAngular) {
            return `${component.name.toLowerCase()}.component.ts`;
        } else {
            return `${component.name}.tsx`;
        }
    }

    private getFileExtension(techStack: TechStack): string {
        const isReact = techStack.frontend.some(tech => tech.name === 'React');
        const isVue = techStack.frontend.some(tech => tech.name === 'Vue.js');
        const isAngular = techStack.frontend.some(tech => tech.name === 'Angular');

        if (isReact) {
            return 'tsx';
        } else if (isVue) {
            return 'vue';
        } else if (isAngular) {
            return 'ts';
        } else {
            return 'tsx';
        }
    }

    private getLanguageFromFilename(filename: string): string {
        if (filename.endsWith('.tsx') || filename.endsWith('.ts')) {
            return 'typescript';
        } else if (filename.endsWith('.vue')) {
            return 'vue';
        } else if (filename.endsWith('.jsx') || filename.endsWith('.js')) {
            return 'javascript';
        } else if (filename.endsWith('.css')) {
            return 'css';
        } else {
            return 'typescript';
        }
    }

    // 기본 구현 메서드들
    private getDefaultReactApp(): string {
        return `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Header from './layouts/Header';
import Footer from './layouts/Footer';
import Home from './pages/Home';
import './styles/globals.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
`;
    }

    private getDefaultVueApp(): string {
        return `<template>
  <div id="app">
    <Header />
    <main>
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Header from './layouts/Header.vue';
import Footer from './layouts/Footer.vue';

const router = useRouter();

onMounted(() => {
  console.log('App mounted');
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
`;
    }

    private getDefaultAngularApp(): string {
        return `import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  constructor(private router: Router) {}

  ngOnInit() {
    console.log('App initialized');
  }
}
`;
    }

    private getDefaultPageComponent(page: { name: string; description: string; features: string[] }, techStack: TechStack): string {
        const isReact = techStack.frontend.some(tech => tech.name === 'React');
        const isVue = techStack.frontend.some(tech => tech.name === 'Vue.js');
        const isAngular = techStack.frontend.some(tech => tech.name === 'Angular');

        if (isReact) {
            return `import React from 'react';

interface ${page.name}Props {}

const ${page.name}: React.FC<${page.name}Props> = () => {
  return (
    <div className="${page.name.toLowerCase()}">
      <h1>${page.name}</h1>
      <p>${page.description}</p>
    </div>
  );
};

export default ${page.name};
`;
        } else if (isVue) {
            return `<template>
  <div class="${page.name.toLowerCase()}">
    <h1>${page.name}</h1>
    <p>${page.description}</p>
  </div>
</template>

<script setup lang="ts">
// ${page.name} 컴포넌트
</script>

<style scoped>
.${page.name.toLowerCase()} {
  padding: 2rem;
}
</style>
`;
        } else {
            return `import { Component } from '@angular/core';

@Component({
  selector: 'app-${page.name.toLowerCase()}',
  templateUrl: './${page.name.toLowerCase()}.component.html',
  styleUrls: ['./${page.name.toLowerCase()}.component.css']
})
export class ${page.name}Component {
  constructor() {}
}
`;
        }
    }

    private getDefaultComponent(component: { name: string; description: string; props: string[] }, techStack: TechStack): string {
        const isReact = techStack.frontend.some(tech => tech.name === 'React');
        const isVue = techStack.frontend.some(tech => tech.name === 'Vue.js');
        const isAngular = techStack.frontend.some(tech => tech.name === 'Angular');

        if (isReact) {
            return `import React from 'react';

interface ${component.name}Props {
  // TODO: Props 타입 정의
}

const ${component.name}: React.FC<${component.name}Props> = (props) => {
  return (
    <div className="${component.name.toLowerCase()}">
      {/* ${component.description} */}
    </div>
  );
};

export default ${component.name};
`;
        } else if (isVue) {
            return `<template>
  <div class="${component.name.toLowerCase()}">
    <!-- ${component.description} -->
  </div>
</template>

<script setup lang="ts">
interface Props {
  // TODO: Props 타입 정의
}

const props = defineProps<Props>();
</script>

<style scoped>
.${component.name.toLowerCase()} {
  /* 스타일 정의 */
}
</style>
`;
        } else {
            return `import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-${component.name.toLowerCase()}',
  templateUrl: './${component.name.toLowerCase()}.component.html',
  styleUrls: ['./${component.name.toLowerCase()}.component.css']
})
export class ${component.name}Component {
  @Input() // TODO: Input 속성 정의
}
`;
        }
    }

    // 추가 구현 메서드들...
    private async generateHeaderComponent(techStack: TechStack): Promise<string> {
        return `import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold">
              Logo
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-gray-900">
              Home
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
`;
    }

    private async generateFooterComponent(techStack: TechStack): Promise<string> {
        return `import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p>&copy; 2024 Your Company. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
`;
    }

    private async generateSidebarComponent(techStack: TechStack): Promise<string> {
        return `import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-gray-100 min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <Link to="/" className="block px-4 py-2 text-gray-700 hover:bg-gray-200 rounded">
              Home
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
`;
    }

    private async generateHookContent(hook: { name: string; description: string }, techStack: TechStack): Promise<string> {
        return `import { useState, useEffect } from 'react';

// ${hook.description}
export const ${hook.name} = () => {
  // TODO: 훅 구현
  return {};
};
`;
    }

    private generateTailwindConfig(): string {
        return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;
    }

    private generatePostCSSConfig(): string {
        return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;
    }

    private generateStyledComponentsConfig(): string {
        return `module.exports = {
  // Styled Components 설정
};
`;
    }

    private generateGlobalStyles(framework: string): string {
        return `/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
`;
    }

    private generateReactRouterConfig(): string {
        return `import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './pages/Home';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
]);

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
`;
    }

    private generateReduxConfig(): string {
        return `import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

export const store = configureStore({
  reducer: {
    // TODO: 리듀서 추가
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
`;
    }

    private generateVueRouterConfig(): string {
        return `import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/Home.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
`;
    }

    /**
     * 파일들을 디스크에 쓰기
     */
    private async writeFilesToDisk(files: CodeFile[], projectStructure: any): Promise<void> {
        for (const file of files) {
            const filePath = path.join(this.outputDir, projectStructure.name, file.path);
            const dirPath = path.dirname(filePath);

            // 디렉토리 생성
            await fs.mkdir(dirPath, { recursive: true });

            // 파일 쓰기
            await fs.writeFile(filePath, file.content, 'utf-8');
        }
    }

    /**
     * 코드 복잡도 계산
     */
    private calculateComplexity(content: string): number {
        const lines = content.split('\n').length;
        const functions = (content.match(/function|=>/g) || []).length;
        const conditions = (content.match(/if|else|switch|case/g) || []).length;
        const loops = (content.match(/for|while|do/g) || []).length;

        return Math.min(10, Math.max(1, (lines / 50) + (functions / 10) + (conditions / 5) + (loops / 3)));
    }

    /**
     * 코드 품질 계산
     */
    private calculateQuality(content: string): number {
        let score = 5; // 기본 점수

        // TypeScript 타입 정의 확인
        if (content.includes('interface') || content.includes('type ')) score += 1;

        // 에러 핸들링 확인
        if (content.includes('try') && content.includes('catch')) score += 1;

        // 접근성 확인
        if (content.includes('aria-') || content.includes('role=')) score += 1;

        // 반응형 디자인 확인
        if (content.includes('sm:') || content.includes('md:') || content.includes('lg:')) score += 1;

        // 컴포넌트 분리 확인
        if (content.includes('export') && content.includes('import')) score += 1;

        return Math.min(10, Math.max(1, score));
    }

    /**
     * 고유 ID 생성
     */
    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}
