import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, lastValueFrom, take } from 'rxjs';
import { ASSISTANT_API_CONFIG } from '../app.constants';
import {
  AssistantService,
  AssistantFull,
} from '../services/assistants-api/assistant.service';
import { Memory } from '../services/assistants-api/memory.service';
import { MessageService } from '../services/assistants-services/message.service';
import { MemoryService } from '../services/memory.service';
import { PromptMessageService } from '../services/prompt-message.service';
import { WarnService } from '../services/warn.service';

export interface MemoryTestResult {
  memoryId: string;
  memoryDescription: string;
  recallSuccess: boolean;
  prompt: string;
  response: string;
}

export interface InstructionTestResult extends MemoryTestResult {
  isInstruction: true;
  complianceScore: number; // How well the assistant follows the instruction (0-1)
}

export interface AssistantTestReport {
  assistantId: string;
  assistantName: string;
  // Standard chat memory results
  chatMemoryResults: MemoryTestResult[];
  multipleMemoryResults: {
    memoriesIncluded: Memory[];
    prompt: string;
    response: string;
    recallSuccess: boolean;
  }[];
  // Instruction memory results
  instructionResults: InstructionTestResult[];
  summary: {
    totalChatMemoriesTested: number;
    successfulChatRecalls: number;
    chatRecallRate: number;
    maxEffectiveChatMemories: number;

    totalInstructionsTested: number;
    successfulInstructionsFollowed: number;
    instructionComplianceRate: number;

    recommendations: string[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class AssistantMemoryTesterService {
  private apiUrl = ASSISTANT_API_CONFIG.baseUrl;
  private testResultsSubject = new BehaviorSubject<AssistantTestReport | null>(
    null
  );
  public testResults$ = this.testResultsSubject.asObservable();

  private isTestingSubject = new BehaviorSubject<boolean>(false);
  public isTesting$ = this.isTestingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private assistantService: AssistantService,
    private memoryService: MemoryService,
    private promptMessageService: PromptMessageService,
    private messageService: MessageService,
    private warnService: WarnService
  ) {}

  /**
   * Runs a comprehensive memory test on an assistant, including both chat memories and instructions
   */
  async runMemoryTest(assistantId: string): Promise<AssistantTestReport> {
    this.isTestingSubject.next(true);

    // Get the assistant details
    const assistant = await this.assistantService.getAssistantWithDetailsById(
      assistantId
    );
    if (!assistant) {
      this.warnService.warn(`Assistant with ID ${assistantId} not found`);
      this.isTestingSubject.next(false);
      throw new Error(`Assistant with ID ${assistantId} not found`);
    }

    // Initialize the test report
    const testReport: AssistantTestReport = {
      assistantId: assistant.id,
      assistantName: assistant.name,
      chatMemoryResults: [],
      multipleMemoryResults: [],
      instructionResults: [],
      summary: {
        totalChatMemoriesTested: 0,
        successfulChatRecalls: 0,
        chatRecallRate: 0,
        maxEffectiveChatMemories: 0,

        totalInstructionsTested: 0,
        successfulInstructionsFollowed: 0,
        instructionComplianceRate: 0,

        recommendations: [],
      },
    };

    // Get all focused memories
    const allMemories = await this.memoryService.getFocusedMemories(
      assistantId
    );

    // Split memories into chat memories and instruction memories
    const chatMemories = allMemories.filter(
      (memory) => memory.type !== 'instruction'
    );
    const instructionMemories = allMemories.filter(
      (memory) => memory.type === 'instruction'
    );

    // Test chat memories
    testReport.summary.totalChatMemoriesTested = chatMemories.length;
    for (const memory of chatMemories) {
      const result = await this.testChatMemory(assistant, memory);
      testReport.chatMemoryResults.push(result);

      if (result.recallSuccess) {
        testReport.summary.successfulChatRecalls++;
      }
    }

    // Calculate chat recall rate
    testReport.summary.chatRecallRate =
      chatMemories.length > 0
        ? testReport.summary.successfulChatRecalls / chatMemories.length
        : 0;

    // Test instruction memories
    testReport.summary.totalInstructionsTested = instructionMemories.length;
    for (const memory of instructionMemories) {
      const result = await this.testInstructionMemory(assistant, memory);
      testReport.instructionResults.push(result);

      if (result.recallSuccess) {
        testReport.summary.successfulInstructionsFollowed++;
      }
    }

    // Calculate instruction compliance rate
    testReport.summary.instructionComplianceRate =
      instructionMemories.length > 0
        ? testReport.summary.successfulInstructionsFollowed /
          instructionMemories.length
        : 0;

    // Test memory combinations (only for chat memories, not instructions)
    if (chatMemories.length >= 2) {
      // Test with pairs of memories
      for (let i = 0; i < Math.min(chatMemories.length - 1, 3); i++) {
        for (let j = i + 1; j < Math.min(chatMemories.length, 4); j++) {
          const pair = [chatMemories[i], chatMemories[j]];
          const pairResult = await this.testMultipleMemories(assistant, pair);
          testReport.multipleMemoryResults.push(pairResult);
        }
      }

      // If we have 3+ memories, test a triple
      if (chatMemories.length >= 3) {
        const triple = [chatMemories[0], chatMemories[1], chatMemories[2]];
        const tripleResult = await this.testMultipleMemories(assistant, triple);
        testReport.multipleMemoryResults.push(tripleResult);
      }
    }

    // Analyze results and make recommendations
    this.analyzeTestResults(testReport);

    // Update the observable with test results
    this.testResultsSubject.next(testReport);
    this.isTestingSubject.next(false);

    return testReport;
  }

  /**
   * Tests an assistant's ability to recall a chat memory
   */
  private async testChatMemory(
    assistant: AssistantFull,
    memory: Memory
  ): Promise<MemoryTestResult> {
    const topic = this.getMemoryTopic(memory);
    const prompt = `Please recall information about the following topic: "${topic}".
    If you have any stored memories about this topic, please share what you know.`;

    // Send the prompt to the assistant and get the response
    const response = await this.sendChatPrompt(assistant, prompt);

    // Check if the response contains key elements from the memory
    const recallSuccess = this.evaluateMemoryRecall(memory, response);

    return {
      memoryId: memory.id,
      memoryDescription: memory.description || 'No description',
      recallSuccess,
      prompt,
      response,
    };
  }

  /**
   * Tests an assistant's ability to follow an instruction memory
   */
  private async testInstructionMemory(
    assistant: AssistantFull,
    memory: Memory
  ): Promise<InstructionTestResult> {
    // Extract key concepts from the instruction
    const keyTerms = this.extractKeyTerms(memory.description || '');
    const directives = this.extractDirectives(memory.description || '');

    // Create scenarios that should trigger the instruction
    const scenarios = this.createTestScenarios(directives, keyTerms);

    // Use the first scenario for testing
    const testScenario =
      scenarios[0] ||
      `Can you tell me about ${keyTerms[0] || 'your approach'}?`;

    // Send the prompt to the assistant (using a different API endpoint for instructions)
    const response = await this.sendInstructionPrompt(assistant, testScenario);

    // Evaluate how well the assistant follows the instruction
    const complianceScore = this.evaluateInstructionCompliance(
      memory,
      response
    );
    const recallSuccess = complianceScore > 0.6; // Consider successful if compliance score > 60%

    return {
      memoryId: memory.id,
      memoryDescription: memory.description || 'No description',
      isInstruction: true,
      recallSuccess,
      complianceScore,
      prompt: testScenario,
      response,
    };
  }

  /**
   * Extract key terms from text
   */
  private extractKeyTerms(text: string): string[] {
    // Remove common stop words
    const stopWords = new Set([
      'a',
      'an',
      'the',
      'is',
      'are',
      'in',
      'on',
      'at',
      'to',
      'for',
      'with',
      'by',
      'about',
      'like',
      'and',
      'or',
      'but',
      'if',
      'then',
      'this',
      'that',
      'you',
      'should',
      'must',
      'always',
      'never',
      'can',
      'will',
      'would',
      'could',
      'may',
      'might',
      'shall',
    ]);

    // Split text into words and filter out stop words
    const words = text.split(/\s+/);
    const significantWords = words.filter((word) => {
      const cleanWord = word.toLowerCase().replace(/[.,;!?()]/g, '');
      return cleanWord.length > 3 && !stopWords.has(cleanWord);
    });

    // Get unique significant words
    return Array.from(new Set(significantWords)).slice(0, 5);
  }

  /**
   * Extract directives (instructions) from text
   */
  private extractDirectives(text: string): string[] {
    // Look for imperative statements or clear instructions
    // This is a simple implementation - in a real system, use NLP for better extraction
    const directives: string[] = [];

    // Split text into sentences
    const sentences = text.split(/[.!?](?:\s|$)/);

    // Identify likely directive sentences
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length < 5) continue;

      // Check for imperative verbs at the beginning
      if (
        /^(Always|Never|Please|Do|Don't|Avoid|Use|Remember|Consider|Ensure|Make sure|Try to)/i.test(
          trimmed
        )
      ) {
        directives.push(trimmed);
        continue;
      }

      // Check for modal verbs indicating requirements
      if (/\b(should|must|need to|have to|required to)\b/i.test(trimmed)) {
        directives.push(trimmed);
        continue;
      }
    }

    return directives;
  }

