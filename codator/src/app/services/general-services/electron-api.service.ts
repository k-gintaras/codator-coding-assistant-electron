/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@angular/core';
import { ApiStrategy } from '../../interfaces/api.strategy.interface';

@Injectable({
  providedIn: 'root',
})
export class ElectronApiService implements ApiStrategy {
  async processText(input: string): Promise<string> {
    throw new Error('not implemented');
    // return window.electron.ipcRenderer.invoke('process-text', input);
  }

  async getFile(path: string): Promise<File | null> {
    throw new Error('not implemented');

    // return window.electron.ipcRenderer.invoke('get-file', path);
  }

  async saveFile(path: string, data: Blob): Promise<void> {
    throw new Error('not implemented');

    // await window.electron.ipcRenderer.invoke('save-file', path, data);
  }
}
