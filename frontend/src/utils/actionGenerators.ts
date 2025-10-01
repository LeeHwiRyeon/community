// Unique Action Generators - Each function generates a unique string and performs a specific action

// Post Writing Functions
export const createPostAction = () => {
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substr(2, 9);
    const actionString = `POST_CREATE_${timestamp}_${uniqueId}`;

    console.log(`📝 Post Creation Action: ${actionString}`);

    return {
        actionType: 'POST_CREATE',
        actionString,
        timestamp,
        uniqueId,
        message: `New post created with ID: ${uniqueId}`,
        data: {
            title: `Post Title ${uniqueId}`,
            content: `This is the content for post ${uniqueId}`,
            author: 'User',
            createdAt: new Date(timestamp).toISOString()
        }
    };
};

export const createCommentAction = () => {
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substr(2, 9);
    const actionString = `COMMENT_ADD_${timestamp}_${uniqueId}`;

    console.log(`💬 Comment Addition Action: ${actionString}`);

    return {
        actionType: 'COMMENT_ADD',
        actionString,
        timestamp,
        uniqueId,
        message: `New comment added with ID: ${uniqueId}`,
        data: {
            postId: `post_${Math.random().toString(36).substr(2, 6)}`,
            content: `This is comment ${uniqueId}`,
            author: 'User',
            createdAt: new Date(timestamp).toISOString()
        }
    };
};

export const createLikeAction = () => {
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substr(2, 9);
    const actionString = `LIKE_ADD_${timestamp}_${uniqueId}`;

    console.log(`👍 Like Action: ${actionString}`);

    return {
        actionType: 'LIKE_ADD',
        actionString,
        timestamp,
        uniqueId,
        message: `Like added with ID: ${uniqueId}`,
        data: {
            targetId: `target_${Math.random().toString(36).substr(2, 6)}`,
            targetType: 'post',
            createdAt: new Date(timestamp).toISOString()
        }
    };
};

export const createShareAction = () => {
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substr(2, 9);
    const actionString = `SHARE_ACTION_${timestamp}_${uniqueId}`;

    console.log(`📤 Share Action: ${actionString}`);

    return {
        actionType: 'SHARE_ACTION',
        actionString,
        timestamp,
        uniqueId,
        message: `Content shared with ID: ${uniqueId}`,
        data: {
            contentId: `content_${Math.random().toString(36).substr(2, 6)}`,
            platform: 'community',
            createdAt: new Date(timestamp).toISOString()
        }
    };
};

export const createFollowAction = () => {
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substr(2, 9);
    const actionString = `FOLLOW_USER_${timestamp}_${uniqueId}`;

    console.log(`👥 Follow Action: ${actionString}`);

    return {
        actionType: 'FOLLOW_USER',
        actionString,
        timestamp,
        uniqueId,
        message: `User followed with ID: ${uniqueId}`,
        data: {
            userId: `user_${Math.random().toString(36).substr(2, 6)}`,
            targetUserId: `target_${Math.random().toString(36).substr(2, 6)}`,
            createdAt: new Date(timestamp).toISOString()
        }
    };
};

export const createBookmarkAction = () => {
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substr(2, 9);
    const actionString = `BOOKMARK_ADD_${timestamp}_${uniqueId}`;

    console.log(`🔖 Bookmark Action: ${actionString}`);

    return {
        actionType: 'BOOKMARK_ADD',
        actionString,
        timestamp,
        uniqueId,
        message: `Bookmark added with ID: ${uniqueId}`,
        data: {
            contentId: `content_${Math.random().toString(36).substr(2, 6)}`,
            contentType: 'post',
            createdAt: new Date(timestamp).toISOString()
        }
    };
};

// Pagination Functions
export const createNextPageAction = () => {
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substr(2, 9);
    const actionString = `PAGE_NEXT_${timestamp}_${uniqueId}`;

    console.log(`➡️ Next Page Action: ${actionString}`);

    return {
        actionType: 'PAGE_NEXT',
        actionString,
        timestamp,
        uniqueId,
        message: `Moved to next page with ID: ${uniqueId}`,
        data: {
            currentPage: Math.floor(Math.random() * 10) + 1,
            nextPage: Math.floor(Math.random() * 10) + 2,
            createdAt: new Date(timestamp).toISOString()
        }
    };
};

export const createPreviousPageAction = () => {
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substr(2, 9);
    const actionString = `PAGE_PREV_${timestamp}_${uniqueId}`;

    console.log(`⬅️ Previous Page Action: ${actionString}`);

    return {
        actionType: 'PAGE_PREV',
        actionString,
        timestamp,
        uniqueId,
        message: `Moved to previous page with ID: ${uniqueId}`,
        data: {
            currentPage: Math.floor(Math.random() * 10) + 2,
            previousPage: Math.floor(Math.random() * 10) + 1,
            createdAt: new Date(timestamp).toISOString()
        }
    };
};

// Action Registry - All available actions
export const ACTION_REGISTRY = {
    createPost: createPostAction,
    createComment: createCommentAction,
    createLike: createLikeAction,
    createShare: createShareAction,
    createFollow: createFollowAction,
    createBookmark: createBookmarkAction,
    nextPage: createNextPageAction,
    previousPage: createPreviousPageAction
};

// Execute action and return result
export const executeAction = (actionName: keyof typeof ACTION_REGISTRY) => {
    const actionFunction = ACTION_REGISTRY[actionName];
    if (!actionFunction) {
        throw new Error(`Action ${actionName} not found in registry`);
    }

    const result = actionFunction();

    // Store action result in localStorage for persistence
    const actionHistory = JSON.parse(localStorage.getItem('actionHistory') || '[]');
    actionHistory.push(result);
    localStorage.setItem('actionHistory', JSON.stringify(actionHistory));

    return result;
};

// Get action history
export const getActionHistory = () => {
    return JSON.parse(localStorage.getItem('actionHistory') || '[]');
};

// Clear action history
export const clearActionHistory = () => {
    localStorage.removeItem('actionHistory');
};
