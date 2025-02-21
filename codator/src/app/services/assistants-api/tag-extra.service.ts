import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { take, lastValueFrom } from 'rxjs';
import { ASSISTANT_API_CONFIG } from '../../app.constants';
import { AssistantsApiResponse } from '../../interfaces/response.model';
import { WarnService } from '../warn.service';
import { Tag } from './tag.service';

@Injectable({
  providedIn: 'root',
})
export class TagExtraService {
  private apiUrl = ASSISTANT_API_CONFIG.baseUrl;

  constructor(private http: HttpClient, private warnService: WarnService) {}

  /** ✅ **Get Tags by Entity** */
  async getTagsByEntity(
    entityId: string,
    entityType: 'memory' | 'assistant' | 'task'
  ): Promise<Tag[]> {
    try {
      const o = this.http
        .get<AssistantsApiResponse>(
          `${this.apiUrl}/tag-extra/${entityType}/${entityId}`
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return Array.isArray(r?.data) ? (r.data as Tag[]) : [];
    } catch (error) {
      this.handleError(
        error,
        `Error fetching tags for entity: ${entityType} ID: ${entityId}`
      );
      return [];
    }
  }

  /** ✅ **Add Tag to Entity (by ID)** */
  async addTagToEntity(
    entityId: string,
    tagId: string,
    entityType: 'memory' | 'assistant' | 'task'
  ): Promise<boolean> {
    try {
      const o = this.http
        .post<AssistantsApiResponse>(
          `${this.apiUrl}/tag-extra/${entityType}/${entityId}/${tagId}/false`,
          {}
        )
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(
        error,
        `Error adding tag ID: ${tagId} to entity: ${entityType} ID: ${entityId}`
      );
      return false;
    }
  }

  /** ✅ **Add Tag to Entity (by Name)** */
  async addTagNamesToEntity(
    entityId: string,
    tagNames: string[],
    entityType: 'memory' | 'assistant' | 'task'
  ): Promise<boolean> {
    try {
      const o = this.http
        .post<AssistantsApiResponse>(
          `${this.apiUrl}/tag-extra/${entityType}/${entityId}/${tagNames.join(
            ','
          )}/true`,
          {}
        )
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(
        error,
        `Error adding tags: ${tagNames.join(
          ','
        )} to entity: ${entityType} ID: ${entityId}`
      );
      return false;
    }
  }

  /** ✅ **Remove Tag from Entity** */
  async removeTagFromEntity(
    entityId: string,
    tagId: string,
    entityType: 'memory' | 'assistant' | 'task'
  ): Promise<boolean> {
    try {
      const o = this.http
        .delete<AssistantsApiResponse>(
          `${this.apiUrl}/tag-extra/${entityType}/${entityId}/${tagId}`
        )
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(
        error,
        `Error removing tag ID: ${tagId} from entity: ${entityType} ID: ${entityId}`
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
