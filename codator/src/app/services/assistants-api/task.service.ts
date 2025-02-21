import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { take, lastValueFrom } from 'rxjs';
import { ASSISTANT_API_CONFIG } from '../../app.constants';
import { AssistantsApiResponse, getId } from '../../interfaces/response.model';
import { WarnService } from '../warn.service';

export interface Task {
  id: string;
  description: string;
  assignedAssistant: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  inputData?: string | null;
  outputData?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = ASSISTANT_API_CONFIG.baseUrl;

  constructor(private http: HttpClient, private warnService: WarnService) {}

  /** ✅ **Get Task by ID** */
  async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(`${this.apiUrl}/task/${taskId}`)
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return (r?.data as Task) ?? null;
    } catch (error) {
      this.handleError(error, `Error fetching task ID: ${taskId}`);
      return null;
    }
  }

  /** ✅ **Get All Tasks** */
  async getAllTasks(): Promise<Task[]> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(`${this.apiUrl}/task/`)
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return Array.isArray(r?.data) ? (r.data as Task[]) : [];
    } catch (error) {
      this.handleError(error, `Error fetching all tasks`);
      return [];
    }
  }

  /** ✅ **Add a Task** */
  async addTask(
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string | undefined> {
    try {
      const o = this.http
        .post<AssistantsApiResponse>(`${this.apiUrl}/task/`, task)
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return getId(r);
    } catch (error) {
      this.handleError(error, `Error creating task`);
      return undefined;
    }
  }

  /** ✅ **Update a Task** */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<boolean> {
    try {
      const o = this.http
        .put<AssistantsApiResponse>(`${this.apiUrl}/task/${taskId}`, updates)
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(error, `Error updating task ID: ${taskId}`);
      return false;
    }
  }

  /** ✅ **Delete a Task** */
  async deleteTask(taskId: string): Promise<boolean> {
    try {
      const o = this.http
        .delete<AssistantsApiResponse>(`${this.apiUrl}/task/${taskId}`)
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(error, `Error deleting task ID: ${taskId}`);
      return false;
    }
  }

  /** ✅ **Get Tasks by Status** */
  async getTasksByStatus(status: Task['status']): Promise<Task[]> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(`${this.apiUrl}/task/status/${status}`)
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return Array.isArray(r?.data) ? (r.data as Task[]) : [];
    } catch (error) {
      this.handleError(error, `Error fetching tasks with status: ${status}`);
      return [];
    }
  }

  /** ✅ **Get Tasks by Assigned Assistant** */
  async getTasksByAssistant(assistantId: string): Promise<Task[]> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(
          `${this.apiUrl}/task/assistant/${assistantId}`
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return Array.isArray(r?.data) ? (r.data as Task[]) : [];
    } catch (error) {
      this.handleError(
        error,
        `Error fetching tasks for assistant ID: ${assistantId}`
      );
      return [];
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
