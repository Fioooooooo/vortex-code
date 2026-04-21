export const windowApi = {
  minimize(): Promise<void> {
    return window.api.window.minimize();
  },

  maximize(): Promise<void> {
    return window.api.window.maximize();
  },

  close(): Promise<void> {
    return window.api.window.close();
  },

  toggleDevTools(): Promise<void> {
    return window.api.window.toggleDevTools();
  },

  isMaximized(): Promise<boolean> {
    return window.api.window.isMaximized();
  },
};
