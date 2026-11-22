import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer, { tokensRefreshed } from './slices/authSlice';
import { setTokensRefreshedListener } from '../services/api';
import doubtReducer from './slices/doubtSlice';
import mentorReducer from './slices/mentorSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    doubts: doubtReducer,
    mentors: mentorReducer,
    ui: uiReducer,
  },
});

// Silent token refreshes (services/api.ts) update Redux so the socket reconnects with the new token.
setTokensRefreshedListener((token) => store.dispatch(tokensRefreshed(token)));

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
