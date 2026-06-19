import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  notificationsPanelOpen: boolean;
  commandPaletteOpen: boolean;

  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setNotificationsPanelOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      notificationsPanelOpen: false,
      commandPaletteOpen: false,

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setNotificationsPanelOpen: (notificationsPanelOpen) => set({ notificationsPanelOpen }),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
    }),
    { name: 'ui-store' }
  )
);
