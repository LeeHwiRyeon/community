import React, { useCallback, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { AttachmentUploader, type AttachmentSelection } from "../components/AttachmentUploader"
import { usePostDetail } from "../hooks/usePostData"
import { useDraftAutoSave, type DraftPayloadInput, type PostDraft } from "../hooks/useDraftAutoSave"

type EditPostFormValues = {
  title: string
  content: string
  category: string
  attachments: AttachmentSelection[]
}

const EditPostPage: React.FC = () => {
  const { boardId, postId } = useParams<{ boardId: string; postId: string }>()
  const safeBoardId = boardId ?? "general"
  const navigate = useNavigate()
  const { data: post, isLoading } = usePostDetail(postId)

  const form = useForm<EditPostFormValues>({
    defaultValues: {
      title: "",
      content: "",
      category: "",
      attachments: []
    }
  })

  const attachments = form.watch("attachments") ?? []

  const { register, handleSubmit, setValue, formState: { errors } } = form

  const mapFormToDraft = useCallback((values: EditPostFormValues): DraftPayloadInput => ({
    title: values.title ?? "",
    content: values.content ?? "",
    metadata: {
      boardId: safeBoardId,
      category: values.category ?? "",
      attachments: values.attachments?.map(selectionToMetadata) ?? []
    },
    post_id: postId ?? null
  }), [postId, safeBoardId])

  const mapDraftToForm = useCallback((draft: PostDraft, currentValues: EditPostFormValues): Partial<EditPostFormValues> => {
    const next: Partial<EditPostFormValues> = {}
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
      if (Array.isArray((meta as any).attachments)) {
        const mapped = (meta as any).attachments
          .map(metadataToSelection)
          .filter((item): item is AttachmentSelection => Boolean(item))
        next.attachments = mapped
      }
    }
    return next
  }, [])

  const { status: draftStatus, error: draftError, lastSavedAt, triggerSave, clearDraft, draftId: activeDraftId } = useDraftAutoSave({
    form,
    boardId: safeBoardId,
    postId: postId ?? null,
    mapFormToDraft,
    mapDraftToForm
  })

  useEffect(() => {
    if (!post) return
    if (activeDraftId) return
    setValue("title", post.title)
    setValue("content", post.content || "")
    setValue("category", post.category || "")
  }, [post, setValue, activeDraftId])

  const draftStatusMessage = useMemo(() => {
    switch (draftStatus) {
      case "loading":
        return "Restoring draft..."
      case "saving":
        return "Auto-saving..."
      case "saved":
        return lastSavedAt ? `Auto-saved (${new Date(lastSavedAt).toLocaleTimeString()})` : "Auto-save complete."
      case "conflict":
        return "Changes were made elsewhere. Refresh to review before editing."
      case "error":
        if (draftError === "rate_limited") {
          return "Auto-save is temporarily delayed due to rate limits."
        }
        if (draftError === "load_failed") {
          return "Previous draft could not be restored."
        }
        return "Auto-save failed. Check your network connection."
      default:
        return null
    }
  }, [draftStatus, draftError, lastSavedAt])

  const onSubmit = async (data: EditPostFormValues) => {
    if (!postId || !safeBoardId) return

    try {
      await triggerSave()
    } catch (error) {
      console.warn("[draft] triggerSave before update failed", error)
    }

    try {
      const { attachments: _attachments, ...rest } = data
      const response = await fetch(`/api/boards/${safeBoardId}/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(rest)
      })

      if (response.ok) {
        await clearDraft()
        navigate(`/board/${safeBoardId}/post/${postId}`)
      } else {
        alert("Updating the post failed.")
      }
    } catch (error) {
      console.error("Error updating post:", error)
      alert("An unexpected error occurred while updating the post.")
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!post) {
    return <div>Post not found.</div>
  }

  return (
    <div className="edit-post-page">
      <h1>Edit Post</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="edit-post-form">
        <div className="draft-status" role="status" aria-live="polite">
          {draftStatusMessage}
        </div>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            {...register("title", { required: "Title is required." })}
            className="form-input"
          />
          {errors.title && <span className="error">{errors.title.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <input
            id="category"
            type="text"
            {...register("category")}
            className="form-input"
            placeholder="Optional"
          />
        </div>

        <div className="form-group">
          <label>Attachments</label>
          <AttachmentUploader
            value={attachments}
            onChange={(next) => form.setValue("attachments", next, { shouldDirty: true })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            {...register("content", { required: "Content is required." })}
            className="form-textarea"
            rows={10}
          />
          {errors.content && <span className="error">{errors.content.message}</span>}
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">Save changes</button>
          <button type="button" onClick={() => navigate(`/board/${safeBoardId}/post/${postId}`)} className="cancel-btn">Cancel</button>
        </div>
      </form>
    </div>
  )
}

export default EditPostPage

function selectionToMetadata(selection: AttachmentSelection) {
  return {
    attachmentId: selection.attachmentId,
    status: selection.status,
    originalName: selection.originalName,
    mimeType: selection.mimeType,
    size: selection.size,
    fileKey: selection.fileKey,
    variants: selection.variants,
    metadata: selection.metadata
  }
}

function metadataToSelection(entry: Record<string, unknown>): AttachmentSelection | null {
  const attachmentId = typeof entry.attachmentId === "string" ? entry.attachmentId : null
  if (!attachmentId) {
    return null
  }
  const mimeType = typeof entry.mimeType === "string" ? entry.mimeType : "application/octet-stream"
  const size = typeof entry.size === "number" ? entry.size : 0
  const status = typeof entry.status === "string" ? entry.status : "processing"
  const fileKey = typeof entry.fileKey === "string" ? entry.fileKey : ""
  const originalName = typeof entry.originalName === "string" ? entry.originalName : null
  const variants = Array.isArray(entry.variants) ? entry.variants as Array<Record<string, unknown>> : []
  const metadata = entry.metadata && typeof entry.metadata === "object" ? entry.metadata as Record<string, unknown> : {}

  return {
    attachmentId,
    status,
    originalName,
    mimeType,
    size,
    fileKey,
    variants,
    metadata
  }
}
