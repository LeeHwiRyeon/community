import { configureStore } from '@reduxjs/toolkit';

// 기본 Redux store 설정
const store = configureStore({
    reducer: {
        // 기본 reducer - 나중에 확장 가능
        app: (state = { initialized: true }, action: any) => {
            switch (action.type) {
                default:
                    return state;
            }
        }
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
