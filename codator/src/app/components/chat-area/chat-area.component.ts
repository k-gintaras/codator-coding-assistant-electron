import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // <-- Import this
import { CommonModule } from '@angular/common';
import { ChatMessagesComponent } from '../chat-messages/chat-messages.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';

@Component({
  selector: 'app-chat-area',
  imports: [
    CommonModule,
    FormsModule,
    ChatMessagesComponent,
    ChatInputComponent,
  ],
  templateUrl: './chat-area.component.html',
  styleUrls: ['./chat-area.component.scss'],
})
export class ChatAreaComponent {}
