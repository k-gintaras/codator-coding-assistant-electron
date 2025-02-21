import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { take, lastValueFrom } from 'rxjs';
import { ASSISTANT_API_CONFIG } from '../../app.constants';
import { WarnService } from '../warn.service';
import { AssistantsApiResponse } from '../../interfaces/response.model';
import { Memory, MemoryWithTags } from './memory.service';

export interface OrganizedMemories {
  looseMemories: Memory[];
  ownedMemories: {
    assistantName: string;
    assistantId: string;
    memories: Memory[];
  }[];
  focusedMemories: {
    assistantName: string;
    memoryFocusRuleId: string;
    memories: Memory[];
  }[];
}
@Injectable({
  providedIn: 'root',
})
export class MemoryExtraService {
  private apiUrl = ASSISTANT_API_CONFIG.baseUrl;

  constructor(private http: HttpClient, private warnService: WarnService) {}

  /** ✅ **Get Memories with Tags** */
  async getMemoriesWithTags(): Promise<MemoryWithTags[]> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(`${this.apiUrl}/memory-extra/`)
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return (r?.data as MemoryWithTags[]) ?? [];
    } catch (error) {
      this.handleError(error, 'Error fetching memories with tags');
      return [];
    }
  }

  /** ✅ **Get Memories by Tags** */
  async getMemoriesByTags(tags: string[]): Promise<MemoryWithTags[]> {
    try {
      const o = this.http
        .get<{ status: string; data: Memory[] }>(
          `${this.apiUrl}/memory-extra/tags`,
          {
            params: { tags: tags.join(',') },
          }
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return (r?.data as MemoryWithTags[]) ?? [];
    } catch (error) {
      this.handleError(error, 'Error fetching memories by tags');
      return [];
    }
  }

  /** ✅ **Get Organized Memories** */
  async getOrganizedMemories(): Promise<OrganizedMemories> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(`${this.apiUrl}/memory-extra/memories`)
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return (
        (r?.data as OrganizedMemories) ?? {
          looseMemories: [],
          ownedMemories: [],
          focusedMemories: [],
        }
      );
    } catch (error) {
      this.handleError(error, 'Error fetching organized memories');
      return { looseMemories: [], ownedMemories: [], focusedMemories: [] };
    }
  }

  /** ✅ **Update Memory Tags** */
  async updateMemoryTags(
    memoryId: string,
    newTags: string[]
  ): Promise<boolean> {
    try {
      const o = this.http
        .put<{ status: string }>(
          `${this.apiUrl}/memory-extra/tags/${memoryId}`,
          { newTags }
        )
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(error, `Error updating tags for memory ID: ${memoryId}`);
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
