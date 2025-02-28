import { Component, OnInit } from '@angular/core';
import { AssistantService } from '../../../services/assistants-services/assistant.service';
import { FormsModule } from '@angular/forms';
import { NgClass, NgFor } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Assistant } from '../../../services/assistants-api/assistant.service';
import {
  AssistantSuggestion,
  OrchestratorService,
  TaskRequest,
} from '../../../services/assistants-api/orchestrator.service';

@Component({
  selector: 'app-assistant-library',
  imports: [FormsModule, NgFor, NgClass, RouterLink, RouterLinkActive],
  templateUrl: './assistant-library.component.html',
  styleUrls: ['./assistant-library.component.scss'],
})
export class AssistantLibraryComponent implements OnInit {
  assistants: Assistant[] = [];
  originalAssistants: Assistant[] = []; // Store the original list
  searchTerm = '';
  selectedAssistant: Assistant | null = null;

  constructor(
    private assistantService: AssistantService,
    private orchestratorService: OrchestratorService, // Inject OrchestratorService
    private dialog: MatDialog,
    private router: Router
  ) {}

  selectAssistant(assistant: Assistant) {
    this.selectedAssistant = assistant;
    this.assistantService.selectAssistant(assistant);
  }

  navigateToChat(id: string): void {
    this.router.navigate([`/chat`, id], { replaceUrl: true });
  }

  ngOnInit(): void {
    this.loadAssistants();
  }

  loadAssistants(): void {
    this.assistantService.getAllAssistants().subscribe(
      (response) => {
        this.assistants = response.data;
        this.originalAssistants = response.data; // Store the original list
      },
      (error) => {
        console.error('Error fetching assistants:', error);
      }
    );
  }

  onSearchChange(): void {
    this.assistants = this.originalAssistants.filter((assistant) =>
      assistant.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.assistants = [...this.originalAssistants]; // Reset to the original list
  }

  async fetchSuggestions(): Promise<void> {
    const task: TaskRequest = {
      type: '',
      description: this.searchTerm,
    };
    const tags: string[] = []; // You can add tags as needed

    const assistantsSuggestion: AssistantSuggestion[] =
      await this.orchestratorService.suggestAssistants(task, tags);

    const assistantsSuggested: Assistant[] = [];
    for (const assistantSuggestion of assistantsSuggestion) {
      const a = await this.assistantService.getFullAssistantByIdPromise(
        assistantSuggestion.assistantId
      );
      if (a) {
        assistantsSuggested.push(a);
      }
    }

    this.assistants = assistantsSuggested;

    console.log('Assistants suggestions:', assistantsSuggestion);
  }
}
