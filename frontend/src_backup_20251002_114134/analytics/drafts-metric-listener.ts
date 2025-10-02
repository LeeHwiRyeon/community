import { API_BASE } from '../api'

const EVENT_NAME = 'drafts.metric'
const DEDUPE_WINDOW_MS = 2000

interface DraftMetricDetail {
  name: string
  status: string
  error: string | null
  reason: string
  origin: string
  boardId: string
  draftId: string | null
  timestamp: string
  httpStatus?: number
}

interface DraftMetricEvent extends CustomEvent<DraftMetricDetail> {}

type CleanupFn = () => void

type ConflictOutcome = 'keep_local' | 'reload_remote'

type ConflictReason = 'conflict_warning' | 'http_conflict'

interface ConflictDetectedDetail {
  name: 'draft_conflict_detected'
  boardId: string
  draftId: string | null
  reason: ConflictReason
  origin: string
  timestamp: string
}

interface ConflictResolvedDetail {
  name: 'draft_conflict_resolved'
  boardId: string
  draftId: string | null
  outcome: ConflictOutcome
  timestamp: string
}

let cleanup: CleanupFn | null = null
const recentEmits = new Map<string, number>()

const shouldForward = (detail: DraftMetricDetail): boolean => {
  const key = `${detail.reason}:${detail.status}:${detail.draftId ?? 'anonymous'}`
  const now = Date.now()
  const last = recentEmits.get(key)
  if (last && now - last < DEDUPE_WINDOW_MS) {
    return false
  }
  recentEmits.set(key, now)
  return true
}

const forwardMetric = async (detail: DraftMetricDetail) => {
  if (!shouldForward(detail)) {
    return
  }

  try {
    await fetch(`${API_BASE}/client-metric`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ metrics: [detail] })
    })
  } catch (error) {
    console.warn('[draft-metric] failed to forward metric', error)
  }
}

const handleMetricEvent = (event: Event) => {
  const metricEvent = event as DraftMetricEvent
  if (!metricEvent.detail) {
    return
  }
  void forwardMetric(metricEvent.detail)
}

const forwardConflictEvent = <T extends ConflictDetectedDetail | ConflictResolvedDetail>(
  eventName: string,
  detail: T
) => {
  if (typeof window === 'undefined') {
    return
  }
  window.dispatchEvent(new CustomEvent(eventName, { detail }))
}

export const emitConflictDetected = (
  boardId: string,
  draftId: string | null,
  reason: ConflictReason,
  origin: string
): void => {
  const detail: ConflictDetectedDetail = {
    name: 'draft_conflict_detected',
    boardId,
    draftId,
    reason,
    origin,
    timestamp: new Date().toISOString()
  }
  forwardConflictEvent('draft_conflict_detected', detail)
}

export const emitConflictResolved = (
  boardId: string,
  draftId: string | null,
  outcome: ConflictOutcome
): void => {
  const detail: ConflictResolvedDetail = {
    name: 'draft_conflict_resolved',
    boardId,
    draftId,
    outcome,
    timestamp: new Date().toISOString()
  }
  forwardConflictEvent('draft_conflict_resolved', detail)
}

export const startDraftMetricListener = (): void => {
  if (typeof window === 'undefined' || cleanup) {
    return
  }
  window.addEventListener(EVENT_NAME, handleMetricEvent as EventListener)
  cleanup = () => {
    window.removeEventListener(EVENT_NAME, handleMetricEvent as EventListener)
    cleanup = null
  }
}

export const stopDraftMetricListener = (): void => {
  if (cleanup) {
    cleanup()
  }
}