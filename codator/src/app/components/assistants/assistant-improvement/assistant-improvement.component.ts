import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AssistantFull,
  AssistantService,
} from '../../../services/assistants-api/assistant.service';
import { Feedback } from '../../../services/assistants-api/feedback.service';
import { Memory } from '../../../services/assistants-api/memory.service';
import { WarnService } from '../../../services/warn.service';
import { RelationshipGraphService } from '../../../services/assistants-api/relationship-graph.service';
import { AssistantImprovementService } from '../../../services/orchestrators/assistant-improvement.service';

@Component({
  selector: 'app-assistant-improvement',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, DatePipe],
  templateUrl: './assistant-improvement.component.html',
  styleUrl: './assistant-improvement.component.scss',
})
export class AssistantImprovementComponent implements OnInit {
  // The assistant to be improved
  targetAssistant: AssistantFull | null = null;

  // Potential parent/supervisor assistants that can help improve
  parentAssistants: AssistantFull[] = [];

  // Selected parent assistant that will provide improvement suggestions
  selectedParentAssistant: AssistantFull | null = null;

  // Available assistants to select from
  availableAssistants: AssistantFull[] = [];

  // Feedback for the target assistant
  feedbackItems: Feedback[] = [];

  // Selected feedback items to analyze
  selectedFeedbackItems: Feedback[] = [];

  // Memories of the target assistant
  memories: Memory[] = [];

  // Selected memories to analyze
  selectedMemories: Memory[] = [];

  // Improvement suggestions from the parent assistant
  improvementSuggestions = '';

  // Loading state
  isLoading = false;

  // Maximum number of memories to include (to prevent token limit issues)
  maxMemories = 5;

  constructor(
    private assistantService: AssistantService,
    private relationshipService: RelationshipGraphService,
    private improvementService: AssistantImprovementService,
    private warnService: WarnService
  ) {}

  async ngOnInit() {
    await this.loadAvailableAssistants();
  }

