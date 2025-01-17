export interface ElectronAPI {
  ipcRenderer: {
    invoke(channel: string, ...args: any[]): Promise<any>;
  };
}

// Extend the global Window interface
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
