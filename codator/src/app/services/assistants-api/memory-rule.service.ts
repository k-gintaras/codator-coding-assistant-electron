import { Injectable } from '@angular/core';
import { ASSISTANT_API_CONFIG } from '../../app.constants';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom, take } from 'rxjs';
import { WarnService } from '../warn.service';
import { AssistantsApiResponse, getId } from '../../interfaces/response.model';

export interface MemoryFocusRule {
  id: string; // Unique identifier
  assistantId: string; // ID of the assistant
  maxResults: number; // Max memories to focus on
  relationshipTypes: string[]; // Types of relationships
  priorityTags: string[]; // Tags prioritized in focus
  createdAt: Date; // Created timestamp
  updatedAt: Date; // Updated timestamp
}

@Injectable({
  providedIn: 'root',
})
export class MemoryFocusRuleService {
  private apiUrl = ASSISTANT_API_CONFIG.baseUrl;

  constructor(private http: HttpClient, private warnService: WarnService) {}

  /** ✅ **Create a New Memory Focus Rule** */
  async createMemoryFocusRule(
    rule: Omit<MemoryFocusRule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string | undefined> {
    try {
      const o = this.http
        .post<AssistantsApiResponse>(`${this.apiUrl}/memory-focus-rule/`, rule)
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return getId(r);
    } catch (error) {
      this.handleError(error, 'Error creating memory focus rule');
      return undefined;
    }
  }

  /** ✅ **Get Memory Focus Rule by ID** */
  async getMemoryFocusRuleById(
    id: string
  ): Promise<MemoryFocusRule | undefined> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(`${this.apiUrl}/memory-focus-rule/${id}`)
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return r?.data as MemoryFocusRule;
    } catch (error) {
      this.handleError(
        error,
        `Error fetching memory focus rule with ID: ${id}`
      );
      return undefined;
    }
  }

  /** ✅ **Get All Memory Focus Rules for an Assistant** */
  async getMemoryFocusRules(assistantId: string): Promise<MemoryFocusRule[]> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(
          `${this.apiUrl}/memory-focus-rule/${assistantId}`
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return Array.isArray(r?.data) ? (r.data as MemoryFocusRule[]) : [];
    } catch (error) {
      this.handleError(
        error,
        `Error fetching memory focus rules for assistant ID: ${assistantId}`
      );
      return [];
    }
  }

  /** ✅ **Update a Memory Focus Rule** */
  async updateMemoryFocusRule(
    id: string,
    updates: Partial<Omit<MemoryFocusRule, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<boolean> {
    try {
      const o = this.http
        .put<AssistantsApiResponse | undefined>(
          `${this.apiUrl}/memory-focus-rule/${id}`,
          updates
        )
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(
        error,
        `Error updating memory focus rule with ID: ${id}`
      );
      return false;
    }
  }

  /** ✅ **Delete a Memory Focus Rule** */
  async removeMemoryFocusRule(id: string): Promise<boolean> {
    try {
      const o = this.http
        .delete<AssistantsApiResponse | undefined>(
          `${this.apiUrl}/memory-focus-rule/${id}`
        )
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(
        error,
        `Error deleting memory focus rule with ID: ${id}`
      );
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
