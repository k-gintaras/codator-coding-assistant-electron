import { exec } from 'child_process';
import { readdir, readFile } from 'fs/promises';
import * as path from 'path';

class CmdHelper {
  async listFiles(directory: string): Promise<string[]> {
    try {
      const files = await readdir(directory);
      return files;
    } catch (error) {
      return [`Error: ${error}`];
    }
  }

  async readFileContent(filePath: string): Promise<string> {
    try {
      const content = await readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      return `Error: ${error}`;
    }
  }

  async prepareCommand(command: string): Promise<string> {
    return `cmd.exe /K "${command}"`; // Preloads in cmd but doesn't run it.
  }

  async openCmdWithDir(directory: string): Promise<string> {
    const fullCommand = `cmd.exe /K "cd /d ${directory}"`;
    exec(fullCommand);
    return `Opened cmd at ${directory}`;
  }
}

export const cmdHelper = new CmdHelper();
