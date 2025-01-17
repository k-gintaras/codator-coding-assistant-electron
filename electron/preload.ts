import { contextBridge, ipcRenderer } from 'electron/renderer';

// Preload script for Electron
window.addEventListener('DOMContentLoaded', () => {
  console.log('Electron app is ready');
});

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  },
});
