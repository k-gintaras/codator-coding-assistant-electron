import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { take, catchError, map } from 'rxjs/operators';
import { WarnService } from './warn.service'; // Assuming WarnService is used for error handling
import { AssistantsApiResponse, getId } from '../interfaces/response.model';
import { ASSISTANT_API_CONFIG } from '../app.constants';
import { Tag } from './assistants-api/tag.service';

@Injectable({
  providedIn: 'root',
})
export class TagOLDService {
  private apiUrl = ASSISTANT_API_CONFIG.baseUrl; // Base API URL

  // BehaviorSubject to store tags
  private tagsSubject = new BehaviorSubject<Tag[]>([]);
  tags$ = this.tagsSubject.asObservable();

  constructor(private http: HttpClient, private warnService: WarnService) {}

  // Add a new tag
  addTag(tagName: string): Observable<string | undefined> {
    return this.http
      .post<AssistantsApiResponse>(`${this.apiUrl}/tag`, { name: tagName })
      .pipe(
        take(1),
        catchError((error: HttpErrorResponse) => {
          this.warnService.warn(error.error.message);
          throw error;
        }),
        map((r) => getId(r))
      );
  }

  // Get all tags
  getAllTags(): Observable<Tag[] | null> {
    return this.http.get<AssistantsApiResponse>(`${this.apiUrl}/tag`).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        this.warnService.warn(error.error.message);
        throw error;
      }),
      map((r) => (Array.isArray(r?.data) ? (r.data as Tag[]) : [])) // Ensure response.data is cast to Tag[]
    );
  }

  // Remove a tag
  removeTag(tagId: string): Observable<boolean> {
    return this.http
      .delete<AssistantsApiResponse>(`${this.apiUrl}/tag/${tagId}`)
      .pipe(
        take(1),
        catchError((error: HttpErrorResponse) => {
          this.warnService.warn(error.error.message);
          throw error;
        }),
        map((response) => response.status === 'success')
      );
  }

  // Update a tag
  updateTag(tagId: string, newName: string): Observable<boolean> {
    return this.http
      .put<AssistantsApiResponse>(`${this.apiUrl}/tag/${tagId}`, {
        name: newName,
      })
      .pipe(
        take(1),
        catchError((error: HttpErrorResponse) => {
          this.warnService.warn(error.error.message);
          throw error;
        }),
        map((response) => response.status === 'success')
      );
  }

  // Get a tag by its ID
  getTagById(tagId: string): Observable<Tag | null> {
    return this.http
      .get<AssistantsApiResponse>(`${this.apiUrl}/tag/${tagId}`)
      .pipe(
        take(1),
        catchError((error: HttpErrorResponse) => {
          this.warnService.warn(error.error.message);
          throw error;
        }),
        map((response) => response.data as Tag) // Ensure response.data is cast to Tag
      );
  }

  // Get tags associated with a specific entity
  getTagsByEntity(entityType: string, entityId: string): Observable<Tag[]> {
    return this.http
      .get<AssistantsApiResponse>(
        `${this.apiUrl}/tag-extra/${entityType}/${entityId}`
      )
      .pipe(
        take(1),
        catchError((error: HttpErrorResponse) => {
          // this.warnService.warn(error.error.message); // useless spam really, there is no tags, no problem
          throw error;
        }),
        map((response) => (response.data as Tag[]) || []) // Return empty array if no tags found
      );
  }

  // Add a tag to an entity
  addTagNameToEntity(
    tagNames: string,
    entityId: string,
    type: string
  ): Observable<boolean> {
    return this.addTagToEntity(type, entityId, tagNames, true);
  }

  addTagNamesToEntity(
    tagNames: string[],
    entityId: string,
    type: string
  ): Observable<boolean> {
    const n = tagNames
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .join(',');
    return this.addTagToEntity(type, entityId, n, true);
  }

  addTagIdToEntity(
    tagId: string,
    entityId: string,
    type: string
  ): Observable<boolean> {
    return this.addTagToEntity(type, entityId, tagId, false);
  }

  addTagIdsToEntity(
    tagIds: string[],
    entityId: string,
    type: string
  ): Observable<boolean> {
    const ids = tagIds
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .join(',');
    return this.addTagToEntity(type, entityId, ids, false);
  }

  addTagToEntity(
    entityType: string,
    entityId: string,
    tagIdOrString: string,
    isNames: boolean
  ): Observable<boolean> {
    return this.http
      .post<AssistantsApiResponse>(
        `${this.apiUrl}/tag-extra/${entityType}/${entityId}/${tagIdOrString}/${isNames}`,
        {}
      )
      .pipe(
        take(1),
        catchError((error: HttpErrorResponse) => {
          this.warnService.warn(error.error.message);
          throw error;
        }),
        map((response) => response.status === 'success') // Check if the operation succeeded
      );
  }

  // Remove a tag from an entity
  removeTagFromEntity(
    entityType: string,
    entityId: string,
    tagId: string
  ): Observable<boolean> {
    return this.http
      .delete<AssistantsApiResponse>(
        `${this.apiUrl}/tag-extra/${entityType}/${entityId}/${tagId}`
      )
      .pipe(
        take(1),
        catchError((error: HttpErrorResponse) => {
          this.warnService.warn(error.error.message);
          throw error;
        }),
        map((response) => response.status === 'success') // Check if the operation succeeded
      );
  }
}
