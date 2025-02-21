import { Injectable } from '@angular/core';
import { ASSISTANT_API_CONFIG } from '../../app.constants';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom, take } from 'rxjs';
import { WarnService } from '../warn.service';
import { AssistantsApiResponse } from '../../interfaces/response.model';
import { MemoryWithTags } from './memory.service';

@Injectable({
  providedIn: 'root',
})
export class MemoryOwnedService {
  private apiUrl = ASSISTANT_API_CONFIG.baseUrl;

  constructor(private http: HttpClient, private warnService: WarnService) {}

  /** ✅ **Get Memories Owned by an Assistant** */
  async getMemoriesByAssistantId(
    assistantId: string
  ): Promise<MemoryWithTags[]> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(
          `${this.apiUrl}/memory-owned/assistant/${assistantId}`
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return Array.isArray(r?.data) ? (r.data as MemoryWithTags[]) : [];
    } catch (error) {
      this.handleError(
        error,
        `Error fetching memories for assistant ID: ${assistantId}`
      );
      return [];
    }
  }

  /** ✅ **Get All Owned Memories for an Assistant** */
  async getOwnedMemories(assistantId: string): Promise<MemoryWithTags[]> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(
          `${this.apiUrl}/memory-owned/${assistantId}`
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return Array.isArray(r?.data) ? (r.data as MemoryWithTags[]) : [];
    } catch (error) {
      this.handleError(
        error,
        `Error fetching owned memories for assistant ID: ${assistantId}`
      );
      return [];
    }
  }

  /** ✅ **Add a Memory to an Assistant** */
  async addOwnedMemory(
    assistantId: string,
    memoryId: string
  ): Promise<boolean> {
    try {
      const o = this.http
        .post<AssistantsApiResponse>(
          `${this.apiUrl}/memory-owned/${assistantId}/${memoryId}`,
          {}
        )
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(
        error,
        `Error adding memory ID: ${memoryId} to assistant ID: ${assistantId}`
      );
      return false;
    }
  }

  /** ✅ **Update Owned Memories for an Assistant** */
  async updateOwnedMemories(
    assistantId: string,
    memoryIds: string[]
  ): Promise<boolean> {
    try {
      const o = this.http
        .put<AssistantsApiResponse>(
          `${this.apiUrl}/memory-owned/${assistantId}`,
          { memoryIds }
        )
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(
        error,
        `Error updating owned memories for assistant ID: ${assistantId}`
      );
      return false;
    }
  }

  /** ✅ **Remove a Memory from an Assistant** */
  async removeOwnedMemory(
    assistantId: string,
    memoryId: string
  ): Promise<boolean> {
    try {
      const o = this.http
        .delete<AssistantsApiResponse>(
          `${this.apiUrl}/memory-owned/${assistantId}/${memoryId}`
        )
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(
        error,
        `Error removing memory ID: ${memoryId} from assistant ID: ${assistantId}`
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
