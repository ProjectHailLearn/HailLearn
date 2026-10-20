import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Mentor } from '../../types';

export interface MentorState {
  mentors: Mentor[];
  selectedTopic: string;
  onlineOnly: boolean;
  activeSessionMentorId: string | null;
}

const initialState: MentorState = {
  mentors: [],
  selectedTopic: 'ALL',
  onlineOnly: false,
  activeSessionMentorId: null,
};

export const mentorSlice = createSlice({
  name: 'mentors',
  initialState,
  reducers: {
    setMentors: (state, action: PayloadAction<Mentor[]>) => {
      state.mentors = action.payload;
    },
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

export const { setMentors, setSelectedTopic, setOnlineOnly, startMentoringSession, endMentoringSession } =
  mentorSlice.actions;

export default mentorSlice.reducer;
