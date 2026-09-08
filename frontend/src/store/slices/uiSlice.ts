import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '../../types';
import { MOCK_NOTIFICATIONS } from '../../constants/mockData';

export interface UIState {
  isSidebarCollapsed: boolean;
  isCommandPaletteOpen: boolean;
  isQuickAskModalOpen: boolean;
  notifications: Notification[];
  isNotificationDrawerOpen: boolean;
}

const initialState: UIState = {
  isSidebarCollapsed: false,
  isCommandPaletteOpen: false,
  isQuickAskModalOpen: false,
  notifications: MOCK_NOTIFICATIONS,
  isNotificationDrawerOpen: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload;
    },
    setCommandPaletteOpen: (state, action: PayloadAction<boolean>) => {
      state.isCommandPaletteOpen = action.payload;
    },
    setQuickAskModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isQuickAskModalOpen = action.payload;
    },
    toggleNotificationDrawer: (state) => {
      state.isNotificationDrawerOpen = !state.isNotificationDrawerOpen;
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach((n) => {
        n.read = true;
      });
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  setCommandPaletteOpen,
  setQuickAskModalOpen,
  toggleNotificationDrawer,
  markAllNotificationsRead,
  addNotification,
} = uiSlice.actions;

export default uiSlice.reducer;
