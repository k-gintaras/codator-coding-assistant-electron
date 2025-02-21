import { Injectable } from '@angular/core';
import { MessageService } from './assistants-services/message.service';
import { PromptService } from './assistants-services/prompt.service';
import { MemoryService } from './memory.service';
import { PROMPT_INTRO, PROMPT_SEPARATOR } from '../app.constants';
import {
  estimateTokens,
  estimateTokensFromPrompt,
  evaluatePrompt,
  models,
  TextSize,
} from '../interfaces/gpt-api.model';
import { WarnService } from './warn.service';
import { Message } from '../interfaces/assistant.model';
import { Assistant } from './assistants-api/assistant.service';

@Injectable({
  providedIn: 'root',
})
export class PromptMessageService {
  constructor(
    private promptService: PromptService,
    private messageService: MessageService,
    private memoryService: MemoryService,
    private warnService: WarnService
  ) {}

  // Higher-level method to handle message sending with temporary memory
  sendPromptSimple(assistant: Assistant, prompt: string) {
    this.sendPromptCustomized(assistant, prompt, false, 'page');
  }

  sendPromptCustomized(
    assistant: Assistant,
    prompt: string,
    sessionMemoryEnabled: boolean,
    expectedResponseSize: TextSize,
    extraInstruction?: string
  ): void {
    const assistantId = assistant.id;

    prompt = PROMPT_INTRO + prompt;

    prompt = this.expandPromptMaybe(
      prompt,
      assistant,
      sessionMemoryEnabled,
      expectedResponseSize
    );

    this.saveRequestMessage(assistantId, prompt);

    this.promptService.prompt(assistantId, prompt, extraInstruction).subscribe({
      next: (response) => {
        this.saveResponseMessage(assistant, response);
      },
      error: () => {
        this.saveErrorMessage(assistant);
      },
      complete: () => {
        console.log('Prompt processing completed');
      },
    });
  }

  private saveErrorMessage(assistant: Assistant) {
    const errorMessage: Message = {
      id: this.messageService.generateMessageId(),
      type: 'response',
      content: 'Failed to process prompt.',
      timestamp: new Date().toISOString(),
      owner: assistant.name,
    };
    this.messageService.addMessage(errorMessage, assistant.id);
    this.messageService.setLoading(false);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private saveResponseMessage(assistant: Assistant, response: any) {
    const responseMessage: Message = {
      id: this.messageService.generateMessageId(),
      type: 'response',
      content: response?.data || 'No data',
      timestamp: new Date().toISOString(),
      owner: assistant.name,
    };
    this.messageService.addMessage(responseMessage, assistant.id);
    this.messageService.setLoading(false);
  }

  private saveRequestMessage(assistantId: string, prompt: string) {
    const requestMessage: Message = {
      id: this.messageService.generateMessageId(),
      type: 'request',
      content: prompt,
      timestamp: new Date().toISOString(),
      owner: 'user',
    };
    this.messageService.addMessage(requestMessage, assistantId);
    this.messageService.setLoading(true);
  }

  private expandPromptMaybe(
    prompt: string,
    assistant: Assistant,
    sessionMemoryEnabled: boolean,
    responseSize: TextSize
  ): string {
    const model = models[assistant.model as keyof typeof models];
    const maxTokens = model.contextWindow;

    const inputTokens = estimateTokens(prompt);

    // Estimate the number of output tokens based on expected response size
    const { outputTokens } = estimateTokensFromPrompt(prompt, responseSize);

    // Check if the total token count fits within the model's context window
    const { isFeasible, recommendations } = evaluatePrompt(
      inputTokens,
      outputTokens,
      'intermediate'
    );

    if (!isFeasible) {
      console.warn(`Warning: ${recommendations.join(' ')}`);
      this.warn(`Warning: ${recommendations.join(' ')}`);
    }

    // Integrate memory functionality if enabled
    let memoryMessages = '';
    if (sessionMemoryEnabled) {
      const assistantMemory = this.memoryService.getSessionMemory(assistant.id);
      if (assistantMemory) {
        memoryMessages = this.getArrayToPromptString(
          assistantMemory,
          maxTokens
        );
      }
    }

    // If memory messages are too long, trim them to fit within the available tokens
    if (memoryMessages.length > 0) {
      const remainingTokens = maxTokens - inputTokens - outputTokens;
      if (remainingTokens < memoryMessages.length) {
        memoryMessages = memoryMessages.slice(0, remainingTokens); // Trim memory messages to fit
      }
      return prompt + PROMPT_SEPARATOR + memoryMessages;
    }

    // If no memory is added, return just the prompt
    return prompt;
  }

  // Helper to convert session memory to prompt string, respecting token limits
  private getArrayToPromptString(
    assistantTempMemory: string[],
    maxTokens: number
  ): string {
    const separator = PROMPT_SEPARATOR;
    let memoryString = assistantTempMemory
      .map((memory) => `Memory: ${memory}`)
      .join(separator); // Use one separator for clarity

    // Ensure memory string does not exceed token limits
    const availableMemoryTokens = maxTokens - estimateTokens(memoryString);
    if (availableMemoryTokens < memoryString.length) {
      memoryString = memoryString.slice(0, availableMemoryTokens); // Trim memory string
    }

    return memoryString;
  }

  joinText(str1: string, str2: string) {
    const separator = PROMPT_SEPARATOR;
    return str1 + separator + str2;
  }

  private warn(msg: string) {
    this.warnService.warn(msg);
  }
}
