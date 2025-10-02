import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

interface Comment {
    id: number
    content: string
    author: string
    created_at: string
    parent_id?: number
    replies?: Comment[]
}

const CommentItem: React.FC<{
    comment: Comment
    onReply: (parentId: number) => void
    onEdit: (commentId: number, content: string) => void
    onDelete: (commentId: number) => void
}> = ({ comment, onReply, onEdit, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(comment.content)

    const handleEdit = () => {
        if (isEditing) {
            onEdit(comment.id, editContent)
            setIsEditing(false)
        } else {
            setIsEditing(true)
        }
    }

    const handleDelete = () => {
        if (confirm('댓글을 삭제하시겠습니까?')) {
            onDelete(comment.id)
        }
    }

    return (
        <div className="comment-item">
            <div className="comment-header">
                <span className="comment-author">{comment.author}</span>
                <span className="comment-date">{new Date(comment.created_at).toLocaleString()}</span>
            </div>
            <div className="comment-content">
                {isEditing ? (
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="comment-edit-input"
                    />
                ) : (
                    <p>{comment.content}</p>
                )}
            </div>
            <div className="comment-actions">
                <button onClick={() => onReply(comment.id)}>답글</button>
                <button onClick={handleEdit}>{isEditing ? '저장' : '수정'}</button>
                <button onClick={handleDelete}>삭제</button>
            </div>
            {comment.replies && comment.replies.length > 0 && (
                <div className="comment-replies">
                    {comment.replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            onReply={onReply}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

const CommentSection: React.FC = () => {
    const { postId } = useParams<{ postId: string }>()
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [replyTo, setReplyTo] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (postId) {
            fetchComments()
        }
    }, [postId])

    const fetchComments = async () => {
        try {
            const response = await fetch(`/api/posts/${postId}/comments`)
            if (response.ok) {
                const data = await response.json()
                // 계층 구조로 변환
                const hierarchicalComments = buildHierarchy(data)
                setComments(hierarchicalComments)
            }
        } catch (error) {
            console.error('Error fetching comments:', error)
        }
    }

    const buildHierarchy = (flatComments: Comment[]): Comment[] => {
        const commentMap = new Map<number, Comment>()
        const roots: Comment[] = []

        flatComments.forEach(comment => {
            comment.replies = []
            commentMap.set(comment.id, comment)
        })

        flatComments.forEach(comment => {
            if (comment.parent_id) {
                const parent = commentMap.get(comment.parent_id)
                if (parent) {
                    parent.replies!.push(comment)
                }
            } else {
                roots.push(comment)
            }
        })

        return roots
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim()) return

        setLoading(true)
        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: newComment,
                    parent_id: replyTo,
                }),
            })

            if (response.ok) {
                setNewComment('')
                setReplyTo(null)
                fetchComments()
            }
        } catch (error) {
            console.error('Error posting comment:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleReply = (parentId: number) => {
        setReplyTo(parentId)
    }

    const handleEdit = async (commentId: number, content: string) => {
        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content }),
            })

            if (response.ok) {
                fetchComments()
            }
        } catch (error) {
            console.error('Error editing comment:', error)
        }
    }

    const handleDelete = async (commentId: number) => {
        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                fetchComments()
            }
        } catch (error) {
            console.error('Error deleting comment:', error)
        }
    }

    return (
        <div className="comment-section">
            <h3>댓글</h3>

            <form onSubmit={handleSubmit} className="comment-form">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyTo ? '답글을 입력하세요...' : '댓글을 입력하세요...'}
                    className="comment-input"
                    rows={3}
                />
                <div className="comment-form-actions">
                    {replyTo && (
                        <button type="button" onClick={() => setReplyTo(null)}>답글 취소</button>
                    )}
                    <button type="submit" disabled={loading}>
                        {loading ? '게시 중...' : '게시'}
                    </button>
                </div>
            </form>

            <div className="comments-list">
                {comments.map(comment => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        onReply={handleReply}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
        </div>
    )
}

export default CommentSection