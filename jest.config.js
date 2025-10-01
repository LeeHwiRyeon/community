module.exports = {
  // 테스트 환경
  testEnvironment: 'node',

  // 테스트 파일 패턴
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // 커버리지 설정
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],

  // 커버리지 임계값
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },

  // 커버리지에서 제외할 파일
  collectCoverageFrom: [
    'server-backend/**/*.js',
    '!server-backend/**/*.test.js',
    '!server-backend/**/*.spec.js',
    '!server-backend/node_modules/**',
    '!server-backend/coverage/**',
    '!server-backend/config/**',
    '!server-backend/migrations/**',
    '!server-backend/seeds/**'
  ],

  // 테스트 설정
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // 모듈 매핑
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/server-backend/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },

  // 변환 설정
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // 테스트 타임아웃
  testTimeout: 10000,

  // 병렬 테스트
  maxWorkers: '50%',

  // 상세 출력
  verbose: true,

  // 클리어 모크
  clearMocks: true,

  // 복원 모크
  restoreMocks: true
};