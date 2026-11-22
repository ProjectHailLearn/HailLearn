import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, UserRole } from '../../types';
import { authService, LoginPayload, RegisterPayload } from '../../services/authService';
import { TOKEN_KEY, REFRESH_KEY, USER_KEY } from '../../services/api';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // Set after signup (or a login to an unverified account) until the emailed code is confirmed.
  pendingVerificationEmail: string | null;
  notice: string | null;
}

type ApiError = { response?: { data?: { message?: string; code?: string; data?: { email?: string } } } };
const errorOf = (err: unknown, fallback: string) => {
  const data = (err as ApiError)?.response?.data;
  return { message: data?.message || fallback, code: data?.code, email: data?.data?.email };
};

const saveSession = (state: AuthState, s: { token: string; refreshToken: string; user: User }) => {
  state.token = s.token;
  state.user = s.user;
  state.isAuthenticated = true;
  state.error = null;
  state.pendingVerificationEmail = null;
  state.notice = null;
  localStorage.setItem(TOKEN_KEY, s.token);
  localStorage.setItem(REFRESH_KEY, s.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(s.user));
};

const storedToken = localStorage.getItem(TOKEN_KEY);
const storedUser = localStorage.getItem(USER_KEY);

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
  isAuthenticated: !!storedToken,
  isLoading: false,
  error: null,
  pendingVerificationEmail: null,
  notice: null,
};

export const loginThunk = createAsyncThunk('auth/login', async (payload: LoginPayload, { rejectWithValue }) => {
  try {
    return await authService.login(payload);
  } catch (err: unknown) {
    return rejectWithValue(errorOf(err, 'Login failed'));
  }
});

export const registerThunk = createAsyncThunk('auth/register', async (payload: RegisterPayload, { rejectWithValue }) => {
  try {
    return await authService.register(payload);
  } catch (err: unknown) {
    return rejectWithValue(errorOf(err, 'Registration failed'));
  }
});

export const verifyEmailThunk = createAsyncThunk('auth/verifyEmail', async (p: { email: string; code: string }, { rejectWithValue }) => {
  try {
    return await authService.verifyEmail(p.email, p.code);
  } catch (err: unknown) {
    return rejectWithValue(errorOf(err, 'Verification failed'));
  }
});


export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.pendingVerificationEmail = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
    },
    tokensRefreshed: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    cancelVerification: (state) => {
      state.pendingVerificationEmail = null;
      state.error = null;
      state.notice = null;
    },
    setNotice: (state, action: PayloadAction<string | null>) => {
      state.notice = action.payload;
    },
    setUserRole: (state, action: PayloadAction<UserRole>) => {
      if (state.user) state.user.role = action.payload;
    },
    updateKarma: (state, action: PayloadAction<number>) => {
      if (state.user) state.user.karmaPoints += action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem(USER_KEY, JSON.stringify(state.user));
      }
    },
    clearError: (state) => { state.error = null; },
    setCredentials: (state, action: PayloadAction<{ token: string; refreshToken: string; user: User }>) => {
      saveSession(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    const pending = (state: AuthState) => { state.isLoading = true; state.error = null; };
    const rejected = (state: AuthState, action: { payload: unknown }) => {
      state.isLoading = false;
      const e = action.payload as { message: string; code?: string; email?: string } | undefined;
      if (e?.code === 'EMAIL_NOT_VERIFIED' && e.email) {
        state.pendingVerificationEmail = e.email;
        state.notice = e.message;
        state.error = null;
      } else {
        state.error = e?.message ?? 'Something went wrong';
      }
    };
    builder
      .addCase(loginThunk.pending, pending)
      .addCase(loginThunk.fulfilled, (state, action) => { state.isLoading = false; saveSession(state, action.payload); })
      .addCase(loginThunk.rejected, rejected)
      .addCase(registerThunk.pending, pending)
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingVerificationEmail = action.payload.email;
        state.notice = `We sent a 6-digit code to ${action.payload.email}.`;
      })
      .addCase(registerThunk.rejected, rejected)
      .addCase(verifyEmailThunk.pending, pending)
      .addCase(verifyEmailThunk.fulfilled, (state, action) => { state.isLoading = false; saveSession(state, action.payload); })
      .addCase(verifyEmailThunk.rejected, rejected);
  },
});

export const {
  logout, setUserRole, updateKarma, updateProfile, clearError, setCredentials, tokensRefreshed, cancelVerification, setNotice,
} = authSlice.actions;
export default authSlice.reducer;
