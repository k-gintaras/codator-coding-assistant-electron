import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MemoryService } from '../../services/memory.service';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MemoryListComponent } from '../memory-list/memory-list.component';
import { WarnService } from '../../services/warn.service';
import { TagManagerComponent } from '../tag-manager/tag-manager.component';
import { AssistantFull } from '../../services/assistants-api/assistant.service';
import {
  Memory,
  MemoryWithTags,
} from '../../services/assistants-api/memory.service';
import { PROMPT_SEPARATOR } from '../../app.constants';

@Component({
  standalone: true,
  selector: 'app-edit-memories',
  imports: [NgFor, NgIf, FormsModule, MemoryListComponent, TagManagerComponent],
  templateUrl: './edit-memories.component.html',
  styleUrl: './edit-memories.component.scss',
})
export class EditMemoriesComponent implements OnChanges {
  @Input() assistant: AssistantFull | null = null;

  memory: Memory = {
    id: '',
    description: '',
    type: 'knowledge',
    createdAt: new Date(),
    updatedAt: new Date(),
    data: undefined,
  };
  assistantFocusMemories: Memory[] = [];
  focusedInstructions: Memory[] = [];
  focusedMemories: Memory[] = [];
  ownedMemories: Memory[] = [];
  temporaryMemories: string[] = [];
  similarMemories: Memory[] = [];
  canReloadMemories = true;

  constructor(
    private memoryService: MemoryService,
    private warnService: WarnService
  ) {}
  ngOnChanges(changes: SimpleChanges): void {
    // when assistant changes, it just changes, it doesnt tell to reload memories, we have to do manually
    // ng on init doesnt know when assistant changed unless we RECREATE whole component
    if (changes['assistant']) {
      this.loadMemories();
    }
  }

  // Load existing memories
  loadMemories(): void {
    if (!this.assistant?.focusedMemories) return;
    this.assistantFocusMemories = this.assistant.focusedMemories;
    this.loadAllMemories().then();
  }

  reloadMemories() {
    if (!this.canReloadMemories) return;
    this.loadMemories();
  }

  async loadAllMemories() {
    if (!this.assistant) return;
    const id = this.assistant.id;
    const tags = this.assistant.assistantTags;

    // Load all focused memories
    const allFocusedMemories = await this.memoryService.getFocusedMemories(id);
    // Sort by last modified date
    allFocusedMemories.sort((a, b) => {
      const dateA = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const dateB = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      return dateB - dateA;
    });

    // Separate focused memories from focused instructions
    const focusedInstructions = allFocusedMemories.filter(
      (m: Memory) => m.type === 'instruction'
    );
    const focusedMemories = allFocusedMemories.filter(
      (m: Memory) => m.type !== 'instruction'
    );

    // Load owned memories
    const ownedMemories = await this.memoryService.getOwnedMemories(id);

    // Filter out memories already in focused memories
    const filteredOwnedMemories = ownedMemories.filter(
      (ownedMemory) =>
        !allFocusedMemories.some(
          (focusedMemory) => focusedMemory.id === ownedMemory.id
        )
    );

    // Load temporary memories
    const temporaryMemories =
      (await this.memoryService.getSessionMemory(id)) || [];

    // Sort all memories (merged focused, owned, and temporary memories)
    filteredOwnedMemories.sort((a, b) => {
      const dateA = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const dateB = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      return dateB - dateA;
    });

    // Assign to the component properties
    this.focusedInstructions = focusedInstructions;
    this.focusedMemories = focusedMemories;
    this.ownedMemories = filteredOwnedMemories;
    this.temporaryMemories = temporaryMemories;

    // Load memories by tags if available
    if (tags) {
      const tagNames = tags.map((tag) => tag.name);
      const memoriesByTags = await this.memoryService.getMemoriesByTags(
        tagNames
      );

      // Filter out memories already in focused memories
      const filteredMemoriesByTags = memoriesByTags.filter(
        (memory) =>
          !allFocusedMemories.some(
            (focusedMemory) => focusedMemory.id === memory.id
          )
      );

      // Sort filtered memories by last updated date
      filteredMemoriesByTags.sort((a, b) => {
        const dateA = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const dateB = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return dateB - dateA;
      });

      this.similarMemories = filteredMemoriesByTags;
    }
  }

