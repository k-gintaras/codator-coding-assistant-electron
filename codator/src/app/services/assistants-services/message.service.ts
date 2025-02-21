import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Message } from '../../interfaces/assistant.model';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private LOG_MESSAGE_ID = 'Log'; // ID for log messages
  private messagesSubject = new BehaviorSubject<Message[]>([]); // Observable for all messages
  messages$ = this.messagesSubject.asObservable(); // Expose messages as observable

  private isLoadingSubject = new BehaviorSubject<boolean>(false); // To track loading state
  isLoading$ = this.isLoadingSubject.asObservable(); // Observable for loading state

  private assistantMessagesMap = new Map<string, Message[]>(); // Store messages per assistant by ID

  setLoading(isLoading: boolean) {
    this.isLoadingSubject.next(isLoading); // Set loading state to false
  }

  // Fetch messages for a specific assistant by assistantId
  getMessagesByAssistant(assistantId: string): Message[] {
    return this.assistantMessagesMap.get(assistantId) || [];
  }

  getLogMessages(): Message[] {
    return this.assistantMessagesMap.get(this.LOG_MESSAGE_ID) || [];
  }

  // Fetch all messages regardless of assistant
  getAllMessages(): Message[] {
    return this.messagesSubject.value;
  }

  // Add a message (request/response) to history for a specific assistant
  addMessage(message: Message, assistantId: string): void {
    const currentMessages = this.assistantMessagesMap.get(assistantId) || [];
    this.assistantMessagesMap.set(assistantId, [...currentMessages, message]);
    this.messagesSubject.next([...this.messagesSubject.value, message]); // Also update global messages list
  }

  addLogMessage(message: Message): void {
    const currentMessages =
      this.assistantMessagesMap.get(this.LOG_MESSAGE_ID) || [];
    this.assistantMessagesMap.set(this.LOG_MESSAGE_ID, [
      ...currentMessages,
      message,
    ]);
    this.messagesSubject.next([...this.messagesSubject.value, message]); // Also update global messages list
  }

  getBasicMessage(msg: string, owner: string): Message {
    const m: Message = {
      id: this.generateMessageId(),
      type: 'request',
      owner: owner,
      content: msg,
      timestamp: new Date().toISOString(),
    };

    return m;
  }

  // Utility to generate unique message ID
  generateMessageId(): string {
    return Math.random().toString(36).substr(2, 9); // Simple ID generator
  }
}
