import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom, take } from 'rxjs';
import { ASSISTANT_API_CONFIG } from '../../app.constants';
import { AssistantsApiResponse } from '../../interfaces/response.model';
import { WarnService } from '../warn.service';

export interface TaskRequest {
  type: string; // e.g., "component", "css", "test"
  description: string; // Summary or instructions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Optional extra fields
}

export interface AssistantEvaluation {
  assistantId: string;
  successRate: number; // ratio of completed tasks vs total
  feedbackAverage: number; // avg feedback rating
  tasksCompleted: number;
  tasksFailed: number;
}

export interface AssistantSuggestion {
  assistantId: string;
  score: number; // higher score => more relevant
}

export interface TaskResponse {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output?: any; // e.g. code snippet, response data, etc.
  error?: string; // Error message if failed
}

export interface MemoryRequest {
  type: 'instruction' | 'session' | 'prompt' | 'knowledge' | 'meta';
  text: string; // Content being stored
}

@Injectable({
  providedIn: 'root',
})
export class OrchestratorService {
  private apiUrl = ASSISTANT_API_CONFIG.baseUrl;

  constructor(private http: HttpClient, private warnService: WarnService) {}

  /** ✅ **Store a Memory for an Assistant** */
  async remember(
    assistantId: string,
    memory: MemoryRequest,
    tags?: string[]
  ): Promise<boolean> {
    try {
      const o = this.http
        .post<AssistantsApiResponse>(`${this.apiUrl}/orchestrator/remember`, {
          assistantId,
          memory,
          tags,
        })
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(error, 'Error storing memory.');
      return false;
    }
  }

  /** ✅ **Delegate a Task to an Assistant** */
  async delegateTask(
    assistantId: string,
    task: TaskRequest,
    tags?: string[]
  ): Promise<TaskResponse | null> {
    try {
      const o = this.http
        .post<AssistantsApiResponse>(
          `${this.apiUrl}/orchestrator/delegate-task`,
          { assistantId, task, tags }
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return (r?.data as TaskResponse) || null;
    } catch (error) {
      this.handleError(error, 'Error delegating task.');
      return null;
    }
  }

  /** ✅ **Connect Two Assistants** */
  async connectAssistants(
    primaryId: string,
    dependentId: string,
    relation: string
  ): Promise<boolean> {
    try {
      const o = this.http
        .post<AssistantsApiResponse>(
          `${this.apiUrl}/orchestrator/connect-assistants`,
          { primaryId, dependentId, relation }
        )
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(error, 'Error connecting assistants.');
      return false;
    }
  }

  /** ✅ **Connect Any Two Entities** */
  async connectEntities(
    sourceType: string,
    sourceId: string,
    targetType: string,
    targetId: string,
    relation: string
  ): Promise<boolean> {
    try {
      const o = this.http
        .post<AssistantsApiResponse>(
          `${this.apiUrl}/orchestrator/connect-entities`,
          { sourceType, sourceId, targetType, targetId, relation }
        )
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(error, 'Error connecting entities.');
      return false;
    }
  }

  /** ✅ **Query Knowledge from an Assistant** */
  async queryKnowledge(
    query: string,
    assistantId?: string,
    tags?: string[]
  ): Promise<string | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = { query };
      if (assistantId) params.assistantId = assistantId;
      if (tags) params.tags = tags.join(',');

      const o = this.http
        .get<AssistantsApiResponse>(
          `${this.apiUrl}/orchestrator/query-knowledge`,
          { params }
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return (r?.data as string) || null;
    } catch (error) {
      this.handleError(error, 'Error querying knowledge.');
      return null;
    }
  }

  /** ✅ **Suggest Assistants for a Task** */
  async suggestAssistants(
    task: TaskRequest,
    tags?: string[]
  ): Promise<AssistantSuggestion[]> {
    try {
      const o = this.http
        .post<AssistantsApiResponse>(
          `${this.apiUrl}/orchestrator/suggest-assistants`,
          { task, tags }
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return Array.isArray(r?.data) ? (r.data as AssistantSuggestion[]) : [];
    } catch (error) {
      this.handleError(error, 'Error fetching assistant suggestions.');
      return [];
    }
  }

  /** ✅ **Evaluate an Assistant's Performance** */
  async evaluatePerformance(
    assistantId: string
  ): Promise<AssistantEvaluation | null> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(
          `${this.apiUrl}/orchestrator/evaluate-performance/${assistantId}`
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return (r?.data as AssistantEvaluation) || null;
    } catch (error) {
      this.handleError(error, 'Error evaluating assistant performance.');
      return null;
    }
  }

  /** 🔥 **Error Handling Helper** */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleError(error: any, message: string) {
    if (error instanceof HttpErrorResponse) {
      this.warnService.warn(error.error.message || message);
    } else {
      this.warnService.warn(message);
    }
  }
}
