const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const logger = require('../utils/logger');

// Test data structures (in production, these would be stored in a database)
let testSessions = [];
let testResults = [];
let testTasks = [];
let sessionIdCounter = 1;
let resultIdCounter = 1;
let taskIdCounter = 1;

// Get all test sessions
router.get('/sessions', async (req, res) => {
    try {
        const { page = 1, limit = 10, status, type } = req.query;

        let filteredSessions = [...testSessions];

        // Apply filters
        if (status) {
            filteredSessions = filteredSessions.filter(s => s.status === status);
        }
        if (type) {
            filteredSessions = filteredSessions.filter(s => s.type === type);
        }

        // Sort by creation date (newest first)
        filteredSessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: paginatedSessions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: filteredSessions.length,
                pages: Math.ceil(filteredSessions.length / limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching test sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch test sessions',
            error: error.message
        });
    }
});

// Get test session by ID
router.get('/sessions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const session = testSessions.find(s => s.id === id);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Test session not found'
            });
        }

        res.json({
            success: true,
            data: session
        });
    } catch (error) {
        logger.error('Error fetching test session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch test session',
            error: error.message
        });
    }
});

// Create new test session
router.post('/sessions', async (req, res) => {
    try {
        const {
            title,
            description,
            type,
            targetUsers,
            tasks,
            metrics,
            hypothesis,
            successCriteria
        } = req.body;

        // Validate required fields
        if (!title || !description || !type) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, description, type'
            });
        }

        // Create test session
        const session = {
            id: `session_${sessionIdCounter++}`,
            title,
            description,
            type,
            status: 'draft',
            participants: 0,
            targetUsers: targetUsers || [],
            tasks: tasks || [],
            metrics: metrics || {
                completionRate: 0,
                averageTime: 0,
                errorRate: 0,
                satisfactionScore: 0,
                accessibilityScore: 0,
                performanceScore: 0
            },
            hypothesis: hypothesis || '',
            successCriteria: successCriteria || {
                metric: 'completionRate',
                threshold: 80,
                direction: 'increase'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: req.user?.id || 'anonymous'
        };

        testSessions.push(session);

        logger.info('New test session created:', {
            id: session.id,
            title: session.title,
            type: session.type
        });

        res.status(201).json({
            success: true,
            message: 'Test session created successfully',
            data: session
        });
    } catch (error) {
        logger.error('Error creating test session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create test session',
            error: error.message
        });
    }
});

// Update test session
router.put('/sessions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const sessionIndex = testSessions.findIndex(s => s.id === id);
        if (sessionIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Test session not found'
            });
        }

        // Update session
        testSessions[sessionIndex] = {
            ...testSessions[sessionIndex],
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        logger.info('Test session updated:', {
            id: testSessions[sessionIndex].id,
            title: testSessions[sessionIndex].title
        });

        res.json({
            success: true,
            message: 'Test session updated successfully',
            data: testSessions[sessionIndex]
        });
    } catch (error) {
        logger.error('Error updating test session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update test session',
            error: error.message
        });
    }
});

// Delete test session
router.delete('/sessions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const sessionIndex = testSessions.findIndex(s => s.id === id);
        if (sessionIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Test session not found'
            });
        }

        // Remove session
        testSessions.splice(sessionIndex, 1);

        // Remove related results
        testResults = testResults.filter(r => r.sessionId !== id);

        logger.info('Test session deleted:', { id });

        res.json({
            success: true,
            message: 'Test session deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting test session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete test session',
            error: error.message
        });
    }
});

// Get test results
router.get('/results', async (req, res) => {
    try {
        const { page = 1, limit = 10, sessionId, participantId } = req.query;

        let filteredResults = [...testResults];

        // Apply filters
        if (sessionId) {
            filteredResults = filteredResults.filter(r => r.sessionId === sessionId);
        }
        if (participantId) {
            filteredResults = filteredResults.filter(r => r.participantId === participantId);
        }

        // Sort by creation date (newest first)
        filteredResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedResults = filteredResults.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: paginatedResults,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: filteredResults.length,
                pages: Math.ceil(filteredResults.length / limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching test results:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch test results',
            error: error.message
        });
    }
});

