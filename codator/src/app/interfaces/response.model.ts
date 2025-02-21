/* eslint-disable @typescript-eslint/no-explicit-any */
import { Feedback } from '../services/assistants-api/feedback.service';
import { MemoryFocusRule } from '../services/assistants-api/memory-rule.service';
import {
  AssistantEvaluation,
  AssistantSuggestion,
  TaskResponse,
} from '../services/assistants-api/orchestrator.service';
import { Task } from '../services/assistants-api/task.service';
import { Tag } from '../services/assistants-api/tag.service';
import { OrganizedMemories } from '../services/assistants-api/memory-extra.service';
import {
  Assistant,
  AssistantFull,
} from '../services/assistants-api/assistant.service';
import { Memory } from '../services/assistants-api/memory.service';

export interface AssistantsApiResponse {
  status: string;
  message: string;
  data:
    | { id: string }
    | Assistant
    | AssistantFull
    | OrganizedMemories
    | Memory
    | Tag
    | Task
    | Feedback
    | AssistantEvaluation
    | TaskResponse
    | string
    | Memory[]
    | Tag[]
    | Task[]
    | string[]
    | Feedback[]
    | MemoryFocusRule[]
    | AssistantSuggestion[]
    | null
    | undefined;
  error: any | undefined;
}

export function getId(r: any): string | undefined {
  const data = r?.data;
  if (!data) return undefined;
  // If data is defined and has an 'id' property, return it
  if (data && typeof data === 'object' && 'id' in data) {
    return data.id;
  }
  return undefined; // Return undefined if no 'id' exists
}
