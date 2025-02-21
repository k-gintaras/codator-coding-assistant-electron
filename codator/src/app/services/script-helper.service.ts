/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { FunctionScript } from '../interfaces/function-script.interface';

@Injectable({
  providedIn: 'root',
})
export class ScriptHelperService {
  @Injectable({
    providedIn: 'root',
  })
  executeFunction(script: FunctionScript, ...args: any[]): any {
    const func = new Function('text', script.code); // Assuming the function takes 'text' as an argument
    return func(...args); // Pass the text as the argument
  }
}
