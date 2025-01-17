import { Injectable } from '@angular/core';
import { FunctionScript } from '../interfaces/function-script.interface';

@Injectable({
  providedIn: 'root',
})
export class ScriptHelperService {
  executeFunction(script: FunctionScript, ...args: any[]): any {
    const func = new Function('...args', script.code);
    return func(...args);
  }
}
