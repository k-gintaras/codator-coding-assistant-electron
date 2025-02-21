import { Component, Input, SimpleChanges, OnChanges } from '@angular/core';

@Component({
  selector: 'app-code',
  imports: [],
  templateUrl: './code.component.html',
  styleUrl: './code.component.scss',
})
export class CodeComponent implements OnChanges {
  @Input() code: string | null = ''; // Input code passed from parent component

  formattedCode = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['code']) {
      this.formattedCode = this.formatCode(this.code);

      console.log('[' + this.formattedCode + ']');
    }
  }

  // Optional: format JSON or JavaScript code
  formatCode(code: string | null): string {
    if (!code) return '';
    try {
      // Try parsing JSON for pretty print
      return JSON.stringify(JSON.parse(code), null, 2);
    } catch {
      // If not JSON, just return the raw code
      return code;
    }
  }
}
