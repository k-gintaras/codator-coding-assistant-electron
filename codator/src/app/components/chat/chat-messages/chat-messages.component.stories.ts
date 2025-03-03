import { MessageService } from '../../../services/assistants-services/message.service';
import { ChatMessagesComponent } from './chat-messages.component';
import { of } from 'rxjs';

import { NoopAnimationsModule } from '@angular/platform-browser/animations'; // Disable animations for simplicity
import { FormsModule } from '@angular/forms';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { Meta, moduleMetadata, StoryFn } from '@storybook/angular';

// Mock Service
class MockMessageService {
  messages$ = of([
    {
      type: 'request',
      content: 'What is the best way to improve project management?',
      timestamp: new Date().toISOString(),
    },
    {
      type: 'response',
      content: 'One effective way is to use Agile methodology...',
      timestamp: new Date().toISOString(),
    },
    {
      type: 'request',
      content: 'What tools should I use for managing tasks?',
      timestamp: new Date().toISOString(),
    },
    {
      type: 'response',
      content: 'One effective way is to use Agile methodology...',
      timestamp: new Date().toISOString(),
    },
    {
      type: 'request',
      content: 'What tools should I use for managing tasks?',
      timestamp: new Date().toISOString(),
    },
    {
      type: 'response',
      content: 'One effective way is to use Agile methodology...',
      timestamp: new Date().toISOString(),
    },
    {
      type: 'request',
      content: 'What tools should I use for managing tasks?',
      timestamp: new Date().toISOString(),
    },
  ]);
  isLoading$ = of(false); // Assume not loading for now, can switch to `true` to simulate loading state
}

// Story Configuration
export default {
  title: 'Components/ChatMessages',
  component: ChatMessagesComponent,
  decorators: [
    moduleMetadata({
      imports: [FormsModule, NgClass, NgFor, NgIf, NoopAnimationsModule], // Include necessary imports
      providers: [
        { provide: MessageService, useClass: MockMessageService }, // Provide the mock service
      ],
    }),
  ],
} as Meta<ChatMessagesComponent>;

// Story Template
const Template: StoryFn<ChatMessagesComponent> = (args) => ({
  component: ChatMessagesComponent,
  props: args,
});

// Default Story (with mock messages)
export const Default = Template.bind({});
Default.args = {};

// Loading State Story (simulating loading state)
export const Loading = Template.bind({});
Loading.args = {
  isLoading: true,
};
