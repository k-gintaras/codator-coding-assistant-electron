/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ASSISTANT_API_CONFIG } from '../../app.constants';

@Injectable({
  providedIn: 'root',
})
export class PromptService {
  private apiUrl =
    ASSISTANT_API_CONFIG.baseUrl + ASSISTANT_API_CONFIG.promptUrl; // Base URL for prompt API

  constructor(private http: HttpClient) {}

  private sendPrompt(
    id: string,
    prompt: string,
    extraInstruction?: string
  ): Observable<any> {
    const requestBody = {
      id,
      prompt,
      extraInstruction,
    };
    return this.http.post<any>(`${this.apiUrl}`, requestBody);
  }

  /**
   * Sends a prompt request to the API.
   * @param id The ID for the prompt request
   * @param prompt The prompt message
   * @param extraInstruction Optional additional instructions
   * @returns Observable with the server's response
   */
  prompt(
    assistantId: string,
    prompt: string,
    extraInstruction?: string
  ): Observable<any> {
    return this.sendPrompt(assistantId, prompt, extraInstruction);
  }
}
