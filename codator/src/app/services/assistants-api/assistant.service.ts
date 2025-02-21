import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom, take } from 'rxjs';
import { ASSISTANT_API_CONFIG } from '../../app.constants';
import { WarnService } from '../warn.service';
import { GptModel } from '../../interfaces/gpt-api.model';
import { MemoryFocusRule } from './memory-rule.service';
import { Tag } from './tag.service';
import { MemoryWithTags } from './memory.service';

export interface Assistant {
  id: string;
  name: string;
  description: string;
  type: 'chat' | 'assistant';
  model: GptModel;
  createdAt: string;
  updatedAt: string;
}
export interface AssistantFull extends Assistant {
  assistantTags: Tag[];
  focusedMemories: MemoryWithTags[];
  memoryFocusRule: MemoryFocusRule;
  feedbackSummary: FeedbackSummary;
}

export interface FeedbackSummary {
  avgRating: number;
  totalFeedback: number;
}

@Injectable({
  providedIn: 'root',
})
export class AssistantService {
  private apiUrl = ASSISTANT_API_CONFIG.baseUrl;

  constructor(private http: HttpClient, private warnService: WarnService) {}

  /** ✅ **Get All Assistants** */
  async getAllAssistants(): Promise<Assistant[]> {
    try {
      const o = this.http
        .get<{ status: string; data: Assistant[] }>(`${this.apiUrl}/assistant/`)
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return r?.data ?? [];
    } catch (error) {
      this.handleError(error, 'Error fetching all assistants');
      return [];
    }
  }

  /** ✅ **Get Assistant by ID** */
  async getAssistantById(id: string): Promise<Assistant | null> {
    try {
      const o = this.http
        .get<{ status: string; data: Assistant }>(
          `${this.apiUrl}/assistant/${id}`
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return r?.data ?? null;
    } catch (error) {
      this.handleError(error, `Error fetching assistant with ID: ${id}`);
      return null;
    }
  }

  /** ✅ **Get Assistant with Details by ID** */
  async getAssistantWithDetailsById(id: string): Promise<AssistantFull | null> {
    try {
      const o = this.http
        .get<{ status: string; data: AssistantFull }>(
          `${this.apiUrl}/assistant/details/${id}`
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return r?.data ?? null;
    } catch (error) {
      this.handleError(
        error,
        `Error fetching assistant details with ID: ${id}`
      );
      return null;
    }
  }

  /** ✅ **Create a Simple Assistant** */
  async createAssistantSimple(
    name: string,
    instructions: string
  ): Promise<string | null> {
    try {
      const o = this.http
        .post<{ status: string; data: { id: string } }>(
          `${this.apiUrl}/assistant/simple`,
          { name, instructions }
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return r?.data?.id ?? null;
    } catch (error) {
      this.handleError(error, 'Error creating simple assistant');
      return null;
    }
  }

  /** ✅ **Create an Assistant** */
  async createAssistant(
    name: string,
    description: string,
    type: string,
    model: string,
    instructions: string
  ): Promise<string | null> {
    try {
      const o = this.http
        .post<{ status: string; data: { id: string } }>(
          `${this.apiUrl}/assistant/`,
          {
            name,
            description,
            type,
            model,
            instructions,
          }
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return r?.data?.id ?? null;
    } catch (error) {
      this.handleError(error, 'Error creating assistant');
      return null;
    }
  }

  /** ✅ **Update an Assistant** */
  async updateAssistant(id: string, assistant: Assistant): Promise<boolean> {
    try {
      const o = this.http
        .put<{ status: string }>(`${this.apiUrl}/assistant/${id}`, assistant)
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(error, `Error updating assistant with ID: ${id}`);
      return false;
    }
  }

  /** ✅ **Delete an Assistant** */
  async deleteAssistant(id: string): Promise<boolean> {
    try {
      const o = this.http
        .delete<{ status: string }>(`${this.apiUrl}/assistant/${id}`)
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(error, `Error deleting assistant with ID: ${id}`);
      return false;
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
