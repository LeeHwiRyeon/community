import { API_BASE } from '../api'

export interface AttachmentSignResponse {
  uploadUrl: string
  method: string
  headers: Record<string, string>
  expiresAt: string
  fileKey: string
  contentType: string
  bucket: string
  region: string
  maxSize: number
  scanRequired: boolean
  policy: {
    allowedTypes: string[]
    expiresInSec: number
  }
}

export interface AttachmentCompletePayload {
  fileKey: string
  mimeType: string
  size: number
  originalName: string
  checksum?: string | null
  draftId?: string | null
  postId?: string | null
  metadata?: Record<string, unknown> | null
}

export type AttachmentQueueStatus = 'queued' | 'processing' | 'ready' | 'failed'

export interface AttachmentRecord {
  attachmentId: string
  status: AttachmentQueueStatus
  fileKey: string
  mimeType: string
  size: number
  checksum: string | null
  originalName: string | null
  sourceType: 'draft' | 'post' | 'temp'
  sourceId: string | null
  variants: Array<Record<string, unknown>>
  metadata: Record<string, unknown> | null
  errorMessage?: string | null
  createdAt?: string
  updatedAt?: string
  queue?: {
    enqueued: boolean
    reason: string | null
  }
}

export async function requestAttachmentSignature(file: File): Promise<AttachmentSignResponse> {
  const response = await fetch(`${API_BASE}/attachments/sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size
    })
  })

  if (!response.ok) {
    const errorBody = await safeJson(response)
    const error = new Error('attachment_sign_failed')
    ;(error as any).status = response.status
    ;(error as any).detail = errorBody
    throw error
  }

  return response.json() as Promise<AttachmentSignResponse>
}

export async function completeAttachmentUpload(payload: AttachmentCompletePayload): Promise<AttachmentRecord> {
  const response = await fetch(`${API_BASE}/attachments/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errorBody = await safeJson(response)
    const error = new Error('attachment_complete_failed')
    ;(error as any).status = response.status
    ;(error as any).detail = errorBody
    throw error
  }

  return response.json() as Promise<AttachmentRecord>
}

export async function fetchAttachmentRecord(attachmentId: string): Promise<AttachmentRecord> {
  const response = await fetch(`${API_BASE}/attachments/${encodeURIComponent(attachmentId)}`, {
    method: 'GET',
    credentials: 'include'
  })

  if (!response.ok) {
    const errorBody = await safeJson(response)
    const error = new Error('attachment_fetch_failed')
    ;(error as any).status = response.status
    ;(error as any).detail = errorBody
    throw error
  }

  return response.json() as Promise<AttachmentRecord>
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}
