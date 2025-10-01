/**
 * 사용자 요청 처리 함수
 * 테스트에서 사용할 수 있는 실제 함수 구현
 */

const handleUserRequest = async (input) => {
    try {
        // 입력 검증
        if (!input || typeof input !== 'string') {
            return {
                success: false,
                error: 'Invalid input',
                data: null
            }
        }

        // XSS 방지를 위한 입력 정화
        const sanitizedInput = input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim()

        // SQL 인젝션 방지 (SCRIPT는 제외하고 실제 SQL 키워드만)
        const sqlInjectionPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
            /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
            /(\b(OR|AND)\s+'.*'\s*=\s*'.*')/gi,
            /(\b(OR|AND)\s+".*"\s*=\s*".*")/gi
        ]

        const hasSqlInjection = sqlInjectionPatterns.some(pattern => pattern.test(input))
        if (hasSqlInjection) {
            return {
                success: false,
                error: 'SQL injection attempt detected',
                data: null
            }
        }

        // 성능 측정을 위한 지연
        const startTime = performance.now()

        // 실제 처리 로직 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100))

        const endTime = performance.now()
        const processingTime = endTime - startTime

        // 결과 반환
        return {
            success: true,
            data: {
                originalInput: input,
                sanitizedInput: sanitizedInput,
                processingTime: processingTime,
                timestamp: new Date().toISOString()
            },
            error: null
        }

    } catch (error) {
        return {
            success: false,
            error: error.message,
            data: null
        }
    }
}

module.exports = { handleUserRequest }
