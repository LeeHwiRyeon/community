import React, { useCallback, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { usePostDetail } from "../hooks/usePostData"
import { useDraftAutoSave, type DraftPayloadInput, type PostDraft } from "../hooks/useDraftAutoSave"

type EditPostFormValues = {
    title: string
    content: string
    category: string
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
            category: ""
        }
    })

    const { register, handleSubmit, setValue, formState: { errors } } = form

    const mapFormToDraft = useCallback((values: EditPostFormValues): DraftPayloadInput => ({
        title: values.title ?? "",
        content: values.content ?? "",
        metadata: {
            boardId: safeBoardId,
            category: values.category ?? ""
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
        setValue('title', post.title)
        setValue('content', post.content || '')
        setValue('category', post.category || '')
    }, [post, setValue, activeDraftId])

    const draftStatusMessage = useMemo(() => {
        switch (draftStatus) {
            case "loading":
                return "임시 저장 불러오는 중…"
            case "saving":
                return "자동 저장 중…"
            case "saved":
                return lastSavedAt ? `자동 저장됨 (${new Date(lastSavedAt).toLocaleTimeString()})` : "자동 저장 완료"
            case "conflict":
                return "다른 기기에서 수정되었습니다. 새로고침 후 내용을 확인하세요."
            case "error":
                if (draftError === "rate_limited") {
                    return "자동 저장이 잠시 지연되고 있습니다. 잠시 후 다시 시도합니다."
                }
                if (draftError === "load_failed") {
                    return "이전 임시 저장을 불러오지 못했습니다. 새로 작성해 주세요."
                }
                return "자동 저장에 실패했습니다. 네트워크 상태를 확인해 주세요."
            default:
                return null
        }
    }, [draftStatus, draftError, lastSavedAt])

    const onSubmit = async (data: EditPostFormValues) => {
        if (!postId || !safeBoardId) return

        try {
            await triggerSave()
        } catch (error) {
            console.warn('[draft] triggerSave before update failed', error)
        }

        try {
            const response = await fetch(`/api/boards/${safeBoardId}/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (response.ok) {
                await clearDraft()
                navigate(`/board/${safeBoardId}/post/${postId}`)
            } else {
                alert('게시글 수정에 실패했습니다.')
            }
        } catch (error) {
            console.error('Error updating post:', error)
            alert('오류가 발생했습니다.')
        }
    }

    if (isLoading) {
        return <div>로딩 중...</div>
    }

    if (!post) {
        return <div>게시글을 찾을 수 없습니다.</div>
    }

    return (
        <div className="edit-post-page">
            <h1>게시글 수정</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="edit-post-form">
                <div className="draft-status" role="status" aria-live="polite">
                    {draftStatusMessage}
                </div>
                <div className="form-group">
                    <label htmlFor="title">제목</label>
                    <input
                        id="title"
                        type="text"
                        {...register('title', { required: '제목을 입력해 주세요.' })}
                        className="form-input"
                    />
                    {errors.title && <span className="error">{errors.title.message}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="category">카테고리</label>
                    <input
                        id="category"
                        type="text"
                        {...register('category')}
                        className="form-input"
                        placeholder="선택 입력"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="content">내용</label>
                    <textarea
                        id="content"
                        {...register('content', { required: '내용을 입력해 주세요.' })}
                        className="form-textarea"
                        rows={10}
                    />
                    {errors.content && <span className="error">{errors.content.message}</span>}
                </div>

                <div className="form-actions">
                    <button type="submit" className="submit-btn">수정하기</button>
                    <button type="button" onClick={() => navigate(`/board/${safeBoardId}/post/${postId}`)} className="cancel-btn">취소</button>
                </div>
            </form>
        </div>
    )
}

export default EditPostPage
