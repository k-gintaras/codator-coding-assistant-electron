import { Routes } from '@angular/router';
import { ChatAreaComponent } from './components/chat/chat-area/chat-area.component';
import { CreateFunctionComponent } from './components/create-function/create-function.component';
import { EditAssistantComponent } from './components/edit-assistant/edit-assistant.component';
import { EditMemoryComponent } from './components/memory/edit-memory/edit-memory.component';
import { AssistantMemoryTesterComponent } from './features/assistant-memory-optimiser/assistant-memory-tester.component';
import { AssistantPipelineComponent } from './components/assistants/assistant-pipeline/assistant-pipeline.component';
import { AssistantImprovementComponent } from './components/assistants/assistant-improvement/assistant-improvement.component';
import { MemoryBrainManagementComponent } from './components/assistants/memory-brain-management/memory-brain-management.component';

export const routes: Routes = [
  { path: '', component: ChatAreaComponent },
  { path: 'chat', component: ChatAreaComponent },
  // assistants
  { path: 'chat-assistant/:id', component: ChatAreaComponent },
  { path: 'edit-assistant/:id', component: EditAssistantComponent },
  { path: 'create-assistant', component: EditAssistantComponent },
  { path: 'edit-assistant', component: EditAssistantComponent },
  // functions
  { path: 'edit-function/:id', component: CreateFunctionComponent },
  { path: 'create-function', component: CreateFunctionComponent },
  // memories
  { path: 'edit-memory/:id', component: EditMemoryComponent },
  { path: 'create-memory', component: EditMemoryComponent },
  // memory testing
  {
    path: 'test-assistant-memory/:id',
    component: AssistantMemoryTesterComponent,
  },
  { path: 'test-assistant-memory', component: AssistantMemoryTesterComponent },
  { path: 'pipeline', component: AssistantPipelineComponent },
  { path: 'improvement', component: AssistantImprovementComponent },
  { path: 'assistant-brain/:id', component: MemoryBrainManagementComponent },
  { path: 'assistant-brain', component: MemoryBrainManagementComponent },
];

export const routeHelper = {
  // assistants chats
  chat: () => '/chat',
  chatAssistant: (id: string) => `/chat-assistant/${id}`,
  editAssistant: (id: string) => `/edit-assistant/${id}`,
  createAssistant: () => `/create-assistant`,
  // functions
  editFunction: (id: string) => `/edit-function/${id}`,
  createFunction: () => `/create-function`,
  // memories
  editMemory: (id: string) => `/edit-memory/${id}`,
  createMemory: () => `/create-memory`,
  // memory testing
  testAssistantMemory: (id: string) => `/test-assistant-memory/${id}`,
  testAssistantsMemory: () => `/test-assistant-memory`,
  // connecting assistants and running
  pipeline: () => `/pipeline`,
  // using feedback to improve
  improvement: () => `/improvement`,
  assistantBrains: () => `/assistant-brain`,
};
