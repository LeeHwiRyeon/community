import React from 'react'

interface SkeletonProps {
    className?: string
    width?: string | number
    height?: string | number
    borderRadius?: string | number
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    width = '100%',
    height = '1rem',
    borderRadius = '4px'
}) => {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width,
                height,
                borderRadius
            }}
        />
    )
}

interface PostCardSkeletonProps {
    className?: string
}

export const PostCardSkeleton: React.FC<PostCardSkeletonProps> = ({ className = '' }) => {
    return (
        <div className={`post-card-skeleton ${className}`}>
            <div className="post-card-skeleton__header">
                <Skeleton className="post-card-skeleton__title" height="20px" />
                <div className="post-card-skeleton__meta">
                    <Skeleton width="80px" height="14px" />
                    <Skeleton width="60px" height="14px" />
                    <Skeleton width="50px" height="14px" />
                </div>
            </div>
            <div className="post-card-skeleton__content">
                <Skeleton height="14px" />
                <Skeleton height="14px" width="80%" />
                <Skeleton height="14px" width="60%" />
            </div>
        </div>
    )
}

interface BoardCardSkeletonProps {
    className?: string
}

export const BoardCardSkeleton: React.FC<BoardCardSkeletonProps> = ({ className = '' }) => {
    return (
        <div className={`board-card-skeleton ${className}`}>
            <div className="board-card-skeleton__header">
                <div className="board-card-skeleton__title-section">
                    <Skeleton className="board-card-skeleton__title" height="18px" width="120px" />
                    <Skeleton width="60px" height="16px" />
                </div>
                <Skeleton height="14px" />
                <Skeleton height="14px" width="90%" />
            </div>
            <div className="board-card-skeleton__body">
                <Skeleton width="80px" height="12px" />
                <Skeleton width="70px" height="12px" />
                <Skeleton width="90px" height="12px" />
            </div>
        </div>
    )
}