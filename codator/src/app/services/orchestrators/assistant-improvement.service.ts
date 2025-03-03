import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, take } from 'rxjs';
import { ASSISTANT_API_CONFIG } from '../../app.constants';
import { AssistantFull } from '../assistants-api/assistant.service';
import { Feedback } from '../assistants-api/feedback.service';
import { Memory } from '../assistants-api/memory.service';
import { PromptService } from '../assistants-services/prompt.service';
import { MemoryService } from '../memory.service';
import { WarnService } from '../warn.service';

@Injectable({
  providedIn: 'root',
})
export class AssistantImprovementService {
  private apiUrl = ASSISTANT_API_CONFIG.baseUrl;

  constructor(
    private http: HttpClient,
    private warnService: WarnService,
    private memoryService: MemoryService,
    private promptService: PromptService
  ) {}

  /**
   * Get feedback for a specific assistant
   */
  async getFeedbackForAssistant(assistantId: string): Promise<Feedback[]> {
    try {
      const response = await lastValueFrom(
        this.http
          .get<{ status: string; data: Feedback[] }>(
            `${this.apiUrl}/feedback/target/${assistantId}/assistant`
          )
          .pipe(take(1))
      );

      return response?.data || [];
    } catch (error) {
      console.error('Error fetching feedback:', error);
      this.warnService.warn('Failed to fetch feedback for assistant');
      return [];
    }
  }

  /**
   * Generate improvement suggestions for an assistant based on feedback and memories
   */
  async generateImprovementSuggestions(
    parentAssistant: AssistantFull,
    targetAssistant: AssistantFull,
    feedbackItems: Feedback[],
    memories: Memory[]
  ): Promise<string> {
    try {
      console.log(
        'Generating improvement suggestions for assistant:',
        targetAssistant
      );
      console.log(
        'Generating improvement suggestions for assistant:',
        feedbackItems
      );
      console.log(
        'Generating improvement suggestions for assistant:',
        memories
      );
      // Create a structured prompt for the parent assistant to analyze
      const prompt = this.createImprovementPrompt(
        targetAssistant,
        feedbackItems,
        memories
      );

      // Send the prompt to the parent assistant
      const o = this.promptService
        .prompt(parentAssistant.id, prompt)
        .pipe(take(1));

      const r = await lastValueFrom(o);

      return r?.data || 'No suggestions generated';
    } catch (error) {
      console.error('Error generating improvement suggestions:', error);
      this.warnService.warn('Failed to generate improvement suggestions');
      return 'Error: Failed to generate improvement suggestions';
    }
  }

  /**
   * Create a structured prompt for improvement suggestions
   */
  private createImprovementPrompt(
    targetAssistant: AssistantFull,
    feedbackItems: Feedback[],
    memories: Memory[]
  ): string {
    // Start with assistant information
    let prompt = `You are acting as a supervisor assistant that helps improve other assistants.
I need your help to improve an assistant named "${targetAssistant.name}".

ASSISTANT DETAILS:
- Name: ${targetAssistant.name}
- Description: ${targetAssistant.description}
- Type: ${targetAssistant.type}
- Model: ${targetAssistant.model}
- Tags: ${targetAssistant.assistantTags.join(', ')}

`;

    // Add feedback information if available
    if (feedbackItems.length > 0) {
      prompt += `\nFEEDBACK RECEIVED:`;
      feedbackItems.forEach((feedback, index) => {
        prompt += `\n${index + 1}. Rating: ${feedback.rating}/5`;
        if (feedback.comments) {
          prompt += `\n   Comments: "${feedback.comments}"`;
        }
        prompt += '\n';
      });
    }

    // Add memory information if available
    if (memories.length > 0) {
      prompt += `\nCURRENT MEMORIES:`;
      memories.forEach((memory, index) => {
        prompt += `\n${index + 1}. Type: ${memory.type}`;
        prompt += `\n   Description: "${memory.description}"`;
        // Only include data if it's important and not too large
        if (
          memory.data &&
          typeof memory.data === 'object' &&
          Object.keys(memory.data).length < 5
        ) {
          prompt += `\n   Data: ${JSON.stringify(memory.data)}`;
        }
        prompt += '\n';
      });
    }

    // Add the specific request for improvements
    prompt += `\nBased on the above information, please analyze this assistant's configuration, feedback, and memories, then provide specific improvement suggestions. Focus on:

1. Instruction improvements - How can the assistant's instructions or knowledge be enhanced?
2. Knowledge gaps - What additional information should the assistant have?
3. Behavior modifications - How should the assistant's behavior change?
4. Response style - How can the assistant's communication style be improved?

For each suggestion, please provide:
- The specific issue you identified
- Your recommended improvement
- A sample implementation (e.g., new or modified memory content)

Please format your response in a clear, structured way that separates different improvement areas.`;

    return prompt;
  }

  /**
   * Create a new memory with improvement suggestions
   */
  async createImprovementMemory(
    assistant: AssistantFull,
    improvementSuggestions: string
  ): Promise<boolean> {
    try {
      // Create a new instruction memory
      const memory: Memory = {
        id: '',
        type: 'instruction',
        description: `IMPROVEMENT SUGGESTIONS (${new Date().toLocaleDateString()}): ${improvementSuggestions.substring(
          0,
          100
        )}...`,
        data: { improvementSuggestions },
        createdAt: null,
        updatedAt: null,
      };

      // Create the memory and associate it with the assistant
      const memoryId = await this.memoryService.createMemory(memory);
      if (!memoryId) {
        return false;
      }

      // Add the memory to the assistant's focused memories
      const focused = await this.memoryService.createFocusedMemory(
        assistant.memoryFocusRule.id,
        memoryId
      );
      if (!focused) {
        return false;
      }

      // Also add it as an owned memory
      const owned = await this.memoryService.createOwnedMemory(
        assistant.id,
        memoryId
      );
      if (!owned) {
        return false;
      }

      // Add appropriate tags
      await this.memoryService.updateTagsForMemory(memoryId, [
        'improvement',
        'instruction',
      ]);

      return true;
    } catch (error) {
      console.error('Error creating improvement memory:', error);
      this.warnService.warn('Failed to create improvement memory');
      return false;
    }
  }
}
