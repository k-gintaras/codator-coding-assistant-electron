import { Routes } from '@angular/router';
import { ChatAreaComponent } from './components/chat-area/chat-area.component';
import { CreateFunctionComponent } from './components/create-function/create-function.component';
import { EditAssistantComponent } from './components/edit-assistant/edit-assistant.component';
import { EditMemoryComponent } from './components/edit-memory/edit-memory.component';
import { AssistantMemoryTesterComponent } from './features/assistant-memory-tester.component';

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
];
