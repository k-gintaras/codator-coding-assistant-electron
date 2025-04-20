import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { Memory } from '../../../services/assistants-api/memory.service';
import { WarnService } from '../../../services/warn.service';
import { Subject, takeUntil } from 'rxjs';
import {
  AssistantMemoryTypeService,
  MemoryRegion,
} from '../../../services/orchestrators/assistant-memory.service';
import {
  AssistantFull,
  AssistantService,
} from '../../../services/assistants-api/assistant.service';
import { SelectedAssistantService } from '../../../services/orchestrators/assistant-selected.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-memory-brain-manager',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, TitleCasePipe],
  templateUrl: './memory-brain-management.component.html',
  styleUrl: './memory-brain-management.component.scss',
})
export class MemoryBrainManagementComponent implements OnInit, OnDestroy {
  @Input() selectedAssistant: AssistantFull | null = null;

  brainRegions: Record<MemoryRegion, Memory[]> = {
    [MemoryRegion.INSTRUCTION]: [],
    [MemoryRegion.PROMPT]: [],
    [MemoryRegion.CONVERSATION]: [],
    [MemoryRegion.DEACTIVATED]: [],
  };

  isLoading = false;
  draggedMemory: Memory | null = null;
  private destroy$ = new Subject<void>();
  memoryRegion = MemoryRegion; // Expose enum to template

  constructor(
    private memoryBrainService: AssistantMemoryTypeService,
    private selectedAssistantService: SelectedAssistantService,
    private assistantService: AssistantService,
    private warnService: WarnService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // First check if we already have a selected assistant passed via @Input
    if (this.selectedAssistant) {
      this.loadMemories();
    }

    // Check for assistant ID in URL
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const assistantId = params.get('id');
      if (assistantId) {
        this.selectAssistant(assistantId);
      }
    });

    // Listen for service-based selection changes
    this.selectedAssistantService.selectedAssistant$
      .pipe(takeUntil(this.destroy$))
      .subscribe((assistant) => {
        if (
          assistant &&
          (!this.selectedAssistant ||
            this.selectedAssistant.id !== assistant.id)
        ) {
          this.selectedAssistant = assistant;
          this.loadMemories();
        }
      });

    // Subscribe to memory state updates
    this.memoryBrainService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.brainRegions = state;
      });
  }

  async selectAssistant(assistantId: string) {
    this.isLoading = true;
    try {
      const assistant = await this.assistantService.getAssistantWithDetailsById(
        assistantId
      );
      if (assistant) {
        this.selectedAssistant = assistant;
        this.selectedAssistantService.setAssistant(assistant); // Update service
        await this.loadMemories();
      }
    } catch {
      this.warnService.warn('Failed to load assistant details');
    } finally {
      this.isLoading = false;
    }
  }

  async loadMemories() {
    if (!this.selectedAssistant) return;

    this.isLoading = true;
    try {
      await this.memoryBrainService.getMemoriesByRegion(
        this.selectedAssistant.id
      );
    } catch {
      this.warnService.warn('Failed to load memories');
    } finally {
      this.isLoading = false;
    }
  }

  onDragStart(memory: Memory) {
    this.draggedMemory = memory;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  async onDrop(event: DragEvent, targetRegion: MemoryRegion) {
    event.preventDefault();
    if (!this.draggedMemory || !this.selectedAssistant) return;

    // Find the source region of the dragged memory
    let sourceRegion: MemoryRegion | null = null;
    for (const [region, memories] of Object.entries(this.brainRegions)) {
      if (memories.some((m) => m.id === this.draggedMemory?.id)) {
        sourceRegion = region as MemoryRegion;
        break;
      }
    }

    if (!sourceRegion || sourceRegion === targetRegion) return;

    // Move the memory to the new region
    await this.memoryBrainService.moveMemoryBetweenRegions(
      this.draggedMemory,
      sourceRegion,
      targetRegion
    );
    this.draggedMemory = null; // Clear the dragged memory
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
