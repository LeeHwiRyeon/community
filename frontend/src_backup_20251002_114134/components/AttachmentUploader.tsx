import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AttachmentRecord,
  AttachmentQueueStatus,
  completeAttachmentUpload,
  fetchAttachmentRecord,
  requestAttachmentSignature
} from '../api/attachments'
import { AttachmentPreviewList, AttachmentPreviewItem } from './AttachmentPreviewList'

export type AttachmentLifecycleStatus =
  | 'signing'
  | 'uploading'
  | 'completing'
  | 'processing'
  | 'ready'
  | 'error'

export interface AttachmentSelection {
  attachmentId: string
  status: AttachmentQueueStatus | AttachmentLifecycleStatus
  originalName: string | null
  mimeType: string
  size: number
  fileKey: string
  variants: AttachmentRecord['variants']
  metadata: AttachmentRecord['metadata']
  errorMessage?: string | null
}

interface AttachmentUploaderProps {
  value?: AttachmentSelection[]
  onChange?: (attachments: AttachmentSelection[]) => void
  onError?: (error: Error) => void
  maxFiles?: number
}

interface UploadItem extends AttachmentPreviewItem {
  clientId: string
  file?: File
  fileKey?: string
  attachmentId?: string
  pollAttempts: number
}

const POLL_INTERVAL_MS = 4000
const MAX_POLL_ATTEMPTS = 15
const DEFAULT_MAX_FILES = 5

