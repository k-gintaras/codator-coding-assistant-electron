import { Injectable } from '@angular/core';
import { BehaviorSubject, lastValueFrom, Observable, take } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ASSISTANT_API_CONFIG } from '../app.constants';
import { AssistantsApiResponse, getId } from '../interfaces/response.model';
import { AssistantService } from './assistants-services/assistant.service';
import { WarnService } from './warn.service';
import { TagOLDService } from './tag.service';
import { OrganizedMemories } from './assistants-api/memory-extra.service';
import { MemoryDepth } from '../interfaces/assistant.model';
import { AssistantFull, Assistant } from './assistants-api/assistant.service';
import { Memory } from './assistants-api/memory.service';

@Injectable({
  providedIn: 'root',
})
export class MemoryService {
  private apiUrl = ASSISTANT_API_CONFIG.baseUrl; // Base API URL

  // BehaviorSubject to store session memory
  private sessionMemorySubject = new BehaviorSubject<Map<string, string[]>>(
    new Map()
  );
  sessionMemory$ = this.sessionMemorySubject.asObservable();

  constructor(
    private http: HttpClient,
    private assistantService: AssistantService,
    private warnService: WarnService,
    private tagService: TagOLDService
  ) {}

  async getAllMemories(): Promise<Memory[]> {
    try {
      const memoryResponse: Observable<AssistantsApiResponse | undefined> =
        this.http
          .get<AssistantsApiResponse>(`${this.apiUrl}/memory`)
          .pipe(take(1));

      const r = await lastValueFrom(memoryResponse);
      return Array.isArray(r?.data) ? (r.data as Memory[]) : []; // Ensure we return an empty array if data is not a Memory[]
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        // this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error getting memories by tags');
      }
      return [];
    }
  }

  // TODO:
  // getMemoriesForAssistant;

  async getMemoriesByTags(tagNames: string[]): Promise<Memory[]> {
    try {
      const stringTags = tagNames.join(',');
      if (stringTags.length < 1) return [];
      const memoryResponse: Observable<AssistantsApiResponse | undefined> =
        this.http
          .get<AssistantsApiResponse>(`${this.apiUrl}/memory-extra/tags`, {
            params: { tags: stringTags }, // Send tags as query parameter
          })
          .pipe(take(1));

      const r = await lastValueFrom(memoryResponse);
      return Array.isArray(r?.data) ? (r.data as Memory[]) : []; // Ensure we return an empty array if data is not a Memory[]
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        // this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error getting memories by tags');
      }
      return [];
    }
  }

  async getOrganizedMemories(): Promise<OrganizedMemories | null> {
    try {
      const memoryResponse: Observable<AssistantsApiResponse | undefined> =
        this.http
          .get<AssistantsApiResponse>(`${this.apiUrl}/memory-extra/memories`)
          .pipe(take(1));

      const r = await lastValueFrom(memoryResponse);
      if (!r) return null;
      return r.data ? (r.data as OrganizedMemories) : null;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        // this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error getting memories by tags');
      }
      return null;
    }
  }

  async getMemory(id: string): Promise<Memory | null> {
    try {
      const memoryResponse: Observable<AssistantsApiResponse | undefined> =
        this.http
          .get<AssistantsApiResponse>(`${this.apiUrl}/memory/${id}`)
          .pipe(take(1));

      const r = await lastValueFrom(memoryResponse);
      return r?.data ? (r.data as Memory) : null; // Ensure we return an empty array if data is not a Memory[]
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        // this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error getting memory');
      }
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getMemoryRule(id: string): Promise<any | null> {
    try {
      const memoryResponse: Observable<AssistantsApiResponse | undefined> =
        this.http
          .get<AssistantsApiResponse>(
            `${this.apiUrl}/memory-focus-rule/rule/${id}`
          )
          .pipe(take(1));

      const r = await lastValueFrom(memoryResponse);
      return r?.data || null; // Ensure we return an empty array if data is not a Memory[]
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        // this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error getting memory');
      }
      return null;
    }
  }

  async getFocusedMemories(assistantId: string): Promise<Memory[]> {
    try {
      const memoryResponse: Observable<AssistantsApiResponse | undefined> =
        this.http
          .get<AssistantsApiResponse>(
            `${this.apiUrl}/memory-focused/assistant/${assistantId}`
          )
          .pipe(take(1));

      const r = await lastValueFrom(memoryResponse);
      return Array.isArray(r?.data) ? (r.data as Memory[]) : []; // Ensure we return an empty array if data is not a Memory[]
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        // this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error getting focused memories');
      }
      return [];
    }
  }

  async getOwnedMemories(assistantId: string): Promise<Memory[]> {
    try {
      const memoryResponse: Observable<AssistantsApiResponse | undefined> =
        this.http
          .get<AssistantsApiResponse>(
            `${this.apiUrl}/memory-owned/assistant/${assistantId}`
          )
          .pipe(take(1));

      const r = await lastValueFrom(memoryResponse);
      return Array.isArray(r?.data) ? (r.data as Memory[]) : []; // Ensure we return an empty array if data is not a Memory[]
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        // this.warnService.warn('Owned Memories Error: ' + error.error.message);
      } else {
        this.warnService.warn('Error getting owned memories');
      }
      return [];
    }
  }

  async updateMemory(m: Memory): Promise<boolean> {
    try {
      const memoryResponse: Observable<AssistantsApiResponse | undefined> =
        this.http
          .put<AssistantsApiResponse>(`${this.apiUrl}/memory/${m.id}`, m) // Send the entire memory object, including its id
          .pipe(take(1));
      const r = await lastValueFrom(memoryResponse);
      return r?.status === 'success';
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error updating memory');
      }
      return false;
    }
  }

  async deleteMemory(id: string): Promise<boolean> {
    try {
      const memoryResponse: Observable<AssistantsApiResponse | undefined> =
        this.http
          .delete<AssistantsApiResponse>(`${this.apiUrl}/memory/${id}`)
          .pipe(take(1));
      const r = await lastValueFrom(memoryResponse);
      return r?.status === 'success';
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error deleting memory');
      }
      return false;
    }
  }

  async updateTagsForMemory(id: string, tagNames: string[]): Promise<boolean> {
    try {
      // /tag-extra/{entityType}/{entityId}/{tagId}/{isNames}
      const tagsString = tagNames.join(',');
      const memoryResponse: Observable<AssistantsApiResponse | undefined> =
        this.http
          .post<AssistantsApiResponse>(
            `${this.apiUrl}/tag-extra/memory/${id}/${tagsString}/true`,
            {
              tagNames,
            }
          )
          .pipe(take(1));
      const r = await lastValueFrom(memoryResponse);
      return r?.status === 'success';
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error updating tags for memory');
      }
      return false;
    }
  }

  async createMemoryWithTags(
    memory: Memory,
    tagNames: string[]
  ): Promise<boolean> {
    const m = await this.createMemory(memory);
    if (!m) return false;
    const tagUpdate = await this.updateTagsForMemory(m, tagNames);
    return tagUpdate;
  }

  // Get session memory for a specific assistant
  getSessionMemory(assistantId: string): string[] | undefined {
    const currentSessionMemory = this.sessionMemorySubject.getValue();
    return currentSessionMemory.get(assistantId);
  }

  // Save memory for a session related to a specific assistant
  rememberForSession(assistantId: string, msg: string): void {
    if (msg.length < 1) return;
    // Get the current session memory (if any) for the assistant
    const currentSessionMemory = this.sessionMemorySubject.getValue();

    // Update memory for this assistant with the new message
    const messages = currentSessionMemory.get(assistantId) || [];
    messages.push(msg);
    currentSessionMemory.set(assistantId, messages);

    // Update the session memory subject with the new value
    this.sessionMemorySubject.next(currentSessionMemory);
  }

  // Save general memory for later use
  async rememberForLater(
    assistant: AssistantFull,
    msg: string
  ): Promise<boolean> {
    if (msg.length < 1) return false;

    return this.remember(assistant, this.getMemoryObject(msg, false), 'short');
  }

  // Save conversation memory (permanent)
  async rememberForConversation(
    assistant: AssistantFull,
    msg: string
  ): Promise<boolean> {
    if (msg.length < 1) return false;

    return this.remember(assistant, this.getMemoryObject(msg, false), 'long');
  }

  // Save assistant-specific instructions
  async rememberAsInstructions(
    assistant: AssistantFull,
    msg: string
  ): Promise<boolean> {
    if (msg.length < 1) return false;

    return this.remember(assistant, this.getMemoryObject(msg, true), 'deep');
  }

  private getMemoryObject(msg: string, instruction: boolean): Memory {
    const m: Memory = {
      id: '',
      type: instruction ? 'instruction' : 'knowledge',
      description: msg,
      data: null,
      createdAt: null,
      updatedAt: null,
      name: null,
      summary: null,
    };
    return m;
  }

  // Create a new memory for the assistant (owned memory)
  private async remember(
    assistant: AssistantFull,
    memoryData: Memory,
    memoryDepth: MemoryDepth
  ): Promise<boolean> {
    try {
      switch (memoryDepth) {
        case 'session':
          // just memory in database, unrelated to anything
          this.rememberForSession(assistant.id, memoryData.description || '');
          return true;

        case 'disconnected':
          // just memory in database, unrelated to anything
          return this.createDisconnectedMemory(assistant, memoryData);

        case 'short':
          // Create assistant owned memory
          return this.createShortMemory(assistant, memoryData, true);

        case 'long':
          // Create owned and focused memory
          return this.createLongMemory(assistant, memoryData, true);

        case 'deep':
          // Create owned, focused memory, and update the assistant to have it as instruction
          return this.createDeepMemory(assistant, memoryData, true);

        default:
          // Default to 'disconnected' behavior
          return true;
      }
    } catch {
      return false;
    }
  }

  async createDeepMemory(
    assistant: AssistantFull,
    memoryData: Memory,
    isFreshMemory: boolean
  ): Promise<boolean> {
    const memoryId = isFreshMemory
      ? await this.createMemory(memoryData)
      : memoryData.id;
    if (!memoryId) return false; // If no memory ID, return false early
    await this.createOwnedMemory(assistant.id, memoryId);
    await this.createFocusedMemory(assistant.memoryFocusRule.id, memoryId);
    await this.updateAssistant(assistant);
    await this.createMemoryTags(assistant, memoryId, ['instruction', 'deep']);
    return true;
  }

  async createLongMemory(
    assistant: AssistantFull,
    memoryData: Memory,
    isFreshMemory: boolean
  ): Promise<boolean> {
    const memoryId = isFreshMemory
      ? await this.createMemory(memoryData)
      : memoryData.id;
    if (!memoryId) return false; // If no memory ID, return false early
    await this.createOwnedMemory(assistant.id, memoryId);
    await this.createFocusedMemory(assistant.memoryFocusRule.id, memoryId);
    await this.createMemoryTags(assistant, memoryId, ['focus', 'long']);

    return true;
  }

  async createShortMemory(
    assistant: AssistantFull,
    memoryData: Memory,
    isFreshMemory: boolean
  ): Promise<boolean> {
    const memoryId = isFreshMemory
      ? await this.createMemory(memoryData)
      : memoryData.id;
    if (!memoryId) return false; // If no memory ID, return false early
    await this.createOwnedMemory(assistant.id, memoryId);
    await this.createMemoryTags(assistant, memoryId, ['owned', 'short']);
    return true;
  }

  async createDisconnectedMemory(
    assistant: Assistant,
    memoryData: Memory
  ): Promise<boolean> {
    const memoryId = await this.createMemory(memoryData);

    if (!memoryId) return false; // If no memory ID, return false early
    await this.createMemoryTags(assistant, memoryId, ['disconnected']);

    return true;
  }

  async createMemory(memoryData: Memory): Promise<string | undefined> {
    try {
      // Step 1: Create the memory
      const memoryResponse: Observable<AssistantsApiResponse | undefined> =
        this.http
          .post<AssistantsApiResponse>(`${this.apiUrl}/memory`, {
            ...memoryData,
          })
          .pipe(take(1)); // Ensures we only take the first value from the observable

      const r = await lastValueFrom(memoryResponse); // Converts the observable to a promise
      return getId(r); // Safely extract id from the response
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error creating memory');
      }
      return undefined;
    }
  }

  // Helper method to create owned memory
  async createOwnedMemory(
    assistantId: string,
    memoryId: string
  ): Promise<boolean> {
    try {
      const o = this.http
        .post<AssistantsApiResponse>(
          `${this.apiUrl}/memory-owned/${assistantId}/${memoryId}`,
          {}
        )
        .pipe(take(1)); // Ensures we only take the first value from the observable

      const r = await lastValueFrom(o); // Converts the observable to a promise
      return r.status === 'success' || false;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error creating owned memory');
      }
      return false;
    }
  }

  // Helper method to create focused memory
  async createFocusedMemory(
    memoryFocusId: string,
    memoryId: string
  ): Promise<boolean> {
    try {
      const o = this.http
        .post<AssistantsApiResponse>(
          `${this.apiUrl}/memory-focused/${memoryFocusId}/${memoryId}`,
          {}
        )
        .pipe(take(1)); // Ensures we only take the first value from the observable

      const r = await lastValueFrom(o); // Converts the observable to a promise
      return r.status === 'success' || false;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error creating focused memory');
      }
      return false;
    }
  }

  async forgetDeep(assistant: AssistantFull, memory: Memory): Promise<boolean> {
    const deletedFocus = await this.deleteFocusedMemory(
      assistant.memoryFocusRule.id,
      memory.id
    );
    if (!deletedFocus) return false;
    if (memory.type === 'instruction') {
      const updated = await this.updateAssistant(assistant);
      if (!updated) return false;
    }
    return true;
  }

  async disconnect(assistant: AssistantFull, memory: Memory): Promise<boolean> {
    const deletedOwned = await this.deleteOwnedMemory(assistant.id, memory.id);
    if (!deletedOwned) return false;
    return true;
  }

  async deleteFocusedMemory(
    memoryFocusId: string,
    memoryId: string
  ): Promise<boolean> {
    try {
      const memoryResponse: Observable<AssistantsApiResponse | undefined> =
        this.http
          .delete<AssistantsApiResponse>(
            `${this.apiUrl}/memory-focused/${memoryFocusId}/${memoryId}`
          )
          .pipe(take(1));
      const r = await lastValueFrom(memoryResponse);
      return r?.status === 'success';
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error deleting focused memory');
      }
      return false;
    }
  }

  async deleteOwnedMemory(
    assistantId: string,
    memoryId: string
  ): Promise<boolean> {
    try {
      const memoryResponse: Observable<AssistantsApiResponse | undefined> =
        this.http
          .delete<AssistantsApiResponse>(
            `${this.apiUrl}/memory-owned/${assistantId}/${memoryId}`
          )
          .pipe(take(1));
      const r = await lastValueFrom(memoryResponse);
      return r?.status === 'success';
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error deleting owned memory');
      }
      return false;
    }
  }

  // Helper method to update the assistant
  private async updateAssistant(
    assistant: AssistantFull
  ): Promise<Assistant | null> {
    return this.assistantService.updateAssistantPromise(assistant);
  }

  private async createMemoryTags(
    assistant: Assistant,
    memoryId: string,
    tags?: string[]
  ): Promise<boolean> {
    if (!assistant) return false;
    const relatedTags = tags ? [assistant.name, ...tags] : [assistant.name];
    const o = this.tagService.addTagNamesToEntity(
      relatedTags,
      memoryId,
      'memory'
    );
    o.pipe(take(1));
    return lastValueFrom(o);
  }
}
