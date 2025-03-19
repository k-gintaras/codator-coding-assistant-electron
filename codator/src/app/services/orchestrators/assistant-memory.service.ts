import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MemoryService } from '../memory.service';
import { WarnService } from '../warn.service';
import { Memory } from '../assistants-api/memory.service';
import {
  AssistantMemoryData,
  AssistantMemoryService,
} from '../assistants-api/assistant-memory.service';
import { FocusedMemoryService } from '../assistants-api/memory-focus.service';

// Memory brain regions for organization
export enum BrainRegion {
  INSTRUCTION = 'instruction',
  PROMPT = 'prompt',
  CONVERSATION = 'conversation',
  DEACTIVATED = 'reference',
}

@Injectable({
  providedIn: 'root',
})
export class MemoryBrainService {
  private state: Record<BrainRegion, Memory[]> = {
    [BrainRegion.INSTRUCTION]: [],
    [BrainRegion.PROMPT]: [],
    [BrainRegion.CONVERSATION]: [],
    [BrainRegion.DEACTIVATED]: [],
  };

  private stateSubject = new BehaviorSubject<Record<BrainRegion, Memory[]>>(
    this.state
  );
  public state$ = this.stateSubject.asObservable();

  constructor(
    private memoryService: MemoryService,
    private assistantMemoryService: AssistantMemoryService,
    private warnService: WarnService,
    private focusedMemoryService: FocusedMemoryService
  ) {}

  /**
   * Fetch all memories grouped by region for a given assistant.
   */
  async getMemoriesByRegion(
    assistantId: string
  ): Promise<Record<BrainRegion, Memory[]>> {
    try {
      const allMemories: AssistantMemoryData | null =
        await this.assistantMemoryService.getAllAssistMemories(assistantId);
      const brainRegions: Record<BrainRegion, Memory[]> = {
        [BrainRegion.INSTRUCTION]: [],
        [BrainRegion.PROMPT]: [],
        [BrainRegion.CONVERSATION]: [],
        [BrainRegion.DEACTIVATED]: [],
      };

      const focusedMemories = allMemories?.focused ?? [];
      const ownedMemories = allMemories?.owned ?? [];
      const relatedMemories = allMemories?.related ?? [];
      const deactivatedMemories = [...ownedMemories, ...relatedMemories];
      // owned and related are basically the same

      // these are either instruction or conversation
      focusedMemories.forEach((memory) => {
        switch (memory.type) {
          case BrainRegion.INSTRUCTION:
            brainRegions[BrainRegion.INSTRUCTION].push(memory);
            break;
          case BrainRegion.PROMPT:
            brainRegions[BrainRegion.PROMPT].push(memory);
            break;
          default:
            brainRegions[BrainRegion.CONVERSATION].push(memory);
        }
      });

      // these are just reference, owned or related, deactivated
      deactivatedMemories.forEach((memory) => {
        brainRegions[BrainRegion.DEACTIVATED].push(memory);
      });

      this.updateState(brainRegions);
      return brainRegions;
    } catch (error) {
      this.warnService.warn('Failed to load assistant memories');
      console.error('Error fetching memories:', error);
      return this.state;
    }
  }

  /**
   * TODO: when we move to deactivated, we use memory activation service and move to that region
   * TODO: when we move to activated (instruction, prompt, conversation), we use memory activation service and move to that region
   */
  async moveMemoryBetweenRegions(
    memory: Memory,
    sourceRegion: BrainRegion,
    targetRegion: BrainRegion
  ): Promise<boolean> {
    try {
      if (sourceRegion === targetRegion) return false;

      // Handle activation/deactivation separately
      if (sourceRegion === BrainRegion.DEACTIVATED) {
        await this.activate(memory);
      }
      if (targetRegion === BrainRegion.DEACTIVATED) {
        await this.deactivate(memory);
      }
      // Update memory type based on the target region
      const updatedMemory: Memory = { ...memory, type: targetRegion };
      await this.memoryService.updateMemory(updatedMemory);

      // Remove from source region and add to the new one
      this.state[sourceRegion] = this.state[sourceRegion].filter(
        (m) => m.id !== memory.id
      );
      this.state[targetRegion].push(updatedMemory);

      this.updateState(this.state);
      return true;
    } catch (error) {
      this.warnService.warn('Failed to move memory');
      console.error('Error moving memory:', error);
      return false;
    }
  }

  /**
   * Create a new memory and add it to a specific region.
   */
  async activate(memory: Memory): Promise<boolean> {
    // need assistant WHOOPS... we need to know the assistant id
    // TODO:
    this.focusedMemoryService.addFocusedMemory(memory);
    return false;
  }

  /**
   * Delete a memory from all regions.
   */
  async deactivate(memory: Memory): Promise<boolean> {
    return false;
  }

  /**
   * Updates the state and notifies subscribers.
   */
  private updateState(newState: Record<BrainRegion, Memory[]>): void {
    this.state = { ...newState };
    this.stateSubject.next(this.state);
  }
}
