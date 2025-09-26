import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { useToast } from "@chakra-ui/react"
import DraftConflictBanner from "../components/editor/DraftConflictBanner"
import DraftConflictModal from "../components/editor/DraftConflictModal"
import { useBoardsCatalog } from "../hooks/useBoardData"
import { useDraftAutoSave, type DraftPayloadInput, type DraftStatus, type PostDraft } from "../hooks/useDraftAutoSave"

type CreatePostFormValues = {
  title: string
  content: string
  category: string
}

const CreatePostPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>()
  const safeBoardId = boardId ?? "general"
  const navigate = useNavigate()
  const boardsQuery = useBoardsCatalog()
  const boards = boardsQuery.data ?? []
  const toast = useToast()

  const conflictStatusRef = useRef<DraftStatus | null>(null)
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [conflictBannerDismissed, setConflictBannerDismissed] = useState(false)
  const [pendingResolution, setPendingResolution] = useState<null | 'keep_local' | 'reload_remote'>(null)

  const form = useForm<CreatePostFormValues>({
    defaultValues: {
      title: "",
      content: "",
      category: ""
    }
  })

  const { register, handleSubmit, formState: { errors } } = form

  const mapFormToDraft = useCallback((values: CreatePostFormValues): DraftPayloadInput => ({
    title: values.title ?? "",
    content: values.content ?? "",
    metadata: {
      boardId: safeBoardId,
      category: values.category ?? ""
    }
  }), [safeBoardId])

  const mapDraftToForm = useCallback((draft: PostDraft, currentValues: CreatePostFormValues): Partial<CreatePostFormValues> => {
    const next: Partial<CreatePostFormValues> = {}
    if (typeof draft.title === "string" && draft.title !== currentValues.title) {
      next.title = draft.title
    }
    if (typeof draft.content === "string" && draft.content !== currentValues.content) {
      next.content = draft.content
    }
    if (draft.metadata && typeof draft.metadata === "object") {
      const meta = draft.metadata as Record<string, unknown>
      if (typeof meta.category === "string" && meta.category !== currentValues.category) {
        next.category = meta.category
      }
    }
    return next
  }, [])

  const {
    status: draftStatus,
    error: draftError,
    lastSavedAt,
    conflictDraft,
    triggerSave,
    clearDraft,
    resolveConflict
  } = useDraftAutoSave({
    form,
    boardId: safeBoardId,
    mapFormToDraft,
    mapDraftToForm
  })

  const currentBoard = boards.find(board => board.id === safeBoardId)

  const draftStatusMessage = useMemo(() => {
    switch (draftStatus) {
      case "loading":
        return "Restoring draft…"
      case "saving":
        return "Auto-saving…"
      case "saved":
        return lastSavedAt ? `Auto-saved (${new Date(lastSavedAt).toLocaleTimeString()})` : "Auto-save complete."
      case "conflict":
        return "This draft was updated elsewhere. Resolve the conflict before continuing."
      case "error":
        if (draftError === "rate_limited") {
          return "Auto-save is temporarily rate limited. Retrying shortly."
        }
        if (draftError === "load_failed") {
          return "Could not restore the previous draft. Start a new draft or reload the page."
        }
        return "Auto-save failed. Check your connection and try again."
      default:
        return null
    }
  }, [draftStatus, draftError, lastSavedAt])

  useEffect(() => {
    const previous = conflictStatusRef.current
    if (draftStatus === 'conflict' && previous !== 'conflict') {
      setShowConflictModal(true)
      setConflictBannerDismissed(false)
    }
    if (draftStatus !== 'conflict' && previous === 'conflict') {
      setShowConflictModal(false)
      setConflictBannerDismissed(false)
      if (pendingResolution === 'keep_local') {
        toast({ title: 'Local changes saved.', status: 'success', duration: 3000, isClosable: true })
      } else if (pendingResolution === 'reload_remote') {
        toast({ title: 'Latest server version loaded.', status: 'info', duration: 3000, isClosable: true })
      }
      setPendingResolution(null)
    }
    conflictStatusRef.current = draftStatus
  }, [draftStatus, pendingResolution, toast])

  const conflictVariant: 'soft' | 'hard' = conflictDraft?.conflict_warning ? 'soft' : 'hard'

  const handleKeepLocalConflict = useCallback(async () => {
    setPendingResolution('keep_local')
    const success = await resolveConflict('keepLocal')
    if (!success) {
      setPendingResolution(null)
      toast({
        title: 'Could not keep local changes.',
        description: 'Please retry after checking your network connection.',
        status: 'error',
        duration: 4000,
        isClosable: true
      })
    }
  }, [resolveConflict, toast])

  const handleReloadRemoteConflict = useCallback(async () => {
    setPendingResolution('reload_remote')
    const success = await resolveConflict('reloadRemote')
    if (!success) {
      setPendingResolution(null)
      toast({
        title: 'Reloading the server draft failed.',
        description: 'Verify connectivity and try again.',
        status: 'error',
        duration: 4000,
        isClosable: true
      })
    }
  }, [resolveConflict, toast])

  const handleConflictModalDismiss = useCallback(() => {
    setShowConflictModal(false)
    setConflictBannerDismissed(false)
  }, [])

  const handleConflictBannerDismiss = useCallback(() => {
    setConflictBannerDismissed(true)
  }, [])

  const onSubmit = async (data: CreatePostFormValues) => {
    try {
      await triggerSave()
    } catch (error) {
      console.warn("[draft] triggerSave before publish failed", error)
    }

    try {
      const response = await fetch(`/api/boards/${safeBoardId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await clearDraft()
        navigate(`/board/${safeBoardId}`)
      } else {
        alert('Publishing the post failed.')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert('An unexpected error occurred while creating the post.')
    }
  }

  if (!currentBoard) {
    return <div>Board not found.</div>
  }

  const showConflictBanner = draftStatus === 'conflict' && !conflictBannerDismissed

  return (
    <div className="create-post-page">
      <h1>{currentBoard.title} - Create Post</h1>

      {showConflictBanner && (
        <div className="draft-conflict-banner-wrapper">
          <DraftConflictBanner
            variant={conflictVariant}
            onKeepLocal={handleKeepLocalConflict}
            onReloadRemote={handleReloadRemoteConflict}
            onDismiss={handleConflictBannerDismiss}
          />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="create-post-form">
        <div
          className="draft-status"
          role="status"
          aria-live="polite"
          data-draft-status={draftStatus}
          data-draft-error={draftError ?? undefined}
        >
          {draftStatusMessage && <span>{draftStatusMessage}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            {...register('title', { required: 'Title is required.' })}
            className="form-input"
          />
          {errors.title && <span className="error">{errors.title.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <input
            id="category"
            type="text"
            {...register('category')}
            className="form-input"
            placeholder="Optional"
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            {...register('content', { required: 'Content is required.' })}
            className="form-textarea"
            rows={10}
          />
          {errors.content && <span className="error">{errors.content.message}</span>}
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">Publish</button>
          <button type="button" onClick={() => navigate(`/board/${safeBoardId}`)} className="cancel-btn">Cancel</button>
        </div>
      </form>

      <DraftConflictModal
        isOpen={showConflictModal}
        variant={conflictVariant}
        conflictDraft={conflictDraft}
        onKeepLocal={handleKeepLocalConflict}
        onReloadRemote={handleReloadRemoteConflict}
        onDismiss={handleConflictModalDismiss}
      />
    </div>
  )
}

export default CreatePostPage
