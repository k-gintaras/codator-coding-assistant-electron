import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WarnService } from '../warn.service';
import { Memory } from '../assistants-api/memory.service';
import {
  AssistantMemoryData,
  AssistantMemoryService,
} from '../assistants-api/assistant-memory.service';
import { MemoryActivationService } from './memory-activation.service';
import { AssistantFull } from '../assistants-api/assistant.service';
import { SelectedAssistantService } from './assistant-selected.service';

// Memory brain regions for organization
export enum MemoryRegion {
  INSTRUCTION = 'instruction',
  PROMPT = 'prompt',
  CONVERSATION = 'conversation',
  DEACTIVATED = 'reference',
}

@Injectable({
  providedIn: 'root',
})
export class AssistantMemoryTypeService {
  private state: Record<MemoryRegion, Memory[]> =
    AssistantMemoryTypeService.getCleanState();
  private stateSubject = new BehaviorSubject<Record<MemoryRegion, Memory[]>>(
    this.state
  );
  public state$ = this.stateSubject.asObservable();

  private _focusRuleId: string | null = null;

  constructor(
    private assistantMemoryService: AssistantMemoryService,
    private selectedAssistantService: SelectedAssistantService,
    private warnService: WarnService,
    private memoryActivationService: MemoryActivationService
  ) {}

  /**
   * Fetch all memories grouped by region for a given assistant.
   */
  async getMemoriesByRegion(
    assistantId: string
  ): Promise<Record<MemoryRegion, Memory[]>> {
    try {
      const freshMemoryState = AssistantMemoryTypeService.getCleanState();
      const assistantFull: AssistantFull | null =
        this.selectedAssistantService.getSelectedAssistant();
      if (!assistantFull) return freshMemoryState;

      this._focusRuleId = assistantFull.memoryFocusRule.id;

      const allMemories: AssistantMemoryData | null =
        await this.assistantMemoryService.getAllAssistMemories(assistantId);

      if (allMemories) {
        this.categorizeMemories(allMemories, freshMemoryState);
      }

      this.updateState(freshMemoryState);
      return freshMemoryState;
    } catch (error) {
      this.warnService.warn('Failed to load assistant memories');
      console.error('Error fetching memories:', error);
      return this.state;
    }
  }

  /**
   * Move memory between regions and update state.
   */
  async moveMemoryBetweenRegions(
    memory: Memory,
    sourceRegion: MemoryRegion,
    targetRegion: MemoryRegion
  ): Promise<boolean> {
    if (!this._focusRuleId) return false;
    if (sourceRegion === targetRegion) return false;

    try {
      const updatedMemory: Memory = { ...memory, type: targetRegion };

      if (targetRegion === MemoryRegion.DEACTIVATED) {
        await this.memoryActivationService.deactivateUpdate(
          this._focusRuleId,
          updatedMemory
        );
      } else {
        await this.memoryActivationService.activateUpdate(
          this._focusRuleId,
          updatedMemory
        );
      }

      this.updateStateAfterMove(updatedMemory, sourceRegion, targetRegion);
      return true;
    } catch (error) {
      this.warnService.warn('Failed to move memory');
      console.error('Error moving memory:', error);
      return false;
    }
  }

  /**
   * Categorizes memories into their respective regions.
   */
  private categorizeMemories(
    allMemories: AssistantMemoryData,
    state: Record<MemoryRegion, Memory[]>
  ): void {
    allMemories.focused?.forEach((memory) => {
      switch (memory.type) {
        case MemoryRegion.INSTRUCTION:
          state[MemoryRegion.INSTRUCTION].push(memory);
          break;
        case MemoryRegion.PROMPT:
          state[MemoryRegion.PROMPT].push(memory);
          break;
        default:
          state[MemoryRegion.CONVERSATION].push(memory);
      }
    });

    [...(allMemories.owned ?? []), ...(allMemories.related ?? [])].forEach(
      (memory) => {
        state[MemoryRegion.DEACTIVATED].push(memory);
      }
    );
  }

  /**
   * Updates memory state after movement.
   */
  private updateStateAfterMove(
    memory: Memory,
    source: MemoryRegion,
    target: MemoryRegion
  ): void {
    this.state = {
      ...this.state,
      [source]: this.state[source].filter((m) => m.id !== memory.id),
      [target]: [...this.state[target], { ...memory, type: target }],
    };
    this.stateSubject.next(this.state);
  }

  /**
   * Updates the state and notifies subscribers.
   */
  private updateState(newState: Record<MemoryRegion, Memory[]>): void {
    this.state = { ...newState };
    this.stateSubject.next(this.state);
  }

  /**
   * Returns an empty memory state.
   */
  private static getCleanState(): Record<MemoryRegion, Memory[]> {
    return {
      [MemoryRegion.INSTRUCTION]: [],
      [MemoryRegion.PROMPT]: [],
      [MemoryRegion.CONVERSATION]: [],
      [MemoryRegion.DEACTIVATED]: [],
    };
  }
}
