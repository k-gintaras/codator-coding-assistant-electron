import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CodeDetectionService {
  // Extract both code and text from content (preserve text and code blocks)
  extractCodeAndText(content: string): { text: string; code: string }[] {
    // Regex to capture code blocks and text (not inside backticks)
    const regex = /```([a-zA-Z]*)\n([\s\S]*?)```|([^`]+)/g;
    const matches = [];
    let result;

    // Match code blocks and plain text
    while ((result = regex.exec(content)) !== null) {
      if (result[2]) {
        // If it's a code block (matched by the first part of the regex)
        matches.push({ text: '', code: result[2].trim() });
      } else if (result[3]) {
        // If it's plain text (matched by the last part of the regex)
        matches.push({ text: result[3].trim(), code: '' });
      }
    }

    // Filter out empty sections to ensure no extra empty entries are returned
    return matches.filter((section) => section.text || section.code);
  }
}
