import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CodingInputComponent } from '../coding-input/coding-input.component';
import { AssistantService } from '../../services/assistants-services/assistant.service';
import { InputService } from '../../services/assistants-services/input.service';
import { NgClass } from '@angular/common';
import { MemoryService } from '../../services/memory.service';
import { ActivatedRoute } from '@angular/router';
import { PromptMessageService } from '../../services/prompt-message.service';
import { PROMPT_SEPARATOR } from '../../app.constants';
import { TextSize } from '../../interfaces/gpt-api.model';
import {
  Assistant,
  AssistantFull,
} from '../../services/assistants-api/assistant.service';
import { WarnService } from '../../services/warn.service';

@Component({
  selector: 'app-chat-input',
  imports: [FormsModule, CodingInputComponent, NgClass],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.scss',
})
export class ChatInputComponent {
  @Input() assistant: Assistant | null = null;
  assistantFull: AssistantFull | null = null;
  userPrompt = '';
  correctionInput = '';
  useTempMemories = false;

  constructor(
    private promptMessageService: PromptMessageService,

    private inputService: InputService,
    private memoryService: MemoryService,
    private assistantService: AssistantService,
    private route: ActivatedRoute,
    private warnService: WarnService
  ) {
    // input assistant?
    if (!this.assistant) {
      // route assistant?
      this.route.paramMap.subscribe((params) => {
        const routeId = params.get('id');
        if (routeId) {
          // use route
          this.assistantService.getAssistantById(routeId).subscribe((a) => {
            if (!a) return;
            this.assistant = a.data;
            this.loadFullAssistant().then();
          });
        }
      });
    }

    this.inputService.getCorrectionInputObservable().subscribe((result) => {
      if (!result) return;
      this.correctionInput = result;
    });
  }

  async loadFullAssistant() {
    const a = await this.getFullAssistant();
    if (!a) return;
    this.assistantFull = a;
  }

  async getFullAssistant(): Promise<AssistantFull | null> {
    if (!this.assistant) return null;
    const a = await this.assistantService.getFullAssistantByIdPromise(
      this.assistant.id
    );
    return a || null;
  }

  async prompt() {
    if (!this.assistant?.name) return;
    if (this.userPrompt.length < 1) return;
    let prompt = this.userPrompt;
    const userCorrection = this.correctionInput;
    if (userCorrection && userCorrection.length > 0) {
      prompt += PROMPT_SEPARATOR + userCorrection;
    }
    this.inputService.setPromptInput(this.userPrompt);

    const expectedResponseSize: TextSize = 'page';
    await this.promptMessageService.sendPromptCustomized(
      this.assistant,
      prompt,
      this.useTempMemories,
      expectedResponseSize
    );
  }

  rememberForSession() {
    if (!this.assistantFull) return;
    this.memoryService.rememberForSession(
      this.assistantFull.id,
      this.correctionInput
    );
    this.useTempMemories = true;
  }

  async rememberForConversation() {
    const a = this.assistantFull;
    if (!a) return;

    const r = await this.memoryService.rememberForConversation(
      a,
      this.correctionInput
    );
    if (r) this.warnService.warn('Saved Memory As Conversation');
  }

  async saveAssistantInstructions() {
    const a = this.assistantFull;
    if (!a) return;

    const r = await this.memoryService.rememberAsInstructions(
      a,
      this.correctionInput
    );
    if (r) this.warnService.warn('Saved Memory As Instructions');
  }

  async saveForLaterUse() {
    const a = this.assistantFull;
    if (!a) return;

    const r = await this.memoryService.rememberForLater(
      a,
      this.correctionInput
    );

    if (r) this.warnService.warn('Saved Memory For Later Use');
  }
}
