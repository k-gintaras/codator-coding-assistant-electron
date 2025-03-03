import { Component, Input, SimpleChanges, OnChanges } from '@angular/core';
import hljs, { HighlightOptions } from 'highlight.js';
import 'highlight.js/styles/github.css'; // Optional theme

@Component({
  selector: 'app-code',
  standalone: true,

  imports: [],
  templateUrl: './code.component.html',
  styleUrls: ['./code.component.scss'],
})
export class CodeComponent implements OnChanges {
  @Input() code: string | null = ''; // Input code passed from parent component

  formattedCode = '';
  language = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['code']) {
      this.formattedCode = this.formatCode(this.code);
    }
  }

  // Optional: format JSON or JavaScript code
  formatCode(code: string | null): string {
    if (!code) return '';

    // Check if the first line contains a language identifier
    const codeLines = code.split('\n');
    const firstLine = codeLines[0].trim().toLowerCase();

    // If the first line is a language (e.g., "typescript", "python")
    const supportedLanguages = [
      'typescript',
      'python',
      'javascript',
      'html',
      'css',
    ];

    if (supportedLanguages.includes(firstLine)) {
      // Set the detected language and remove the first line
      this.language = firstLine;
      codeLines.shift(); // Remove the first line (language identifier)
    }

    // Join the remaining lines as the actual code
    const codeWithoutLanguage = codeLines.join('\n');

    // Return formatted code (if necessary)
    const formatted = this.formatCodeContent(codeWithoutLanguage);
    return formatted;
  }

  private formatCodeContent(code: string): string {
    try {
      const language = this.language || 'typescript';
      const options: HighlightOptions = { language: language };
      const html = hljs.highlight(code, options).value; // Highlight for TypeScript
      return html;
    } catch {
      // If not JSON, just return the raw code
      return code;
    }
  }
}
