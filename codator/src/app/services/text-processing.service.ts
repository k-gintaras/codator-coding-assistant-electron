import { Injectable } from '@angular/core';
import { FunctionScript } from '../interfaces/function-script.interface';
import { FunctionLibraryService } from './function-library.service';
import { ScriptHelperService } from './script-helper.service';
import { InputService } from './assistants-services/input.service';
import { MessageService } from './assistants-services/message.service';

@Injectable({
  providedIn: 'root',
})
export class TextProcessingService {
  constructor(
    private inputService: InputService,
    private outputService: MessageService,
    private scriptHelperService: ScriptHelperService,
    private functionLibraryService: FunctionLibraryService
  ) {}

  private getInput() {
    return this.inputService.getCorrectionInput();
  }

  private setOutput(str: string) {
    const msg = this.outputService.getBasicMessage(
      str,
      'TextProcessingService'
    );
    this.outputService.addLogMessage(msg);
    this.outputService.setLoading(false);
  }

  processCorrectionInput(f: FunctionScript): void {
    const input = this.getInput();
    const output = this.executeFunctionOnText(f, input);
    this.setOutput(output);
  }

  // This method processes text using the specified function ID
  async processTextWithFunctionId(
    text: string,
    functionId: string
  ): Promise<string> {
    // Get the function script from the library
    const functionScript = await this.functionLibraryService.get(functionId);

    if (!functionScript) {
      throw new Error('Function not found');
    }

    // Execute the function and return the modified text
    return this.executeFunctionOnText(functionScript, text);
  }

  private executeFunctionOnText(
    functionScript: FunctionScript,
    text: string
  ): string {
    try {
      // Execute the function script using ScriptHelperService
      const result = this.scriptHelperService.executeFunction(
        functionScript,
        text
      );

      return result;
    } catch (error) {
      console.error('Error executing function:', error);
      throw new Error('Function execution failed');
    }
  }
}
