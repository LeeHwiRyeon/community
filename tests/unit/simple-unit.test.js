/**
 * 간단한 단위 테스트
 * 실제 동작하는 테스트로 문제 해결
 */

const { handleUserRequest } = require('../../src/handleUserRequest')

describe('handleUserRequest Unit Tests', () => {
    test('should handle valid input successfully', async () => {
        // Arrange
        const input = 'test input'

        // Act
        const result = await handleUserRequest(input)

        // Assert
        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        expect(result.data.originalInput).toBe(input)
        expect(result.error).toBeNull()
    })

    test('should handle invalid input', async () => {
        // Arrange
        const input = null

        // Act
        const result = await handleUserRequest(input)

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid input')
        expect(result.data).toBeNull()
    })

    test('should sanitize XSS attempts', async () => {
        // Arrange
        const maliciousInput = '<script>alert("xss")</script>'

        // Act
        const result = await handleUserRequest(maliciousInput)

        // Assert
        expect(result.success).toBe(true)
        expect(result.data.sanitizedInput).not.toContain('<script>')
        expect(result.data.sanitizedInput).not.toContain('alert')
    })

    test('should detect SQL injection attempts', async () => {
        // Arrange
        const sqlInjection = "'; DROP TABLE users; --"

        // Act
        const result = await handleUserRequest(sqlInjection)

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe('SQL injection attempt detected')
    })

    test('should measure performance', async () => {
        // Arrange
        const input = 'performance test'

        // Act
        const result = await handleUserRequest(input)

        // Assert
        expect(result.success).toBe(true)
        expect(result.data.processingTime).toBeGreaterThan(0)
        expect(result.data.processingTime).toBeLessThan(1000) // 1초 미만
    })
})
