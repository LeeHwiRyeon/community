const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold'],
        default: 'pending'
    },
    priority: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    category: {
        type: String,
        enum: ['feature', 'bug', 'improvement', 'documentation', 'testing', 'refactoring', 'deployment'],
        default: 'feature'
    },
    assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dueDate: {
        type: Date
    },
    estimatedHours: {
        type: Number,
        min: 0
    },
    actualHours: {
        type: Number,
        min: 0,
        default: 0
    },
    tags: [{
        type: String,
        trim: true
    }],
    dependencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Todo'
    }],
    subtasks: [{
        title: {
            type: String,
            required: true,
            trim: true
        },
        completed: {
            type: Boolean,
            default: false
        },
        completedAt: Date
    }],
    attachments: [{
        filename: String,
        originalName: String,
        url: String,
        size: Number,
        mimeType: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],
    watchers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    sprint: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sprint'
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: Date,
    completedAt: Date,
    lastActivityAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 인덱스 설정
todoSchema.index({ assignee: 1, status: 1 });
todoSchema.index({ project: 1, status: 1 });
todoSchema.index({ dueDate: 1 });
todoSchema.index({ priority: 1, status: 1 });
todoSchema.index({ category: 1, status: 1 });
todoSchema.index({ createdAt: -1 });
todoSchema.index({ lastActivityAt: -1 });

// 가상 필드
todoSchema.virtual('isOverdue').get(function () {
    if (!this.dueDate || this.status === 'completed') return false;
    return new Date() > this.dueDate;
});

todoSchema.virtual('progress').get(function () {
    if (this.subtasks.length === 0) {
        return this.status === 'completed' ? 100 : 0;
    }
    const completedSubtasks = this.subtasks.filter(subtask => subtask.completed).length;
    return Math.round((completedSubtasks / this.subtasks.length) * 100);
});

todoSchema.virtual('timeRemaining').get(function () {
    if (!this.estimatedHours || this.actualHours >= this.estimatedHours) return 0;
    return this.estimatedHours - this.actualHours;
});

// 미들웨어
todoSchema.pre('save', function (next) {
    // 완료 상태로 변경 시 completedAt 설정
    if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
        this.completedAt = new Date();
    }

    // 마지막 활동 시간 업데이트
    this.lastActivityAt = new Date();

    next();
});

// 정적 메서드
todoSchema.statics.findByAssignee = function (assigneeId, options = {}) {
    return this.find({ assignee: assigneeId, ...options });
};

todoSchema.statics.findByProject = function (projectId, options = {}) {
    return this.find({ project: projectId, ...options });
};

todoSchema.statics.findOverdue = function () {
    return this.find({
        dueDate: { $lt: new Date() },
        status: { $nin: ['completed', 'cancelled'] }
    });
};

todoSchema.statics.findByPriority = function (priority, options = {}) {
    return this.find({ priority, ...options });
};

todoSchema.statics.getStats = function (filters = {}) {
    return this.aggregate([
        { $match: filters },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalEstimatedHours: { $sum: '$estimatedHours' },
                totalActualHours: { $sum: '$actualHours' }
            }
        }
    ]);
};

// 인스턴스 메서드
todoSchema.methods.addComment = function (userId, content) {
    this.comments.push({
        user: userId,
        content: content
    });
    return this.save();
};

todoSchema.methods.addSubtask = function (title) {
    this.subtasks.push({ title });
    return this.save();
};

todoSchema.methods.completeSubtask = function (subtaskIndex) {
    if (this.subtasks[subtaskIndex]) {
        this.subtasks[subtaskIndex].completed = true;
        this.subtasks[subtaskIndex].completedAt = new Date();
    }
    return this.save();
};

todoSchema.methods.addWatcher = function (userId) {
    if (!this.watchers.includes(userId)) {
        this.watchers.push(userId);
    }
    return this.save();
};

todoSchema.methods.removeWatcher = function (userId) {
    this.watchers = this.watchers.filter(watcher => !watcher.equals(userId));
    return this.save();
};

todoSchema.methods.archive = function () {
    this.isArchived = true;
    this.archivedAt = new Date();
    return this.save();
};

module.exports = mongoose.model('Todo', todoSchema);
