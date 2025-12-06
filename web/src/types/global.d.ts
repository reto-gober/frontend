// Extensión de tipos globales para el proyecto

declare global {
  interface Window {
    notifications?: {
      success: (title: string, message?: string) => Promise<any>;
      error: (title: string, message?: string) => Promise<any>;
      warning: (title: string, message?: string) => Promise<any>;
      info: (title: string, message?: string) => Promise<any>;
      confirm: (title: string, message?: string, confirmText?: string, cancelText?: string) => Promise<boolean>;
      toast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
      loading: (message?: string) => void;
      close: () => void;
    };
  }
}

export {};
