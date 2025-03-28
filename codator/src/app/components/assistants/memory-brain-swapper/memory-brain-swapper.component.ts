import { Component, Input, OnChanges } from '@angular/core';
import { Memory } from '../../../services/assistants-api/memory.service';
import {
  AssistantMemoryTypeService,
  MemoryRegion,
} from '../../../services/orchestrators/assistant-memory.service';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForgetService } from '../../../services/orchestrators/forget.service';

@Component({
  selector: 'app-memory-brain-swapper',
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './memory-brain-swapper.component.html',
  styleUrl: './memory-brain-swapper.component.scss',
})
export class MemoryBrainSwapperComponent implements OnChanges {
  @Input() assistant: { id: string; name: string; description: string } | null =
    null;
  brainRegions: Record<MemoryRegion, Memory[]> = {
    [MemoryRegion.INSTRUCTION]: [],
    [MemoryRegion.PROMPT]: [],
    [MemoryRegion.CONVERSATION]: [],
    [MemoryRegion.DEACTIVATED]: [],
  };
  newMemoryDesc = '';
  draggedMemory: { memory: Memory; fromRegion: MemoryRegion } | null = null;
  brainRegionKeys = Object.values(MemoryRegion);

  constructor(
    private memoryBrainService: AssistantMemoryTypeService,
    private forgetService: ForgetService
  ) {}

  ngOnChanges() {
    if (this.assistant) {
      this.loadMemories();
    }
  }

  async loadMemories() {
    if (this.assistant) {
      this.brainRegions = await this.memoryBrainService.getMemoriesByRegion(
        this.assistant.id
      );
    }
  }

  async disconnectMemory(memory: Memory, region: MemoryRegion) {
    if (!this.assistant) return;
    console.log('Forgetting memory', memory, region);
    await this.forgetService.forget(this.assistant.id, memory.id);
    this.loadMemories();
  }

  onDragStart(memory: Memory, fromRegion: MemoryRegion) {
    this.draggedMemory = { memory, fromRegion };
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  async onDrop(event: DragEvent, targetRegion: MemoryRegion) {
    event.preventDefault();
    if (this.draggedMemory && this.draggedMemory.fromRegion !== targetRegion) {
      await this.memoryBrainService.moveMemoryBetweenRegions(
        this.draggedMemory.memory,
        this.draggedMemory.fromRegion,
        targetRegion
      );
      this.loadMemories();
    }
    this.draggedMemory = null;
  }
}
