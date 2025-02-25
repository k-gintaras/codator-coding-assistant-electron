import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../../services/assistants-services/message.service';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { Message } from '../../interfaces/assistant.model';
import { InputService } from '../../services/assistants-services/input.service';
import { CodeDetectionService } from '../../services/code-detection.service';
import { CodeComponent } from '../code/code.component';
import { ActivatedRoute } from '@angular/router';
import { FormatTextComponent } from '../format-text/format-text.component';
import { WarnService } from '../../services/warn.service';

@Component({
  standalone: true,
  selector: 'app-chat-messages',
  imports: [
    FormsModule,
    NgFor,
    NgClass,
    NgIf,
    CodeComponent,
    FormatTextComponent,
  ],
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
    private route: ActivatedRoute,
    private warningService: WarnService
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

  copyToClipboard(content: string): void {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    // Set the textarea value to the message content
    textarea.value = content;

    // Select the content of the textarea
    textarea.select();

    // Execute the copy command to copy the selected content
    document.execCommand('copy');

    // Remove the temporary textarea element
    document.body.removeChild(textarea);

    // Optional: Provide feedback that the content has been copied
    this.warningService.warn('Message copied to clipboard!');
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

  // Improved method to process the messages
  processMessages(messages: Message[]): Message[] {
    const processedMessages: Message[] = [];

    messages.forEach((message) => {
      const sections = this.extractCodeAndText(message.content);

      if (sections) {
        sections.forEach((section) => {
          if (section.text) {
            // If it's text, just add it as is
            processedMessages.push({
              ...message,
              content: section.text,
              type: message.type, // same type as original message
            });
          }
          if (section.code) {
            // If it's code, set the correct type ('request-code' or 'response-code')
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

  // Helper method to split code and text
  extractCodeAndText(content: string): { text: string; code: string }[] {
    const regex = /```([\s\S]*?)```|([^`]+)/g;
    const matches = [];
    let result;

    // This buffer will accumulate consecutive text blocks
    let currentText = '';

    while ((result = regex.exec(content)) !== null) {
      if (result[1]) {
        // It's a code block (between triple backticks)
        if (currentText) {
          matches.push({ text: currentText.trim(), code: '' });
          currentText = ''; // Reset the text buffer
        }
        matches.push({ text: '', code: result[1].trim() }); // Add the code block
      } else if (result[2]) {
        // It's regular text (not between backticks)
        currentText += result[2].trim() + ' '; // Accumulate text
      }
    }

    // If there's any remaining text after parsing
    if (currentText) {
      matches.push({ text: currentText.trim(), code: '' });
    }

    return matches;
  }

  // processMessages(messages: Message[]): Message[] {
  //   const processedMessages: Message[] = [];

  //   messages.forEach((message) => {
  //     const sections = this.getCodeAndText(message.content);

  //     if (sections) {
  //       let currentText = ''; // Buffer to accumulate text
  //       let currentCode = ''; // Buffer to accumulate code
  //       let hasText = false; // Flag to indicate if we are processing text or code

  //       sections.forEach((section) => {
  //         if (section.text) {
  //           currentText += section.text + ' '; // Accumulate text
  //           hasText = true;
  //         }
  //         if (section.code) {
  //           currentCode += section.code + '\n'; // Accumulate code
  //           hasText = false;
  //         }

  //         // If we have both accumulated text and code, process and reset
  //         if (hasText && currentCode) {
  //           processedMessages.push({
  //             ...message,
  //             content: currentText.trim(),
  //             type: message.type,
  //           });
  //           processedMessages.push({
  //             ...message,
  //             content: currentCode.trim(),
  //             type:
  //               message.type === 'request' ? 'request-code' : 'response-code',
  //           });
  //           currentText = '';
  //           currentCode = '';
  //           hasText = false;
  //         }
  //       });

  //       // If there is any remaining text or code after the loop, push it
  //       if (currentText.trim()) {
  //         processedMessages.push({
  //           ...message,
  //           content: currentText.trim(),
  //           type: message.type,
  //         });
  //       }

  //       if (currentCode.trim()) {
  //         processedMessages.push({
  //           ...message,
  //           content: currentCode.trim(),
  //           type: message.type === 'request' ? 'request-code' : 'response-code',
  //         });
  //       }
  //     } else {
  //       processedMessages.push(message); // If no code, just push the original message
  //     }
  //   });

  //   return processedMessages;
  // }

  // // Process the messages to separate code and text into distinct message objects
  // processMessages(messages: Message[]): Message[] {
  //   const processedMessages: Message[] = [];

  //   messages.forEach((message) => {
  //     const sections = this.getCodeAndText(message.content);

  //     if (sections) {
  //       sections.forEach((section) => {
  //         if (section.text) {
  //           processedMessages.push({
  //             ...message,
  //             content: section.text,
  //             type: message.type,
  //           });
  //         }
  //         if (section.code) {
  //           processedMessages.push({
  //             ...message,
  //             content: section.code,
  //             type:
  //               message.type === 'request' ? 'request-code' : 'response-code',
  //           });
  //         }
  //       });
  //     } else {
  //       processedMessages.push(message); // If no code, just push the original message
  //     }
  //   });

  //   return processedMessages;
  // }

  // Extract code from message
  getCodeAndText(message: string): { text: string; code: string }[] | null {
    return this.codeDetectionService.extractCodeAndText(message);
  }
}
