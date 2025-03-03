import { NgIf } from '@angular/common';
import { Component, Input, OnChanges, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Component({
  standalone: true,
  imports: [NgIf],
  selector: 'app-format-text',
  templateUrl: './format-text.component.html',
  styleUrls: ['./format-text.component.scss'],
  encapsulation: ViewEncapsulation.None, // Disable Angular's Shadow DOM scoping
})
export class FormatTextComponent implements OnChanges {
  @Input() rawText = '';
  formattedText: SafeHtml | null = null;

  constructor(private sanitizer: DomSanitizer) {
    if (!sanitizer) {
      throw new Error('DomSanitizer is not initialized.');
    }
  }

  async ngOnChanges() {
    if (!this.rawText.trim()) {
      this.formattedText = null;
      return;
    }

    try {
      // Ensure marked.parse() is awaited properly
      const html = await marked.parse(this.rawText);
      this.formattedText = this.sanitizer.bypassSecurityTrustHtml(html);
    } catch (error) {
      console.error('Error processing markdown:', error);
      this.formattedText = null; // Fallback to avoid breaking the UI
    }
  }
}
