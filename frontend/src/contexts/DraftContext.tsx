import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';

// Draft 인터페이스
interface Draft {
    id?: number;
    board_id?: number;
    title: string;
    content: string;
    category?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    version?: number;
    last_saved_at?: string;
    created_at?: string;
    expires_at?: string;
}

// 저장 상태 타입
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// 충돌 상태 인터페이스
interface ConflictState {
    detected: boolean;
    localDraft: Draft | null;
    serverDraft: Draft | null;
}

// Context 타입 정의
interface DraftContextType {
    currentDraft: Draft | null;
    draftId: number | null;
    saveStatus: SaveStatus;
    lastSaved: Date | null;
    error: string | null;
    conflictState: ConflictState;

    // Draft 관리 함수
    initializeDraft: (draft?: Partial<Draft>) => void;
    updateDraft: (updates: Partial<Draft>) => void;
    saveDraft: () => Promise<void>;
    loadDraft: (id: number) => Promise<void>;
    deleteDraft: (id: number) => Promise<void>;
    clearDraft: () => void;

    // 충돌 관리 함수
    checkConflict: () => Promise<boolean>;
    resolveConflict: (useLocal: boolean) => void;
    dismissConflict: () => void;

    // 자동 저장 제어
    enableAutoSave: () => void;
    disableAutoSave: () => void;
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Debounce 유틸리티 함수
function useDebounce<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): (...args: Parameters<T>) => void {
    const timeoutRef = useRef<NodeJS.Timeout>();

    return useCallback(
        (...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        },
        [callback, delay]
    );
}

