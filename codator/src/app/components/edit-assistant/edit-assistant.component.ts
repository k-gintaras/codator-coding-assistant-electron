import { Component, Input } from '@angular/core';
import { DatePipe, NgClass, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AssistantService } from '../../services/assistants-services/assistant.service';
import { BASE_MODEL } from '../../interfaces/gpt-api.model';
import { EditMemoriesComponent } from '../edit-memories/edit-memories.component';
import { WarnService } from '../../services/warn.service';
import { TagManagerComponent } from '../tag-manager/tag-manager.component';
import { TagOLDService } from '../../services/tag.service';
import { FeedbackComponent } from '../feedback/feedback.component';
import {
  AssistantFull,
  Assistant,
} from '../../services/assistants-api/assistant.service';

@Component({
  standalone: true,
  selector: 'app-edit-assistant',
  imports: [
    NgIf,
    FormsModule,
    DatePipe,
    NgClass,
    EditMemoriesComponent,
    TagManagerComponent,
    FeedbackComponent,
    FeedbackComponent,
  ],
  templateUrl: './edit-assistant.component.html',
  styleUrl: './edit-assistant.component.scss',
})
export class EditAssistantComponent {
  fullAssistant: AssistantFull | null = null;
  @Input() assistant: Assistant | null = null;

  constructor(
    private assistantService: AssistantService,
    private tagService: TagOLDService,
    private route: ActivatedRoute,
    private warnService: WarnService
  ) {
    // If there's no input assistant, try to fetch from the route
    if (!this.assistant) {
      this.route.paramMap.subscribe((params) => {
        const routeId = params.get('id');

        if (!routeId) {
          // No routeId: we can initialize a new assistant
          this.fullAssistant = this.createNewAssistant();
        } else {
          // RouteId provided: load the assistant by ID
          this.loadFullAssistant(routeId);
        }
      });
    } else {
      // If there's an input assistant, load its details
      this.loadFullAssistant(this.assistant.id);
    }
  }

  // Method to initialize a new assistant
  createNewAssistant(): AssistantFull {
    const a: AssistantFull = {
      id: '',
      name: '',
      description: '',
      type: 'chat',
      model: BASE_MODEL,
      createdAt: '',
      updatedAt: '',
      assistantTags: [],
      focusedMemories: [],
      memoryFocusRule: {
        id: '',
        assistantId: '',
        maxResults: 0,
        relationshipTypes: [],
        priorityTags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      feedbackSummary: {
        avgRating: 0,
        totalFeedback: 0,
      },
    };
    return a;
  }

  // Load the full assistant details
  loadFullAssistant(id: string) {
    if (!id) return;
    this.assistantService.getFullAssistantById(id).subscribe((a) => {
      if (!a) return;
      this.fullAssistant = a;
      this.fullAssistant.focusedMemories.sort((a, b) => {
        if (!a.updatedAt || !b.updatedAt) return 0;
        return a.updatedAt > b.updatedAt ? -1 : 1;
      });
      console.log('new assistant... ');
    });
  }

  // Save the assistant (either creating or updating)
  save() {
    if (!this.fullAssistant) return;
    const name = this.fullAssistant.name;

    // Check if it's an existing assistant or a new one
    if (this.fullAssistant.id) {
      // Update existing assistant
      this.assistantService
        .updateAssistant(this.fullAssistant)
        .subscribe((u) => {
          console.log(u ? 'Updated: ' + name : 'Failed To Update' + name);
          this.warnService.warn('Assistant Updated');
        });
    } else {
      // Create new assistant
      if (this.fullAssistant)
        this.assistantService
          .createAssistant(this.fullAssistant)
          .subscribe((newAssistant) => {
            console.log(
              newAssistant ? 'Created: ' + name : 'Failed To Create' + name
            );
            this.warnService.warn('Assistant Created');
            this.createAssistantTags();
          });
    }
  }

  createAssistantTags() {
    if (!this.fullAssistant) return;
    this.tagService.addTagToEntity(
      'assistant',
      this.fullAssistant.id,
      this.fullAssistant.name,
      true
    );
  }

  // Filter focused memories based on type
  filterFocusedMemories(type: string) {
    if (!this.fullAssistant?.focusedMemories) return [];
    return this.fullAssistant.focusedMemories.filter(
      (memory) => memory.type === type
    );
  }

  // Determine if the assistant is outdated
  isAssistantOutdated(): boolean {
    if (!this.fullAssistant) return false;
    if (!this.fullAssistant.focusedMemories[0]) return true;

    const lastUpdate = new Date(this.fullAssistant?.updatedAt || '');
    const freshMemory = this.fullAssistant?.focusedMemories[0].updatedAt;

    if (freshMemory) {
      const now1 = new Date(freshMemory);
      const timeDiff = now1.getTime() - lastUpdate.getTime();
      return timeDiff > 1 * 24 * 60 * 60 * 1000; // more than 1 days
    }
    const now2 = new Date();

    const timeDiff = now2.getTime() - lastUpdate.getTime();
    return timeDiff > 7 * 24 * 60 * 60 * 1000; // more than 7 days
  }
}
