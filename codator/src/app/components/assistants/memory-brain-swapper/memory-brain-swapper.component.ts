import { Component, Input } from '@angular/core';
import { BrainRegion } from '../../../interfaces/important-concepts';
import { Memory } from '../../../services/assistants-api/memory.service';
import { MemoryBrainService } from '../../../services/orchestrators/assistant-memory.service';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-memory-brain-swapper',
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './memory-brain-swapper.component.html',
  styleUrl: './memory-brain-swapper.component.scss',
})
export class MemoryBrainSwapperComponent {
  @Input() assistant: { id: string; name: string; description: string } | null =
    null;
  brainRegions: Record<BrainRegion, Memory[]> = {
    [BrainRegion.INSTRUCTION]: [],
    [BrainRegion.PROMPT]: [],
    [BrainRegion.CONVERSATION]: [],
    [BrainRegion.REFERENCE]: [],
    [BrainRegion.DISCONNECTED]: [],
  };
  newMemoryDesc = '';
  draggedMemory: { memory: Memory; fromRegion: BrainRegion } | null = null;
  brainRegionKeys = Object.values(BrainRegion);

  constructor(private memoryBrainService: MemoryBrainService) {}

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

  async addMemory() {
    // if (this.assistant && this.newMemoryDesc.trim()) {
    //   await this.memoryBrainService.createMemory(
    //     {
    //       description: this.newMemoryDesc,
    //       type: 'knowledge',
    //     },
    //     BrainRegion.CONVERSATION
    //   );
    //   this.newMemoryDesc = '';
    //   this.loadMemories();
    // }
  }

  async deleteMemory(memory: Memory, region: BrainRegion) {
    console.log('Deleting memory', memory, region);
    // await this.memoryBrainService.deleteMemory(memory);
    this.loadMemories();
  }

  onDragStart(memory: Memory, fromRegion: BrainRegion) {
    this.draggedMemory = { memory, fromRegion };
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  async onDrop(event: DragEvent, targetRegion: BrainRegion) {
    event.preventDefault();
    if (this.draggedMemory && this.draggedMemory.fromRegion !== targetRegion) {
      // await this.memoryBrainService.moveMemoryBetweenRegions(
      //   this.draggedMemory.memory,
      //   this.draggedMemory.fromRegion,
      //   targetRegion
      // );
      // this.loadMemories();
    }
    this.draggedMemory = null;
  }
}
