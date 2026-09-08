import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, UserRole } from '../../types';
import { CURRENT_USER } from '../../constants/mockData';

export interface AuthState {
  user: User;
  isAuthenticated: boolean;
  selectedRole: UserRole;
}

const initialState: AuthState = {
  user: CURRENT_USER,
  isAuthenticated: true,
  selectedRole: 'student',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUserRole: (state, action: PayloadAction<UserRole>) => {
      state.selectedRole = action.payload;
      state.user.role = action.payload;
    },
    updateKarma: (state, action: PayloadAction<number>) => {
      state.user.karmaPoints += action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
});

export const { setUserRole, updateKarma, updateProfile } = authSlice.actions;
export default authSlice.reducer;
