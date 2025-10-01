import { describe, it, expect } from '@jest/globals';
import { Calculator } from './calculator';

describe('Calculator Security Tests', () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
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
