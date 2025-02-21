import { Injectable } from '@angular/core';
import { MemoryFocusRuleService } from './assistants-api/memory-rule.service';
import {
  Assistant,
  AssistantService,
} from './assistants-api/assistant.service';

@Injectable({
  providedIn: 'root',
})
export class AssistantExtraService {
  constructor(
    private memoryService: MemoryFocusRuleService,
    private assistantService: AssistantService
  ) {}

  async getAssistantByRuleId(
    memoryFocusRuleId: string
  ): Promise<Assistant | null> {
    const rule = await this.memoryService.getMemoryFocusRuleById(
      memoryFocusRuleId
    );
    if (!rule) return null;
    return this.getAssistantById(rule.id);
  }

  async getAssistantById(assistantId: string): Promise<Assistant | null> {
    return this.assistantService.getAssistantById(assistantId);
  }
}
