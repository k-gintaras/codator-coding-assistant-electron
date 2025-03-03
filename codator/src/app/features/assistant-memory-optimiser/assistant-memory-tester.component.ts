import { Component, Input, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import {
  AssistantFull,
  AssistantService,
} from '../../services/assistants-api/assistant.service';
import { WarnService } from '../../services/warn.service';
import {
  AssistantTestReport,
  AssistantMemoryTesterService,
} from './assistant-memory-tester.service';

@Component({
  selector: 'app-assistant-memory-tester',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatCardModule,
    MatButtonModule,
    RouterModule,
  ],
  template: `
    <div class="max-w-4xl mx-auto p-6 bg-slate-700 rounded-lg shadow-lg my-6">
      <h2 class="text-2xl font-bold mb-4 text-center">
        Assistant Memory Testing
      </h2>

      <div *ngIf="!assistant && !assistantId()" class="mb-4">
        <p class="text-gray-300 mb-2">Select an assistant to test:</p>
        <select
          [(ngModel)]="selectedAssistantId"
          (change)="loadAssistant()"
          class="select select-bordered w-full"
        >
          <option [value]="''">Select an assistant</option>
          <option *ngFor="let a of availableAssistants" [value]="a.id">
            {{ a.name }}
          </option>
        </select>
      </div>

      <div *ngIf="assistant" class="mb-6">
        <h3 class="text-xl font-bold mb-2">Testing: {{ assistant.name }}</h3>
        <p class="text-gray-300 mb-4">
          This tool will test how well your assistant can recall its memories.
        </p>

        <div class="stats shadow mb-4 w-full">
          <div class="stat">
            <div class="stat-title">Total Memories</div>
            <div class="stat-value">
              {{ assistant.focusedMemories.length || 0 }}
            </div>
          </div>

          <div *ngIf="testReport" class="stat">
            <div class="stat-title">Chat Recall Rate</div>
            <div class="stat-value">
              {{ (testReport.summary.chatRecallRate * 100).toFixed(0) }}%
            </div>
          </div>

          <div *ngIf="testReport" class="stat">
            <div class="stat-title">Max Effective Chat Memories</div>
            <div class="stat-value">
              {{ testReport.summary.maxEffectiveChatMemories }}
            </div>
          </div>

          <div
            *ngIf="testReport && testReport.summary.totalInstructionsTested > 0"
            class="stat"
          >
            <div class="stat-title">Instruction Compliance</div>
            <div class="stat-value">
              {{
                (testReport.summary.instructionComplianceRate * 100).toFixed(0)
              }}%
            </div>
          </div>
        </div>

        <button
          (click)="runTest()"
          class="btn btn-primary w-full"
          [disabled]="isTesting || !assistant.focusedMemories.length"
        >
          <span *ngIf="!isTesting">Run Memory Test</span>
          <span *ngIf="isTesting" class="flex items-center">
            <span class="loading loading-spinner loading-sm mr-2"></span>
            Testing...
          </span>
        </button>

        <p
          *ngIf="!assistant.focusedMemories?.length"
          class="text-yellow-400 text-sm mt-2"
        >
          This assistant has no focused memories to test.
        </p>
      </div>

      <!-- Test Results -->
      <div *ngIf="testReport" class="mt-6">
        <h3 class="text-xl font-bold mb-4">Test Results</h3>

        <!-- Recommendations -->
        <div class="bg-blue-900 p-4 rounded-lg mb-6">
          <h4 class="text-lg font-bold mb-2">Recommendations</h4>
          <ul class="list-disc pl-5 space-y-1">
            <li *ngFor="let rec of testReport.summary.recommendations">
              {{ rec }}
            </li>
          </ul>
        </div>

        <!-- Individual Memory Results -->
        <!-- With this: -->
        <div *ngIf="testReport.chatMemoryResults.length > 0" class="mb-6">
          <h4 class="text-lg font-bold mb-2">Chat Memory Tests</h4>

          <div class="accordion">
            <mat-accordion>
              <mat-expansion-panel
                *ngFor="let result of testReport.chatMemoryResults"
              >
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <span
                      [ngClass]="{
                        'text-green-400': result.recallSuccess,
                        'text-red-400': !result.recallSuccess
                      }"
                    >
                      {{ truncateText(result.memoryDescription, 40) }}
                    </span>
                  </mat-panel-title>
                  <mat-panel-description>
                    {{ result.recallSuccess ? '✓ Recalled' : '✗ Not recalled' }}
                  </mat-panel-description>
                </mat-expansion-panel-header>

                <div class="p-4">
                  <h5 class="font-bold">Prompt:</h5>
                  <p class="mb-4 text-gray-300">{{ result.prompt }}</p>

                  <h5 class="font-bold">Response:</h5>
                  <p class="text-gray-300">{{ result.response }}</p>
                </div>
              </mat-expansion-panel>
            </mat-accordion>
          </div>
        </div>

        <div *ngIf="testReport.instructionResults.length > 0" class="mb-6">
          <h4 class="text-lg font-bold mb-2">Instruction Memory Tests</h4>

          <div class="accordion">
            <mat-accordion>
              <mat-expansion-panel
                *ngFor="let result of testReport.instructionResults"
              >
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <span
                      [ngClass]="{
                        'text-green-400': result.recallSuccess,
                        'text-red-400': !result.recallSuccess
                      }"
                    >
                      {{ truncateText(result.memoryDescription, 40) }}
                    </span>
                  </mat-panel-title>
                  <mat-panel-description>
                    {{ result.recallSuccess ? '✓ Followed' : '✗ Not followed' }}
                    ({{ (result.complianceScore * 100).toFixed(0) }}%)
                  </mat-panel-description>
                </mat-expansion-panel-header>

                <div class="p-4">
                  <h5 class="font-bold">Prompt:</h5>
                  <p class="mb-4 text-gray-300">{{ result.prompt }}</p>

                  <h5 class="font-bold">Response:</h5>
                  <p class="text-gray-300">{{ result.response }}</p>
                </div>
              </mat-expansion-panel>
            </mat-accordion>
          </div>
        </div>

        <!-- Multiple Memory Tests -->
        <div *ngIf="testReport.multipleMemoryResults.length > 0">
          <h4 class="text-lg font-bold mb-2">Multiple Memory Tests</h4>

          <div class="accordion">
            <mat-accordion>
              <mat-expansion-panel
                *ngFor="let result of testReport.multipleMemoryResults"
              >
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <span
                      [ngClass]="{
                        'text-green-400': result.recallSuccess,
                        'text-red-400': !result.recallSuccess
                      }"
                    >
                      {{ result.memoriesIncluded.length }} Memories Test
                    </span>
                  </mat-panel-title>
                  <mat-panel-description>
                    {{
                      result.recallSuccess
                        ? '✓ All recalled'
                        : '✗ Some not recalled'
                    }}
                  </mat-panel-description>
                </mat-expansion-panel-header>

                <div class="p-4">
                  <h5 class="font-bold">Memories Tested:</h5>
                  <ul class="list-disc pl-5 mb-4">
                    <li
                      *ngFor="let memory of result.memoriesIncluded"
                      class="text-gray-300"
                    >
                      {{
                        truncateText(memory.description || 'No description', 60)
                      }}
                    </li>
                  </ul>

                  <h5 class="font-bold">Prompt:</h5>
                  <p class="mb-4 text-gray-300">{{ result.prompt }}</p>

                  <h5 class="font-bold">Response:</h5>
                  <p class="text-gray-300">{{ result.response }}</p>
                </div>
              </mat-expansion-panel>
            </mat-accordion>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .accordion mat-expansion-panel {
        margin-bottom: 8px;
        background-color: #2d3748;
        color: white;
      }

      .stats {
        background-color: #374151;
        color: white;
      }

      .stat-title {
        color: #cbd5e0;
      }
    `,
  ],
})
export class AssistantMemoryTesterComponent implements OnInit {
  readonly assistantId = input<string | null>(null);
  @Input() assistant: AssistantFull | null = null;

