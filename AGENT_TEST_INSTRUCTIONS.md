# Agent Test-Driven Development Instructions

## Core Principle
**Only submit code that passes all tests and complies with specifications. Notify user only when next task is ready for execution.**

## Workflow Rules

### 1. Pre-Development Phase
- [ ] Analyze requirements and create test cases first
- [ ] Write failing tests that define expected behavior
- [ ] Ensure test coverage meets 90%+ threshold
- [ ] Verify all tests fail initially (Red phase)

### 2. Development Phase
- [ ] Write minimal code to make tests pass
- [ ] Refactor code while keeping tests green
- [ ] Add edge cases and error handling tests
- [ ] Ensure all existing tests continue to pass

### 3. Pre-Submission Phase
- [ ] Run full test suite locally
- [ ] Verify code coverage requirements
- [ ] Check linting and formatting
- [ ] Validate security and accessibility tests
- [ ] Ensure performance benchmarks are met

### 4. Submission Rules
- [ ] **NEVER** submit code that fails tests
- [ ] **NEVER** submit code with linting errors
- [ ] **NEVER** submit code below coverage threshold
- [ ] **ALWAYS** include test files with implementation
- [ ] **ALWAYS** document test scenarios

## Component Testing Requirements

### React Components
```typescript
// Required test structure for every component
describe('ComponentName', () => {
  // Props testing
  describe('Props', () => {
    it('should render with required props', () => {});
    it('should handle optional props correctly', () => {});
    it('should validate prop types', () => {});
  });

  // State testing
  describe('State Management', () => {
    it('should initialize with correct default state', () => {});
    it('should update state on user interaction', () => {});
    it('should handle state transitions', () => {});
  });

  // User interaction testing
  describe('User Interactions', () => {
    it('should handle click events', () => {});
    it('should handle form submissions', () => {});
    it('should handle keyboard navigation', () => {});
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('should handle empty data', () => {});
    it('should handle error states', () => {});
    it('should handle loading states', () => {});
  });
});
```

### API Services
```typescript
// Required test structure for every API service
describe('ApiService', () => {
  // Success cases
  describe('Success Cases', () => {
    it('should fetch data successfully', async () => {});
    it('should handle pagination', async () => {});
    it('should handle filtering', async () => {});
  });

  // Error handling
  describe('Error Handling', () => {
    it('should handle network errors', async () => {});
    it('should handle server errors', async () => {});
    it('should handle timeout errors', async () => {});
  });

  // Data validation
  describe('Data Validation', () => {
    it('should validate response structure', async () => {});
    it('should handle malformed data', async () => {});
    it('should sanitize input data', async () => {});
  });
});
```

### Custom Hooks
```typescript
// Required test structure for every custom hook
describe('useCustomHook', () => {
  // Hook behavior
  describe('Hook Behavior', () => {
    it('should return initial values', () => {});
    it('should update values on dependency change', () => {});
    it('should cleanup on unmount', () => {});
  });

  // Side effects
  describe('Side Effects', () => {
    it('should trigger effects on mount', () => {});
    it('should trigger effects on dependency change', () => {});
    it('should cleanup effects on unmount', () => {});
  });
});
```

## Test Data Management

### Mock Data Rules
- Use consistent mock data across all tests
- Create reusable mock factories
- Keep mock data realistic and current
- Separate mock data from test logic

### Test Database
- Use in-memory database for all tests
- Reset database state between tests
- Use transactions for test isolation
- Never use production data in tests

## Performance Testing Requirements

### Frontend Performance
- [ ] Test component render times < 100ms
- [ ] Verify lazy loading functionality
- [ ] Test memory leak prevention
- [ ] Measure bundle size impact

### Backend Performance
- [ ] Test API response times < 500ms
- [ ] Verify database query optimization
- [ ] Test concurrent request handling
- [ ] Monitor memory usage patterns

## Security Testing Requirements

### Input Validation
- [ ] Test SQL injection prevention
- [ ] Verify XSS protection
- [ ] Test CSRF protection
- [ ] Validate file upload security

### Authentication
- [ ] Test login/logout flows
- [ ] Verify token handling
- [ ] Test session management
- [ ] Check authorization rules

## Accessibility Testing Requirements

