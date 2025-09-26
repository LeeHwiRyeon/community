import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import { API_BASE } from "../api"
import { emitConflictDetected, emitConflictResolved } from "../analytics/drafts-metric-listener"

const AUTO_SAVE_DEBOUNCE_MS = 1500
const AUTO_SAVE_INTERVAL_MS = 15000
const REQUEST_TIMEOUT_MS = 8000

export type DraftStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error' | 'conflict'
export type DraftErrorCode = 'save_failed' | 'load_failed' | 'rate_limited' | 'conflict' | null

export interface PostDraft {
    id: string
    post_id: string | null
    author_id: number
    title: string
    content: string
    metadata: unknown
    status: 'active' | 'archived' | 'conflict'
    created_at: string | null
    updated_at: string | null
    expires_at: string | null
    conflict_warning?: boolean
}

export interface DraftPayloadInput {
    title?: string
    content?: string
    metadata?: unknown
    post_id?: string | null
}

interface StorageRecord {
    draftId: string
    updatedAt?: string | null
    snapshot?: string
    lastSavedAt?: string | null
}


type DraftMetricReason = 'conflict_warning' | 'http_conflict' | 'rate_limited' | 'save_failed' | 'load_failed'

export type DraftConflictResolutionStrategy = 'keepLocal' | 'reloadRemote'

interface DraftMetricDetail {
    name: 'drafts.save.failure'
    status: DraftStatus
    error: DraftErrorCode
    reason: DraftMetricReason
    origin: 'manual' | 'debounce' | 'interval'
    boardId: string
    draftId: string | null
    timestamp: string
    httpStatus?: number
}

const dispatchDraftMetric = (detail: DraftMetricDetail) => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('drafts.metric', { detail }))
}

class DraftApiError extends Error {
    status: number
    data: unknown

    constructor(status: number, data: unknown, message?: string) {
        super(message ?? `Draft API Error: ${status}`)
        this.name = 'DraftApiError'
        this.status = status
        this.data = data
    }
}

