import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom, take } from 'rxjs';
import { ASSISTANT_API_CONFIG } from '../../app.constants';
import { WarnService } from '../warn.service';

/** 📌 **Relationship Graph Interfaces** */
export interface Relationship {
  id: string;
  type: 'assistant' | 'memory' | 'task';
  targetId: string;
  relationshipType:
    | 'related_to'
    | 'part_of'
    | 'example_of'
    | 'derived_from'
    | 'depends_on'
    | 'blocks'
    | 'subtask_of';
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class RelationshipGraphService {
  private apiUrl = `${ASSISTANT_API_CONFIG.baseUrl}/relationship-graph`;

  constructor(private http: HttpClient, private warnService: WarnService) {}

  /** ✅ **Get All Relationships** */
  async getAllRelationships(): Promise<Relationship[]> {
    try {
      const o = this.http
        .get<{ status: string; data: Relationship[] }>(this.apiUrl)
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return r?.data ?? [];
    } catch (error) {
      this.handleError(error, 'Error fetching all relationships');
      return [];
    }
  }

  /** ✅ **Get Relationships by Source (Target ID)** */
  async getRelationshipsBySource(id: string): Promise<Relationship[]> {
    try {
      const o = this.http
        .get<{ status: string; data: Relationship[] }>(
          `${this.apiUrl}/source/${id}`
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      console.log('r');
      console.log(r);
      return r?.data ?? [];
    } catch (error) {
      this.handleError(
        error,
        `Error fetching relationships for target ID: ${id}`
      );
      return [];
    }
  }

  /** ✅ **Get Relationships by Source & Type** */
  async getRelationshipsBySourceAndType(
    targetId: string,
    relationshipType: string
  ): Promise<Relationship[]> {
    try {
      const o = this.http
        .get<{ status: string; data: Relationship[] }>(
          `${this.apiUrl}/source/${targetId}/${relationshipType}`
        )
        .pipe(take(1));

      const r = await lastValueFrom(o);
      return r?.data ?? [];
    } catch (error) {
      this.handleError(
        error,
        `Error fetching relationships of type '${relationshipType}' for target ID: ${targetId}`
      );
      return [];
    }
  }

  /** ✅ **Add a Relationship** */
  async addRelationship(
    id: string,
    type: 'assistant' | 'memory' | 'task',
    targetId: string,
    relationshipType:
      | 'related_to'
      | 'part_of'
      | 'example_of'
      | 'derived_from'
      | 'depends_on'
      | 'blocks'
      | 'subtask_of'
  ): Promise<string | null> {
    try {
      const o = this.http
        .post<{ status: string; data: { id: string } }>(this.apiUrl, {
          id,
          type,
          targetId,
          relationshipType,
        })
        .pipe(take(1));

      console.log('??? ', id, type, targetId, relationshipType);

      const r = await lastValueFrom(o);
      console.log(r);
      return r?.data?.id ?? null;
    } catch (error) {
      this.handleError(error, 'Error creating relationship');
      return null;
    }
  }

  /** ✅ **Update a Relationship** */
  async updateRelationship(
    id: string,
    updates: Partial<Relationship>
  ): Promise<boolean> {
    try {
      const o = this.http
        .put<{ status: string }>(`${this.apiUrl}/${id}`, updates)
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(error, `Error updating relationship with ID: ${id}`);
      return false;
    }
  }

  /** ✅ **Delete a Relationship** */
  async deleteRelationship(id: string): Promise<boolean> {
    try {
      const o = this.http
        .delete<{ status: string }>(`${this.apiUrl}/${id}`)
        .pipe(take(1));

      await lastValueFrom(o);
      return true;
    } catch (error) {
      this.handleError(error, `Error deleting relationship with ID: ${id}`);
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
