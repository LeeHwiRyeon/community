#!/usr/bin/env node

/**
 * 지능형 테스트 생성 데모 스크립트
 * 
 * 사용법:
 * node demo-intelligent-testing.js [파일경로] [옵션]
 * 
 * 예시:
 * node demo-intelligent-testing.js ./src/utils/calculator.ts --type=unit --framework=jest
 * node demo-intelligent-testing.js ./src/api/user.ts --type=integration --framework=playwright
 */

const fs = require('fs');
const path = require('path');

// 샘플 코드
const sampleCode = `
// Calculator utility class
export class Calculator {
  /**
   * Add two numbers
   * @param a First number
   * @param b Second number
   * @returns Sum of a and b
   */
  add(a: number, b: number): number {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Both arguments must be numbers');
    }
    return a + b;
  }

  /**
   * Subtract two numbers
   * @param a First number
   * @param b Second number
   * @returns Difference of a and b
   */
  subtract(a: number, b: number): number {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Both arguments must be numbers');
    }
    return a - b;
  }

  /**
   * Multiply two numbers
   * @param a First number
   * @param b Second number
   * @returns Product of a and b
   */
  multiply(a: number, b: number): number {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Both arguments must be numbers');
    }
    return a * b;
  }

  /**
   * Divide two numbers
   * @param a Dividend
   * @param b Divisor
   * @returns Quotient of a and b
   */
  divide(a: number, b: number): number {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Both arguments must be numbers');
    }
    if (b === 0) {
      throw new Error('Division by zero is not allowed');
    }
    return a / b;
  }

  /**
   * Calculate power
   * @param base Base number
   * @param exponent Exponent
   * @returns Base raised to the power of exponent
   */
  power(base: number, exponent: number): number {
    if (typeof base !== 'number' || typeof exponent !== 'number') {
      throw new Error('Both arguments must be numbers');
    }
    return Math.pow(base, exponent);
  }

  /**
   * Calculate square root
   * @param number Number to find square root of
   * @returns Square root of the number
   */
  sqrt(number: number): number {
    if (typeof number !== 'number') {
      throw new Error('Argument must be a number');
    }
    if (number < 0) {
      throw new Error('Cannot calculate square root of negative number');
    }
    return Math.sqrt(number);
  }
}
`;