async function draftRequest<T>(path: string, init: RequestInit = {}): Promise<{ status: number; data: T | null }> {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
        const response = await fetch(`${API_BASE}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                ...init.headers
            },
            credentials: 'include',
            ...init,
            signal: controller.signal
        })

        const text = await response.text()
        const data = text ? (JSON.parse(text) as T) : null

        if (!response.ok) {
            throw new DraftApiError(response.status, data)
        }

        return { status: response.status, data }
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new DraftApiError(408, null, 'Draft request timed out')
        }
        throw error
    } finally {
        window.clearTimeout(timeoutId)
    }
}

export interface UseDraftAutoSaveOptions<TFormValues> {
    form: UseFormReturn<TFormValues>
    boardId: string
    postId?: string | null
    storageKey?: string
    isEnabled?: boolean
    mapFormToDraft: (values: TFormValues) => DraftPayloadInput
    mapDraftToForm?: (draft: PostDraft, currentValues: TFormValues) => Partial<TFormValues>
}

interface DraftControllerState {
    status: DraftStatus
    lastSavedAt: string | null
    error: DraftErrorCode
    conflictDraft: PostDraft | null
}

interface UseDraftAutoSaveResult {
    status: DraftStatus
    error: DraftErrorCode
    lastSavedAt: string | null
    draftId: string | null
    conflictDraft: PostDraft | null
    triggerSave: () => Promise<void>
    clearDraft: () => Promise<void>
    resolveConflict: (strategy: DraftConflictResolutionStrategy) => Promise<boolean>
}

export function useDraftAutoSave<TFormValues extends Record<string, any>>(
    options: UseDraftAutoSaveOptions<TFormValues>
): UseDraftAutoSaveResult {
    const { form, boardId, postId, mapFormToDraft, storageKey: storageKeyProp, isEnabled = true } = options
    const mapDraftToForm = options.mapDraftToForm
    const resolvedStorageKey = useMemo(() => {
        if (storageKeyProp) return storageKeyProp
        if (postId) return `draft:post:${postId}`
        return `draft:new:${boardId}`
    }, [boardId, postId, storageKeyProp])

    const initialRecord = useMemo(() => {
        if (typeof window === 'undefined') {
            return { draftId: null as string | null, updatedAt: null, snapshot: '', lastSavedAt: null }
        }
        try {
            const raw = window.localStorage.getItem(resolvedStorageKey)
            if (!raw) {
                return { draftId: null as string | null, updatedAt: null, snapshot: '', lastSavedAt: null }
            }
            const parsed = JSON.parse(raw) as StorageRecord
            return {
                draftId: parsed?.draftId ?? null,
                updatedAt: parsed?.updatedAt ?? null,
                snapshot: parsed?.snapshot ?? '',
                lastSavedAt: parsed?.lastSavedAt ?? null
            }
        } catch {
            return { draftId: null as string | null, updatedAt: null, snapshot: '', lastSavedAt: null }
        }
    }, [resolvedStorageKey])

    const [draftId, setDraftIdState] = useState<string | null>(initialRecord.draftId)
    const draftIdRef = useRef<string | null>(initialRecord.draftId)
    const emitFailureMetric = useCallback(
        (input: { status: DraftStatus; error: DraftErrorCode; reason: DraftMetricReason; origin: 'manual' | 'debounce' | 'interval'; httpStatus?: number }) => {
            dispatchDraftMetric({
                name: 'drafts.save.failure',
                status: input.status,
                error: input.error,
                reason: input.reason,
                origin: input.origin,
                httpStatus: input.httpStatus,
                boardId,
                draftId: draftIdRef.current,
                timestamp: new Date().toISOString()
            })
        },
        [boardId]
    )
    const [controllerState, setControllerState] = useState<DraftControllerState>(() => ({
        status: initialRecord.draftId ? 'loading' : 'idle',
        lastSavedAt: initialRecord.lastSavedAt ?? null,
        error: null,
        conflictDraft: null
    }))

    const controllerStateRef = useRef(controllerState)

    useEffect(() => {
        controllerStateRef.current = controllerState
    }, [controllerState])

    const lastSavedSnapshotRef = useRef<string>(initialRecord.snapshot ?? '')
    const lastUpdatedAtRef = useRef<string | null>(initialRecord.updatedAt ?? null)
    const hydrationReadyRef = useRef<boolean>(initialRecord.draftId ? false : true)
    const pendingValuesRef = useRef<TFormValues | null>(null)
    const debounceTimerRef = useRef<number | null>(null)
    const savingRef = useRef<boolean>(false)

    const updateDraftId = useCallback((nextId: string | null) => {
        draftIdRef.current = nextId
        setDraftIdState(nextId)
    }, [])

    const persistRecord = useCallback(
        (record: StorageRecord | null) => {
            if (typeof window === 'undefined') return
            if (!record) {
                window.localStorage.removeItem(resolvedStorageKey)
                return true
            }
            window.localStorage.setItem(resolvedStorageKey, JSON.stringify(record))
        },
        [resolvedStorageKey]
    )

    const setState = useCallback(
        (updater: (prev: DraftControllerState) => DraftControllerState) => {
            setControllerState(prev => updater(prev))
        },
        []
    )

    const runSave = useCallback(
        async (origin: 'manual' | 'debounce' | 'interval' = 'manual') => {
            if (!isEnabled) return
            if (!hydrationReadyRef.current) return
            if (savingRef.current) return

            const latestValues = pendingValuesRef.current ?? form.getValues()
            const payloadBase = mapFormToDraft(latestValues)
            const payload: DraftPayloadInput = {
                ...payloadBase,
                post_id: payloadBase.post_id ?? (postId ?? null)
            }

            const snapshot = JSON.stringify(payload)

            const hasSubstantiveContent = Boolean((payload.title ?? '').trim()) || Boolean((payload.content ?? '').trim())
            if (!draftIdRef.current && !hasSubstantiveContent) {
                return
            }

            if (origin !== 'manual' && snapshot === lastSavedSnapshotRef.current) {
                return
            }

            savingRef.current = true
            setState(prev => ({ ...prev, status: 'saving', error: null }))

            try {
                let draftResponse: PostDraft | null = null

                if (!draftIdRef.current) {
                    const { data } = await draftRequest<PostDraft>('/posts/drafts', {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    })
                    draftResponse = data
                    if (draftResponse) {
                        updateDraftId(draftResponse.id)
                    }
                } else {
                    const headers: HeadersInit = {}
                    if (lastUpdatedAtRef.current) {
                        headers['If-Unmodified-Since'] = lastUpdatedAtRef.current
                    }
                    const { data } = await draftRequest<PostDraft>(`/posts/drafts/${draftIdRef.current}`, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify(payload)
                    })
                    draftResponse = data
                }

                if (draftResponse) {
                    lastSavedSnapshotRef.current = snapshot
                    lastUpdatedAtRef.current = draftResponse.updated_at ?? draftResponse.created_at ?? null
                    const record: StorageRecord = {
                        draftId: draftResponse.id,
                        updatedAt: lastUpdatedAtRef.current,
                        snapshot,
                        lastSavedAt: draftResponse.updated_at ?? draftResponse.created_at ?? null
                    }
                    persistRecord(record)
                    setState(prev => ({
                        ...prev,
                        status: draftResponse.conflict_warning ? 'conflict' : 'saved',
                        lastSavedAt: record.lastSavedAt ?? prev.lastSavedAt,
                        error: draftResponse.conflict_warning ? 'conflict' : null,
                        conflictDraft: draftResponse.conflict_warning ? draftResponse : null
                    }))
                    if (draftResponse.conflict_warning) {
                        emitFailureMetric({
                            status: 'conflict',
                            error: 'conflict',
                            reason: 'conflict_warning',
                            origin
                        })
                        emitConflictDetected(boardId, draftResponse.id ?? draftIdRef.current ?? null, 'conflict_warning', origin)
                    }
                }
            } catch (error) {
                if (error instanceof DraftApiError) {
                    if (error.status === 409) {
                        setState(prev => ({
                            ...prev,
                            status: 'conflict',
                            error: 'conflict',
                            conflictDraft: (error.data as { draft?: PostDraft })?.draft ?? null
                        }))
                        emitFailureMetric({
                            status: 'conflict',
                            error: 'conflict',
                            reason: 'http_conflict',
                            origin,
                            httpStatus: 409
                        })
                        emitConflictDetected(boardId, draftIdRef.current ?? null, 'http_conflict', origin)
                    } else if (error.status === 429) {
                        setState(prev => ({ ...prev, status: 'error', error: 'rate_limited' }))
                        emitFailureMetric({
                            status: 'error',
                            error: 'rate_limited',
                            reason: 'rate_limited',
                            origin,
                            httpStatus: 429
                        })
                    } else if (error.status === 404) {
                        persistRecord(null)
                        updateDraftId(null)
                        lastSavedSnapshotRef.current = ''
                        lastUpdatedAtRef.current = null
                        setState(prev => ({ ...prev, status: 'idle', error: 'load_failed', conflictDraft: null }))
                        emitFailureMetric({
                            status: 'error',
                            error: 'load_failed',
                            reason: 'load_failed',
                            origin,
                            httpStatus: 404
                        })
                    } else {
                        setState(prev => ({ ...prev, status: 'error', error: 'save_failed' }))
                        emitFailureMetric({
                            status: 'error',
                            error: 'save_failed',
                            reason: 'save_failed',
                            origin,
                            httpStatus: error.status
                        })
                    }
                } else {
                    setState(prev => ({ ...prev, status: 'error', error: 'save_failed' }))
                    emitFailureMetric({
                        status: 'error',
                        error: 'save_failed',
                        reason: 'save_failed',
                        origin
                    })
                }

            } finally {
                savingRef.current = false
            }
        },
        [form, isEnabled, mapFormToDraft, persistRecord, postId, setState, updateDraftId, emitFailureMetric]
    )

    const scheduleSave = useCallback(
        () => {
            if (!isEnabled) return
            if (!hydrationReadyRef.current) return
            if (debounceTimerRef.current) {
                window.clearTimeout(debounceTimerRef.current)
            }
            debounceTimerRef.current = window.setTimeout(() => {
                debounceTimerRef.current = null
                void runSave('debounce')
            }, AUTO_SAVE_DEBOUNCE_MS)
        },
        [isEnabled, runSave]
    )

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                window.clearTimeout(debounceTimerRef.current)
            }
        }
    }, [])

    useEffect(() => {
        if (!draftId || hydrationReadyRef.current) {
            return
        }
        let cancelled = false

        const hydrate = async () => {
            try {
                const { data } = await draftRequest<PostDraft>(`/posts/drafts/${draftId}`, { method: 'GET' })
                if (cancelled) return
                if (!data) {
                    persistRecord(null)
                    updateDraftId(null)
                    hydrationReadyRef.current = true
                    setState(prev => ({ ...prev, status: 'idle', error: 'load_failed', conflictDraft: null }))
                    return
                }

                const currentValues = form.getValues()
                const mapped = mapDraftToForm ? mapDraftToForm(data, currentValues) : undefined
                if (mapped && Object.keys(mapped).length > 0) {
                    form.reset({ ...currentValues, ...mapped }, { keepDirty: false })
                }
                lastUpdatedAtRef.current = data.updated_at ?? data.created_at ?? null
                const snapshotPayload = mapFormToDraft(form.getValues())
                snapshotPayload.post_id = snapshotPayload.post_id ?? (postId ?? null)
                lastSavedSnapshotRef.current = JSON.stringify(snapshotPayload)
                hydrationReadyRef.current = true
                setState(prev => ({
                    ...prev,
                    status: 'saved',
                    lastSavedAt: data.updated_at ?? data.created_at ?? prev.lastSavedAt,
                    error: null,
                    conflictDraft: null
                }))
            } catch (error) {
                if (cancelled) return
                if (error instanceof DraftApiError && error.status === 404) {
                    persistRecord(null)
                    updateDraftId(null)
                    setState(prev => ({ ...prev, status: 'idle', error: 'load_failed', conflictDraft: null }))
                } else {
                    setState(prev => ({ ...prev, status: 'error', error: 'load_failed' }))
                }
                hydrationReadyRef.current = true
            }
        }

        hydrate()

        return () => {
            cancelled = true
        }
    }, [draftId, form, mapDraftToForm, mapFormToDraft, persistRecord, postId, updateDraftId, setState])

    useEffect(() => {
        if (!isEnabled) return
        const subscription = form.watch(values => {
            pendingValuesRef.current = values as TFormValues
            if (!hydrationReadyRef.current) {
                return
            }
            scheduleSave()
        })
        return () => subscription.unsubscribe()
    }, [form, isEnabled, scheduleSave])

    useEffect(() => {
        if (!isEnabled) return undefined
        const intervalId = window.setInterval(() => {
            pendingValuesRef.current = form.getValues()
            void runSave('interval')
        }, AUTO_SAVE_INTERVAL_MS)
        return () => {
            window.clearInterval(intervalId)
        }
    }, [form, isEnabled, runSave])

    const resolveConflict = useCallback(async (strategy: DraftConflictResolutionStrategy): Promise<boolean> => {
        const currentDraftId = draftIdRef.current
        if (strategy === 'keepLocal') {
            const conflict = controllerStateRef.current.conflictDraft
            if (conflict) {
                lastUpdatedAtRef.current = conflict.updated_at ?? conflict.created_at ?? lastUpdatedAtRef.current
            }
            pendingValuesRef.current = form.getValues()
            await runSave('manual')
            if (controllerStateRef.current.status !== 'conflict') {
                emitConflictResolved(boardId, draftIdRef.current ?? currentDraftId ?? null, 'keep_local')
                return true
            }
            return false
        }

        if (strategy === 'reloadRemote') {
            let draft = controllerStateRef.current.conflictDraft
            if (!draft && draftIdRef.current) {
                try {
                    const { data } = await draftRequest<PostDraft>(`/posts/drafts/${draftIdRef.current}`, { method: 'GET' })
                    draft = data ?? undefined
                } catch (error) {
                    console.warn('[draft] failed to load remote draft during conflict resolution', error)
                }
            }

            if (!draft) {
                setState(prev => ({ ...prev, status: 'saved', error: null, conflictDraft: null }))
                emitConflictResolved(boardId, draftIdRef.current ?? currentDraftId ?? null, 'reload_remote')
                return true
            }

            const currentValues = form.getValues()
            const mapped = mapDraftToForm ? mapDraftToForm(draft, currentValues) : undefined
            if (mapped && Object.keys(mapped).length > 0) {
                form.reset({ ...currentValues, ...mapped }, { keepDirty: false })
            }

            lastUpdatedAtRef.current = draft.updated_at ?? draft.created_at ?? null
            const snapshotPayload = mapFormToDraft(form.getValues())
            snapshotPayload.post_id = snapshotPayload.post_id ?? (postId ?? null)
            const snapshot = JSON.stringify(snapshotPayload)
            lastSavedSnapshotRef.current = snapshot
            persistRecord({
                draftId: draft.id,
                updatedAt: lastUpdatedAtRef.current,
                snapshot,
                lastSavedAt: draft.updated_at ?? draft.created_at ?? null
            })

            setState(prev => ({
                ...prev,
                status: 'saved',
                lastSavedAt: draft.updated_at ?? draft.created_at ?? prev.lastSavedAt,
                error: null,
                conflictDraft: null
            }))
            emitConflictResolved(boardId, draft.id ?? draftIdRef.current ?? currentDraftId ?? null, 'reload_remote')
            return true
        }
        return false
    }, [boardId, form, mapDraftToForm, mapFormToDraft, persistRecord, postId, runSave, setState])

    const triggerSave = useCallback(async () => {
        pendingValuesRef.current = form.getValues()
        await runSave('manual')
    }, [form, runSave])

    const clearDraft = useCallback(async () => {
        const currentId = draftIdRef.current
        if (currentId) {
            try {
                await draftRequest(`/posts/drafts/${currentId}`, { method: 'DELETE' })
            } catch (error) {
                if (!(error instanceof DraftApiError) || error.status !== 404) {
                    console.warn('[draft] failed to delete remote draft', error)
                }
            }
        }
        persistRecord(null)
        updateDraftId(null)
        lastSavedSnapshotRef.current = ''
        lastUpdatedAtRef.current = null
        hydrationReadyRef.current = true
        setState(prev => ({ status: 'idle', lastSavedAt: null, error: null, conflictDraft: null }))
    }, [persistRecord, updateDraftId, setState])

    return {
        status: controllerState.status,
        error: controllerState.error,
        lastSavedAt: controllerState.lastSavedAt,
        draftId,
        conflictDraft: controllerState.conflictDraft,
        triggerSave,
        clearDraft,
        resolveConflict
    }
}
