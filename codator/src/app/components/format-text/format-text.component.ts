import { Component, Input } from '@angular/core';
import { marked } from 'marked';
// import showdown from 'showdown';
// import { Remarkable } from 'remarkable';

@Component({
  selector: 'app-format-text',
  imports: [],
  templateUrl: './format-text.component.html',
  styleUrl: './format-text.component.scss',
})
export class FormatTextComponent {
  @Input() rawText = ''; // Receiving raw text input

  // Process raw text and format it for display
  get formattedText() {
    const htmlContent = marked(this.rawText);
    // const converter = new showdown.Converter();
    // const htmlContent = converter.makeHtml(this.rawText);
    // const md = new Remarkable();
    // const htmlContent = md.render(this.rawText);

    // const htmlContent = this.formatText(this.rawText);
    return htmlContent;
  }

  private formatText(text: string): string {
    // Step 1: Convert newlines into <br> elements
    text = text.replace(/\n/g, '<br>');

    // Step 2: Handle multi-spaces or tabs
    text = text.replace(
      /\s{2,}/g,
      (match) => `<span class="whitespace-pre">${match}</span>`
    );

    // Step 3: Convert bullet lists (starting with * or -)
    text = text.replace(/^(?:\*|-)\s*(.*)$/gm, '<ul><li>$1</li></ul>');

    // Step 4: Convert numbered lists (starting with 1., 2., etc.)
    text = text.replace(/^\d+\.\s*(.*)$/gm, '<ol><li>$1</li></ol>');

    // Step 5: Convert text to paragraphs
    text = text.replace(/(.*?)(<br>|\n)/g, '<p class="text-white">$1</p>');

    return text;
  }
}
