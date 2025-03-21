import { Injectable } from '@angular/core';
import { Memory } from '../assistants-api/memory.service';
import { MemoryService } from '../memory.service';
import { MemoryRegion } from './assistant-memory.service';
import { FocusedMemoryService } from '../assistants-api/memory-focus.service';

@Injectable({
  providedIn: 'root',
})
export class MemoryActivationService {
  constructor(
    private memoryService: MemoryService,
    private focusedMemoryService: FocusedMemoryService
  ) {}

  async activateUpdate(focusRuleId: string, memory: Memory): Promise<boolean> {
    // Perform activation logic, update backend
    await this.focusedMemoryService.addFocusedMemory(focusRuleId, memory.id);
    return this.memoryService.updateMemory({
      ...memory,
      type: MemoryRegion.INSTRUCTION,
    });
  }

  async deactivateUpdate(
    focusRuleId: string,
    memory: Memory
  ): Promise<boolean> {
    await this.focusedMemoryService.removeFocusedMemory(focusRuleId, memory.id);
    return this.memoryService.updateMemory({
      ...memory,
      type: MemoryRegion.DEACTIVATED,
    });
  }

  async focus(focusRuleId: string, memory: Memory): Promise<boolean> {
    // Perform activation logic, update backend
    return await this.activateUpdate(focusRuleId, memory);
  }

  async unfocus(focusRuleId: string, memory: Memory): Promise<boolean> {
    return await this.deactivateUpdate(focusRuleId, memory);
  }
}
