import { NgClass, NgFor, NgIf, SlicePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MemoryService } from '../../../services/memory.service';
import { OrganizedMemories } from '../../../services/assistants-api/memory-extra.service';
import { Memory } from '../../../services/assistants-api/memory.service';

@Component({
  standalone: true,
  selector: 'app-memory-library',
  imports: [FormsModule, NgFor, NgIf, RouterLink, NgClass, SlicePipe],
  templateUrl: './memory-library.component.html',
  styleUrl: './memory-library.component.scss',
})
export class MemoryLibraryComponent implements OnInit {
  memories: Memory[] = [];
  organizedMemories: OrganizedMemories | null = null;
  searchTerm = '';
  selectedMemory: Memory | null = null;

  showLooseMemories = false;
  showOwnedMemories = false;
  showFocusedMemories = false;

  constructor(private memoryService: MemoryService) {}

  selectMemory(memory: Memory) {
    this.selectedMemory = memory;
  }

  ngOnInit(): void {
    this.loadOrganizedMemories();
  }

  async loadOrganizedMemories(): Promise<void> {
    try {
      const result = await this.memoryService.getOrganizedMemories();
      if (!result) return;
      this.organizedMemories = result;
      this.memories = [
        ...result.looseMemories,
        ...result.ownedMemories.flatMap((o) => o.memories),
        ...result.focusedMemories.flatMap((f) => f.memories),
      ];
    } catch (error) {
      console.error('Error loading organized memories', error);
    }
  }

  onSearchChange(): void {
    // if (!this.organizedMemories) return;
    // const allMemories = [
    //   ...this.organizedMemories.looseMemories,
    //   ...this.organizedMemories.ownedMemories.flatMap((o) => o.memories),
    //   ...this.organizedMemories.focusedMemories.flatMap((f) => f.memories),
    // ];
    // this.memories = allMemories.filter((memory) =>
    //   memory.description?.toLowerCase().includes(this.searchTerm.toLowerCase())
    // );
  }
}