// Jest 테스트 생성
function generateJestTest(codeContent, className) {
    return `import { describe, it, expect, beforeEach } from '@jest/globals';
import { ${className} } from './${className.toLowerCase()}';

describe('${className}', () => {
  let calculator: ${className};

  beforeEach(() => {
    calculator = new ${className}();
  });

  describe('add', () => {
    it('should add two positive numbers correctly', () => {
      // Arrange
      const a = 5;
      const b = 3;
      
      // Act
      const result = calculator.add(a, b);
      
      // Assert
      expect(result).toBe(8);
    });

    it('should add negative numbers correctly', () => {
      // Arrange
      const a = -5;
      const b = -3;
      
      // Act
      const result = calculator.add(a, b);
      
      // Assert
      expect(result).toBe(-8);
    });

    it('should add zero correctly', () => {
      // Arrange
      const a = 5;
      const b = 0;
      
      // Act
      const result = calculator.add(a, b);
      
      // Assert
      expect(result).toBe(5);
    });

    it('should throw error for non-number inputs', () => {
      // Arrange
      const a = '5' as any;
      const b = 3;
      
      // Act & Assert
      expect(() => calculator.add(a, b)).toThrow('Both arguments must be numbers');
    });

    it('should throw error for null inputs', () => {
      // Arrange
      const a = null as any;
      const b = 3;
      
      // Act & Assert
      expect(() => calculator.add(a, b)).toThrow('Both arguments must be numbers');
    });
  });

  describe('subtract', () => {
    it('should subtract two positive numbers correctly', () => {
      // Arrange
      const a = 10;
      const b = 3;
      
      // Act
      const result = calculator.subtract(a, b);
      
      // Assert
      expect(result).toBe(7);
    });

    it('should handle negative results correctly', () => {
      // Arrange
      const a = 3;
      const b = 10;
      
      // Act
      const result = calculator.subtract(a, b);
      
      // Assert
      expect(result).toBe(-7);
    });

    it('should throw error for non-number inputs', () => {
      // Arrange
      const a = '10' as any;
      const b = 3;
      
      // Act & Assert
      expect(() => calculator.subtract(a, b)).toThrow('Both arguments must be numbers');
    });
  });

  describe('multiply', () => {
    it('should multiply two positive numbers correctly', () => {
      // Arrange
      const a = 4;
      const b = 5;
      
      // Act
      const result = calculator.multiply(a, b);
      
      // Assert
      expect(result).toBe(20);
    });

    it('should multiply by zero correctly', () => {
      // Arrange
      const a = 5;
      const b = 0;
      
      // Act
      const result = calculator.multiply(a, b);
      
      // Assert
      expect(result).toBe(0);
    });

    it('should multiply negative numbers correctly', () => {
      // Arrange
      const a = -4;
      const b = -5;
      
      // Act
      const result = calculator.multiply(a, b);
      
      // Assert
      expect(result).toBe(20);
    });

    it('should throw error for non-number inputs', () => {
      // Arrange
      const a = '4' as any;
      const b = 5;
      
      // Act & Assert
      expect(() => calculator.multiply(a, b)).toThrow('Both arguments must be numbers');
    });
  });

  describe('divide', () => {
    it('should divide two positive numbers correctly', () => {
      // Arrange
      const a = 20;
      const b = 4;
      
      // Act
      const result = calculator.divide(a, b);
      
      // Assert
      expect(result).toBe(5);
    });

    it('should handle decimal results correctly', () => {
      // Arrange
      const a = 7;
      const b = 3;
      
      // Act
      const result = calculator.divide(a, b);
      
      // Assert
      expect(result).toBeCloseTo(2.333, 3);
    });

    it('should throw error for division by zero', () => {
      // Arrange
      const a = 10;
      const b = 0;
      
      // Act & Assert
      expect(() => calculator.divide(a, b)).toThrow('Division by zero is not allowed');
    });

    it('should throw error for non-number inputs', () => {
      // Arrange
      const a = '20' as any;
      const b = 4;
      
      // Act & Assert
      expect(() => calculator.divide(a, b)).toThrow('Both arguments must be numbers');
    });
  });

  describe('power', () => {
    it('should calculate power correctly', () => {
      // Arrange
      const base = 2;
      const exponent = 3;
      
      // Act
      const result = calculator.power(base, exponent);
      
      // Assert
      expect(result).toBe(8);
    });

    it('should handle zero exponent correctly', () => {
      // Arrange
      const base = 5;
      const exponent = 0;
      
      // Act
      const result = calculator.power(base, exponent);
      
      // Assert
      expect(result).toBe(1);
    });

    it('should handle negative exponent correctly', () => {
      // Arrange
      const base = 2;
      const exponent = -2;
      
      // Act
      const result = calculator.power(base, exponent);
      
      // Assert
      expect(result).toBe(0.25);
    });

    it('should throw error for non-number inputs', () => {
      // Arrange
      const base = '2' as any;
      const exponent = 3;
      
      // Act & Assert
      expect(() => calculator.power(base, exponent)).toThrow('Both arguments must be numbers');
    });
  });

  describe('sqrt', () => {
    it('should calculate square root correctly', () => {
      // Arrange
      const number = 16;
      
      // Act
      const result = calculator.sqrt(number);
      
      // Assert
      expect(result).toBe(4);
    });

    it('should handle zero correctly', () => {
      // Arrange
      const number = 0;
      
      // Act
      const result = calculator.sqrt(number);
      
      // Assert
      expect(result).toBe(0);
    });

    it('should handle decimal results correctly', () => {
      // Arrange
      const number = 2;
      
      // Act
      const result = calculator.sqrt(number);
      
      // Assert
      expect(result).toBeCloseTo(1.414, 3);
    });

    it('should throw error for negative numbers', () => {
      // Arrange
      const number = -4;
      
      // Act & Assert
      expect(() => calculator.sqrt(number)).toThrow('Cannot calculate square root of negative number');
    });

    it('should throw error for non-number inputs', () => {
      // Arrange
      const number = '16' as any;
      
      // Act & Assert
      expect(() => calculator.sqrt(number)).toThrow('Argument must be a number');
    });
  });
});
`;
}

