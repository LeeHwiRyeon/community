import { act, render, waitFor } from "@testing-library/react"
import React from "react"
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { useForm, type UseFormReturn } from "react-hook-form"
import { useDraftAutoSave, type DraftPayloadInput, type PostDraft } from "../useDraftAutoSave"

type FormValues = {
    title: string
    content: string
    category: string
}

type HarnessOptions = {
    mapFormToDraft?: (values: FormValues) => DraftPayloadInput
    mapDraftToForm?: (draft: PostDraft, current: FormValues) => Partial<FormValues>
    postId?: string | null
    storageKey?: string
    isEnabled?: boolean
}

type HarnessHandle = {
    form: UseFormReturn<FormValues>
    getState: () => ReturnType<typeof useDraftAutoSave<FormValues>>
}

const flushAsync = async () => {
    await act(async () => {
        await Promise.resolve()
    })
}

function DraftAutoSaveHarness({ onReady, options }: { onReady: (handle: HarnessHandle) => void; options?: HarnessOptions }) {
    const form = useForm<FormValues>({
        defaultValues: {
            title: "",
            content: "",
            category: ""
        }
    })

    const state = useDraftAutoSave<FormValues>({
        form,
        boardId: "general",
        postId: options?.postId ?? null,
        storageKey: options?.storageKey,
        isEnabled: options?.isEnabled ?? true,
        mapFormToDraft: options?.mapFormToDraft ?? ((values) => ({
            title: values.title,
            content: values.content,
            metadata: { category: values.category ?? "" },
            post_id: options?.postId ?? null
        })),
        mapDraftToForm: options?.mapDraftToForm
    })

    React.useEffect(() => {
        onReady({
            form,
            getState: () => state
        })
    }, [form, state, onReady])

    return null
}

function renderDraftAutoSaveHarness(options?: HarnessOptions) {
    let handle: HarnessHandle | null = null
    const utils = render(
        <DraftAutoSaveHarness
            options={options}
            onReady={(h) => {
                handle = h
            }}
        />
    )

    const waitUntilReady = async () => {
        await waitFor(() => expect(handle).not.toBeNull())
    }

    const getHandle = () => {
        expect(handle).not.toBeNull()
        return handle as HarnessHandle
    }

    return { ...utils, waitUntilReady, getHandle }
}

describe("useDraftAutoSave", () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        vi.setSystemTime(new Date("2025-09-26T00:00:00Z"))
        localStorage.clear()
    })

    afterEach(() => {
        vi.clearAllMocks()
        global.fetch = originalFetch
    })

    it("creates a draft and records lastSavedAt", async () => {
        const draftResponse: PostDraft = {
            id: "draft-new",
            post_id: null,
            author_id: 1,
            title: "Draft Title",
            content: "Body",
            metadata: { category: "general" },
            status: "active",
            created_at: "2025-09-26T00:00:00.000Z",
            updated_at: "2025-09-26T00:00:00.000Z",
            expires_at: "2025-10-26T00:00:00.000Z"
        }

        const fetchMock = vi.fn(async () => ({
            ok: true,
            status: 201,
            text: async () => JSON.stringify(draftResponse)
        }) as Response)
        global.fetch = fetchMock

        const harness = renderDraftAutoSaveHarness()
        await harness.waitUntilReady()

        await act(async () => {
            const handle = harness.getHandle()
            handle.form.setValue("title", "Draft Title", { shouldDirty: true })
            await handle.getState().triggerSave()
        })

        await flushAsync()

        await waitFor(() => expect(fetchMock).toHaveBeenCalled())
        await waitFor(() => expect(harness.getHandle().getState().lastSavedAt).not.toBeNull())

        const firstCall = fetchMock.mock.calls[0]
        expect(firstCall?.[0]).toBe("http://localhost:50001/api/posts/drafts")
        expect(localStorage.getItem("draft:new:general")).toBeTruthy()
    })

    it("yields conflict state when backend responds 409", async () => {
        const storageKey = "draft:new:general"
        const snapshot = JSON.stringify({ title: "Base", content: "", metadata: { category: "general" }, post_id: null })
        localStorage.setItem(storageKey, JSON.stringify({
            draftId: "draft-409",
            updatedAt: "2025-09-26T00:00:00.000Z",
            snapshot,
            lastSavedAt: "2025-09-26T00:00:00.000Z"
        }))

        const serverDraft: PostDraft = {
            id: "draft-409",
            post_id: null,
            author_id: 1,
            title: "Server Title",
            content: "Server Content",
            metadata: { category: "general" },
            status: "active",
            created_at: "2025-09-25T23:59:00.000Z",
            updated_at: "2025-09-25T23:59:00.000Z",
            expires_at: "2025-10-25T23:59:00.000Z"
        }

        const responses = [
            {
                ok: true,
                status: 200,
                body: JSON.stringify(serverDraft)
            },
            {
                ok: false,
                status: 409,
                body: JSON.stringify({ draft: serverDraft })
            }
        ]

        let lastResponse = responses[responses.length - 1]

        const fetchMock = vi.fn(async () => {
            const next = responses.shift()
            const payload = next ?? lastResponse
            if (next) {
                lastResponse = next
            }
            return {
                ok: payload.ok,
                status: payload.status,
                text: async () => payload.body
            } as Response
        })
        global.fetch = fetchMock

        const harness = renderDraftAutoSaveHarness({ storageKey })
        await harness.waitUntilReady()

        await act(async () => {
            const handle = harness.getHandle()
            handle.form.setValue("content", "Local change", { shouldDirty: true })
            await handle.getState().triggerSave()
        })

        await flushAsync()
        await waitFor(() => expect(fetchMock).toHaveBeenCalled())
        await waitFor(() => {
            const state = harness.getHandle().getState()
            expect(state.status).toBe("conflict")
            expect(state.error).toBe("conflict")
            expect(state.conflictDraft?.id).toBe("draft-409")
        })
    })

    it("shows rate_limited error when backend throttles", async () => {
        const fetchMock = vi.fn(async () => ({
            ok: false,
            status: 429,
            text: async () => "{}"
        }) as Response)
        global.fetch = fetchMock

        const harness = renderDraftAutoSaveHarness()
        await harness.waitUntilReady()

        await act(async () => {
            const handle = harness.getHandle()
            handle.form.setValue("title", "Rate limit", { shouldDirty: true })
            await handle.getState().triggerSave()
        })

        await flushAsync()
        await waitFor(() => expect(fetchMock).toHaveBeenCalled())
        await waitFor(() => {
            const state = harness.getHandle().getState()
            expect(state.status).toBe("error")
            expect(state.error).toBe("rate_limited")
        })
    })
})
