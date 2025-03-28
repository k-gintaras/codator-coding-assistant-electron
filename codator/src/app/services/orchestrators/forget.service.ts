import { Injectable } from '@angular/core';
import { OrchestratorService } from '../assistants-api/orchestrator.service';

@Injectable({
  providedIn: 'root',
})
export class ForgetService {
  constructor(private orchestrator: OrchestratorService) {}

  async forget(assistantId: string, memoryId: string) {
    await this.orchestrator.forget(assistantId, memoryId);
  }
}
