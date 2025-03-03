import { Component, OnInit } from '@angular/core';
import {
  PipelineConnection,
  PipelineExecutionResult,
} from '../../../interfaces/assistant-pipeline.model';
import { AssistantService } from '../../../services/assistants-api/assistant.service';
import { AssistantPipelineService } from '../../../services/orchestrators/assistant-pipeline.service';
import { FormsModule } from '@angular/forms';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { AssistantPipelineGraphComponent } from '../assistant-pipeline-graph/assistant-pipeline-graph.component';

interface Assistant {
  id: string;
  name: string;
  description: string;
  // Add other properties as needed
}

@Component({
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, NgClass, AssistantPipelineGraphComponent],
  selector: 'app-assistant-pipeline',
  templateUrl: './assistant-pipeline.component.html',
  styleUrls: ['./assistant-pipeline.component.scss'],
})
export class AssistantPipelineComponent implements OnInit {
  assistants: Assistant[] = [];
  connections: PipelineConnection[] = [];
  selectedSourceAssistant: string | null = null;
  selectedTargetAssistant: string | null = null;
  pipelineStartAssistant: string | null = null;
  pipelineInput = '';
  pipelineResult: PipelineExecutionResult | null = null;
  isExecuting = false;
  activeTab: 'form' | 'graph' = 'graph';

  constructor(
    private pipelineService: AssistantPipelineService,
    private assistantService: AssistantService
  ) {}

  async ngOnInit() {
    await this.loadAssistants();
    await this.loadConnections();
  }

  async loadAssistants() {
    // Load all available assistants
    const assistants = await this.assistantService.getAllAssistants();
    this.assistants = assistants;
  }

  async createConnection() {
    if (!this.selectedSourceAssistant || !this.selectedTargetAssistant) {
      return;
    }

    try {
      await this.pipelineService.createConnection(
        this.selectedSourceAssistant,
        this.selectedTargetAssistant,
        'depends_on'
      );

      // Refresh connections
      await this.loadConnections();

      // Reset selections
      this.selectedSourceAssistant = null;
      this.selectedTargetAssistant = null;
    } catch (error) {
      console.error('Failed to create connection:', error);
    }
  }

  async loadConnections() {
    // For simplicity, we'll just get all connections for all assistants
    const allConnections: PipelineConnection[] = [];

    for (const assistant of this.assistants) {
      const { outgoing } = await this.pipelineService.getAssistantConnections(
        assistant.id
      );
      allConnections.push(...outgoing);
    }

    this.connections = allConnections;
  }

  async deleteConnection(connectionId: string) {
    console.log('Deleting connection:', connectionId);
    // This would need to be implemented in the pipeline service
    // await this.pipelineService.deleteConnection(connectionId);
    await this.loadConnections();
  }

  async executePipeline() {
    if (!this.pipelineStartAssistant || !this.pipelineInput) {
      return;
    }

    this.isExecuting = true;

    try {
      this.pipelineResult = await this.pipelineService.executePipeline(
        this.pipelineStartAssistant,
        this.pipelineInput
      );
    } catch (error) {
      console.error('Pipeline execution failed:', error);
    } finally {
      this.isExecuting = false;
    }
  }

  getAssistantName(id: string): string {
    const assistant = this.assistants.find((a) => a.id === id);
    return assistant ? assistant.name : 'Unknown Assistant';
  }

  setActiveTab(tab: 'form' | 'graph') {
    this.activeTab = tab;
  }
}
