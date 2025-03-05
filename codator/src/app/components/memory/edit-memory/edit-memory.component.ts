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
  getDescriptionPlaceholder() {
    const placeHolder = `memory format prompt format,
To effectively structure prompts for GPT models, consider the following formatting techniques:

Use of Delimiters: Clearly separate instructions from content using triple quotes (""") or hash symbols (###).
help.openai.com

Example:

Summarize the text below as a bullet point list of the most important points.

Text: """
[Your text here]
"""
Clear Section Headings: Employ headings to define different parts of the prompt, enhancing readability.

Example:

**Task**: Generate a creative sentence inspired by the examples below.

**Examples**:
- Life is a journey, not a destination.
- Every cloud has a silver lining.
- The early bird catches the worm.
Numbered or Bulleted Lists: Organize information using lists to present examples or instructions systematically.

Example:

**Instructions**:
1. Read the following examples.
2. Generate a new sentence inspired by them.

**Examples**:
- Actions speak louder than words.
- A picture is worth a thousand words.
- When in Rome, do as the Romans do.
XML or JSON Formatting: For complex prompts, structure inputs using XML or JSON to define components explicitly.

XML Example:

xml
Copy
Edit
<task>
  <instruction>Create a new, creative sentence inspired by the following examples.</instruction>
  <examples>
    <example>Life is a journey, not a destination.</example>
    <example>Every cloud has a silver lining.</example>
    <example>The early bird catches the worm.</example>
  </examples>
</task>
JSON Example:

{
  "instruction": "Create a new, creative sentence inspired by the following examples.",
  "examples": [
    "Life is a journey, not a destination.",
    "Every cloud has a silver lining.",
    "The early bird catches the worm."
  ]
}
Implementing these formatting strategies can enhance the clarity of your prompts, leading to more accurate and relevant responses from GPT models.`;

    return placeHolder;
  }
  memory: Memory = {
    id: '',
    description: '',
    type: 'knowledge', // Default memory type
    createdAt: new Date(),
    updatedAt: new Date(),
    data: undefined,
    name: null,
    summary: null,
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
