import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AssistantFull } from '../assistants-api/assistant.service';
import { Memory } from '../assistants-api/memory.service';
import { MemoryService } from '../memory.service';
import { WarnService } from '../warn.service';

// Memory brain regions for visualization and organization
export enum BrainRegion {
  INSTRUCTION = 'instruction', // Goes into system message
  PROMPT = 'prompt', // Prepended to user prompt
  CONVERSATION = 'conversation', // Added as message history
  REFERENCE = 'reference', // Owned but not directly included
  DISCONNECTED = 'disconnected', // Not connected to this assistant
}

export interface MemoryBrainState {
  assistant: AssistantFull | null;
  brainRegions: Record<BrainRegion, Memory[]>;
  availableMemories: Memory[];
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MemoryBrainService {
  // State management
  private state: MemoryBrainState = {
    assistant: null,
    brainRegions: {
      [BrainRegion.INSTRUCTION]: [],
      [BrainRegion.PROMPT]: [],
      [BrainRegion.CONVERSATION]: [],
      [BrainRegion.REFERENCE]: [],
      [BrainRegion.DISCONNECTED]: [],
    },
    availableMemories: [],
    isLoading: false,
  };

  private stateSubject = new BehaviorSubject<MemoryBrainState>(this.state);
  public state$ = this.stateSubject.asObservable();

  constructor(
    private memoryService: MemoryService,
    private warnService: WarnService
  ) {}

  // Get current state
  getState(): MemoryBrainState {
    return { ...this.state };
  }

  // Update state and notify subscribers
  private updateState(newState: Partial<MemoryBrainState>): void {
    this.state = { ...this.state, ...newState };
    this.stateSubject.next(this.state);
  }

  // Set loading state
  setLoading(isLoading: boolean): void {
    this.updateState({ isLoading });
  }

  // Clear all brain regions
  clearBrainRegions(): void {
    const emptyRegions = {
      [BrainRegion.INSTRUCTION]: [],
      [BrainRegion.PROMPT]: [],
      [BrainRegion.CONVERSATION]: [],
      [BrainRegion.REFERENCE]: [],
      [BrainRegion.DISCONNECTED]: [],
    };
    this.updateState({ brainRegions: emptyRegions });
  }

  // Select an assistant and load its memories
  async selectAssistant(
    assistantId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assistantService: any
  ): Promise<void> {
    this.setLoading(true);
    this.updateState({ assistant: null });
    this.clearBrainRegions();

    try {
      const assistant = await assistantService.getAssistantWithDetailsById(
        assistantId
      );
      if (assistant) {
        this.updateState({ assistant });
        await this.loadAssistantMemories();
        await this.loadAvailableMemories();
      }
    } catch (error) {
      this.warnService.warn('Failed to load assistant details');
      console.error('Error selecting assistant:', error);
    } finally {
      this.setLoading(false);
    }
  }

  // Load all memories connected to the selected assistant
  async loadAssistantMemories(): Promise<void> {
    if (!this.state.assistant) return;

    try {
      // Load focused memories
      const focusedMemories = this.state.assistant.focusedMemories || [];
      const brainRegions = { ...this.state.brainRegions };

      // Sort memories by type and assign to brain regions
      focusedMemories.forEach((memory) => {
        if (memory.type === 'instruction') {
          // Instructions go to the INSTRUCTION region
          brainRegions[BrainRegion.INSTRUCTION].push(memory);
        } else {
          // Other focused memories go to CONVERSATION region
          brainRegions[BrainRegion.CONVERSATION].push(memory);
        }
      });

      // Load owned (but not focused) memories
      const ownedMemories = await this.memoryService.getOwnedMemories(
        this.state.assistant.id
      );
      const ownedNotFocused = ownedMemories.filter(
        (ownedMemory) =>
          !focusedMemories.some(
            (focusedMemory) => focusedMemory.id === ownedMemory.id
          )
      );

      // Assign to REFERENCE region
      brainRegions[BrainRegion.REFERENCE] = ownedNotFocused;

      this.updateState({ brainRegions });
    } catch (error) {
      this.warnService.warn('Failed to load assistant memories');
      console.error('Error loading assistant memories:', error);
    }
  }

  // Load available memories that can be connected to the assistant
  async loadAvailableMemories(): Promise<void> {
    try {
      if (!this.state.assistant) return;

      // Get all memories
      const allMemories = await this.memoryService.getAllMemories();
      const brainRegions = { ...this.state.brainRegions };

      // Filter out memories already connected to this assistant
      const connectedMemoryIds = [
        ...brainRegions[BrainRegion.INSTRUCTION].map((m) => m.id),
        ...brainRegions[BrainRegion.CONVERSATION].map((m) => m.id),
        ...brainRegions[BrainRegion.REFERENCE].map((m) => m.id),
      ];

      const availableMemories = allMemories.filter(
        (memory) => !connectedMemoryIds.includes(memory.id)
      );

      // These are disconnected memories
      brainRegions[BrainRegion.DISCONNECTED] = availableMemories;

      this.updateState({ availableMemories, brainRegions });
    } catch (error) {
      this.warnService.warn('Failed to load available memories');
      console.error('Error loading available memories:', error);
    }
  }

  // Move a memory between brain regions
  async moveMemoryBetweenRegions(
    memory: Memory,
    sourceRegion: BrainRegion,
    targetRegion: BrainRegion
  ): Promise<boolean> {
    if (!this.state.assistant) return false;
    this.setLoading(true);

    try {
      // Handle different region moves
      switch (true) {
        // Moving to INSTRUCTION region
        case targetRegion === BrainRegion.INSTRUCTION:
          // Update memory type if needed
          if (memory.type !== 'instruction') {
            const updatedMemory: Memory = { ...memory, type: 'instruction' };
            await this.memoryService.updateMemory(updatedMemory);
          }

          // Connect to assistant if not already
          if (sourceRegion === BrainRegion.DISCONNECTED) {
            await this.memoryService.createOwnedMemory(
              this.state.assistant.id,
              memory.id
            );
          }

          // Add to focused memories
          await this.memoryService.createFocusedMemory(
            this.state.assistant.memoryFocusRule.id,
            memory.id
          );
          break;

        // Moving to CONVERSATION region
        case targetRegion === BrainRegion.CONVERSATION:
          // Connect to assistant if not already
          if (sourceRegion === BrainRegion.DISCONNECTED) {
            await this.memoryService.createOwnedMemory(
              this.state.assistant.id,
              memory.id
            );
          }

          // Add to focused memories
          await this.memoryService.createFocusedMemory(
            this.state.assistant.memoryFocusRule.id,
            memory.id
          );
          break;

        // Moving to REFERENCE region
        case targetRegion === BrainRegion.REFERENCE:
          // Connect to assistant if not already
          if (sourceRegion === BrainRegion.DISCONNECTED) {
            await this.memoryService.createOwnedMemory(
              this.state.assistant.id,
              memory.id
            );
          }

          // Remove from focused memories if needed
          if (
            sourceRegion === BrainRegion.INSTRUCTION ||
            sourceRegion === BrainRegion.CONVERSATION
          ) {
            await this.memoryService.deleteFocusedMemory(
              this.state.assistant.memoryFocusRule.id,
              memory.id
            );
          }
          break;

        // Moving to DISCONNECTED region
        case targetRegion === BrainRegion.DISCONNECTED:
          // Remove from focused memories if needed
          if (
            sourceRegion === BrainRegion.INSTRUCTION ||
            sourceRegion === BrainRegion.CONVERSATION
          ) {
            await this.memoryService.deleteFocusedMemory(
              this.state.assistant.memoryFocusRule.id,
              memory.id
            );
          }

          // Disconnect from assistant
          await this.memoryService.deleteOwnedMemory(
            this.state.assistant.id,
            memory.id
          );
          break;

        // Add PROMPT region handling when implemented
        case targetRegion === BrainRegion.PROMPT:
          // This would require a custom implementation to prepend to prompts
          this.memoryService.rememberForSession(
            this.state.assistant.id,
            memory.description || ''
          );
          this.warnService.warn('Prompt region not yet implemented');
          break;
      }

      // Update local data structures
      const brainRegions = { ...this.state.brainRegions };

      // Remove from source region
      brainRegions[sourceRegion] = brainRegions[sourceRegion].filter(
        (m) => m.id !== memory.id
      );

      // Add to target region
      brainRegions[targetRegion].push(memory);

      this.updateState({ brainRegions });
      return true;
    } catch (error) {
      this.warnService.warn('Failed to move memory');
      console.error('Error moving memory:', error);
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  // Create a new memory
  async createMemory(
    memory: Memory,
    brainRegion: BrainRegion
  ): Promise<boolean> {
    if (!this.state.assistant) {
      this.warnService.warn('Please select an assistant');
      return false;
    }

    this.setLoading(true);

    try {
      // Create the memory
      const memoryId = await this.memoryService.createMemory(memory);

      if (!memoryId) {
        this.warnService.warn('Failed to create memory');
        return false;
      }

      // Get the created memory
      const createdMemory = await this.memoryService.getMemory(memoryId);

      if (createdMemory) {
        // Add to the appropriate brain region
        const brainRegions = { ...this.state.brainRegions };

        if (brainRegion !== BrainRegion.DISCONNECTED) {
          // Add the memory to the assistant
          await this.memoryService.createOwnedMemory(
            this.state.assistant.id,
            memoryId
          );

          // If it should be a focused memory
          if (
            brainRegion === BrainRegion.INSTRUCTION ||
            brainRegion === BrainRegion.CONVERSATION
          ) {
            await this.memoryService.createFocusedMemory(
              this.state.assistant.memoryFocusRule.id,
              memoryId
            );
          }

          // Update local data structures
          brainRegions[brainRegion].push(createdMemory);
        } else {
          // Just add to available memories
          const availableMemories = [
            ...this.state.availableMemories,
            createdMemory,
          ];
          brainRegions[BrainRegion.DISCONNECTED].push(createdMemory);
          this.updateState({ availableMemories });
        }

        this.updateState({ brainRegions });
        this.warnService.warn('Memory created successfully');
        return true;
      }
    } catch (error) {
      this.warnService.warn('Failed to create memory');
      console.error('Error creating memory:', error);
    } finally {
      this.setLoading(false);
    }

    return false;
  }

  // Delete a memory
  async deleteMemory(memory: Memory): Promise<boolean> {
    this.setLoading(true);

    try {
      // If connected to the assistant, disconnect first
      if (this.state.assistant) {
        // Check if it's a focused memory
        const isFocused =
          this.state.brainRegions[BrainRegion.INSTRUCTION].some(
            (m) => m.id === memory.id
          ) ||
          this.state.brainRegions[BrainRegion.CONVERSATION].some(
            (m) => m.id === memory.id
          );

        if (isFocused) {
          await this.memoryService.deleteFocusedMemory(
            this.state.assistant.memoryFocusRule.id,
            memory.id
          );
        }

        // Check if it's an owned memory
        const isOwned =
          this.state.brainRegions[BrainRegion.REFERENCE].some(
            (m) => m.id === memory.id
          ) || isFocused;

        if (isOwned) {
          await this.memoryService.deleteOwnedMemory(
            this.state.assistant.id,
            memory.id
          );
        }
      }

      // Delete the memory
      await this.memoryService.deleteMemory(memory.id);

      // Update local data structures
      const brainRegions = { ...this.state.brainRegions };

      for (const region in brainRegions) {
        brainRegions[region as BrainRegion] = brainRegions[
          region as BrainRegion
        ].filter((m) => m.id !== memory.id);
      }

      const availableMemories = this.state.availableMemories.filter(
        (m) => m.id !== memory.id
      );

      this.updateState({ brainRegions, availableMemories });
      this.warnService.warn('Memory deleted successfully');
      return true;
    } catch (error) {
      this.warnService.warn('Failed to delete memory');
      console.error('Error deleting memory:', error);
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  // Update an existing memory
  async updateMemory(memory: Memory): Promise<boolean> {
    try {
      const success = await this.memoryService.updateMemory(memory);
      if (success) {
        // Update local memory references in all regions
        const brainRegions = { ...this.state.brainRegions };

        for (const region in brainRegions) {
          brainRegions[region as BrainRegion] = brainRegions[
            region as BrainRegion
          ].map((m) => (m.id === memory.id ? memory : m));
        }

        this.updateState({ brainRegions });
        this.warnService.warn('Memory updated successfully');
      }
      return success;
    } catch (error) {
      this.warnService.warn('Failed to update memory');
      console.error('Error updating memory:', error);
      return false;
    }
  }

  // Filter memories by search text or tags
  filterMemories(
    memories: Memory[],
    searchText: string,
    selectedTags: string[]
  ): Memory[] {
    if (!searchText && selectedTags.length === 0) {
      return memories;
    }

    return memories.filter((memory) => {
      // Filter by search text
      const matchesText =
        !searchText ||
        memory.description?.toLowerCase().includes(searchText.toLowerCase());

      // Later, you could implement tag filtering here
      // This would need to be implemented with your tag service

      return matchesText;
    });
  }
}
