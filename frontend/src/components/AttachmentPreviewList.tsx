import React from 'react'
import type { AttachmentLifecycleStatus } from './AttachmentUploader'

export interface AttachmentPreviewItem {
  clientId: string
  attachmentId?: string
  name: string
  mimeType: string
  size: number
  status: AttachmentLifecycleStatus
  progress: number
  variants?: Array<Record<string, unknown>>
  metadata?: Record<string, unknown>
  errorMessage?: string | null
}

interface AttachmentPreviewListProps {
  items: AttachmentPreviewItem[]
  onRemove: (clientId: string) => void
  onRetry: (clientId: string) => void
}

export const AttachmentPreviewList: React.FC<AttachmentPreviewListProps> = ({ items, onRemove, onRetry }) => {
  if (!items.length) {
    return null
  }

  return (
    <div className="attachment-preview-list">
      {items.map((item) => (
        <article key={item.clientId} className={`attachment-preview-item status-${item.status}`}>
          <div className="attachment-preview-thumb" aria-hidden>
            {renderThumbnail(item)}
          </div>
          <div className="attachment-preview-meta">
            <div className="attachment-preview-name" title={item.name}>{item.name}</div>
            <div className="attachment-preview-sub">{`${formatBytes(item.size)} • ${item.mimeType || 'unknown type'}`}</div>
            <div className="attachment-preview-status" aria-live="polite">{renderStatus(item)}</div>
          </div>
          <div className="attachment-preview-actions">
            {item.status === 'error' ? (
              <button type="button" className="attachment-btn retry" onClick={() => onRetry(item.clientId)}>
                Retry
              </button>
            ) : null}
            <button type="button" className="attachment-btn remove" onClick={() => onRemove(item.clientId)}>
              Remove
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

function renderStatus(item: AttachmentPreviewItem): React.ReactNode {
  if (item.status === 'uploading' || item.status === 'signing' || item.status === 'completing') {
    return (
      <span>
        Uploading...
        <progress value={item.progress} max={100} aria-label="upload progress" />
      </span>
    )
  }

  if (item.status === 'processing') {
    return 'Processing attachments...'
  }

  if (item.status === 'ready') {
    return 'Ready'
  }

  if (item.status === 'error') {
    return item.errorMessage || 'Upload failed'
  }

  return 'Pending'
}

function renderThumbnail(item: AttachmentPreviewItem): React.ReactNode {
  const type = item.mimeType || ''
  if (type.startsWith('image/')) {
    const previewVariant = Array.isArray(item.variants)
      ? item.variants.find((variant) => typeof (variant as any)?.previewUrl === 'string')
      : null
    const previewUrl = previewVariant ? (previewVariant as any).previewUrl : null
    if (typeof previewUrl === 'string') {
      return <img src={previewUrl} alt="Attachment preview" />
    }
    return <div className="attachment-thumb placeholder image" />
  }
  if (type.startsWith('video/')) {
    return <div className="attachment-thumb placeholder video" />
  }
  if (type.startsWith('audio/')) {
    return <div className="attachment-thumb placeholder audio" />
  }
  if (type === 'application/pdf') {
    return <div className="attachment-thumb placeholder pdf" />
  }
  return <div className="attachment-thumb placeholder file" />
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}
