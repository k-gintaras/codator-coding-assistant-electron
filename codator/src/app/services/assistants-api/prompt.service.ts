import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { take, lastValueFrom } from 'rxjs';
import { ASSISTANT_API_CONFIG } from '../../app.constants';
import { AssistantsApiResponse } from '../../interfaces/response.model';
import { WarnService } from '../warn.service';

@Injectable({
  providedIn: 'root',
})
export class PromptService {
  private apiUrl = ASSISTANT_API_CONFIG.baseUrl;

  constructor(private http: HttpClient, private warnService: WarnService) {}

  /** ✅ **Process a Prompt for an Assistant** */
  async processPrompt(
    id: string,
    prompt: string,
    extraInstruction?: string
  ): Promise<string | null> {
    try {
      const body = { id, prompt, extraInstruction };
      const o = this.http
        .post<AssistantsApiResponse>(`${this.apiUrl}/prompt/`, body)
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return (r?.data as string) ?? null;
    } catch (error) {
      this.handleError(
        error,
        `Error processing prompt for assistant ID: ${id}`
      );
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
