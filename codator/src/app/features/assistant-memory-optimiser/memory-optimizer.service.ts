import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, take } from 'rxjs';
import {
  AssistantMemoryTesterService,
  AssistantTestReport,
  InstructionTestResult,
  MemoryTestResult,
} from './assistant-memory-tester.service';
import { AssistantFull } from '../../services/assistants-api/assistant.service';
import { MemoryFocusRuleService } from '../../services/assistants-api/memory-rule.service';
import { MemoryService } from '../../services/memory.service';
import { WarnService } from '../../services/warn.service';
import { Memory } from '../../services/assistants-api/memory.service';

@Injectable({
  providedIn: 'root',
})
export class MemoryOptimizerService {
  constructor(
    private http: HttpClient,
    private testerService: AssistantMemoryTesterService,
    private memoryService: MemoryService,
    private memoryRuleService: MemoryFocusRuleService,
    private warnService: WarnService
  ) {}

  // In memory-optimizer.service.ts

  async optimizeMemoryConfiguration(
    assistant: AssistantFull
  ): Promise<boolean> {
    try {
      // First get the latest test report for this assistant
      const testReport = await lastValueFrom(
        this.testerService.testResults$.pipe(take(1))
      );

      if (!testReport || testReport.assistantId !== assistant.id) {
        // If we don't have a test report for this assistant, run a test
        this.warnService.warn(
          'No test results available. Running memory test...'
        );
        await this.testerService.runMemoryTest(assistant.id);
        return false; // Return false to indicate optimization not completed yet
      }

      // Get the current memory focus rule
      const focusRule = assistant.memoryFocusRule;

      // Determine the optimal max results based on test findings
      // For chat-type assistants, use chatMemories limit
      // For assistant-type assistants with instructions, consider both
      const optimizedMaxResults =
        assistant.type === 'chat'
          ? testReport.summary.maxEffectiveChatMemories
          : Math.max(
              testReport.summary.maxEffectiveChatMemories,
              testReport.summary.totalInstructionsTested > 0 ? 1 : 0 // Ensure room for at least 1 instruction
            );

      // If the value is already optimal, no need to change
      if (focusRule.maxResults === optimizedMaxResults) {
        this.warnService.warn('Memory configuration is already optimal');
        return true;
      }

      // Update the memory focus rule with the optimal number
      const updated = await this.memoryRuleService.updateMemoryFocusRule(
        focusRule.id,
        {
          maxResults: optimizedMaxResults,
        }
      );

      if (updated) {
        this.warnService.warn(
          `Optimized memory configuration: Max memories set to ${optimizedMaxResults}`
        );

        // If reducing the number of memories, identify the ones to prioritize
        if (optimizedMaxResults < focusRule.maxResults) {
          await this.prioritizeMemories(assistant, testReport);
        }

        return true;
      } else {
        this.warnService.warn('Failed to update memory configuration');
        return false;
      }
    } catch (error) {
      console.error('Error optimizing memory configuration:', error);
      this.warnService.warn('Error optimizing memory configuration');
      return false;
    }
  }

  private async prioritizeMemories(
    assistant: AssistantFull,
    testReport: AssistantTestReport
  ): Promise<void> {
    // Get all current focused memories
    const focusedMemories = await this.memoryService.getFocusedMemories(
      assistant.id
    );

    if (focusedMemories.length <= testReport.summary.maxEffectiveChatMemories) {
      // No need to prioritize if we already have fewer memories than the optimal number
      return;
    }

    // Create maps of memory IDs to their test results
    const chatMemoryResults = new Map<string, MemoryTestResult>();
    testReport.chatMemoryResults.forEach((result) => {
      chatMemoryResults.set(result.memoryId, result);
    });

    const instructionResults = new Map<string, InstructionTestResult>();
    testReport.instructionResults.forEach((result) => {
      instructionResults.set(result.memoryId, result);
    });

    // Separate memories by type
    const chatMemories = focusedMemories.filter(
      (m: Memory) => m.type !== 'instruction'
    );
    const instructionMemories = focusedMemories.filter(
      (m: Memory) => m.type === 'instruction'
    );

    // Sort chat memories by recall success and description length
    const prioritizedChatMemories = [...chatMemories].sort((a, b) => {
      const resultA = chatMemoryResults.get(a.id);
      const resultB = chatMemoryResults.get(b.id);

      // If we have test results for both, sort by recall success
      if (resultA && resultB) {
        if (resultA.recallSuccess !== resultB.recallSuccess) {
          return resultB.recallSuccess ? 1 : -1; // Successful recalls first
        }
      }

      // If tied on recall or no test results, prioritize shorter descriptions
      const lenA = a.description?.length || 0;
      const lenB = b.description?.length || 0;
      return lenA - lenB;
    });

    // Sort instruction memories by compliance score
    const prioritizedInstructionMemories = [...instructionMemories].sort(
      (a, b) => {
        const resultA = instructionResults.get(a.id);
        const resultB = instructionResults.get(b.id);

        // If we have test results for both, sort by compliance score
        if (resultA && resultB) {
          return resultB.complianceScore - resultA.complianceScore; // Higher scores first
        }

        return 0;
      }
    );

    // Determine how many of each type to keep
    const optimalChatMemories = prioritizedChatMemories.slice(
      0,
      testReport.summary.maxEffectiveChatMemories
    );

    // For instructions, keep the most effective ones if we need to reduce
    const maxInstructions = Math.max(
      1, // Always keep at least 1 instruction for assistant-type assistants
      testReport.summary.maxEffectiveChatMemories - optimalChatMemories.length // Use remaining slots
    );

    const optimalInstructionMemories = prioritizedInstructionMemories.slice(
      0,
      maxInstructions
    );

    // Suggest to the user which memories to keep
    this.warnService.warn(
      `Recommended configuration: ${optimalChatMemories.length} chat memories and ${optimalInstructionMemories.length} instruction memories. The most effective ones are listed first in your memory list.`
    );

    // Return the prioritized list for potential use in the UI
    return;
  }
}