function createClientId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID()
  }
  return `client-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  value,
  onChange,
  onError,
  maxFiles = DEFAULT_MAX_FILES
}) => {
  const [items, setItems] = useState<UploadItem[]>(() => (value ? mapSelectionsToItems(value) : []))
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!value) return
    setItems((current) => {
      const existingIds = new Set(current.filter((item) => item.attachmentId).map((item) => item.attachmentId))
      const additions = value.filter((selection) => !existingIds.has(selection.attachmentId))
      if (!additions.length) {
        return current
      }
      const mapped = additions.map((selection) => selectionToItem(selection))
      return [...current, ...mapped]
    })
  }, [value])

  useEffect(() => {
    const selections = items
      .filter((item) => item.attachmentId && item.status !== 'error')
      .map((item) => itemToSelection(item))
    onChange?.(selections)
  }, [items, onChange])

  useEffect(() => {
    const pending = items.filter((item) => item.attachmentId && item.status === 'processing' && item.pollAttempts < MAX_POLL_ATTEMPTS)
    if (!pending.length) {
      return
    }

    const timer = window.setTimeout(async () => {
      const updates = await Promise.all(
        pending.map(async (item) => {
          try {
            const record = await fetchAttachmentRecord(item.attachmentId as string)
            return { item, record }
          } catch (error) {
            console.warn('[attachment] poll failed', error)
            return { item, record: null }
          }
        })
      )

      setItems((current) =>
        current.map((existing) => {
          const update = updates.find((entry) => entry.item.clientId === existing.clientId)
          if (!update) {
            return existing
          }
          if (!update.record) {
            return { ...existing, pollAttempts: existing.pollAttempts + 1 }
          }
          const status = normalizeStatus(update.record.status)
          return {
            ...existing,
            status,
            attachmentId: update.record.attachmentId,
            fileKey: update.record.fileKey,
            variants: update.record.variants,
            metadata: update.record.metadata,
            errorMessage: update.record.errorMessage ?? null,
            pollAttempts: status === 'ready' ? MAX_POLL_ATTEMPTS : existing.pollAttempts + 1
          }
        })
      )
    }, POLL_INTERVAL_MS)

    return () => window.clearTimeout(timer)
  }, [items])

  const handleFileInputClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files?.length) return
    ingestFiles(Array.from(files))
    event.target.value = ''
  }, [])

  const ingestFiles = useCallback(
    (files: File[]) => {
      if (!files.length) return
      const activeCount = items.filter((item) => item.status !== 'error').length
      const available = Math.max(0, maxFiles - activeCount)
      if (available === 0) {
        return
      }
      files.slice(0, available).forEach((file) => {
        void startUpload(file)
      })
    },
    [items, maxFiles, startUpload]
  )

  const startUpload = useCallback(async (file: File) => {
    const clientId = createClientId()
    setItems((current) => {
      const activeCount = current.filter((item) => item.status !== 'error').length
      if (activeCount >= maxFiles) {
        return current
      }
      return [...current, createUploadItem(file, clientId)]
    })

    try {
      const signature = await requestAttachmentSignature(file)
      setItems((current) =>
        current.map((item) => (item.clientId === clientId ? { ...item, status: 'uploading', fileKey: signature.fileKey } : item))
      )

      await uploadWithProgress(signature.uploadUrl, signature.method, signature.headers, file, (progress) => {
        setItems((current) =>
          current.map((item) => (item.clientId === clientId ? { ...item, progress } : item))
        )
      })

      setItems((current) =>
        current.map((item) => (item.clientId === clientId ? { ...item, status: 'completing', progress: 100 } : item))
      )

      const record = await completeAttachmentUpload({
        fileKey: signature.fileKey,
        mimeType: signature.contentType,
        size: file.size,
        originalName: file.name
      })

      setItems((current) =>
        current.map((item) =>
          item.clientId === clientId
            ? {
                ...item,
                attachmentId: record.attachmentId,
                status: normalizeStatus(record.status),
                fileKey: record.fileKey,
                variants: record.variants,
                metadata: record.metadata,
                pollAttempts: record.status === 'ready' ? MAX_POLL_ATTEMPTS : 1
              }
            : item
        )
      )
    } catch (error) {
      console.error('[attachment] upload failed', error)
      onError?.(error as Error)
      setItems((current) =>
        current.map((item) =>
          item.clientId === clientId
            ? {
                ...item,
                status: 'error',
                errorMessage: deriveErrorMessage(error)
              }
            : item
        )
      )
    }
  }, [onError, maxFiles])

  const removeItem = useCallback((clientId: string) => {
    setItems((current) => current.filter((item) => item.clientId !== clientId))
  }, [])

  const retryItem = useCallback((clientId: string) => {
    const target = items.find((item) => item.clientId === clientId)
    if (!target || !target.file) {
      return
    }
    setItems((current) => current.filter((item) => item.clientId !== clientId))
    void startUpload(target.file)
  }, [items, startUpload])

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDragging(false)
      const files = Array.from(event.dataTransfer.files || [])
      ingestFiles(files)
    },
    [ingestFiles]
  )

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!isDragging) setIsDragging(true)
  }, [isDragging])

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }, [])

  const dropzoneClass = useMemo(() => {
    const base = 'attachment-uploader-dropzone'
    if (isDragging) return `${base} is-dragging`
    if (items.length >= maxFiles) return `${base} is-disabled`
    return base
  }, [isDragging, items.length, maxFiles])

  return (
    <div className="attachment-uploader">
      <div
        className={dropzoneClass}
        onClick={handleFileInputClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleFileInputClick()
          }
        }}
        aria-disabled={items.filter((item) => item.status !== "error").length >= maxFiles}
      >
        <p className="attachment-uploader-instructions">
          Drag & drop files here or <span className="link">browse</span>
        </p>
        <p className="attachment-uploader-hint">Supports images, video, audio, and PDF up to the configured limit.</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="attachment-uploader-input"
        aria-hidden
        onChange={handleFileInputChange}
      />

      <AttachmentPreviewList items={items} onRemove={removeItem} onRetry={retryItem} />
    </div>
  )
}

function mapSelectionsToItems(selections: AttachmentSelection[]): UploadItem[] {
  return selections.map((selection) => selectionToItem(selection))
}

function selectionToItem(selection: AttachmentSelection): UploadItem {
  return {
    clientId: createClientId(),
    attachmentId: selection.attachmentId,
    fileKey: selection.fileKey,
    name: selection.originalName ?? 'attachment',
    mimeType: selection.mimeType,
    size: selection.size,
    status: selection.status === 'ready' || selection.status === 'processing' ? selection.status : normalizeStatus(selection.status as AttachmentQueueStatus),
    progress: selection.status === 'ready' ? 100 : 0,
    variants: selection.variants,
    metadata: selection.metadata,
    errorMessage: selection.errorMessage ?? null,
    pollAttempts: selection.status === 'ready' ? MAX_POLL_ATTEMPTS : 0
  }
}

function itemToSelection(item: UploadItem): AttachmentSelection {
  return {
    attachmentId: item.attachmentId as string,
    status: item.status,
    originalName: item.name,
    mimeType: item.mimeType,
    size: item.size,
    fileKey: item.fileKey || '',
    variants: item.variants || [],
    metadata: (item.metadata as Record<string, unknown>) || {},
    errorMessage: item.errorMessage ?? null
  }
}

function createUploadItem(file: File, clientId: string = createClientId()): UploadItem {
  return {
    clientId,
    file,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    status: 'signing',
    progress: 0,
    pollAttempts: 0,
    metadata: {},
    variants: []
  }
}

function normalizeStatus(status: AttachmentQueueStatus | string): AttachmentLifecycleStatus | AttachmentQueueStatus {
  switch (status) {
    case 'ready':
      return 'ready'
    case 'failed':
      return 'error'
    case 'queued':
    case 'processing':
      return 'processing'
    default:
      return 'processing'
  }
}

function deriveErrorMessage(error: unknown): string {
  if (error instanceof Error && (error as any).detail?.error === 'unsupported_type') {
    return 'This file type is not supported.'
  }
  if (error instanceof Error && (error as any).detail?.error === 'size_exceeded') {
    const maxSize = (error as any).detail?.maxSize
    if (maxSize) {
      const megabytes = Math.round((Number(maxSize) / (1024 * 1024)) * 10) / 10
      return `File size exceeds the maximum of ${megabytes} MB.`
    }
    return 'File size exceeds the maximum allowed.'
  }
  if (error instanceof Error) {
    return error.message || 'Upload failed.'
  }
  return 'Upload failed.'
}

async function uploadWithProgress(
  url: string,
  method: string,
  headers: Record<string, string>,
  file: File,
  onProgress: (progress: number) => void
): Promise<void> {
  if (typeof XMLHttpRequest === 'undefined') {
    await fetch(url, {
      method,
      headers,
      body: file
    })
    onProgress(100)
    return
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method || 'PUT', url, true)
    Object.entries(headers || {}).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value)
    })

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      const progress = Math.round((event.loaded / event.total) * 100)
      onProgress(progress)
    }

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== XMLHttpRequest.DONE) return
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100)
        resolve()
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Upload network error'))
    xhr.send(file)
  })
}

