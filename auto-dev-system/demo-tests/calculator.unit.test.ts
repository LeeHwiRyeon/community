import { describe, it, expect, beforeEach } from '@jest/globals';
import { Calculator } from './calculator';

describe('Calculator', () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
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
