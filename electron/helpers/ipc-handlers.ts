import { ipcMain } from 'electron';
import { cmdHelper } from './cmd-helper';

export const registerIpcHandlers = () => {
  ipcMain.handle('list-files', async (_event, directory) => {
    return cmdHelper.listFiles(directory);
  });

  ipcMain.handle('read-file', async (_event, filePath) => {
    return cmdHelper.readFileContent(filePath);
  });

  ipcMain.handle('open-cmd', async (_event, directory) => {
    return cmdHelper.openCmdWithDir(directory);
  });

  ipcMain.handle('prepare-command', async (_event, command) => {
    return cmdHelper.prepareCommand(command);
  });
};
