import { useState, useEffect, useCallback } from 'react';

interface ABTestConfig {
    id: string;
    name: string;
    description: string;
    variants: {
        id: string;
        name: string;
        weight: number;
        config: Record<string, any>;
    }[];
    status: 'draft' | 'active' | 'paused' | 'completed';
    startDate: string;
    endDate: string;
    targetAudience: {
        segments: string[];
        percentage: number;
    };
    metrics: {
        primary: string;
        secondary: string[];
    };
    hypothesis: string;
    successCriteria: {
        metric: string;
        threshold: number;
        direction: 'increase' | 'decrease';
    };
}

interface ABTestResult {
    testId: string;
    variantId: string;
    userId: string;
    sessionId: string;
    events: {
        event: string;
        value?: number;
        timestamp: string;
        properties?: Record<string, any>;
    }[];
    conversion: boolean;
    conversionValue?: number;
    createdAt: string;
}

interface ABTestStats {
    testId: string;
    variantId: string;
    participants: number;
    conversions: number;
    conversionRate: number;
    averageValue: number;
    confidence: number;
    significance: boolean;
    uplift: number;
}

export const useABTest = (testId: string) => {
    const [testConfig, setTestConfig] = useState<ABTestConfig | null>(null);
    const [userVariant, setUserVariant] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load test configuration
    useEffect(() => {
        const loadTestConfig = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/ab-tests/${testId}`);
                if (!response.ok) {
                    throw new Error('Failed to load test configuration');
                }
                const config = await response.json();
                setTestConfig(config);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        };

        loadTestConfig();
    }, [testId]);

    // Assign user to variant
    useEffect(() => {
        if (!testConfig || testConfig.status !== 'active') return;

        const assignVariant = async () => {
            try {
                // Check if user is already assigned
                const existingVariant = localStorage.getItem(`ab-test-${testId}`);
                if (existingVariant) {
                    setUserVariant(existingVariant);
                    return;
                }

                // Check if user is in target audience
                const isInTargetAudience = await checkTargetAudience(testConfig.targetAudience);
                if (!isInTargetAudience) {
                    setUserVariant('control');
                    return;
                }

                // Assign variant based on weights
                const variant = selectVariant(testConfig.variants);
                setUserVariant(variant.id);
                localStorage.setItem(`ab-test-${testId}`, variant.id);

                // Track assignment
                await trackEvent('ab_test_assigned', {
                    testId,
                    variantId: variant.id,
                    timestamp: new Date().toISOString()
                });
            } catch (err) {
                console.error('Failed to assign variant:', err);
                setUserVariant('control');
            }
        };

        assignVariant();
    }, [testConfig, testId]);

    // Track events
    const trackEvent = useCallback(async (
        event: string,
        properties: Record<string, any> = {}
    ) => {
        if (!userVariant || !testConfig) return;

        try {
            await fetch('/api/ab-tests/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId,
                    variantId: userVariant,
                    event,
                    properties: {
                        ...properties,
                        timestamp: new Date().toISOString()
                    }
                })
            });
        } catch (err) {
            console.error('Failed to track event:', err);
        }
    }, [testId, userVariant, testConfig]);

    // Get variant configuration
    const getVariantConfig = useCallback(() => {
        if (!testConfig || !userVariant) return null;

        const variant = testConfig.variants.find(v => v.id === userVariant);
        return variant?.config || null;
    }, [testConfig, userVariant]);

    // Check if test is active
    const isTestActive = useCallback(() => {
        if (!testConfig) return false;

        const now = new Date();
        const startDate = new Date(testConfig.startDate);
        const endDate = new Date(testConfig.endDate);

        return testConfig.status === 'active' &&
            now >= startDate &&
            now <= endDate;
    }, [testConfig]);

    // Get test statistics
    const getTestStats = useCallback(async () => {
        if (!testConfig) return null;

        try {
            const response = await fetch(`/api/ab-tests/${testId}/stats`);
            if (!response.ok) {
                throw new Error('Failed to load test statistics');
            }
            return await response.json();
        } catch (err) {
            console.error('Failed to load test statistics:', err);
            return null;
        }
    }, [testId, testConfig]);

    return {
        testConfig,
        userVariant,
        isLoading,
        error,
        trackEvent,
        getVariantConfig,
        isTestActive,
        getTestStats
    };
};

// Helper function to select variant based on weights
const selectVariant = (variants: ABTestConfig['variants']): ABTestConfig['variants'][0] => {
    const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);
    const random = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const variant of variants) {
        currentWeight += variant.weight;
        if (random <= currentWeight) {
            return variant;
        }
    }

    return variants[variants.length - 1];
};

// Helper function to check if user is in target audience
const checkTargetAudience = async (targetAudience: ABTestConfig['targetAudience']): Promise<boolean> => {
    try {
        // Get user segments
        const response = await fetch('/api/user/segments');
        const userSegments = await response.json();

        // Check if user has any of the target segments
        const hasTargetSegment = targetAudience.segments.some(segment =>
            userSegments.includes(segment)
        );

        // Check percentage
        const random = Math.random() * 100;
        const isInPercentage = random <= targetAudience.percentage;

        return hasTargetSegment && isInPercentage;
    } catch (err) {
        console.error('Failed to check target audience:', err);
        return false;
    }
};

// Hook for managing A/B tests
export const useABTestManager = () => {
    const [tests, setTests] = useState<ABTestConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load all tests
    useEffect(() => {
        const loadTests = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/ab-tests');
                if (!response.ok) {
                    throw new Error('Failed to load tests');
                }
                const data = await response.json();
                setTests(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        };

        loadTests();
    }, []);

    // Create new test
    const createTest = useCallback(async (testData: Partial<ABTestConfig>) => {
        try {
            const response = await fetch('/api/ab-tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });

            if (!response.ok) {
                throw new Error('Failed to create test');
            }

            const newTest = await response.json();
            setTests(prev => [...prev, newTest]);
            return newTest;
        } catch (err) {
            throw err;
        }
    }, []);

    // Update test
    const updateTest = useCallback(async (testId: string, testData: Partial<ABTestConfig>) => {
        try {
            const response = await fetch(`/api/ab-tests/${testId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });

            if (!response.ok) {
                throw new Error('Failed to update test');
            }

            const updatedTest = await response.json();
            setTests(prev => prev.map(test =>
                test.id === testId ? updatedTest : test
            ));
            return updatedTest;
        } catch (err) {
            throw err;
        }
    }, []);

    // Delete test
    const deleteTest = useCallback(async (testId: string) => {
        try {
            const response = await fetch(`/api/ab-tests/${testId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete test');
            }

            setTests(prev => prev.filter(test => test.id !== testId));
        } catch (err) {
            throw err;
        }
    }, []);

    // Start test
    const startTest = useCallback(async (testId: string) => {
        return updateTest(testId, { status: 'active' });
    }, [updateTest]);

    // Pause test
    const pauseTest = useCallback(async (testId: string) => {
        return updateTest(testId, { status: 'paused' });
    }, [updateTest]);

    // Complete test
    const completeTest = useCallback(async (testId: string) => {
        return updateTest(testId, { status: 'completed' });
    }, [updateTest]);

    // Get test results
    const getTestResults = useCallback(async (testId: string) => {
        try {
            const response = await fetch(`/api/ab-tests/${testId}/results`);
            if (!response.ok) {
                throw new Error('Failed to load test results');
            }
            return await response.json();
        } catch (err) {
            throw err;
        }
    }, []);

    return {
        tests,
        isLoading,
        error,
        createTest,
        updateTest,
        deleteTest,
        startTest,
        pauseTest,
        completeTest,
        getTestResults
    };
};

export default useABTest;