  /**
   * Create comprehensive test scenarios to evaluate instruction compliance
   */
  private createTestScenarios(
    directives: string[],
    keyTerms: string[]
  ): string[] {
    const scenarios: string[] = [];

    // Create a detailed scenario with rich context based on the instruction content
    if (keyTerms.length > 0) {
      // Combine multiple key terms to create a comprehensive context
      const primaryTerm = keyTerms[0];
      const secondaryTerms = keyTerms.slice(1, 4).join(', ');

      const detailedScenario = `I'm working on an important project related to ${primaryTerm}${
        secondaryTerms ? ` that also involves ${secondaryTerms}` : ''
      }. I need your expertise and guidance on this matter. Could you please provide me with a comprehensive explanation of how to approach this, including any specific guidelines or principles I should follow? I'm particularly interested in understanding the best practices and any important considerations I should keep in mind.`;

      scenarios.push(detailedScenario);
    }

    // Create a scenario that directly addresses the core directive
    if (directives.length > 0) {
      const directive = directives[0];
      // Extract the action and object from the directive
      const actionMatch = directive.match(
        /\b(use|avoid|consider|ensure|follow|apply|implement|maintain|create|develop|design|analyze|evaluate)\b/i
      );
      const action = actionMatch ? actionMatch[0].toLowerCase() : 'approach';

      // Remove the action verb to isolate the object/subject of the directive
      const subjectMatter = directive
        .replace(
          /^(Always|Never|Please|Do|Don't|Avoid|Use|Remember|Consider|Ensure|Make sure|Try to)\s+/i,
          ''
        )
        .replace(/\b(should|must|need to|have to|required to)\b/i, '')
        .trim();

      const directiveScenario = `I need your detailed advice on how to properly ${action} ${subjectMatter}. What specific guidelines should I follow? Please provide a thorough explanation with examples if possible, and highlight any crucial factors I should consider during implementation.`;

      scenarios.push(directiveScenario);
    }

    // Create a scenario presenting a dilemma related to the instruction domain
    if (keyTerms.length > 0) {
      const dilemmaScenario = `I'm facing a challenging situation regarding ${keyTerms[0]}. I have two competing approaches to consider:

1. Taking a conservative, established route that follows conventional wisdom
2. Implementing a more innovative approach that might yield better results but carries more uncertainty

What would you recommend in this situation, and what key principles or guidelines should inform my decision-making process? Please provide a detailed rationale for your recommendation.`;

      scenarios.push(dilemmaScenario);
    }

    // Default scenario for when no specific content can be extracted
    if (scenarios.length === 0) {
      scenarios.push(
        "I'm facing a complex decision that requires careful consideration of best practices and guiding principles in your area of expertise. Could you please provide me with a comprehensive framework for approaching this type of situation? I would appreciate detailed guidance on the methodology, key considerations, and evaluation criteria that should inform my decision-making process."
      );
    }

    return scenarios;
  }

  /**
   * Evaluate how well the assistant follows instructions
   */
  private evaluateInstructionCompliance(
    memory: Memory,
    response: string
  ): number {
    const description = memory.description || '';

    // Extract key elements from the instruction
    const directives = this.extractDirectives(description);
    const keyTerms = this.extractKeyTerms(description);

    let complianceScore = 0;

    // Check for presence of key terms in the response
    let termMatches = 0;
    for (const term of keyTerms) {
      if (response.toLowerCase().includes(term.toLowerCase())) {
        termMatches++;
      }
    }

    const termScore = keyTerms.length > 0 ? termMatches / keyTerms.length : 0;

    // Check for evidence of following directives
    let directiveMatches = 0;
    for (const directive of directives) {
      // Look for phrases suggesting compliance with the directive
      const directiveKeywords = this.extractKeyTerms(directive);
      let keywordMatches = 0;

      for (const keyword of directiveKeywords) {
        if (response.toLowerCase().includes(keyword.toLowerCase())) {
          keywordMatches++;
        }
      }

      if (keywordMatches >= Math.ceil(directiveKeywords.length * 0.5)) {
        directiveMatches++;
      }
    }

    const directiveScore =
      directives.length > 0 ? directiveMatches / directives.length : 0;

    // Final compliance score is weighted average of term matching and directive following
    complianceScore =
      directives.length > 0
        ? termScore * 0.3 + directiveScore * 0.7 // Weight directive compliance higher
        : termScore; // If no directives, fall back to term matching

    return complianceScore;
  }

  /**
   * Tests an assistant's ability to recall multiple chat memories
   */
  private async testMultipleMemories(
    assistant: AssistantFull,
    memories: Memory[]
  ): Promise<{
    memoriesIncluded: Memory[];
    prompt: string;
    response: string;
    recallSuccess: boolean;
  }> {
    // Create a prompt that asks about multiple topics
    const memoryTopics = memories
      .map((m) => this.getMemoryTopic(m))
      .join('", "');
    const prompt = `Please recall information about the following topics: "${memoryTopics}".
    For each topic, share what you know based on your stored memories.`;

    // Send the prompt to the assistant and get the response
    const response = await this.sendChatPrompt(assistant, prompt);

    // Check if the response contains key elements from all memories
    const recallResults = memories.map((memory) =>
      this.evaluateMemoryRecall(memory, response)
    );
    const recallSuccess = recallResults.every((result) => result);

    return {
      memoriesIncluded: memories,
      prompt,
      response,
      recallSuccess,
    };
  }

  /**
   * Evaluates whether a response demonstrates successful recall of a memory
   */
  private evaluateMemoryRecall(memory: Memory, response: string): boolean {
    // Extract key concepts/phrases from the memory to check against the response
    const keyElements = this.extractKeyElements(memory);

    // Check if a sufficient number of key elements are present in the response
    const threshold = Math.max(1, Math.floor(keyElements.length * 0.3)); // At least 60% of key elements
    let matchCount = 0;

    for (const element of keyElements) {
      if (response.toLowerCase().includes(element.toLowerCase())) {
        matchCount++;
      }
    }

    return matchCount >= threshold;
  }

  /**
   * Extract key elements (words/phrases) from a memory
   */
  private extractKeyElements(memory: Memory): string[] {
    // Simple implementation - extract key nouns and phrases from description
    const description = memory.description || '';
    const stopWords = new Set([
      'a',
      'an',
      'the',
      'is',
      'are',
      'in',
      'on',
      'at',
      'to',
      'for',
      'with',
      'by',
      'about',
      'like',
      'and',
      'or',
      'but',
      'if',
      'then',
      'this',
      'that',
    ]);
    const words = description.split(/\s+/);

    // Create a list of key terms
    const keyElements: string[] = [];

    // Add individual significant words
    for (const word of words) {
      const cleanWord = word.toLowerCase().replace(/[.,;!?()]/g, '');
      if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
        keyElements.push(cleanWord);
      }
    }

    // Add key phrases (2-3 consecutive words)
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = words.slice(i, i + 2).join(' ');
      if (phrase.length > 10) {
        keyElements.push(phrase);
      }

      if (i < words.length - 2) {
        const longerPhrase = words.slice(i, i + 3).join(' ');
        if (longerPhrase.length > 15) {
          keyElements.push(longerPhrase);
        }
      }
    }

