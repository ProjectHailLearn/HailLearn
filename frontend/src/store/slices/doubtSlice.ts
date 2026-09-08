import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Doubt, DoubtStatus } from '../../types';
import { MOCK_DOUBTS } from '../../constants/mockData';

export interface DoubtState {
  doubts: Doubt[];
  activeDoubtId: string | null;
  filterStatus: 'ALL' | DoubtStatus;
  searchQuery: string;
  isAiSolving: boolean;
}

const initialState: DoubtState = {
  doubts: MOCK_DOUBTS,
  activeDoubtId: 'dbt-301',
  filterStatus: 'ALL',
  searchQuery: '',
  isAiSolving: false,
};

export const doubtSlice = createSlice({
  name: 'doubts',
  initialState,
  reducers: {
    addDoubt: (state, action: PayloadAction<Doubt>) => {
      state.doubts.unshift(action.payload);
      state.activeDoubtId = action.payload.id;
    },
    setActiveDoubt: (state, action: PayloadAction<string>) => {
      state.activeDoubtId = action.payload;
    },
    setFilterStatus: (state, action: PayloadAction<'ALL' | DoubtStatus>) => {
      state.filterStatus = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setIsAiSolving: (state, action: PayloadAction<boolean>) => {
      state.isAiSolving = action.payload;
    },
    upvoteDoubt: (state, action: PayloadAction<string>) => {
      const doubt = state.doubts.find((d) => d.id === action.payload);
      if (doubt) {
        doubt.upvotes += 1;
      }
    },
    escalateDoubtToMentor: (
      state,
      action: PayloadAction<{ doubtId: string; mentorId: string; mentorName: string; mentorAvatar: string; karma: number }>
    ) => {
      const doubt = state.doubts.find((d) => d.id === action.payload.doubtId);
      if (doubt) {
        doubt.status = 'MENTOR_ESCALATED';
        doubt.assignedMentor = {
          id: action.payload.mentorId,
          name: action.payload.mentorName,
          avatar: action.payload.mentorAvatar,
          karma: action.payload.karma,
        };
      }
    },
  },
});

export const {
  addDoubt,
  setActiveDoubt,
  setFilterStatus,
  setSearchQuery,
  setIsAiSolving,
  upvoteDoubt,
  escalateDoubtToMentor,
} = doubtSlice.actions;

export default doubtSlice.reducer;
