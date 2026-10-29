/// <reference types="vite/client" />
interface Window {
  workspace?: {
    ensureDataDirectory: () => Promise<string>;
    hasPassword: () => Promise<boolean>;
    verifyPassword: (password: string) => Promise<boolean>;
    setPassword: (password: string, current?: string) => Promise<boolean>;
    removePassword: (current: string) => Promise<boolean>;
    resetAll: () => Promise<boolean>;
  };
}
