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
  @Output() rememberDeepMemory: EventEmitter<Memory> =
    new EventEmitter<Memory>();

  @Input() assistant: AssistantFull | null = null;
  @Input() memories: Memory[] = [];
  @Input() canForget = false;
  @Input() canFocus = false;
  @Input() canRememberDeep = false;
  @Input() title = 'Memories';

  getMemoryLimit(): number {
    if (!this.assistant) return 0; // no limit
    return this.assistant.memoryFocusRule.maxResults;
  }

  // Determine if the memory exceeds the maxResults limit
  isMemoryExceeded(memory: Memory): boolean {
    if (!this.assistant) return false; // No assistant means no limit
    const memoryLimit = this.getMemoryLimit();

    if (memoryLimit <= 0) return false; // If limit is 0 or undefined, no memory is exceeded

    // Get only the allowed memories within the limit
    const includedMemories = this.memories.slice(0, memoryLimit);

    // Check if the given memory exists inside the includedMemories
    return !includedMemories.includes(memory);
  }

  isAllowedToRememberDeep(m: Memory): boolean {
    if (this.canRememberDeep) {
      // is non instruction
      const isInstruction = m.type === 'instruction';
      const isOutDated = this.isMemoryFresh(m);

      const isInstructionOrNotAndOutdated =
        !isInstruction || (isInstruction && isOutDated);

      return isInstructionOrNotAndOutdated;
    }
    return false;
  }

  // Determine if the memory is 'too fresh' (not yet added to instructions if it's of type 'instruction')
  isMemoryFresh(memory: Memory): boolean {
    // Only check 'instruction' memories
    if (memory.type === 'instruction' && this.assistant) {
      if (!memory.createdAt) return false; // If memory has no timestamp, assume it's not fresh

      const memoryDate = new Date(memory.createdAt);
      const assistantUpdateDate = new Date(this.assistant.updatedAt);

      return memoryDate > assistantUpdateDate; // Memory is fresh if it’s newer than last assistant update
    }

    return false; // Non-instruction memories are NOT considered fresh
  }

  forget(memory: Memory) {
    if (!this.canForget) return;
    this.forgetMemory.emit(memory);
  }

  focus(memory: Memory) {
    if (!this.canFocus) return;
    this.focusMemory.emit(memory);
  }

  rememberDeep(memory: Memory) {
    if (!this.canRememberDeep) return;
    this.rememberDeepMemory.emit(memory);
  }

  edit(memory: Memory) {
    this.editMemory.emit(memory);
  }
}
