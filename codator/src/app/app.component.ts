import { Component, OnInit } from '@angular/core';
import { CodatorComponent } from './components/codator/codator.component';
import { MessageService } from './services/assistants-services/message.service';
import { TEST_RESPONSE_FOR_CODE } from './test-other/response.test';
import { APP_STATE } from './app.constants';

@Component({
  selector: 'app-root',
  imports: [CodatorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'codator';
  testing = APP_STATE.testing;

  constructor(private messageService: MessageService) {
    console.log('App component loaded');
  }

  ngOnInit() {
    if (this.testing) {
      console.log('Testing mode enabled');
      this.loadTestMessage();
    }
  }
  loadTestMessage() {
    // test
    this.messageService.addLogMessage({
      content: TEST_RESPONSE_FOR_CODE,
      type: 'response',
      id: '',
      owner: '',
      timestamp: '',
    });
    this.messageService.setLoading(false);
  }
}
