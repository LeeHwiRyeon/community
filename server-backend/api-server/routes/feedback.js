const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const logger = require('../utils/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/feedback');
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Maximum 5 files
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
        }
    }
});

// Ensure upload directory exists
const ensureUploadDir = async () => {
    const uploadDir = path.join(__dirname, '../../uploads/feedback');
    try {
        await fs.access(uploadDir);
    } catch (error) {
        await fs.mkdir(uploadDir, { recursive: true });
    }
};

// Initialize upload directory
ensureUploadDir();

// Feedback data structure (in production, this would be stored in a database)
let feedbackData = [];
let feedbackIdCounter = 1;

// Get all feedback
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, type, status, priority, category } = req.query;

        let filteredFeedback = [...feedbackData];

        // Apply filters
        if (type) {
            filteredFeedback = filteredFeedback.filter(f => f.type === type);
        }
        if (status) {
            filteredFeedback = filteredFeedback.filter(f => f.status === status);
        }
        if (priority) {
            filteredFeedback = filteredFeedback.filter(f => f.priority === priority);
        }
        if (category) {
            filteredFeedback = filteredFeedback.filter(f => f.category === category);
        }

        // Sort by creation date (newest first)
        filteredFeedback.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedFeedback = filteredFeedback.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: paginatedFeedback,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: filteredFeedback.length,
                pages: Math.ceil(filteredFeedback.length / limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedback',
            error: error.message
        });
    }
});

// Get recent feedback
router.get('/recent', async (req, res) => {
    try {
        const recentFeedback = feedbackData
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        res.json({
            success: true,
            data: recentFeedback
        });
    } catch (error) {
        logger.error('Error fetching recent feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent feedback',
            error: error.message
        });
    }
});

// Get feedback by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const feedback = feedbackData.find(f => f.id === id);

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.json({
            success: true,
            data: feedback
        });
    } catch (error) {
        logger.error('Error fetching feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedback',
            error: error.message
        });
    }
});

// Create new feedback
router.post('/', upload.array('attachments', 5), async (req, res) => {
    try {
        const {
            type,
            rating,
            title,
            description,
            category,
            priority,
            userId,
            userEmail,
            userName
        } = req.body;

        // Validate required fields
        if (!type || !title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: type, title, description'
            });
        }

        // Process uploaded files
        const attachments = req.files ? req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            path: file.path
        })) : [];

        // Create feedback object
        const feedback = {
            id: `feedback_${feedbackIdCounter++}`,
            type,
            rating: parseInt(rating) || 5,
            title,
            description,
            category: category || '',
            priority: priority || 'medium',
            status: 'open',
            user: {
                id: userId || 'anonymous',
                name: userName || 'Anonymous',
                email: userEmail || ''
            },
            attachments,
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add to feedback data
        feedbackData.push(feedback);

        // Log feedback creation
        logger.info('New feedback created:', {
            id: feedback.id,
            type: feedback.type,
            title: feedback.title,
            priority: feedback.priority
        });

        // Send notification to admin (in production, this would be async)
        await sendAdminNotification(feedback);

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: feedback
        });
    } catch (error) {
        logger.error('Error creating feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create feedback',
            error: error.message
        });
    }
});

// Update feedback status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNote } = req.body;

        const feedback = feedbackData.find(f => f.id === id);
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        feedback.status = status;
        feedback.updatedAt = new Date().toISOString();

        if (adminNote) {
            feedback.adminNote = adminNote;
        }

        logger.info('Feedback status updated:', {
            id: feedback.id,
            status: feedback.status,
            adminNote: adminNote
        });

        res.json({
            success: true,
            message: 'Feedback status updated successfully',
            data: feedback
        });
    } catch (error) {
        logger.error('Error updating feedback status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update feedback status',
            error: error.message
        });
    }
});

// Add comment to feedback
router.post('/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const { comment, author, authorType } = req.body;

        const feedback = feedbackData.find(f => f.id === id);
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        if (!feedback.comments) {
            feedback.comments = [];
        }

        const newComment = {
            id: uuidv4(),
            comment,
            author,
            authorType: authorType || 'user',
            createdAt: new Date().toISOString()
        };

        feedback.comments.push(newComment);
        feedback.updatedAt = new Date().toISOString();

        res.json({
            success: true,
            message: 'Comment added successfully',
            data: newComment
        });
    } catch (error) {
        logger.error('Error adding comment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add comment',
            error: error.message
        });
    }
});

// Get feedback statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const stats = {
            total: feedbackData.length,
            byType: {},
            byStatus: {},
            byPriority: {},
            byCategory: {},
            averageRating: 0,
            recentCount: 0
        };

        // Calculate statistics
        feedbackData.forEach(feedback => {
            // By type
            stats.byType[feedback.type] = (stats.byType[feedback.type] || 0) + 1;

            // By status
            stats.byStatus[feedback.status] = (stats.byStatus[feedback.status] || 0) + 1;

            // By priority
            stats.byPriority[feedback.priority] = (stats.byPriority[feedback.priority] || 0) + 1;

            // By category
            if (feedback.category) {
                stats.byCategory[feedback.category] = (stats.byCategory[feedback.category] || 0) + 1;
            }

            // Average rating
            stats.averageRating += feedback.rating;
        });

        // Calculate average rating
        if (feedbackData.length > 0) {
            stats.averageRating = stats.averageRating / feedbackData.length;
        }

        // Recent count (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        stats.recentCount = feedbackData.filter(f =>
            new Date(f.createdAt) > sevenDaysAgo
        ).length;

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error fetching feedback statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedback statistics',
            error: error.message
        });
    }
});

// Search feedback
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const searchResults = feedbackData.filter(feedback =>
            feedback.title.toLowerCase().includes(query.toLowerCase()) ||
            feedback.description.toLowerCase().includes(query.toLowerCase()) ||
            feedback.category.toLowerCase().includes(query.toLowerCase())
        );

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedResults = searchResults.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: paginatedResults,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: searchResults.length,
                pages: Math.ceil(searchResults.length / limit)
            }
        });
    } catch (error) {
        logger.error('Error searching feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search feedback',
            error: error.message
        });
    }
});

// Helper function to send admin notification
const sendAdminNotification = async (feedback) => {
    try {
        // In production, this would send actual notifications
        logger.info('Admin notification sent for feedback:', {
            id: feedback.id,
            type: feedback.type,
            priority: feedback.priority
        });

        // Example: Send to Slack webhook
        if (process.env.SLACK_WEBHOOK_URL) {
            const message = {
                text: `New feedback received: ${feedback.title}`,
                attachments: [{
                    color: feedback.priority === 'high' ? 'danger' : 'good',
                    fields: [
                        { title: 'Type', value: feedback.type, short: true },
                        { title: 'Priority', value: feedback.priority, short: true },
                        { title: 'Rating', value: feedback.rating.toString(), short: true },
                        { title: 'Description', value: feedback.description, short: false }
                    ]
                }]
            };

            // Send to Slack (implementation would go here)
        }
    } catch (error) {
        logger.error('Error sending admin notification:', error);
    }
};

module.exports = router;
