"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('workspace', {
    ensureDataDirectory: () => electron_1.ipcRenderer.invoke('app:ensure-data-directory'),
    hasPassword: () => electron_1.ipcRenderer.invoke('auth:has-password'),
    verifyPassword: (password) => electron_1.ipcRenderer.invoke('auth:verify', password),
    setPassword: (password, current) => electron_1.ipcRenderer.invoke('auth:set-password', password, current),
    removePassword: (current) => electron_1.ipcRenderer.invoke('auth:remove-password', current),
    resetAll: () => electron_1.ipcRenderer.invoke('auth:reset-all')
});