// Submit test result
router.post('/results', async (req, res) => {
    try {
        const {
            sessionId,
            participantId,
            participantName,
            taskId,
            taskTitle,
            completed,
            timeSpent,
            errors,
            satisfaction,
            comments,
            screenshots,
            recordings
        } = req.body;

        // Validate required fields
        if (!sessionId || !participantId || !taskId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: sessionId, participantId, taskId'
            });
        }

        // Create test result
        const result = {
            id: `result_${resultIdCounter++}`,
            sessionId,
            participantId,
            participantName: participantName || 'Anonymous',
            taskId,
            taskTitle: taskTitle || '',
            completed: completed || false,
            timeSpent: timeSpent || 0,
            errors: errors || 0,
            satisfaction: satisfaction || 0,
            comments: comments || '',
            screenshots: screenshots || [],
            recordings: recordings || [],
            events: [],
            createdAt: new Date().toISOString()
        };

        testResults.push(result);

        // Update session metrics
        updateSessionMetrics(sessionId);

        logger.info('Test result submitted:', {
            id: result.id,
            sessionId: result.sessionId,
            participantId: result.participantId,
            completed: result.completed
        });

        res.status(201).json({
            success: true,
            message: 'Test result submitted successfully',
            data: result
        });
    } catch (error) {
        logger.error('Error submitting test result:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit test result',
            error: error.message
        });
    }
});

// Track test event
router.post('/events', async (req, res) => {
    try {
        const {
            sessionId,
            participantId,
            taskId,
            event,
            value,
            properties
        } = req.body;

        // Find the most recent result for this participant and task
        const result = testResults.find(r =>
            r.sessionId === sessionId &&
            r.participantId === participantId &&
            r.taskId === taskId
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Test result not found'
            });
        }

        // Add event to result
        const testEvent = {
            event,
            value,
            properties: properties || {},
            timestamp: new Date().toISOString()
        };

        result.events.push(testEvent);

        logger.info('Test event tracked:', {
            sessionId,
            participantId,
            taskId,
            event
        });

        res.json({
            success: true,
            message: 'Event tracked successfully',
            data: testEvent
        });
    } catch (error) {
        logger.error('Error tracking test event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track event',
            error: error.message
        });
    }
});

// Get test statistics
router.get('/stats/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = testSessions.find(s => s.id === sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Test session not found'
            });
        }

        const results = testResults.filter(r => r.sessionId === sessionId);

        // Calculate statistics
        const stats = {
            sessionId,
            totalParticipants: results.length,
            completedTasks: results.filter(r => r.completed).length,
            completionRate: results.length > 0 ? (results.filter(r => r.completed).length / results.length) * 100 : 0,
            averageTime: results.length > 0 ? results.reduce((sum, r) => sum + r.timeSpent, 0) / results.length : 0,
            averageErrors: results.length > 0 ? results.reduce((sum, r) => sum + r.errors, 0) / results.length : 0,
            averageSatisfaction: results.length > 0 ? results.reduce((sum, r) => sum + r.satisfaction, 0) / results.length : 0,
            taskBreakdown: {},
            participantBreakdown: {}
        };

        // Task breakdown
        results.forEach(result => {
            if (!stats.taskBreakdown[result.taskId]) {
                stats.taskBreakdown[result.taskId] = {
                    taskTitle: result.taskTitle,
                    total: 0,
                    completed: 0,
                    averageTime: 0,
                    averageErrors: 0,
                    averageSatisfaction: 0
                };
            }

            const taskStats = stats.taskBreakdown[result.taskId];
            taskStats.total++;
            if (result.completed) taskStats.completed++;
            taskStats.averageTime += result.timeSpent;
            taskStats.averageErrors += result.errors;
            taskStats.averageSatisfaction += result.satisfaction;
        });

        // Calculate averages for each task
        Object.keys(stats.taskBreakdown).forEach(taskId => {
            const taskStats = stats.taskBreakdown[taskId];
            taskStats.averageTime = taskStats.averageTime / taskStats.total;
            taskStats.averageErrors = taskStats.averageErrors / taskStats.total;
            taskStats.averageSatisfaction = taskStats.averageSatisfaction / taskStats.total;
        });

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error fetching test statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch test statistics',
            error: error.message
        });
    }
});

// Helper function to update session metrics
const updateSessionMetrics = (sessionId) => {
    const session = testSessions.find(s => s.id === sessionId);
    if (!session) return;

    const results = testResults.filter(r => r.sessionId === sessionId);

    if (results.length === 0) return;

    // Update metrics
    session.metrics.completionRate = (results.filter(r => r.completed).length / results.length) * 100;
    session.metrics.averageTime = results.reduce((sum, r) => sum + r.timeSpent, 0) / results.length;
    session.metrics.errorRate = (results.reduce((sum, r) => sum + r.errors, 0) / results.length) * 100;
    session.metrics.satisfactionScore = results.reduce((sum, r) => sum + r.satisfaction, 0) / results.length;

    // Update participant count
    session.participants = new Set(results.map(r => r.participantId)).size;

    // Update status if all tasks are completed
    if (session.metrics.completionRate >= 100) {
        session.status = 'completed';
    }
};

module.exports = router;
