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

// TODO: integrate

// contextBridge.exposeInMainWorld('electronAPI', {
//   listFiles: (directory: string) => ipcRenderer.invoke('list-files', directory),
//   readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
//   openCmd: (directory: string) => ipcRenderer.invoke('open-cmd', directory),
//   prepareCommand: (command: string) => ipcRenderer.invoke('prepare-command', command),
// });
