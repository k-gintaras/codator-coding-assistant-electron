import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../../services/assistants-services/message.service';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { Message } from '../../interfaces/assistant.model';
import { InputService } from '../../services/assistants-services/input.service';
import { CodeDetectionService } from '../../services/code-detection.service';
import { CodeComponent } from '../code/code.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-chat-messages',
  imports: [FormsModule, NgFor, NgClass, NgIf, CodeComponent],
  templateUrl: './chat-messages.component.html',
  styleUrls: ['./chat-messages.component.scss'],
})
export class ChatMessagesComponent implements OnInit {
  messages: Message[] = [];
  isLoading = false;
  showAllMessages = false;
  urlAssistantId: string | null = null;

  constructor(
    private messageService: MessageService,
    private inputService: InputService,
    private codeDetectionService: CodeDetectionService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const routeId = params.get('id');
      if (!routeId) return;
      this.urlAssistantId = routeId;
      this.loadAssistantMessages();
    });

    // Subscribe to message changes
    this.messageService.messages$.subscribe((messages) => {
      if (this.urlAssistantId) {
        this.loadAssistantMessages();
      } else {
        this.messages = this.processMessages(messages);
      }
    });

    // Subscribe to loading state
    this.messageService.isLoading$.subscribe((isLoading) => {
      this.isLoading = isLoading;
    });
  }

  loadAssistantMessages() {
    if (!this.urlAssistantId) return;
    const assistantMessages = this.messageService.getMessagesByAssistant(
      this.urlAssistantId
    );

    const logMessages = this.messageService.getLogMessages();
    this.messages = this.processMessages([
      ...assistantMessages,
      ...logMessages,
    ]);
  }

  deleteMessage() {
    throw new Error('not implemented');
  }

  editMessage(str: string) {
    this.inputService.setRequestEditInput(str);
  }

  rememberMessage() {
    throw new Error('not implemented');
  }

  getMessagesToShow() {
    if (this.showAllMessages) {
      return this.messages;
    }
    if (this.messages.length < 3) {
      return this.messages;
    }
    return [
      this.messages[this.messages.length - 2],
      this.messages[this.messages.length - 1],
    ];
  }

  // Process the messages to separate code and text into distinct message objects
  processMessages(messages: Message[]): Message[] {
    const processedMessages: Message[] = [];

    messages.forEach((message) => {
      const sections = this.getCodeAndText(message.content);

      if (sections) {
        sections.forEach((section) => {
          if (section.text) {
            processedMessages.push({
              ...message,
              content: section.text,
              type: message.type,
            });
          }
          if (section.code) {
            processedMessages.push({
              ...message,
              content: section.code,
              type:
                message.type === 'request' ? 'request-code' : 'response-code',
            });
          }
        });
      } else {
        processedMessages.push(message); // If no code, just push the original message
      }
    });

    return processedMessages;
  }

  // Extract code from message
  getCodeAndText(message: string): { text: string; code: string }[] | null {
    return this.codeDetectionService.extractCodeAndText(message);
  }
}
