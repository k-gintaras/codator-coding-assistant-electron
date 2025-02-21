import { Injectable } from '@angular/core';
import { FunctionScript } from '../interfaces/function-script.interface';
import { MemoryService } from './memory.service';
import { HttpClient } from '@angular/common/http';
import { Memory } from './assistants-api/memory.service';

@Injectable({
  providedIn: 'root',
})
export class FunctionLibraryService {
  constructor(private memoryService: MemoryService, private http: HttpClient) {}

  // Save function script to memory and associate it with the "function" tag
  async save(script: FunctionScript): Promise<boolean> {
    const d = { data: script.code || {} };

    const m: Memory = {
      id: '', // Automatically generated or assigned later
      type: 'knowledge', // The type of memory, can be customized
      description: script.name + ':' + (script.description || ''),
      data: d, // Store the script code in memory
      createdAt: null,
      updatedAt: null,
    };

    // Create the memory and associate with "function" tag
    const id = await this.memoryService.createMemory(m);
    if (!id) return false;

    const tagsAdded = await this.memoryService.updateTagsForMemory(id, [
      'function',
    ]);

    return tagsAdded;
  }

  async getAllFunctions(): Promise<FunctionScript[]> {
    const mt: Memory[] = await this.memoryService.getMemoriesByTags([
      'function',
    ]);
    const fn: FunctionScript[] = mt.map((memory: Memory) => {
      const descriptionData = memory.description?.split(':') || [
        'Unnamed',
        'No Description',
      ];

      const f: FunctionScript = {
        id: memory.id,
        name: descriptionData[0],
        description: descriptionData[1],
        code: memory.data.data, // Assuming 'data' contains the function code
        createdAt: memory.createdAt ? new Date(memory.createdAt) : new Date(),
        updatedAt: memory.updatedAt ? new Date(memory.updatedAt) : new Date(),
      };

      return f;
    });

    return fn;
  }

  // Get a specific function memory by ID
  async get(id: string): Promise<FunctionScript | null> {
    return this.memoryService.getMemory(id).then((memory) => {
      if (memory) {
        // Split the description into name and description
        const descriptionData = memory.description?.split(':') || [
          'Unnamed',
          'No Description',
        ];

        return {
          id: memory.id,
          name: descriptionData[0], // Name before the colon
          description: descriptionData[1], // Description after the colon
          code: memory.data.data,
          createdAt: memory.createdAt ? new Date(memory.createdAt) : new Date(),
          updatedAt: memory.updatedAt ? new Date(memory.updatedAt) : new Date(),
        };
      }
      return null;
    });
  }

  // Update an existing function memory (edit its code and description)
  async update(id: string, updatedScript: FunctionScript): Promise<boolean> {
    const d = { data: updatedScript.code || {} };
    const m: Memory = {
      id: id,
      type: 'knowledge',
      description: updatedScript.name + ':' + (updatedScript.description || ''),
      data: d,
      createdAt: null,
      updatedAt: null,
    };

    return this.memoryService.updateMemory(m);
  }

  // Delete a function memory by ID
  async delete(id: string): Promise<boolean> {
    return this.memoryService.deleteMemory(id);
  }
}
