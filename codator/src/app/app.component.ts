import { Component } from '@angular/core';
import { CodatorComponent } from './components/codator/codator.component';

@Component({
  selector: 'app-root',
  imports: [CodatorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'codator';
}
