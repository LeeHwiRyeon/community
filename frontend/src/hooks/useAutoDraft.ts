import { useState, useEffect, useCallback } from 'react';
import { useDraft } from '../contexts/DraftContext';

interface UseAutoDraftOptions {
    enabled?: boolean;
    saveInterval?: number; // milliseconds
}

/**
 * Custom hook for automatic draft saving
 * 
 * @param options - Configuration options
 * @returns Draft management functions and state
 */
export const useAutoDraft = (options: UseAutoDraftOptions = {}) => {
    const {
        enabled = true,
        saveInterval = 5000, // 5 seconds default
    } = options;

    const {
        currentDraft,
        draftId,
        saveStatus,
        lastSaved,
        error,
        conflictState,
        initializeDraft,
        updateDraft,
        saveDraft,
        loadDraft,
        deleteDraft,
        clearDraft,
        checkConflict,
        resolveConflict,
        dismissConflict,
        enableAutoSave,
        disableAutoSave,
    } = useDraft();

    const [isDirty, setIsDirty] = useState(false);

    // Track changes
    useEffect(() => {
        if (currentDraft && saveStatus === 'idle') {
            setIsDirty(true);
        } else if (saveStatus === 'saved') {
            setIsDirty(false);
        }
    }, [currentDraft, saveStatus]);

    // Control auto-save based on enabled prop
    useEffect(() => {
        if (enabled) {
            enableAutoSave();
        } else {
            disableAutoSave();
        }
    }, [enabled, enableAutoSave, disableAutoSave]);

    // Manual save with feedback
    const handleSave = useCallback(async () => {
        if (!isDirty) return;
        await saveDraft();
    }, [isDirty, saveDraft]);

    // Update draft field
    const updateField = useCallback(
        (field: string, value: any) => {
            updateDraft({ [field]: value } as any);
        },
        [updateDraft]
    );

    // Batch update multiple fields
    const updateFields = useCallback(
        (updates: Record<string, any>) => {
            if (currentDraft) {
                updateDraft(updates as any);
            }
        },
        [updateDraft, currentDraft]
    );

    return {
        // State
        draft: currentDraft,
        draftId,
        saveStatus,
        lastSaved,
        error,
        conflictState,
        isDirty,
        isSaving: saveStatus === 'saving',
        isSaved: saveStatus === 'saved',
        hasError: saveStatus === 'error',

        // Actions
        initializeDraft,
        updateField,
        updateFields,
        saveDraft: handleSave,
        loadDraft,
        deleteDraft,
        clearDraft,

        // Conflict management
        checkConflict,
        resolveConflict,
        dismissConflict,
    };
};

/**
 * Hook for managing draft form fields with auto-save
 */
export const useDraftField = <T extends any>(
    fieldName: string,
    initialValue: T
) => {
    const { updateField } = useAutoDraft();
    const [value, setValue] = useState<T>(initialValue);

    const handleChange = useCallback(
        (newValue: T) => {
            setValue(newValue);
            updateField(fieldName, newValue);
        },
        [fieldName, updateField]
    );

    return [value, handleChange] as const;
};

/**
 * Hook to warn users about unsaved changes
 */
export const useUnsavedChangesWarning = () => {
    const { isDirty } = useAutoDraft();

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '저장되지 않은 변경사항이 있습니다. 페이지를 나가시겠습니까?';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty]);

    return isDirty;
};

export default useAutoDraft;
