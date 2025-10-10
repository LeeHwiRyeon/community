#!/usr/bin/env node

/**
 * Community Platform v1.3 - 페이지 제작 로직 자동 생성 도구
 * @created 2024-10-06
 * @version 1.3.0
 */

const fs = require('fs');
const path = require('path');

class PageGenerator {
    constructor() {
        this.projectRoot = process.cwd();
        this.srcPath = path.join(this.projectRoot, 'frontend', 'src');
        this.pagesPath = path.join(this.srcPath, 'pages');
        this.componentsPath = path.join(this.srcPath, 'components');
        this.servicesPath = path.join(this.srcPath, 'services');
        this.testsPath = path.join(this.projectRoot, 'frontend', 'tests');
    }

    /**
     * 페이지 생성
     */
    generatePage(pageConfig) {
        const { name, path: pagePath, title, description, components, apiEndpoints, features } = pageConfig;

        // 페이지 디렉토리 생성
        const pageDir = path.join(this.pagesPath, name);
        if (!fs.existsSync(pageDir)) {
            fs.mkdirSync(pageDir, { recursive: true });
        }

        // 페이지 컴포넌트 생성
        const pageContent = this.generatePageComponent(pageConfig);
        fs.writeFileSync(path.join(pageDir, `${name}.tsx`), pageContent);

        // 페이지별 컴포넌트들 생성
        components.forEach(component => {
            this.generateSubComponent(name, component);
        });

        // API 서비스 생성
        this.generateService(name, apiEndpoints);

        // 테스트 파일 생성
        this.generateTests(name, pageConfig);

        // 인덱스 파일 생성
        this.generateIndexFile(pageDir, name, components);

        console.log(`✅ ${name} 페이지가 생성되었습니다: ${pageDir}`);
    }