// Playwright 테스트 생성
function generatePlaywrightTest(codeContent, className) {
    return `import { test, expect } from '@playwright/test';

test.describe('${className} E2E Tests', () => {
  test('should perform complete calculation workflow', async ({ page }) => {
    // Navigate to calculator page
    await page.goto('/calculator');
    
    // Test addition
    await page.fill('[data-testid="input-a"]', '10');
    await page.fill('[data-testid="input-b"]', '5');
    await page.click('[data-testid="add-button"]');
    
    const result = await page.textContent('[data-testid="result"]');
    expect(result).toBe('15');
    
    // Test subtraction
    await page.fill('[data-testid="input-a"]', '20');
    await page.fill('[data-testid="input-b"]', '8');
    await page.click('[data-testid="subtract-button"]');
    
    const result2 = await page.textContent('[data-testid="result"]');
    expect(result2).toBe('12');
    
    // Test error handling
    await page.fill('[data-testid="input-a"]', 'abc');
    await page.fill('[data-testid="input-b"]', '5');
    await page.click('[data-testid="add-button"]');
    
    const errorMessage = await page.textContent('[data-testid="error-message"]');
    expect(errorMessage).toContain('Both arguments must be numbers');
  });

  test('should handle division by zero error', async ({ page }) => {
    await page.goto('/calculator');
    
    await page.fill('[data-testid="input-a"]', '10');
    await page.fill('[data-testid="input-b"]', '0');
    await page.click('[data-testid="divide-button"]');
    
    const errorMessage = await page.textContent('[data-testid="error-message"]');
    expect(errorMessage).toContain('Division by zero is not allowed');
  });
});
`;
}

// 성능 테스트 생성
function generatePerformanceTest(codeContent, className) {
    return `import { test, expect } from '@playwright/test';

test.describe('${className} Performance Tests', () => {
  test('should perform calculations within acceptable time', async ({ page }) => {
    await page.goto('/calculator');
    
    const startTime = Date.now();
    
    // Perform multiple calculations
    for (let i = 0; i < 1000; i++) {
      await page.fill('[data-testid="input-a"]', i.toString());
      await page.fill('[data-testid="input-b"]', (i + 1).toString());
      await page.click('[data-testid="add-button"]');
    }
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Should complete within 5 seconds
    expect(executionTime).toBeLessThan(5000);
  });

  test('should handle concurrent calculations', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);
    
    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));
    
    const startTime = Date.now();
    
    // Perform calculations concurrently
    await Promise.all(pages.map(async (page, index) => {
      await page.goto('/calculator');
      await page.fill('[data-testid="input-a"]', (index * 100).toString());
      await page.fill('[data-testid="input-b"]', '50');
      await page.click('[data-testid="add-button"]');
    }));
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Should complete within 3 seconds
    expect(executionTime).toBeLessThan(3000);
    
    // Cleanup
    await Promise.all(contexts.map(ctx => ctx.close()));
  });
});
`;
}

// 보안 테스트 생성
function generateSecurityTest(codeContent, className) {
    return `import { describe, it, expect } from '@jest/globals';
import { ${className} } from './${className.toLowerCase()}';

describe('${className} Security Tests', () => {
  let calculator: ${className};

  beforeEach(() => {
    calculator = new ${className}();
  });

  describe('Input Validation', () => {
    it('should prevent code injection through string inputs', () => {
      // Arrange
      const maliciousInput = '1; console.log("hacked"); //';
      const normalInput = 2;
      
      // Act & Assert
      expect(() => calculator.add(maliciousInput as any, normalInput)).toThrow('Both arguments must be numbers');
    });

    it('should prevent prototype pollution', () => {
      // Arrange
      const maliciousInput = { __proto__: { isAdmin: true } };
      const normalInput = 2;
      
      // Act & Assert
      expect(() => calculator.add(maliciousInput as any, normalInput)).toThrow('Both arguments must be numbers');
    });

    it('should handle extremely large numbers safely', () => {
      // Arrange
      const largeNumber = Number.MAX_SAFE_INTEGER;
      const normalNumber = 1;
      
      // Act
      const result = calculator.add(largeNumber, normalNumber);
      
      // Assert
      expect(typeof result).toBe('number');
      expect(isFinite(result)).toBe(true);
    });

    it('should handle extremely small numbers safely', () => {
      // Arrange
      const smallNumber = Number.MIN_VALUE;
      const normalNumber = 1;
      
      // Act
      const result = calculator.add(smallNumber, normalNumber);
      
      // Assert
      expect(typeof result).toBe('number');
      expect(isFinite(result)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should not expose sensitive information in error messages', () => {
      // Arrange
      const invalidInput = null;
      const normalInput = 2;
      
      // Act & Assert
      expect(() => calculator.add(invalidInput as any, normalInput)).toThrow('Both arguments must be numbers');
      
      // Error message should not contain internal implementation details
      try {
        calculator.add(invalidInput as any, normalInput);
      } catch (error) {
        expect(error.message).not.toContain('undefined');
        expect(error.message).not.toContain('null');
        expect(error.message).not.toContain('object');
      }
    });
  });
});
`;
}