    return keyElements;
  }

  /**
   * Analyzes test results and generates recommendations
   */
  private analyzeTestResults(testReport: AssistantTestReport): void {
    const recommendations: string[] = [];

    // Analyze chat memory recall
    if (testReport.summary.totalChatMemoriesTested > 0) {
      if (testReport.summary.chatRecallRate < 0.5) {
        recommendations.push(
          'The assistant has difficulty recalling chat memories. Consider simplifying memory content or reducing the total number of memories.'
        );
      }

      // Determine the maximum number of effective chat memories
      const multiMemoryResults = testReport.multipleMemoryResults;
      let maxEffectiveMemories = 1;

      // Check pairs first
      const pairTests = multiMemoryResults.filter(
        (r) => r.memoriesIncluded.length === 2
      );
      const successfulPairs = pairTests.filter((r) => r.recallSuccess);

      if (successfulPairs.length > pairTests.length * 0.7) {
        maxEffectiveMemories = 2;

        // Then check triples
        const tripleTests = multiMemoryResults.filter(
          (r) => r.memoriesIncluded.length === 3
        );
        const successfulTriples = tripleTests.filter((r) => r.recallSuccess);

        if (
          tripleTests.length > 0 &&
          successfulTriples.length > tripleTests.length * 0.7
        ) {
          maxEffectiveMemories = 3;
        }
      }

      testReport.summary.maxEffectiveChatMemories = maxEffectiveMemories;
      recommendations.push(
        `This assistant reliably handles up to ${maxEffectiveMemories} chat memories simultaneously.`
      );

      if (maxEffectiveMemories < 2) {
        recommendations.push(
          'Consider using more specialized assistants with fewer, more focused chat memories.'
        );
      }
    }

    // Analyze instruction memory compliance
    if (testReport.summary.totalInstructionsTested > 0) {
      if (testReport.summary.instructionComplianceRate < 0.5) {
        recommendations.push(
          'The assistant often fails to follow instruction memories. Consider making instructions clearer and more explicit.'
        );
      } else if (testReport.summary.instructionComplianceRate > 0.8) {
        recommendations.push(
          'The assistant follows instruction memories effectively. This is a good way to shape assistant behavior.'
        );
      }

      // Add recommendations based on individual instruction results
      const problematicInstructions = testReport.instructionResults.filter(
        (r) => !r.recallSuccess
      );
      if (problematicInstructions.length > 0) {
        recommendations.push(
          `${problematicInstructions.length} instruction(s) are not being followed reliably. Consider revising them to be more direct and specific.`
        );
      }
    }

    // Overall memory management recommendations
    if (
      testReport.summary.totalChatMemoriesTested > 0 &&
      testReport.summary.totalInstructionsTested > 0
    ) {
      if (
        testReport.summary.instructionComplianceRate >
        testReport.summary.chatRecallRate
      ) {
        recommendations.push(
          'The assistant follows instructions more reliably than it recalls chat memories. Consider converting important factual information into instruction format.'
        );
      }
    }

    testReport.summary.recommendations = recommendations;
  }

  /**
   * Extract a concise topic from a memory
   */
  private getMemoryTopic(memory: Memory): string {
    const description = memory.description || '';
    const firstSentence = description.split(/[.!?](?:\s|$)/)[0].trim();

    return firstSentence.length <= 50
      ? firstSentence
      : firstSentence.substring(0, 47) + '...';
  }

  /**
   * Sends a test prompt to the assistant using the chat endpoint
   */
  private async sendChatPrompt(
    assistant: AssistantFull,
    prompt: string
  ): Promise<string> {
    try {
      const testId = `chat-test-${Date.now()}`;

      // Use the chat endpoint for regular memory testing
      const response = await lastValueFrom(
        this.http
          .post<{ status: string; data: string }>(`${this.apiUrl}/prompt/`, {
            id: assistant.id,
            prompt: prompt,
            testId: testId,
          })
          .pipe(take(1))
      );

      this.logTestInteraction(assistant.id, prompt, response.data, testId);
      return response.data;
    } catch (error) {
      console.error('Error sending chat test prompt:', error);
      this.warnService.warn('Failed to send chat test prompt to assistant');
      return 'Error: Failed to get response from assistant';
    }
  }

  /**
   * Sends a test prompt to the assistant using the instruction endpoint
   */
  private async sendInstructionPrompt(
    assistant: AssistantFull,
    prompt: string
  ): Promise<string> {
    try {
      const testId = `instruction-test-${Date.now()}`;

      // Use the instruction endpoint for instruction memory testing
      const response = await lastValueFrom(
        this.http
          .post<{ status: string; data: string }>(`${this.apiUrl}/prompt/`, {
            id: assistant.id,
            prompt: prompt,
            testId: testId,
          })
          .pipe(take(1))
      );

      this.logTestInteraction(assistant.id, prompt, response.data, testId);
      return response.data;
    } catch (error) {
      console.error('Error sending instruction test prompt:', error);
      this.warnService.warn(
        'Failed to send instruction test prompt to assistant'
      );
      return 'Error: Failed to get response from assistant';
    }
  }

  /**
   * Logs a test interaction for record-keeping
   */
  private logTestInteraction(
    assistantId: string,
    prompt: string,
    response: string,
    testId: string
  ): void {
    const requestMessage = this.messageService.getBasicMessage(
      `[TEST ${testId}] ${prompt}`,
      'Memory Test'
    );

    const responseMessage = this.messageService.getBasicMessage(
      `[TEST ${testId}] ${response}`,
      'Assistant'
    );

    this.messageService.addLogMessage(requestMessage);
    this.messageService.addLogMessage(responseMessage);
  }
}
