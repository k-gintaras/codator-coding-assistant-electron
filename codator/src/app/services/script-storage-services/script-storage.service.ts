import { Injectable } from '@angular/core';
import { SqliteScriptStorageService } from './sqlite-script-storage.service';
import { FirebaseScriptStorageService } from './firebase-script-storage.service';
import { environment } from '../../../environments/environment.electron';
import { FunctionScript } from '../../interfaces/function-script.interface';
import { ScriptStorageStrategy } from '../../interfaces/script-storage.strategy.interface';

@Injectable({
  providedIn: 'root',
})
export class ScriptStorageService {
  private strategy: ScriptStorageStrategy;

  constructor() {
    this.strategy =
      environment.platform === 'electron'
        ? new SqliteScriptStorageService()
        : new FirebaseScriptStorageService();
    // this.strategy =
    //   environment.platform === 'electron'
    //     ? new SqliteScriptStorageService()
    //     : new FirebaseScriptStorageService(firestore);
  }

  save(script: FunctionScript): Promise<void> {
    return this.strategy.save(script);
  }

  get(id: string): Promise<FunctionScript | null> {
    return this.strategy.get(id);
  }

  getAll(): Promise<FunctionScript[]> {
    return this.strategy.getAll();
  }

  delete(id: string): Promise<void> {
    return this.strategy.delete(id);
  }
}
