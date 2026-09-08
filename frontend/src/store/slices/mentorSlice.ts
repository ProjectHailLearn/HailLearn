import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Mentor } from '../../types';
import { MOCK_MENTORS } from '../../constants/mockData';

export interface MentorState {
  mentors: Mentor[];
  selectedTopic: string;
  onlineOnly: boolean;
  activeSessionMentorId: string | null;
}

const initialState: MentorState = {
  mentors: MOCK_MENTORS,
  selectedTopic: 'ALL',
  onlineOnly: false,
  activeSessionMentorId: null,
};

export const mentorSlice = createSlice({
  name: 'mentors',
  initialState,
  reducers: {
    setSelectedTopic: (state, action: PayloadAction<string>) => {
      state.selectedTopic = action.payload;
    },
    setOnlineOnly: (state, action: PayloadAction<boolean>) => {
      state.onlineOnly = action.payload;
    },
    startMentoringSession: (state, action: PayloadAction<string>) => {
      state.activeSessionMentorId = action.payload;
    },
    endMentoringSession: (state) => {
      state.activeSessionMentorId = null;
    },
  },
});

export const { setSelectedTopic, setOnlineOnly, startMentoringSession, endMentoringSession } =
  mentorSlice.actions;

export default mentorSlice.reducer;
