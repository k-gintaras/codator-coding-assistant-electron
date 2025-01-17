import { FunctionScript } from './function-script.interface';

export interface ScriptStorageStrategy {
  save(script: FunctionScript): Promise<void>;
  get(id: string): Promise<FunctionScript | null>;
  getAll(): Promise<FunctionScript[]>;
  delete(id: string): Promise<void>;
}