    /**
     * 페이지 컴포넌트 생성
     */
    generatePageComponent(config) {
        const { name, title, description, components, features } = config;

        return `import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link
} from '@mui/material';
import { ${components.map(c => c.name).join(', ')} } from './components';
import { ${name}Service } from '@/services/${name.toLowerCase()}Service';
import { PageLayout } from '@/components/common';

interface ${name}PageProps {
  // 페이지별 props 정의
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const ${name}Page: React.FC<${name}PageProps> = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  
  const navigate = useNavigate();
  const params = useParams();

  // 브레드크럼 설정
  const breadcrumbs: BreadcrumbItem[] = [
    { label: '홈', href: '/' },
    { label: '${title}', href: '/${name.toLowerCase()}' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ${name}Service.getData();
      setData(result);
    } catch (err: any) {
      setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  if (loading) {
    return (
      <PageLayout title="${title}" description="${description}">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="${title}" description="${description}">
        <Alert severity="error" action={
          <button onClick={handleRefresh}>다시 시도</button>
        }>
          {error}
        </Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="${title}" 
      description="${description}"
      breadcrumbs={breadcrumbs}
    >
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            ${title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            ${description}
          </Typography>
        </Box>

        {/* 페이지별 컨텐츠 */}
        ${components.map(comp => `
        <${comp.name} 
          data={data?.${comp.dataKey || 'items'}}
          onAction={handleAction}
          loading={loading}
        />`).join('\n        ')}

        ${features.includes('search') ? `
        {/* 검색 기능 */}
        <Box sx={{ mt: 4 }}>
          <SearchBar 
            onSearch={handleSearch}
            placeholder="${title} 검색..."
          />
        </Box>` : ''}

        ${features.includes('pagination') ? `
        {/* 페이지네이션 */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Pagination 
            count={data?.totalPages || 1}
            page={data?.currentPage || 1}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>` : ''}
      </Container>
    </PageLayout>
  );
};

export default ${name}Page;`;
    }

    /**
     * 서브 컴포넌트 생성
     */
    generateSubComponent(pageName, component) {
        const { name, type, props, features } = component;
        const componentDir = path.join(this.pagesPath, pageName, 'components');

        if (!fs.existsSync(componentDir)) {
            fs.mkdirSync(componentDir, { recursive: true });
        }

        const componentContent = `import React from 'react';
import { ${type} } from '@mui/material';
import './${name}.css';

interface ${name}Props {
  data?: any[];
  onAction?: (action: string, item: any) => void;
  loading?: boolean;
  ${props.map(prop => `${prop.name}: ${prop.type};`).join('\n  ')}
}

const ${name}: React.FC<${name}Props> = ({
  data = [],
  onAction,
  loading = false,
  ${props.map(prop => prop.name).join(',\n  ')}
}) => {
  const handleAction = (action: string, item: any) => {
    onAction?.(action, item);
  };

  if (loading) {
    return (
      <${type} className="${name.toLowerCase()}">
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      </${type}>
    );
  }

  return (
    <${type} className="${name.toLowerCase()}">
      <Typography variant="h6" gutterBottom>
        ${name}
      </Typography>
      
      {data.length === 0 ? (
        <Box p={3} textAlign="center">
          <Typography color="text.secondary">
            데이터가 없습니다.
          </Typography>
        </Box>
      ) : (
        <Box>
          {data.map((item, index) => (
            <Box key={item.id || index} sx={{ mb: 2 }}>
              {/* 아이템 렌더링 */}
              <Typography variant="body1">
                {item.title || item.name || \`Item \${index + 1}\`}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </${type}>
  );
};

export default ${name};`;

        fs.writeFileSync(path.join(componentDir, `${name}.tsx`), componentContent);

        // CSS 파일 생성
        const cssContent = `.${name.toLowerCase()} {
  /* 컴포넌트 스타일 */
}`;
        fs.writeFileSync(path.join(componentDir, `${name}.css`), cssContent);
    }

    /**
     * API 서비스 생성
     */
    generateService(serviceName, endpoints) {
        const serviceDir = path.join(this.servicesPath);
        if (!fs.existsSync(serviceDir)) {
            fs.mkdirSync(serviceDir, { recursive: true });
        }

        const serviceContent = `import { apiClient } from '@/utils/apiClient';

export class ${serviceName}Service {
  private baseURL = '/api/${serviceName.toLowerCase()}';
  
  ${endpoints.map(endpoint => `
  async ${endpoint.name}(${endpoint.params}): Promise<${endpoint.returnType}> {
    try {
      const response = await apiClient.${endpoint.method}(\`\${this.baseURL}${endpoint.path}\`);
      return response.data;
    } catch (error) {
      console.error('${endpoint.name} API Error:', error);
      throw error;
    }
  }`).join('')}
  
  // 공통 메서드
  async getData(params?: any): Promise<any> {
    return this.getList(params);
  }
  
  async getById(id: string): Promise<any> {
    return this.getDetail(id);
  }
  
  async create(data: any): Promise<any> {
    return this.createItem(data);
  }
  
  async update(id: string, data: any): Promise<any> {
    return this.updateItem(id, data);
  }
  
  async delete(id: string): Promise<any> {
    return this.deleteItem(id);
  }
}

export const ${serviceName.toLowerCase()}Service = new ${serviceName}Service();`;

        fs.writeFileSync(path.join(serviceDir, `${serviceName.toLowerCase()}Service.ts`), serviceContent);
    }

    /**
     * 테스트 파일 생성
     */
    generateTests(pageName, config) {
        const testDir = path.join(this.testsPath, 'pages');
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        const testContent = `import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ${pageName}Page from '@/pages/${pageName}/${pageName}Page';

// Mock API 서비스
jest.mock('@/services/${pageName.toLowerCase()}Service', () => ({
  ${pageName}Service: {
    getData: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('${pageName}Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders page title correctly', () => {
    renderWithProviders(<${pageName}Page />);
    
    expect(screen.getByText('${config.title}')).toBeInTheDocument();
  });
  
  it('displays loading state initially', () => {
    renderWithProviders(<${pageName}Page />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  it('handles error state correctly', async () => {
    const mockError = new Error('Test error');
    require('@/services/${pageName.toLowerCase()}Service').${pageName}Service.getData.mockRejectedValue(mockError);
    
    renderWithProviders(<${pageName}Page />);
    
    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });
  
  it('renders data correctly when loaded', async () => {
    const mockData = {
      items: [
        { id: '1', title: 'Test Item 1' },
        { id: '2', title: 'Test Item 2' }
      ],
      totalPages: 1,
      currentPage: 1
    };
    
    require('@/services/${pageName.toLowerCase()}Service').${pageName}Service.getData.mockResolvedValue(mockData);
    
    renderWithProviders(<${pageName}Page />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    });
  });
  
  ${config.components.map(component => `
  it('renders ${component.name} component', async () => {
    const mockData = { items: [] };
    require('@/services/${pageName.toLowerCase()}Service').${pageName}Service.getData.mockResolvedValue(mockData);
    
    renderWithProviders(<${pageName}Page />);
    
    await waitFor(() => {
      expect(screen.getByText('${component.name}')).toBeInTheDocument();
    });
  });`).join('')}
});`;

        fs.writeFileSync(path.join(testDir, `${pageName}Page.test.tsx`), testContent);
    }

    /**
     * 인덱스 파일 생성
     */
    generateIndexFile(pageDir, pageName, components) {
        const indexContent = `export { default as ${pageName}Page } from './${pageName}';
${components.map(comp => `export { default as ${comp.name} } from './components/${comp.name}';`).join('\n')}`;

        fs.writeFileSync(path.join(pageDir, 'index.ts'), indexContent);
    }

    /**
     * 라우팅 설정 업데이트
     */
    updateRouting(pageConfigs) {
        const appPath = path.join(this.srcPath, 'App.tsx');

        if (!fs.existsSync(appPath)) {
            console.log('App.tsx 파일을 찾을 수 없습니다.');
            return;
        }

        let appContent = fs.readFileSync(appPath, 'utf8');

        // 새로운 라우트 추가
        const newRoutes = pageConfigs.map(config =>
            `        <Route path="/${config.path}" element={<${config.name}Page />} />`
        ).join('\n');

        // 라우트 섹션 찾아서 업데이트
        const routePattern = /(<Routes>[\s\S]*?<\/Routes>)/;
        const match = appContent.match(routePattern);

        if (match) {
            const updatedRoutes = match[1].replace(
                /<\/Routes>/,
                `\n${newRoutes}\n      </Routes>`
            );
            appContent = appContent.replace(routePattern, updatedRoutes);
        }

        fs.writeFileSync(appPath, appContent);
        console.log('✅ 라우팅 설정이 업데이트되었습니다.');
    }
}

// CLI 실행
if (require.main === module) {
    const generator = new PageGenerator();

    // 예시 페이지 설정
    const pageConfigs = [
        {
            name: 'NewsPage',
            path: 'news',
            title: '뉴스',
            description: '최신 뉴스와 정보를 확인하세요',
            components: [
                { name: 'NewsList', type: 'Box', props: [], dataKey: 'news' },
                { name: 'NewsFilters', type: 'Box', props: [], dataKey: 'filters' }
            ],
            apiEndpoints: [
                { name: 'getList', method: 'get', path: '/list', params: 'params?: any', returnType: 'any[]' },
                { name: 'getDetail', method: 'get', path: '/:id', params: 'id: string', returnType: 'any' },
                { name: 'createItem', method: 'post', path: '/create', params: 'data: any', returnType: 'any' },
                { name: 'updateItem', method: 'put', path: '/:id', params: 'id: string, data: any', returnType: 'any' },
                { name: 'deleteItem', method: 'delete', path: '/:id', params: 'id: string', returnType: 'any' }
            ],
            features: ['search', 'pagination', 'filter']
        },
        {
            name: 'GamePage',
            path: 'games',
            title: '게임 커뮤니티',
            description: '게임 정보와 커뮤니티를 만나보세요',
            components: [
                { name: 'GameList', type: 'Box', props: [], dataKey: 'games' },
                { name: 'GameBoard', type: 'Box', props: [], dataKey: 'boards' }
            ],
            apiEndpoints: [
                { name: 'getList', method: 'get', path: '/list', params: 'params?: any', returnType: 'any[]' },
                { name: 'getDetail', method: 'get', path: '/:id', params: 'id: string', returnType: 'any' }
            ],
            features: ['search', 'pagination']
        }
    ];

    // 페이지들 생성
    pageConfigs.forEach(config => {
        generator.generatePage(config);
    });

    // 라우팅 업데이트
    generator.updateRouting(pageConfigs);

    console.log('🎉 모든 페이지가 성공적으로 생성되었습니다!');
}

module.exports = PageGenerator;
