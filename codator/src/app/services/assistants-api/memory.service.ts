import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { take, lastValueFrom } from 'rxjs';
import { ASSISTANT_API_CONFIG } from '../../app.constants';
import { AssistantsApiResponse, getId } from '../../interfaces/response.model';
import { WarnService } from '../warn.service';
import { Tag } from './tag.service';

export interface Memory {
  id: string;
  type: string; // e.g., "instruction", "session", "prompt", "knowledge", "meta"
  name: string | null; // Nullable in the database
  summary: string | null; // Nullable in the database
  description: string | null; // Nullable in the database
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any | null; // Nullable in the database
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface MemoryWithTags extends Memory {
  tags: Tag[] | null;
}
@Injectable({
  providedIn: 'root',
})
export class MemoryService {
  private apiUrl = ASSISTANT_API_CONFIG.baseUrl;

  constructor(private http: HttpClient, private warnService: WarnService) {}

  /** ✅ **Get Memory by ID** */
  async getMemoryById(memoryId: string): Promise<Memory | null> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(`${this.apiUrl}/memory/${memoryId}`)
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return (r?.data as Memory) ?? null;
    } catch (error) {
      this.handleError(error, `Error fetching memory ID: ${memoryId}`);
      return null;
    }
  }

  /** ✅ **Get All Memories** */
  async getAllMemories(): Promise<Memory[]> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(`${this.apiUrl}/memory/`)
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return Array.isArray(r?.data) ? (r.data as Memory[]) : [];
    } catch (error) {
      this.handleError(error, 'Error fetching all memories');
      return [];
    }
  }

  /** ✅ **Create a Memory** */
  async createMemory(memory: Memory): Promise<string | undefined> {
    try {
      const o = this.http
        .post<AssistantsApiResponse>(`${this.apiUrl}/memory/`, memory)
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return getId(r);
    } catch (error) {
      this.handleError(error, `Error creating memory`);
      return undefined;
    }
  }

  /** ✅ **Update a Memory** */
  async updateMemory(memoryId: string, memory: Memory): Promise<boolean> {
    try {
      const o = this.http
        .put<AssistantsApiResponse>(`${this.apiUrl}/memory/${memoryId}`, memory)
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(error, `Error updating memory ID: ${memoryId}`);
      return false;
    }
  }

  /** ✅ **Delete a Memory** */
  async deleteMemory(memoryId: string): Promise<boolean> {
    try {
      const o = this.http
        .delete<AssistantsApiResponse>(`${this.apiUrl}/memory/${memoryId}`)
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(error, `Error deleting memory ID: ${memoryId}`);
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