  availableAssistants: { id: string; name: string }[] = [];
  selectedAssistantId = '';

  testReport: AssistantTestReport | null = null;
  isTesting = false;

  constructor(
    private testerService: AssistantMemoryTesterService,
    private assistantService: AssistantService,
    private warnService: WarnService
  ) {}

  ngOnInit(): void {
    this.loadAvailableAssistants();

    // Subscribe to testing status updates
    this.testerService.isTesting$.subscribe(
      (isTesting) => (this.isTesting = isTesting)
    );

    // Subscribe to test results
    this.testerService.testResults$.subscribe((results) => {
      if (results) {
        this.testReport = results;
      }
    });

    // If assistantId is provided, load the assistant
    const assistantId = this.assistantId();
    if (assistantId) {
      this.selectedAssistantId = assistantId;
      this.loadAssistant();
    }
  }

  loadAvailableAssistants(): void {
    this.assistantService.getAllAssistants().then(
      (response) => {
        this.availableAssistants = (response || []).map((a) => ({
          id: a.id,
          name: a.name,
        }));
      },
      (error) => {
        this.warnService.warn('Error loading assistants');
        console.error('Error loading assistants:', error);
      }
    );
  }

  loadAssistant(): void {
    if (!this.selectedAssistantId) return;

    this.assistantService
      .getAssistantWithDetailsById(this.selectedAssistantId)
      .then(
        (assistant:AssistantFull|null) => {
          if (assistant) {
            this.assistant = assistant;
            // Reset test report when switching assistants
            this.testReport = null;
          } else {
            this.warnService.warn('Assistant not found');
          }
        },
        (error) => {
          this.warnService.warn('Error loading assistant details');
          console.error('Error loading assistant details:', error);
        }
      );
  }

  runTest(): void {
    if (!this.assistant) return;

    this.testerService
      .runMemoryTest(this.assistant.id)
      .then((report) => {
        console.log('Test completed:', report);
      })
      .catch((error) => {
        this.warnService.warn('Error running memory test');
        console.error('Error running memory test:', error);
      });
  }

  truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length <= maxLength
      ? text
      : text.substring(0, maxLength) + '...';
  }
}