  // remembering:
  async focus(m: Memory) {
    if (!m.id) return;
    if (!this.assistant) return;
    const added = await this.memoryService.createFocusedMemory(
      this.assistant.memoryFocusRule.id,
      m.id
    );
    if (!added) return;
    const fm: MemoryWithTags = { ...m, tags: [] }; // focused memory is a memory with tags
    this.assistant.focusedMemories.push(fm); // add focused memory to assistant focused memories
    this.warnService.warn('Focused Memory Added');
    this.reloadMemories();
  }

  async deepMemorize(m: Memory) {
    if (!m.id) return;
    if (!this.assistant) return;
    m.type = 'instruction';
    const ok = await this.memoryService.createDeepMemory(
      this.assistant,
      m,
      false
    );
    this.warnService.warn('Deep Memorized');
    this.reloadMemories();

    return ok;
  }

  async lightMemorize(m: Memory) {
    if (!m.id) return;
    if (!this.assistant) return;
    const ok = await this.memoryService.createLongMemory(
      this.assistant,
      m,
      false
    );
    this.warnService.warn('Light Memorized');
    this.reloadMemories();

    return ok;
  }

  async memorize(m: Memory) {
    if (!m.id) return;
    if (!this.assistant) return;
    const ok = await this.memoryService.createDisconnectedMemory(
      this.assistant,
      m
    );
    this.warnService.warn('Short Memorized');
    this.reloadMemories();

    return ok;
  }

  createAndFocus(memoryString: string) {
    const m: Memory = {
      id: '',
      type: 'knowledge',
      description: memoryString,
      data: undefined,
      createdAt: null,
      updatedAt: null,
    };
    if (!this.assistant) return;
    this.memoryService.createLongMemory(this.assistant, m, true).then((ok) => {
      console.log('Created and Focused:', ok);
      this.warnService.warn('Created and Focused');
      this.reloadMemories();
    });
  }

  async forget(m: Memory) {
    if (!m.id) return;
    if (!this.assistant) return;
    const removed = await this.memoryService.forgetDeep(this.assistant, m);
    this.warnService.warn('Memory Forgotten');
    this.reloadMemories();

    if (!removed) return;
  }

  // Handle form submission for adding or updating memories
  edit(m: Memory) {
    this.memory = m;
  }

  // Handle form submission for adding or updating memories
  deleteMemory(m: Memory) {
    if (!m.id) return;
    this.memoryService.deleteMemory(m.id).then((success) => {
      if (success) {
        this.warnService.warn('Memory Deleted');
        this.reloadMemories();
      }
    });
  }

  async fuse(m: Memory[]) {
    if (!this.assistant) return;
    console.log('Fusing memories:', m);

    for (const memory of m) {
      await this.memoryService.forgetDeep(this.assistant, memory);
    }

    this.createAndFocus(
      m.map((memory) => memory.description).join(PROMPT_SEPARATOR)
    );
  }

  // do we save as assistant memory, as focused memory, as owned memory, as temporary memory?
  async onSubmit(): Promise<void> {
    if (this.memory.id) {
      this.memoryService.updateMemory(this.memory).then((success) => {
        if (success) {
          this.warnService.warn('Memory Updated');
          this.reloadMemories();
        }
      });
    } else {
      if (!this.assistant) return;
      const createdId = await this.memoryService.createMemory(this.memory);
      this.warnService.warn('Memory Created');
      if (!createdId) return;
      const connected = await this.memoryService.createFocusedMemory(
        this.assistant.memoryFocusRule.id,
        createdId
      );
      if (!connected) return;
      this.warnService.warn('Memory Connected');
      this.reloadMemories();
    }
  }

  // Update memory (downgrade, upgrade, or adjust type)
  updateMemory(memory: Memory): void {
    if (!memory.id) return;
    // Change type to another tier (or upgrade based on requirements)
    this.memoryService.updateMemory(memory).then(() => {
      this.loadMemories(); // Reload after update
    });
    this.warnService.warn('Memory Updated');
    this.reloadMemories();
  }
}