### WCAG Compliance
- [ ] Test keyboard navigation
- [ ] Verify screen reader compatibility
- [ ] Check color contrast ratios
- [ ] Test focus management

### Automated Testing
- [ ] Use axe-core for automated testing
- [ ] Test with different assistive technologies
- [ ] Verify ARIA attributes
- [ ] Test responsive design

## Code Quality Standards

### Test Code Quality
- [ ] Follow same coding standards as production code
- [ ] Use TypeScript for type safety
- [ ] Write self-documenting tests
- [ ] Keep tests simple and focused

### Test Documentation
- [ ] Document complex test scenarios
- [ ] Explain test data setup
- [ ] Document test environment requirements
- [ ] Maintain test runbooks

## Error Handling in Tests

### Test Failures
- [ ] Provide clear error messages
- [ ] Include stack traces
- [ ] Show expected vs actual values
- [ ] Suggest fixes when possible

### Flaky Tests
- [ ] Identify and fix flaky tests immediately
- [ ] Use retry mechanisms sparingly
- [ ] Document known issues
- [ ] Monitor test stability

## Continuous Integration

### Pre-commit Hooks
- [ ] Run unit tests before commit
- [ ] Check code coverage thresholds
- [ ] Validate linting rules
- [ ] Run security scans

### CI/CD Pipeline
- [ ] Run full test suite on pull requests
- [ ] Generate test coverage reports
- [ ] Run performance benchmarks
- [ ] Deploy only if all tests pass

## Monitoring and Reporting

### Test Metrics
- [ ] Track test execution time
- [ ] Monitor test coverage trends
- [ ] Report test failure rates
- [ ] Track flaky test identification

### Test Reports
- [ ] Generate HTML test reports
- [ ] Include screenshots for E2E tests
- [ ] Document test environment details
- [ ] Provide test result summaries

## Emergency Procedures

### Test Environment Issues
- [ ] Have backup test environments
- [ ] Document recovery procedures
- [ ] Maintain test data backups
- [ ] Have rollback plans

### Critical Test Failures
- [ ] Block deployments on critical failures
- [ ] Escalate to development team
- [ ] Document incident reports
- [ ] Implement preventive measures

## Tools and Technologies

### Frontend Testing Stack
- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **Visual Tests**: Chromatic
- **Performance**: Lighthouse CI

### Backend Testing Stack
- **Unit Tests**: Jest
- **Integration Tests**: Supertest
- **Load Tests**: Artillery
- **Security Tests**: OWASP ZAP

### Test Management Tools
- **Test Runner**: Vitest (Frontend), Jest (Backend)
- **Coverage**: c8, Istanbul
- **Mocking**: MSW, Sinon
- **CI/CD**: GitHub Actions

## Compliance Standards

### Industry Standards
- [ ] Follow ISTQB testing standards
- [ ] Implement OWASP security guidelines
- [ ] Adhere to WCAG accessibility standards
- [ ] Use ISO 25010 quality model

### Internal Standards
- [ ] Maintain 90%+ code coverage
- [ ] Keep test execution under 10 minutes
- [ ] Ensure 99%+ test stability
- [ ] Document all test scenarios

## Success Criteria

### Code Submission Criteria
- [ ] All tests pass (100% success rate)
- [ ] Code coverage ≥ 90%
- [ ] No linting errors
- [ ] No security vulnerabilities
- [ ] Performance benchmarks met
- [ ] Accessibility standards met

### Quality Gates
- [ ] Unit tests: 100% pass rate
- [ ] Integration tests: 100% pass rate
- [ ] E2E tests: 100% pass rate
- [ ] Performance tests: All benchmarks met
- [ ] Security tests: No vulnerabilities
- [ ] Accessibility tests: WCAG AA compliance

## Notification Rules

### When to Notify User
- [ ] All tests pass and code is ready for review
- [ ] Critical issues require immediate attention
- [ ] Test environment setup is complete
- [ ] Performance benchmarks are achieved

### When NOT to Notify User
- [ ] Tests are still failing
- [ ] Code coverage is below threshold
- [ ] Linting errors exist
- [ ] Security vulnerabilities found
- [ ] Performance benchmarks not met

## Conclusion

**Remember: Only submit code that passes all tests and meets all quality standards. The user should only be notified when the next task is ready for execution with fully tested, compliant code.**
