import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MemoryService } from '../memory.service';
import { WarnService } from '../warn.service';
import { Memory } from '../assistants-api/memory.service';
import {
  AssistantMemoryData,
  AssistantMemoryService,
} from '../assistants-api/assistant-memory.service';

// Memory brain regions for organization
export enum BrainRegion {
  INSTRUCTION = 'instruction',
  PROMPT = 'prompt',
  CONVERSATION = 'conversation',
  REFERENCE = 'reference',
  DISCONNECTED = 'disconnected',
}

@Injectable({
  providedIn: 'root',
})
export class MemoryBrainService {
  private state: Record<BrainRegion, Memory[]> = {
    [BrainRegion.INSTRUCTION]: [],
    [BrainRegion.PROMPT]: [],
    [BrainRegion.CONVERSATION]: [],
    [BrainRegion.REFERENCE]: [],
    [BrainRegion.DISCONNECTED]: [],
  };

  private stateSubject = new BehaviorSubject<Record<BrainRegion, Memory[]>>(
    this.state
  );
  public state$ = this.stateSubject.asObservable();

  constructor(
    private memoryService: MemoryService,
    private assistantMemoryService: AssistantMemoryService,
    private warnService: WarnService
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
        [BrainRegion.REFERENCE]: [],
        [BrainRegion.DISCONNECTED]: [],
      };

      // TODO: decide what it means for focused memory to be instruction and for related memory to be instruction... we cant just put them in instruction

      const focusedMemories = allMemories?.focused ?? [];
      const ownedMemories = allMemories?.owned ?? [];
      const relatedMemories = allMemories?.related ?? [];
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

      // these are just reference
      focusedMemories.forEach((memory) => {
        switch (memory.type) {
          case BrainRegion.INSTRUCTION:
            brainRegions[BrainRegion.INSTRUCTION].push(memory);
            break;
          default:
            brainRegions[BrainRegion.CONVERSATION].push(memory);
        }
      });

      allMemories.forEach((memory) => {
        switch (memory.type) {
          case BrainRegion.INSTRUCTION:
            brainRegions[BrainRegion.INSTRUCTION].push(memory);
            break;
          case BrainRegion.PROMPT:
            brainRegions[BrainRegion.PROMPT].push(memory);
            break;
          case BrainRegion.CONVERSATION:
            brainRegions[BrainRegion.CONVERSATION].push(memory);
            break;
          case BrainRegion.REFERENCE:
            brainRegions[BrainRegion.REFERENCE].push(memory);
            break;
          default:
            brainRegions[BrainRegion.DISCONNECTED].push(memory);
        }
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
   * Move a memory between brain regions and update its type accordingly.
   */
  async moveMemoryBetweenRegions(
    memory: Memory,
    sourceRegion: BrainRegion,
    targetRegion: BrainRegion
  ): Promise<boolean> {
    try {
      if (sourceRegion === targetRegion) return false;

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
  async createMemory(
    memory: Memory,
    brainRegion: BrainRegion
  ): Promise<boolean> {
    try {
      const memoryId = await this.memoryService.createMemory(memory);
      if (!memoryId) {
        this.warnService.warn('Failed to create memory');
        return false;
      }

      const createdMemory = await this.memoryService.getMemory(memoryId);
      if (!createdMemory) return false;

      this.state[brainRegion].push(createdMemory);
      this.updateState(this.state);
      return true;
    } catch (error) {
      this.warnService.warn('Failed to create memory');
      console.error('Error creating memory:', error);
      return false;
    }
  }

  /**
   * Delete a memory from all regions.
   */
  async deleteMemory(memory: Memory): Promise<boolean> {
    try {
      await this.memoryService.deleteMemory(memory.id);
      Object.keys(this.state).forEach((region) => {
        this.state[region as BrainRegion] = this.state[
          region as BrainRegion
        ].filter((m) => m.id !== memory.id);
      });
      this.updateState(this.state);
      return true;
    } catch (error) {
      this.warnService.warn('Failed to delete memory');
      console.error('Error deleting memory:', error);
      return false;
    }
  }

  /**
   * Updates the state and notifies subscribers.
   */
  private updateState(newState: Record<BrainRegion, Memory[]>): void {
    this.state = { ...newState };
    this.stateSubject.next(this.state);
  }
}
