import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { take, lastValueFrom } from 'rxjs';
import { ASSISTANT_API_CONFIG } from '../../app.constants';
import { AssistantsApiResponse, getId } from '../../interfaces/response.model';
import { WarnService } from '../warn.service';

export interface Tag {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class TagService {
  private apiUrl = ASSISTANT_API_CONFIG.baseUrl;

  constructor(private http: HttpClient, private warnService: WarnService) {}

  /** ✅ **Get Tag by ID** */
  async getTagById(tagId: string): Promise<Tag | null> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(`${this.apiUrl}/tag/${tagId}`)
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return (r?.data as Tag) ?? null;
    } catch (error) {
      this.handleError(error, `Error fetching tag ID: ${tagId}`);
      return null;
    }
  }

  /** ✅ **Get All Tags** */
  async getAllTags(): Promise<Tag[]> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(`${this.apiUrl}/tag/`)
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return Array.isArray(r?.data) ? (r.data as Tag[]) : [];
    } catch (error) {
      this.handleError(error, `Error fetching all tags`);
      return [];
    }
  }

  /** ✅ **Add a Tag** */
  async addTag(name: string): Promise<string | undefined> {
    try {
      const o = this.http
        .post<AssistantsApiResponse>(`${this.apiUrl}/tag/`, { name })
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return getId(r);
    } catch (error) {
      this.handleError(error, `Error creating tag: ${name}`);
      return undefined;
    }
  }

  /** ✅ **Update a Tag** */
  async updateTag(tagId: string, name: string): Promise<boolean> {
    try {
      const o = this.http
        .put<AssistantsApiResponse>(`${this.apiUrl}/tag/${tagId}`, { name })
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(error, `Error updating tag ID: ${tagId}`);
      return false;
    }
  }

  /** ✅ **Delete a Tag** */
  async deleteTag(tagId: string): Promise<boolean> {
    try {
      const o = this.http
        .delete<AssistantsApiResponse>(`${this.apiUrl}/tag/${tagId}`)
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(error, `Error deleting tag ID: ${tagId}`);
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