// 메인 함수
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
🧪 지능형 테스트 생성 데모

사용법:
  node demo-intelligent-testing.js [옵션]

옵션:
  --type=unit          단위 테스트 생성 (기본값)
  --type=integration   통합 테스트 생성
  --type=e2e          E2E 테스트 생성
  --type=performance  성능 테스트 생성
  --type=security     보안 테스트 생성
  --framework=jest    Jest 프레임워크 사용 (기본값)
  --framework=playwright Playwright 프레임워크 사용
  --output=./tests    출력 디렉토리 (기본값: ./generated-tests)

예시:
  node demo-intelligent-testing.js --type=unit --framework=jest
  node demo-intelligent-testing.js --type=e2e --framework=playwright
  node demo-intelligent-testing.js --type=performance --output=./performance-tests
`);
        return;
    }

    // 옵션 파싱
    const options = {
        type: 'unit',
        framework: 'jest',
        output: './generated-tests'
    };

    args.forEach(arg => {
        if (arg.startsWith('--type=')) {
            options.type = arg.split('=')[1];
        } else if (arg.startsWith('--framework=')) {
            options.framework = arg.split('=')[1];
        } else if (arg.startsWith('--output=')) {
            options.output = arg.split('=')[1];
        }
    });

    console.log('🧪 지능형 테스트 생성 시작...');
    console.log(`📋 설정: ${options.type} 테스트, ${options.framework} 프레임워크`);
    console.log(`📁 출력: ${options.output}`);

    // 출력 디렉토리 생성
    if (!fs.existsSync(options.output)) {
        fs.mkdirSync(options.output, { recursive: true });
    }

    const className = 'Calculator';
    let testContent = '';

    // 테스트 타입에 따른 생성
    switch (options.type) {
        case 'unit':
            testContent = generateJestTest(sampleCode, className);
            break;
        case 'integration':
            testContent = generatePlaywrightTest(sampleCode, className);
            break;
        case 'e2e':
            testContent = generatePlaywrightTest(sampleCode, className);
            break;
        case 'performance':
            testContent = generatePerformanceTest(sampleCode, className);
            break;
        case 'security':
            testContent = generateSecurityTest(sampleCode, className);
            break;
        default:
            console.error(`❌ 알 수 없는 테스트 타입: ${options.type}`);
            return;
    }

    // 테스트 파일 저장
    const testFileName = `${className.toLowerCase()}.${options.type}.test.ts`;
    const testFilePath = path.join(options.output, testFileName);

    fs.writeFileSync(testFilePath, testContent);

    console.log(`✅ 테스트 파일 생성 완료: ${testFilePath}`);

    // 통계 출력
    const lines = testContent.split('\n').length;
    const testCases = (testContent.match(/it\(/g) || []).length;
    const describeBlocks = (testContent.match(/describe\(/g) || []).length;

    console.log(`
📊 생성된 테스트 통계:
  📄 파일: ${testFileName}
  📏 라인 수: ${lines}
  🧪 테스트 케이스: ${testCases}
  📁 describe 블록: ${describeBlocks}
  🎯 프레임워크: ${options.framework}
  📋 타입: ${options.type}
`);

    // 실행 가이드 출력
    console.log(`
🚀 테스트 실행 가이드:

Jest 사용 시:
  npm install --save-dev jest @types/jest
  npx jest ${testFilePath}

Playwright 사용 시:
  npm install --save-dev @playwright/test
  npx playwright test ${testFilePath}

테스트 실행:
  npm test
`);
}

// 스크립트 실행
if (require.main === module) {
    main();
}

module.exports = {
    generateJestTest,
    generatePlaywrightTest,
    generatePerformanceTest,
    generateSecurityTest
};
