import { Injectable } from '@angular/core';
import { SelectedAssistantService } from './assistant-selected.service';
import { Memory, MemoryService } from '../assistants-api/memory.service';
import { MemoryActivationService } from './memory-activation.service';
import { MemoryOwnedService } from '../assistants-api/memory-owned.service';

@Injectable({
  providedIn: 'root',
})
export class RememberService {
  constructor(
    private memoryActivationService: MemoryActivationService,
    private ownedMemoryService: MemoryOwnedService,
    private memoryService: MemoryService,
    private selectedAssistantService: SelectedAssistantService
  ) {}

  async rememberInstruction(memory: Memory) {
    memory.type = 'instruction';
    await this.rememberWithRule(memory);
  }

  async rememberConversation(memory: Memory) {
    memory.type = 'conversation';
    await this.rememberWithRule(memory);
  }

  async rememberPrompt(memory: Memory) {
    memory.type = 'prompt';
    await this.rememberWithRule(memory);
  }

  async remember(memory: Memory) {
    const assistantId =
      this.selectedAssistantService.getSelectedAssistant()?.id;
    if (!assistantId) return;

    const id = await this.createMemory(memory);
    if (!id) return;

    this.ownedMemoryService.addOwnedMemory(assistantId, id);
  }

  /** Handles memory creation + activation via memory focus rule */
  private async rememberWithRule(memory: Memory) {
    const ruleId =
      this.selectedAssistantService.getSelectedAssistant()?.memoryFocusRule?.id;
    if (!ruleId) return;

    const id = await this.createMemory(memory);
    if (!id) return;

    this.memoryActivationService.activateUpdate(ruleId, memory);
  }

  private async createMemory(memory: Memory): Promise<string | undefined> {
    if (memory.id) return memory.id;
    return await this.memoryService.createMemory(memory);
  }
}
