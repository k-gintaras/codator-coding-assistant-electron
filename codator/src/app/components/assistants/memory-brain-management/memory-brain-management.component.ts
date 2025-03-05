import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import {
  AssistantFull,
  AssistantService,
} from '../../../services/assistants-api/assistant.service';
import { Memory } from '../../../services/assistants-api/memory.service';
import { MemoryService } from '../../../services/memory.service';
import { TagOLDService } from '../../../services/tag.service';
import { WarnService } from '../../../services/warn.service';

// Memory brain regions for visualization and organization
export enum BrainRegion {
  INSTRUCTION = 'instruction', // Goes into system message
  PROMPT = 'prompt', // Prepended to user prompt
  CONVERSATION = 'conversation', // Added as message history
  REFERENCE = 'reference', // Owned but not directly included
  DISCONNECTED = 'disconnected', // Not connected to this assistant
}

@Component({
  selector: 'app-memory-brain-manager',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './memory-brain-management.component.html',
  styleUrl: './memory-brain-management.component.scss',
})
export class MemoryBrainManagementComponent implements OnInit {
  // All assistants in the system
  assistants: AssistantFull[] = [];

  // Currently selected assistant
  selectedAssistant: AssistantFull | null = null;

  // Available memories for connecting
  availableMemories: Memory[] = [];

  // Search filters
  memorySearchText = '';
  selectedTags: string[] = [];
  availableTags: string[] = [];

  // Brain region memory mapping
  brainRegions: Record<BrainRegion, Memory[]> = {
    [BrainRegion.INSTRUCTION]: [],
    [BrainRegion.PROMPT]: [],
    [BrainRegion.CONVERSATION]: [],
    [BrainRegion.REFERENCE]: [],
    [BrainRegion.DISCONNECTED]: [],
  };

  // UI states
  isLoading = false;
  draggedMemory: Memory | null = null;

  // Constants for the UI display
  readonly BrainRegion = BrainRegion;

  // Memory type options
  memoryTypes: string[] = [
    'instruction',
    'knowledge',
    'session',
    'prompt',
    'meta',
  ];

  // New memory form
  newMemory: {
    description: string;
    type: string;
    brainRegion: BrainRegion;
  } = {
    description: '',
    type: 'knowledge',
    brainRegion: BrainRegion.CONVERSATION,
  };

  constructor(
    private assistantService: AssistantService,
    private memoryService: MemoryService,
    private tagService: TagOLDService,
    private warnService: WarnService
  ) {}

  async ngOnInit() {
    await this.loadAssistants();
    await this.loadAllTags();
  }

