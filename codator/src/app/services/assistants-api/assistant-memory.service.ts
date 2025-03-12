import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom, take } from 'rxjs';
import { ASSISTANT_API_CONFIG } from '../../app.constants';
import { WarnService } from '../warn.service';
import { Memory } from './memory.service';

export interface AssistantMemoryData {
  focused: Memory[];
  owned: Memory[];
  related: Memory[];
}

@Injectable({
  providedIn: 'root',
})
export class AssistantMemoryService {
  private apiUrl = ASSISTANT_API_CONFIG.baseUrl;

  constructor(private http: HttpClient, private warnService: WarnService) {}

  /** ✅ **Get All Assistants** */
  async getAllAssistMemories(
    assistantId: string
  ): Promise<AssistantMemoryData | null> {
    try {
      const o = this.http
        .get<{ status: string; data: AssistantMemoryData }>(
          `${this.apiUrl}/assistant-memory/${assistantId}/memories`
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return r?.data ?? [];
    } catch (error) {
      this.handleError(error, 'Error fetching all assistants');
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
