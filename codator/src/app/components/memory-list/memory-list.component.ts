import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { AssistantFull } from '../../services/assistants-api/assistant.service';
import { Memory } from '../../services/assistants-api/memory.service';

@Component({
  selector: 'app-memory-list',
  imports: [NgIf, NgFor],
  templateUrl: './memory-list.component.html',
  styleUrl: './memory-list.component.scss',
})
export class MemoryListComponent {
  @Output() forgetMemory: EventEmitter<Memory> = new EventEmitter<Memory>();
  @Output() focusMemory: EventEmitter<Memory> = new EventEmitter<Memory>();
  @Output() editMemory: EventEmitter<Memory> = new EventEmitter<Memory>();
  @Output() deleteMemory: EventEmitter<Memory> = new EventEmitter<Memory>();
  @Output() fuseMemories: EventEmitter<Memory[]> = new EventEmitter<Memory[]>();
  @Output() rememberDeepMemory: EventEmitter<Memory> =
    new EventEmitter<Memory>();

  @Input() assistant: AssistantFull | null = null;
  @Input() memories: Memory[] = [];
  @Input() canForget = false;
  @Input() canFocus = false;
  @Input() canDelete = false;
  @Input() canRememberDeep = false;
  @Input() title = 'Memories';

  // Store selected memories for fusion
  selectedMemories: Memory[] = [];

  getMemoryLimit(): number {
    if (!this.assistant) return 0; // no limit
    return this.assistant.memoryFocusRule.maxResults;
  }

  isMemoryExceeded(memory: Memory): boolean {
    if (!this.assistant) return false; // No assistant means no limit
    const memoryLimit = this.getMemoryLimit();
    if (memoryLimit <= 0) return false; // If limit is 0 or undefined, no memory is exceeded
    const includedMemories = this.memories.slice(0, memoryLimit);
    return !includedMemories.includes(memory);
  }

  isAllowedToRememberDeep(m: Memory): boolean {
    if (this.canRememberDeep) {
      const isInstruction = m.type === 'instruction';
      const isOutDated = this.isMemoryFresh(m);
      const isInstructionOrNotAndOutdated =
        !isInstruction || (isInstruction && isOutDated);
      return isInstructionOrNotAndOutdated;
    }
    return false;
  }

  isMemoryFresh(memory: Memory): boolean {
    if (memory.type === 'instruction' && this.assistant) {
      if (!memory.createdAt) return false;
      const memoryDate = new Date(memory.createdAt);
      const assistantUpdateDate = new Date(this.assistant.updatedAt);
      return memoryDate > assistantUpdateDate;
    }
    return false;
  }

  // Handle memory selection for fusion
  toggleMemorySelection(memory: Memory) {
    if (this.selectedMemories.includes(memory)) {
      this.selectedMemories = this.selectedMemories.filter((m) => m !== memory);
    } else {
      this.selectedMemories.push(memory);
    }
  }

  // Fusion of selected memories
  fuseSelectedMemories() {
    if (this.selectedMemories.length < 2) {
      return;
    }
    this.fuseMemories.emit(this.selectedMemories);
    this.selectedMemories = [];
  }

  forget(memory: Memory) {
    if (!this.canForget) return;
    this.forgetMemory.emit(memory);
  }

  focus(memory: Memory) {
    if (!this.canFocus) return;
    this.focusMemory.emit(memory);
  }

  deleteM(memory: Memory) {
    if (!this.canDelete) return;
    this.deleteMemory.emit(memory);
  }

  rememberDeep(memory: Memory) {
    if (!this.canRememberDeep) return;
    this.rememberDeepMemory.emit(memory);
  }

  edit(memory: Memory) {
    this.editMemory.emit(memory);
  }
}