  /**
   * Load all available assistants
   */
  async loadAvailableAssistants() {
    try {
      this.isLoading = true;
      const assistants = await this.assistantService.getAllAssistants();
      if (assistants) {
        // For each assistant, get the full details
        this.availableAssistants = [];
        for (const assistant of assistants) {
          const fullAssistant =
            await this.assistantService.getAssistantWithDetailsById(
              assistant.id
            );
          if (fullAssistant) {
            this.availableAssistants.push(fullAssistant);
          }
        }
      }
    } catch (error) {
      this.warnService.warn('Failed to load assistants');
      console.error('Error loading assistants:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Select an assistant to improve
   */
  async selectTargetAssistant(assistantId: string) {
    try {
      this.isLoading = true;

      // Reset selections
      this.targetAssistant = null;
      this.parentAssistants = [];
      this.selectedParentAssistant = null;
      this.feedbackItems = [];
      this.selectedFeedbackItems = [];
      this.memories = [];
      this.selectedMemories = [];
      this.improvementSuggestions = '';

      // Load full assistant details
      const assistant = await this.assistantService.getAssistantWithDetailsById(
        assistantId
      );
      if (assistant) {
        this.targetAssistant = assistant;

        // Load feedback and memories
        await this.loadAssistantFeedback();
        await this.loadAssistantMemories();

        // Find parent assistants (assistants that this assistant depends on)
        await this.findParentAssistants();
      } else {
        this.warnService.warn('Assistant not found');
      }
    } catch (error) {
      this.warnService.warn('Failed to load assistant details');
      console.error('Error selecting assistant:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load feedback for the target assistant
   */
  async loadAssistantFeedback() {
    if (!this.targetAssistant) return;

    try {
      this.feedbackItems =
        await this.improvementService.getFeedbackForAssistant(
          this.targetAssistant.id
        );
    } catch (error) {
      this.warnService.warn('Failed to load feedback');
      console.error('Error loading feedback:', error);
    }
  }

  /**
   * Load memories for the target assistant
   */
  async loadAssistantMemories() {
    if (!this.targetAssistant) return;

    try {
      this.memories = this.targetAssistant.focusedMemories;
      // Sort memories by most recent
      this.memories.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      this.warnService.warn('Failed to load memories');
      console.error('Error loading memories:', error);
    }
  }

  /**
   * Find parent assistants (assistants that this assistant depends on)
   */
  async findParentAssistants() {
    if (!this.targetAssistant) return;

    try {
      // Get relationships where this assistant depends on another assistant
      const relationships =
        await this.relationshipService.getRelationshipsBySourceAndType(
          this.targetAssistant.id,
          'depends_on'
        );

      // Load the full details of each parent assistant
      this.parentAssistants = [];
      for (const relationship of relationships) {
        if (relationship.type === 'assistant') {
          const parentAssistant =
            await this.assistantService.getAssistantWithDetailsById(
              relationship.targetId
            );
          if (parentAssistant) {
            this.parentAssistants.push(parentAssistant);
          }
        }
      }

      // If no parent assistants found, use all available assistants as potential parents
      if (this.parentAssistants.length === 0) {
        this.parentAssistants = this.availableAssistants.filter(
          (a) => a.id !== this.targetAssistant?.id
        );
      }
    } catch (error) {
      this.warnService.warn('Failed to find parent assistants');
      console.error('Error finding parent assistants:', error);
    }
  }

  /**
   * Toggle selection of a feedback item
   */
  toggleFeedbackSelection(feedback: Feedback) {
    const index = this.selectedFeedbackItems.findIndex(
      (f) => f.id === feedback.id
    );
    if (index === -1) {
      this.selectedFeedbackItems.push(feedback);
    } else {
      this.selectedFeedbackItems.splice(index, 1);
    }
  }

  /**
   * Toggle selection of a memory
   */
  toggleMemorySelection(memory: Memory) {
    const index = this.selectedMemories.findIndex((m) => m.id === memory.id);
    if (index === -1) {
      this.selectedMemories.push(memory);
    } else {
      this.selectedMemories.splice(index, 1);
    }
  }

  /**
   * Select a parent assistant that will provide improvement suggestions
   */
  selectParentAssistant(assistantId: string) {
    this.selectedParentAssistant =
      this.parentAssistants.find((a) => a.id === assistantId) || null;
  }

  /**
   * Generate improvement suggestions
   */
  async generateImprovements() {
    if (!this.targetAssistant || !this.selectedParentAssistant) {
      this.warnService.warn('Please select both target and parent assistants');
      return;
    }

    if (
      this.selectedFeedbackItems.length === 0 &&
      this.selectedMemories.length === 0
    ) {
      this.warnService.warn(
        'Please select at least one feedback item or memory'
      );
      return;
    }

    try {
      this.isLoading = true;
      this.improvementSuggestions = '';

      // Check if too many memories are selected
      if (this.selectedMemories.length > this.maxMemories) {
        this.warnService.warn(
          `Too many memories selected. Using only the first ${this.maxMemories} memories.`
        );
        // Keep only the first maxMemories memories
        this.selectedMemories = this.selectedMemories.slice(
          0,
          this.maxMemories
        );
      }

      // Generate improvements
      this.improvementSuggestions =
        await this.improvementService.generateImprovementSuggestions(
          this.selectedParentAssistant,
          this.targetAssistant,
          this.selectedFeedbackItems,
          this.selectedMemories
        );
    } catch (error) {
      this.warnService.warn('Failed to generate improvement suggestions');
      console.error('Error generating improvements:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Apply improvement suggestions to the target assistant
   * This will create new memories or update existing ones
   */
  async applyImprovements() {
    if (!this.targetAssistant || !this.improvementSuggestions) {
      this.warnService.warn('No improvements to apply');
      return;
    }

    try {
      this.isLoading = true;

      // Parse the improvement suggestions into actionable items
      // This could be a complex process, but for now, just create a new instruction memory
      const success = await this.improvementService.createImprovementMemory(
        this.targetAssistant,
        this.improvementSuggestions
      );

      if (success) {
        this.warnService.warn('Improvements applied successfully');
        // Reload memories to show the new one
        await this.loadAssistantMemories();
      } else {
        this.warnService.warn('Failed to apply improvements');
      }
    } catch (error) {
      this.warnService.warn('Failed to apply improvements');
      console.error('Error applying improvements:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
