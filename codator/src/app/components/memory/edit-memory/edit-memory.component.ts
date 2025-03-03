import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MemoryService } from '../../../services/memory.service';
import { TagManagerComponent } from '../../tag-manager/tag-manager.component';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistantService } from '../../../services/assistants-services/assistant.service';
import { Assistant } from '../../../services/assistants-api/assistant.service';
import { Memory } from '../../../services/assistants-api/memory.service';
import { Tag } from '../../../services/assistants-api/tag.service';

@Component({
  standalone: true,
  selector: 'app-edit-memory',
  imports: [TagManagerComponent, NgIf, FormsModule, NgFor],
  templateUrl: './edit-memory.component.html',
  styleUrl: './edit-memory.component.scss',
})
export class EditMemoryComponent implements OnInit {
  memory: Memory = {
    id: '',
    description: '',
    type: 'knowledge', // Default memory type
    createdAt: new Date(),
    updatedAt: new Date(),
    data: undefined,
  };
  statusMessage: string | null = null;
  tags: string[] = [];

  assistantId: string | null = null;
  memoryFocusRuleId: string | null = null;
  assistant: Assistant | null = null;

  isFunctionMemory = false;

  constructor(
    private memoryService: MemoryService,
    private assistantService: AssistantService,
    private route: ActivatedRoute // For accessing route params
  ) {
    this.route.paramMap.subscribe((params) => {
      this.memory.id = params.get('id') || ''; // Get the 'id' from the URL
      if (!this.memory.id) {
        // Handle the case when there's no ID (creating a new memory)
        console.log('No ID provided, creating new memory');
      } else {
        // Load the memory if editing
        this.loadMemory(this.memory.id);
        this.assistant = null;
      }
    });

    this.route.queryParams.subscribe((queryParams) => {
      const assistantId = queryParams['assistantId'];
      const memoryFocusRuleId = queryParams['memoryFocusRuleId'];
      if (assistantId) {
        console.log('Editing memory owned by assistant:', assistantId);
        this.assistantId = assistantId;
        this.memoryFocusRuleId = null;
        this.loadAssistantByAssistantId(assistantId);
      }
      if (memoryFocusRuleId) {
        console.log('Editing memory owned by assistant:', assistantId);
        this.assistantId = null;
        this.memoryFocusRuleId = memoryFocusRuleId;

        this.loadAssistantByMemoryFocusRuleId(memoryFocusRuleId);
      }
    });
  }

  async loadAssistantByAssistantId(assistantId: string) {
    this.assistantService.getAssistantById(assistantId).subscribe((a) => {
      if (!a?.data) return;
      this.assistant = a.data;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async loadAssistantByMemoryFocusRuleId(memoryFocusRuleId: any) {
    const r = await this.memoryService.getMemoryRule(memoryFocusRuleId);
    if (!r?.data) return;
    this.loadAssistantByAssistantId(r.data.assistantId);
  }

  deleteMemory() {
    if (!this.memory.id) return;
    // we must forget first before deletion if... assistant ?
    this.memoryService.deleteMemory(this.memory.id).then((success) => {
      if (success) {
        this.statusMessage = 'Memory deleted successfully!';
      } else {
        this.statusMessage = 'Failed to delete memory.';
      }
    });
  }

  onTagChange(tags: string[]): void {
    this.tags = tags;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCode(code: any) {
    return code.data;
  }

  onTagsLoaded(tags: Tag[]): void {
    const hasFunction = tags.some((tag) => tag.name === 'function');
    this.isFunctionMemory = hasFunction;
  }

  ngOnInit(): void {
    if (this.memory.id) {
      this.loadMemory(this.memory.id); // Load the memory if editing
    }
  }

  loadMemory(memoryId: string): void {
    this.memoryService.getMemory(memoryId).then((memory) => {
      if (memory) {
        this.memory = memory;
      } else {
        this.statusMessage = 'Memory not found.';
      }
    });
  }

  onSubmit(): void {
    if (this.memory.description && this.memory.type) {
      const saveOrUpdate = this.memory.id
        ? this.memoryService.updateMemory(this.memory) // Update existing memory
        : this.memoryService.createMemory(this.memory); // Save new memory

      saveOrUpdate.then((idOrSuccess) => {
        if (idOrSuccess) {
          this.statusMessage = `Memory ${
            this.memory.id ? 'updated' : 'created'
          } successfully!`;

          if (this.tags.length > 0) {
            if (typeof idOrSuccess === 'string') {
              this.createTags(idOrSuccess);
              this.memory.id = idOrSuccess;
            }
          }
        } else {
          this.statusMessage = 'Failed to save or update the memory.';
        }
      });
    }
  }

  createTags(memoryId: string): void {
    // Wait for memory to be created and ID assigned
    const tags = this.tags; // You can add custom logic to generate tags
    this.memoryService.updateTagsForMemory(memoryId, tags).then(
      (success) => {
        if (success) {
          this.statusMessage = 'Tags added successfully!';
        } else {
          this.statusMessage = 'Failed to add tags.';
        }
      },
      (error) => {
        console.error('Error adding tags:', error);
        this.statusMessage = 'Failed to add tags.';
      }
    );
  }
}