  /**
   * Load all assistants from the system
   */
  async loadAssistants() {
    this.isLoading = true;
    try {
      const assistants = await this.assistantService.getAllAssistants();
      if (assistants) {
        this.assistants = [];
        for (const assistant of assistants) {
          const fullAssistant =
            await this.assistantService.getAssistantWithDetailsById(
              assistant.id
            );
          if (fullAssistant) {
            this.assistants.push(fullAssistant);
          }
        }
      }
    } catch (error) {
      this.warnService.warn('Failed to load assistants');
      console.error('Error loading assistants:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Select an assistant and load its connected memories
   */
  async selectAssistant(assistantId: string) {
    this.isLoading = true;
    this.selectedAssistant = null;
    this.clearBrainRegions();

    try {
      const assistant = await this.assistantService.getAssistantWithDetailsById(
        assistantId
      );
      if (assistant) {
        this.selectedAssistant = assistant;
        await this.loadAssistantMemories();
        await this.loadAvailableMemories();
      }
    } catch (error) {
      this.warnService.warn('Failed to load assistant details');
      console.error('Error selecting assistant:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Clear all brain regions
   */
  clearBrainRegions() {
    Object.keys(this.brainRegions).forEach((region) => {
      this.brainRegions[region as BrainRegion] = [];
    });
  }

  /**
   * Load all memories connected to the selected assistant
   */
  async loadAssistantMemories() {
    if (!this.selectedAssistant) return;

    try {
      // Load focused memories
      const focusedMemories = this.selectedAssistant.focusedMemories || [];

      // Sort memories by type and assign to brain regions
      focusedMemories.forEach((memory) => {
        if (memory.type === 'instruction') {
          // Instructions go to the INSTRUCTION region
          this.brainRegions[BrainRegion.INSTRUCTION].push(memory);
        } else {
          // Other focused memories go to CONVERSATION region
          this.brainRegions[BrainRegion.CONVERSATION].push(memory);
        }
      });

      // Load owned (but not focused) memories
      const ownedMemories = await this.memoryService.getOwnedMemories(
        this.selectedAssistant.id
      );
      const ownedNotFocused = ownedMemories.filter(
        (ownedMemory) =>
          !focusedMemories.some(
            (focusedMemory) => focusedMemory.id === ownedMemory.id
          )
      );

      // Assign to REFERENCE region
      this.brainRegions[BrainRegion.REFERENCE] = ownedNotFocused;
    } catch (error) {
      this.warnService.warn('Failed to load assistant memories');
      console.error('Error loading assistant memories:', error);
    }
  }

  /**
   * Load available memories that can be connected to the assistant
   */
  async loadAvailableMemories() {
    try {
      // Get all memories
      const allMemories = await this.memoryService.getAllMemories();

      // Filter out memories already connected to this assistant
      const connectedMemoryIds = [
        ...this.brainRegions[BrainRegion.INSTRUCTION].map((m) => m.id),
        ...this.brainRegions[BrainRegion.CONVERSATION].map((m) => m.id),
        ...this.brainRegions[BrainRegion.REFERENCE].map((m) => m.id),
      ];

      this.availableMemories = allMemories.filter(
        (memory) => !connectedMemoryIds.includes(memory.id)
      );

      // These are disconnected memories
      this.brainRegions[BrainRegion.DISCONNECTED] = this.availableMemories;
    } catch (error) {
      this.warnService.warn('Failed to load available memories');
      console.error('Error loading available memories:', error);
    }
  }

  /**
   * Load all available tags
   */
  async loadAllTags() {
    try {
      const tags = await this.tagService.getAllTags().toPromise();
      if (tags) {
        this.availableTags = tags.map((tag) => tag.name);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  }

  /**
   * Filter memories by search text and tags
   */
  filterMemories(memories: Memory[]): Memory[] {
    if (!this.memorySearchText && this.selectedTags.length === 0) {
      return memories;
    }

    return memories.filter((memory) => {
      // Filter by search text
      const matchesText =
        !this.memorySearchText ||
        memory.description
          ?.toLowerCase()
          .includes(this.memorySearchText.toLowerCase());

      // Filter by tags if any are selected
      // This would need to be implemented with your tag service
      // For now, we'll just return the text match
      return matchesText;
    });
  }

  /**
   * Handle drag start on a memory
   */
  onDragStart(memory: Memory) {
    this.draggedMemory = memory;
  }

  /**
   * Handle drag over on a brain region
   */
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  /**
   * Handle drop on a brain region
   */
  async onDrop(event: DragEvent, targetRegion: BrainRegion) {
    event.preventDefault();

    if (!this.draggedMemory || !this.selectedAssistant) return;

    // Find the source region
    let sourceRegion: BrainRegion | null = null;
    for (const [region, memories] of Object.entries(this.brainRegions)) {
      if (memories.some((m) => m.id === this.draggedMemory?.id)) {
        sourceRegion = region as BrainRegion;
        break;
      }
    }

    if (!sourceRegion) return;

    // If dropped on the same region, do nothing
    if (sourceRegion === targetRegion) return;

    // Based on the source and target regions, perform different operations
    await this.moveMemoryBetweenRegions(
      this.draggedMemory,
      sourceRegion,
      targetRegion
    );

    // Clear the dragged memory
    this.draggedMemory = null;
  }

  /**
   * Move a memory between brain regions
   */
  async moveMemoryBetweenRegions(
    memory: Memory,
    sourceRegion: BrainRegion,
    targetRegion: BrainRegion
  ) {
    if (!this.selectedAssistant) return;

    this.isLoading = true;

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
              this.selectedAssistant.id,
              memory.id
            );
          }

          // Add to focused memories
          await this.memoryService.createFocusedMemory(
            this.selectedAssistant.memoryFocusRule.id,
            memory.id
          );
          break;

        // Moving to CONVERSATION region
        case targetRegion === BrainRegion.CONVERSATION:
          // Connect to assistant if not already
          if (sourceRegion === BrainRegion.DISCONNECTED) {
            await this.memoryService.createOwnedMemory(
              this.selectedAssistant.id,
              memory.id
            );
          }

          // Add to focused memories
          await this.memoryService.createFocusedMemory(
            this.selectedAssistant.memoryFocusRule.id,
            memory.id
          );
          break;

        // Moving to REFERENCE region
        case targetRegion === BrainRegion.REFERENCE:
          // Connect to assistant if not already
          if (sourceRegion === BrainRegion.DISCONNECTED) {
            await this.memoryService.createOwnedMemory(
              this.selectedAssistant.id,
              memory.id
            );
          }

          // Remove from focused memories if needed
          if (
            sourceRegion === BrainRegion.INSTRUCTION ||
            sourceRegion === BrainRegion.CONVERSATION
          ) {
            await this.memoryService.deleteFocusedMemory(
              this.selectedAssistant.memoryFocusRule.id,
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
              this.selectedAssistant.memoryFocusRule.id,
              memory.id
            );
          }

          // Disconnect from assistant
          await this.memoryService.deleteOwnedMemory(
            this.selectedAssistant.id,
            memory.id
          );
          break;

        // Add PROMPT region handling when implemented
        case targetRegion === BrainRegion.PROMPT:
          // This would require a custom implementation to prepend to prompts
          this.warnService.warn('Prompt region not yet implemented');
          break;
      }

      // Update local data structures
      // Remove from source region
      this.brainRegions[sourceRegion] = this.brainRegions[sourceRegion].filter(
        (m) => m.id !== memory.id
      );

      // Add to target region
      this.brainRegions[targetRegion].push(memory);
    } catch (error) {
      this.warnService.warn('Failed to move memory');
      console.error('Error moving memory:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Create a new memory and add it to the specified brain region
   */
  async createNewMemory() {
    if (!this.selectedAssistant || !this.newMemory.description) {
      this.warnService.warn(
        'Please select an assistant and enter a description'
      );
      return;
    }

    this.isLoading = true;

    try {
      // Create the memory
      const memory: Memory = {
        id: '',
        type: this.newMemory.type,
        description: this.newMemory.description,
        data: null,
        createdAt: null,
        updatedAt: null,
        name: null,
        summary: null,
      };

      const memoryId = await this.memoryService.createMemory(memory);

      if (memoryId) {
        // Get the created memory
        const createdMemory = await this.memoryService.getMemory(memoryId);

        if (createdMemory) {
          // Add to the appropriate brain region
          if (this.newMemory.brainRegion !== BrainRegion.DISCONNECTED) {
            // Add the memory to the assistant
            await this.memoryService.createOwnedMemory(
              this.selectedAssistant.id,
              memoryId
            );

            // If it should be a focused memory
            if (
              this.newMemory.brainRegion === BrainRegion.INSTRUCTION ||
              this.newMemory.brainRegion === BrainRegion.CONVERSATION
            ) {
              await this.memoryService.createFocusedMemory(
                this.selectedAssistant.memoryFocusRule.id,
                memoryId
              );
            }

            // Update local data structures
            this.brainRegions[this.newMemory.brainRegion].push(createdMemory);
          } else {
            // Just add to available memories
            this.availableMemories.push(createdMemory);
            this.brainRegions[BrainRegion.DISCONNECTED].push(createdMemory);
          }

          // Reset the form
          this.newMemory = {
            description: '',
            type: 'knowledge',
            brainRegion: BrainRegion.CONVERSATION,
          };

          this.warnService.warn('Memory created successfully');
        }
      }
    } catch (error) {
      this.warnService.warn('Failed to create memory');
      console.error('Error creating memory:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Update an existing memory
   */
  async updateMemory(memory: Memory) {
    try {
      await this.memoryService.updateMemory(memory);
      this.warnService.warn('Memory updated successfully');
    } catch (error) {
      this.warnService.warn('Failed to update memory');
      console.error('Error updating memory:', error);
    }
  }

  /**
   * Delete a memory
   */
  async deleteMemory(memory: Memory) {
    if (!confirm('Are you sure you want to delete this memory?')) {
      return;
    }

    this.isLoading = true;

    try {
      // If connected to the assistant, disconnect first
      if (this.selectedAssistant) {
        // Check if it's a focused memory
        const isFocused =
          this.brainRegions[BrainRegion.INSTRUCTION].some(
            (m) => m.id === memory.id
          ) ||
          this.brainRegions[BrainRegion.CONVERSATION].some(
            (m) => m.id === memory.id
          );

        if (isFocused) {
          await this.memoryService.deleteFocusedMemory(
            this.selectedAssistant.memoryFocusRule.id,
            memory.id
          );
        }

        // Check if it's an owned memory
        const isOwned =
          this.brainRegions[BrainRegion.REFERENCE].some(
            (m) => m.id === memory.id
          ) || isFocused;

        if (isOwned) {
          await this.memoryService.deleteOwnedMemory(
            this.selectedAssistant.id,
            memory.id
          );
        }
      }

      // Delete the memory
      await this.memoryService.deleteMemory(memory.id);

      // Update local data structures
      for (const region in this.brainRegions) {
        this.brainRegions[region as BrainRegion] = this.brainRegions[
          region as BrainRegion
        ].filter((m) => m.id !== memory.id);
      }

      this.availableMemories = this.availableMemories.filter(
        (m) => m.id !== memory.id
      );

      this.warnService.warn('Memory deleted successfully');
    } catch (error) {
      this.warnService.warn('Failed to delete memory');
      console.error('Error deleting memory:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Test memory recall in different regions
   */
  async testMemoryRecall() {
    if (!this.selectedAssistant) {
      this.warnService.warn('Please select an assistant');
      return;
    }

    // This would communicate with your test service to check memory recall effectiveness
    this.warnService.warn('Memory recall testing not yet implemented');

    // You could implement different test scenarios:
    // 1. Test instruction recall
    // 2. Test conversation memory recall
    // 3. Test which region has better recall for different memory types
  }
}
