import { Injectable } from '@angular/core';
import { ApiStrategy } from '../../interfaces/api.strategy.interface';

@Injectable({
  providedIn: 'root',
})
export class ElectronApiService implements ApiStrategy {
  async processText(input: string): Promise<string> {
    return window.electron.ipcRenderer.invoke('process-text', input);
  }

  async getFile(path: string): Promise<File | null> {
    return window.electron.ipcRenderer.invoke('get-file', path);
  }

  async saveFile(path: string, data: Blob): Promise<void> {
    await window.electron.ipcRenderer.invoke('save-file', path, data);
  }
}
