import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  map,
  take,
  lastValueFrom,
  of,
} from 'rxjs';
import { ASSISTANT_API_CONFIG } from '../../app.constants';
import { WarnService } from '../warn.service';
import { AssistantsApiResponse } from '../../interfaces/response.model';
import { Assistant, AssistantFull } from '../assistants-api/assistant.service';

@Injectable({
  providedIn: 'root',
})
export class AssistantService {
  private apiUrl =
    ASSISTANT_API_CONFIG.baseUrl + ASSISTANT_API_CONFIG.assistantUrl; // Base API URL
  private selectedAssistantSubject = new BehaviorSubject<Assistant | null>(
    null
  ); // To store selected assistant
  selectedAssistant$ = this.selectedAssistantSubject.asObservable(); // Observable to subscribe to

  constructor(private http: HttpClient, private warnService: WarnService) {}

  // Get all assistants
  getAllAssistants(): Observable<{ data: Assistant[] }> {
    try {
      return this.http.get<{ data: Assistant[] }>(`${this.apiUrl}/`);
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        // this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error deleting owned memory');
      }
      const empty: Assistant[] = [];
      return of({ data: empty });
    }
  }

  // Get a specific assistant by id
  getAssistantById(id: string): Observable<{ data: Assistant } | null> {
    try {
      return this.http.get<{ data: Assistant }>(`${this.apiUrl}/${id}`);
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error deleting owned memory');
      }
      return of(null);
    }
  }

  // Get assistant details by id
  getFullAssistantById(id: string): Observable<AssistantFull | undefined> {
    try {
      return this.http
        .get<{
          status: string;
          message: string;
          data: AssistantFull | undefined;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          error: any | undefined;
        }>(`${this.apiUrl}/details/${id}`)
        .pipe(map((response) => response.data));
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        // this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error deleting owned memory');
      }
      return of(undefined);
    }
  }

  async getFullAssistantByIdPromise(
    id: string
  ): Promise<AssistantFull | undefined> {
    try {
      const o = this.http
        .get<{
          status: string;
          message: string;
          data: AssistantFull | undefined;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          error: any | undefined;
        }>(`${this.apiUrl}/details/${id}`)
        .pipe(map((response) => response.data))
        .pipe(take(1));
      const r = await lastValueFrom(o); // Converts the observable to a promise
      return r;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        // this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error deleting owned memory');
      }
      return undefined;
    }
  }

  // Create a new assistant with simple data (name, instructions)
  createSimpleAssistant(
    name: string,
    instructions: string
  ): Observable<Assistant | null> {
    try {
      return this.http.post<Assistant>(`${this.apiUrl}/simple`, {
        name,
        instructions,
      });
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error deleting owned memory');
      }
      return of(null);
    }
  }

  // Create a new assistant with detailed data (name, type, model, instructions)
  createAssistant(a: Assistant): Observable<Assistant | null> {
    try {
      return this.http.post<Assistant>(`${this.apiUrl}/`, a);
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error deleting owned memory');
      }
      return of(null);
    }
  }

  // Update assistant data by id
  updateAssistant(a: Assistant): Observable<Assistant | null> {
    try {
      return this.http.put<Assistant>(`${this.apiUrl}/${a.id}`, a);
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error deleting owned memory');
      }
      return of(null);
    }
  }

  async updateAssistantPromise(a: Assistant): Promise<Assistant | null> {
    try {
      const o = this.http
        .put<Assistant>(`${this.apiUrl}/${a.id}`, a)
        .pipe(take(1));
      return await lastValueFrom(o);
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error deleting owned memory');
      }
      return null;
    }
  }

  // Delete an assistant by id
  deleteAssistant(id: string): Observable<AssistantsApiResponse | undefined> {
    try {
      const r: Observable<AssistantsApiResponse | undefined> =
        this.http.delete<AssistantsApiResponse>(`${this.apiUrl}/${id}`);
      return r;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.warnService.warn(error.error.message);
      } else {
        this.warnService.warn('Error deleting owned memory');
      }
      return of(undefined);
    }
  }

  // Get the currently selected assistant
  getSelectedAssistant(): Assistant | null {
    return this.selectedAssistantSubject.getValue();
  }

  // Select an assistant
  selectAssistant(assistant: Assistant): void {
    this.selectedAssistantSubject.next(assistant);
  }
}
