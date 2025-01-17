"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const renderer_1 = require("electron/renderer");
// Preload script for Electron
window.addEventListener('DOMContentLoaded', () => {
    console.log('Electron app is ready');
});
renderer_1.contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: (channel, ...args) => renderer_1.ipcRenderer.invoke(channel, ...args),
    },
});