export const DraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);
    const [draftId, setDraftId] = useState<number | null>(null);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
    const [conflictState, setConflictState] = useState<ConflictState>({
        detected: false,
        localDraft: null,
        serverDraft: null,
    });

    const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

    // 토큰 가져오기
    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    // Draft 초기화
    const initializeDraft = useCallback((draft?: Partial<Draft>) => {
        setCurrentDraft({
            title: '',
            content: '',
            ...draft,
        });
        setDraftId(draft?.id || null);
        setSaveStatus('idle');
        setError(null);
    }, []);

    // Draft 업데이트 (로컬 상태만)
    const updateDraft = useCallback((updates: Partial<Draft>) => {
        setCurrentDraft((prev) => {
            if (!prev) return null;
            return { ...prev, ...updates };
        });
        setSaveStatus('idle'); // 변경되면 저장 필요 상태로
    }, []);

    // Draft 서버에 저장
    const saveDraft = useCallback(async () => {
        if (!currentDraft) return;

        const token = getAuthToken();
        if (!token) {
            setError('인증이 필요합니다.');
            return;
        }

        setSaveStatus('saving');
        setError(null);

        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            };

            let response;

            if (draftId) {
                // 기존 초안 업데이트
                response = await axios.put(
                    `${API_BASE_URL}/api/posts/drafts/${draftId}`,
                    currentDraft,
                    { headers }
                );
            } else {
                // 새 초안 생성
                response = await axios.post(
                    `${API_BASE_URL}/api/posts/drafts`,
                    currentDraft,
                    { headers }
                );

                if (response.data.draft?.id) {
                    setDraftId(response.data.draft.id);
                }
            }

            setSaveStatus('saved');
            setLastSaved(new Date());

            // 저장 완료 후 3초 뒤 idle로 변경
            setTimeout(() => {
                setSaveStatus('idle');
            }, 3000);

        } catch (err: any) {
            console.error('Draft save error:', err);
            setSaveStatus('error');
            setError(err.response?.data?.message || '저장 중 오류가 발생했습니다.');

            // 에러 메시지 5초 후 제거
            setTimeout(() => {
                setError(null);
                setSaveStatus('idle');
            }, 5000);
        }
    }, [currentDraft, draftId]);

    // Draft 불러오기
    const loadDraft = useCallback(async (id: number) => {
        const token = getAuthToken();
        if (!token) {
            setError('인증이 필요합니다.');
            return;
        }

        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/posts/drafts/${id}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (response.data.success && response.data.draft) {
                setCurrentDraft(response.data.draft);
                setDraftId(id);
                setSaveStatus('idle');
                setError(null);
            }
        } catch (err: any) {
            console.error('Draft load error:', err);
            setError(err.response?.data?.message || '불러오기 중 오류가 발생했습니다.');
        }
    }, []);

    // Draft 삭제
    const deleteDraft = useCallback(async (id: number) => {
        const token = getAuthToken();
        if (!token) {
            setError('인증이 필요합니다.');
            return;
        }

        try {
            await axios.delete(
                `${API_BASE_URL}/api/posts/drafts/${id}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (draftId === id) {
                clearDraft();
            }
        } catch (err: any) {
            console.error('Draft delete error:', err);
            setError(err.response?.data?.message || '삭제 중 오류가 발생했습니다.');
        }
    }, [draftId]);

    // Draft 초기화
    const clearDraft = useCallback(() => {
        setCurrentDraft(null);
        setDraftId(null);
        setSaveStatus('idle');
        setLastSaved(null);
        setError(null);
    }, []);

    // 자동 저장 활성화
    const enableAutoSave = useCallback(() => {
        setAutoSaveEnabled(true);
    }, []);

    // 자동 저장 비활성화
    const disableAutoSave = useCallback(() => {
        setAutoSaveEnabled(false);
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }
    }, []);

    // 충돌 감지
    const checkConflict = useCallback(async (): Promise<boolean> => {
        if (!draftId || !currentDraft) return false;

        const token = getAuthToken();
        if (!token) return false;

        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/posts/drafts/${draftId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (response.data.success && response.data.draft) {
                const serverDraft = response.data.draft;

                // 서버 버전이 로컬 버전보다 최신인지 확인
                const serverVersion = serverDraft.version || 0;
                const localVersion = currentDraft.version || 0;

                // 서버의 last_saved_at이 로컬보다 최신인지 확인
                const serverTime = new Date(serverDraft.last_saved_at || 0).getTime();
                const localTime = lastSaved?.getTime() || 0;

                if (serverVersion > localVersion || serverTime > localTime) {
                    // 충돌 감지
                    setConflictState({
                        detected: true,
                        localDraft: currentDraft,
                        serverDraft: serverDraft,
                    });
                    return true;
                }
            }
            return false;
        } catch (err) {
            console.error('Conflict check error:', err);
            return false;
        }
    }, [draftId, currentDraft, lastSaved]);

    // 충돌 해결
    const resolveConflict = useCallback((useLocal: boolean) => {
        if (!conflictState.detected) return;

        if (useLocal) {
            // 로컬 버전 사용 - 서버에 강제 저장
            saveDraft();
        } else {
            // 서버 버전 사용 - 로컬 데이터 덮어쓰기
            if (conflictState.serverDraft) {
                setCurrentDraft(conflictState.serverDraft);
                setSaveStatus('idle');
            }
        }

        // 충돌 상태 초기화
        setConflictState({
            detected: false,
            localDraft: null,
            serverDraft: null,
        });
    }, [conflictState, saveDraft]);

    // 충돌 무시
    const dismissConflict = useCallback(() => {
        setConflictState({
            detected: false,
            localDraft: null,
            serverDraft: null,
        });
    }, []);

    // 자동 저장 (5초마다)
    const debouncedSave = useDebounce(saveDraft, 5000);

    useEffect(() => {
        if (autoSaveEnabled && currentDraft && saveStatus === 'idle') {
            // Draft가 변경되면 자동 저장 예약
            debouncedSave();
        }
    }, [currentDraft, autoSaveEnabled, saveStatus, debouncedSave]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, []);

    const value: DraftContextType = {
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
    };

    return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
};

// Hook for using draft context
export const useDraft = () => {
    const context = useContext(DraftContext);
    if (context === undefined) {
        throw new Error('useDraft must be used within a DraftProvider');
    }
    return context;
};

// Export types for external use
export type { Draft, SaveStatus, ConflictState, DraftContextType };
