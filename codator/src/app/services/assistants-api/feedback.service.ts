import { Injectable } from '@angular/core';
import { ASSISTANT_API_CONFIG } from '../../app.constants';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom, take } from 'rxjs';
import { WarnService } from '../warn.service';
import { AssistantsApiResponse, getId } from '../../interfaces/response.model';

export interface Feedback {
  id: string; // Unique identifier
  targetId: string; // Target entity ID
  targetType: 'assistant' | 'memory' | 'task'; // Target type
  rating: number; // 1-5 stars
  comments?: string; // Optional comments
  createdAt: Date; // Created timestamp
  updatedAt: Date; // Updated timestamp
}

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private apiUrl = ASSISTANT_API_CONFIG.baseUrl;

  constructor(private http: HttpClient, private warnService: WarnService) {}

  /** ✅ **Create New Feedback** */
  async createFeedback(feedback: Feedback): Promise<string | undefined> {
    try {
      const o = this.http
        .post<AssistantsApiResponse | undefined>(
          `${this.apiUrl}/feedback/`,
          feedback
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return getId(r);
    } catch (error) {
      this.handleError(error, 'Error adding feedback');
      return undefined;
    }
  }

  /** ✅ **Get Feedback by ID** */
  async getFeedbackById(id: string): Promise<Feedback | undefined> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(`${this.apiUrl}/feedback/${id}`)
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return r?.data as Feedback;
    } catch (error) {
      this.handleError(error, `Error fetching feedback with ID: ${id}`);
      return undefined;
    }
  }

  /** ✅ **Get All Feedback for a Target (assistant, memory, task)** */
  async getFeedbackByTarget(
    targetId: string,
    targetType: 'assistant' | 'memory' | 'task'
  ): Promise<Feedback[]> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(
          `${this.apiUrl}/feedback/target/${targetId}/${targetType}`
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return Array.isArray(r?.data) ? (r.data as Feedback[]) : [];
    } catch (error) {
      this.handleError(
        error,
        `Error fetching feedback for ${targetType} with ID: ${targetId}`
      );
      return [];
    }
  }

  /** ✅ **Update Feedback** */
  async updateFeedback(
    id: string,
    updates: Partial<Omit<Feedback, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<boolean> {
    try {
      const o = this.http
        .put<AssistantsApiResponse | undefined>(
          `${this.apiUrl}/feedback/${id}`,
          updates
        )
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(error, `Error updating feedback with ID: ${id}`);
      return false;
    }
  }

  /** ✅ **Delete Feedback** */
  async deleteFeedback(id: string): Promise<boolean> {
    try {
      const o = this.http
        .delete<AssistantsApiResponse | undefined>(
          `${this.apiUrl}/feedback/${id}`
        )
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(error, `Error deleting feedback with ID: ${id}`);
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
