import { Component, OnInit } from '@angular/core';
import { AssistantService } from '../../../services/assistants-services/assistant.service';
import { FormsModule } from '@angular/forms';
import { NgClass, NgFor } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Assistant } from '../../../services/assistants-api/assistant.service';

@Component({
  selector: 'app-assistant-library',
  imports: [FormsModule, NgFor, NgClass, RouterLink, RouterLinkActive],
  templateUrl: './assistant-library.component.html',
  styleUrls: ['./assistant-library.component.scss'],
})
export class AssistantLibraryComponent implements OnInit {
  assistants: Assistant[] = [];
  searchTerm = '';
  selectedAssistant: Assistant | null = null;

  constructor(
    private assistantService: AssistantService,
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
      },
      (error) => {
        console.error('Error fetching assistants:', error);
      }
    );
  }

  onSearchChange(): void {
    this.assistants = this.assistants.filter((assistant) =>
      assistant.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}
