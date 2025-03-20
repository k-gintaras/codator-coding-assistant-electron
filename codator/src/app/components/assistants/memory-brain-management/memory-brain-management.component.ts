import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import {
  AssistantFull,
  AssistantService,
} from '../../../services/assistants-api/assistant.service';
import { Memory } from '../../../services/assistants-api/memory.service';
import { TagOLDService } from '../../../services/tag.service';
import { WarnService } from '../../../services/warn.service';
import { Subject, takeUntil } from 'rxjs';
import { BrainRegion } from '../../../interfaces/important-concepts';
import { AssistantMemoryTypeService } from '../../../services/orchestrators/assistant-memory.service';

@Component({
  selector: 'app-memory-brain-manager',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './memory-brain-management.component.html',
  styleUrl: './memory-brain-management.component.scss',
})
export class MemoryBrainManagementComponent implements OnInit, OnDestroy {
  // All assistants in the system
  assistants: AssistantFull[] = [];

  // Currently selected assistant
  selectedAssistant: AssistantFull | null = null;

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
    'conversation',
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

  // For cleanup on destroy
  private destroy$ = new Subject<void>();

  constructor(
    private assistantService: AssistantService,
    private memoryBrainService: AssistantMemoryTypeService,
    private tagService: TagOLDService,
    private warnService: WarnService
  ) {}

  async ngOnInit() {
    // Subscribe to state changes from the service
    this.memoryBrainService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.selectedAssistant = state.assistant;
        this.brainRegions = state.brainRegions;
        this.isLoading = state.isLoading;
      });

    await this.loadAssistants();
    await this.loadAllTags();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
    await this.memoryBrainService.selectAssistant(
      assistantId,
      this.assistantService
    );
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
    return this.memoryBrainService.filterMemories(
      memories,
      this.memorySearchText,
      this.selectedTags
    );
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
    await this.memoryBrainService.moveMemoryBetweenRegions(
      this.draggedMemory,
      sourceRegion,
      targetRegion
    );

    // Clear the dragged memory
    this.draggedMemory = null;
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

    const success = await this.memoryBrainService.createMemory(
      memory,
      this.newMemory.brainRegion
    );

    if (success) {
      // Reset the form
      this.newMemory = {
        description: '',
        type: 'knowledge',
        brainRegion: BrainRegion.CONVERSATION,
      };
    }
  }

  /**
   * Update an existing memory
   */
  async updateMemory(memory: Memory) {
    await this.memoryBrainService.updateMemory(memory);
  }

  /**
   * Delete a memory
   */
  async deleteMemory(memory: Memory) {
    if (!confirm('Are you sure you want to delete this memory?')) {
      return;
    }

    await this.memoryBrainService.deleteMemory(memory);
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
