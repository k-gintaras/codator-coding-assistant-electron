import { Injectable } from '@angular/core';
import { ASSISTANT_API_CONFIG } from '../../app.constants';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom, take } from 'rxjs';
import { WarnService } from '../warn.service';
import { AssistantsApiResponse } from '../../interfaces/response.model';
import { MemoryWithTags } from './memory.service';

export interface FocusedMemory {
  memoryId: string;
  memoryFocusId: string;
}

@Injectable({
  providedIn: 'root',
})
export class FocusedMemoryService {
  private apiUrl = ASSISTANT_API_CONFIG.baseUrl;

  constructor(private http: HttpClient, private warnService: WarnService) {}

  /** ✅ **Get Focused Memories by Assistant ID** */
  async getFocusedMemoriesByAssistantId(
    assistantId: string
  ): Promise<MemoryWithTags[]> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(
          `${this.apiUrl}/memory-focused/assistant/${assistantId}`
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return Array.isArray(r?.data) ? (r.data as MemoryWithTags[]) : [];
    } catch (error) {
      this.handleError(
        error,
        `Error fetching focused memories for assistant ID: ${assistantId}`
      );
      return [];
    }
  }

  /** ✅ **Get Focused Memories by Focus ID** */
  async getFocusedMemories(memoryFocusId: string): Promise<MemoryWithTags[]> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(
          `${this.apiUrl}/memory-focused/${memoryFocusId}`
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return Array.isArray(r?.data) ? (r.data as MemoryWithTags[]) : [];
    } catch (error) {
      this.handleError(
        error,
        `Error fetching focused memories for focus ID: ${memoryFocusId}`
      );
      return [];
    }
  }

  /** ✅ **Add a Memory to a Focus Group** */
  async addFocusedMemory(
    memoryFocusId: string,
    memoryId: string
  ): Promise<boolean> {
    try {
      const o = this.http
        .post<AssistantsApiResponse>(
          `${this.apiUrl}/memory-focused/${memoryFocusId}/${memoryId}`,
          {}
        )
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(
        error,
        `Error adding memory ID: ${memoryId} to focus group: ${memoryFocusId}`
      );
      return false;
    }
  }

  /** ✅ **Update Focused Memories in a Focus Group** */
  async updateFocusedMemories(
    memoryFocusId: string,
    memoryIds: string[]
  ): Promise<boolean> {
    try {
      const o = this.http
        .put<AssistantsApiResponse>(
          `${this.apiUrl}/memory-focused/${memoryFocusId}`,
          { memoryIds }
        )
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(
        error,
        `Error updating focused memories for focus ID: ${memoryFocusId}`
      );
      return false;
    }
  }

  /** ✅ **Remove a Memory from a Focus Group** */
  async removeFocusedMemory(
    memoryFocusId: string,
    memoryId: string
  ): Promise<boolean> {
    try {
      const o = this.http
        .delete<AssistantsApiResponse>(
          `${this.apiUrl}/memory-focused/${memoryFocusId}/${memoryId}`
        )
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(
        error,
        `Error removing memory ID: ${memoryId} from focus group: ${memoryFocusId}`
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
