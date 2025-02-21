import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputService } from '../../services/assistants-services/input.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-coding-input',
  imports: [FormsModule],
  templateUrl: './coding-input.component.html',
  styleUrl: './coding-input.component.scss',
})
export class CodingInputComponent implements OnDestroy {
  userCorrection = '';
  editRequestSubscription: Subscription;

  constructor(private inputService: InputService) {
    // Listen for new input requests
    this.editRequestSubscription =
      this.inputService.requestEditInput$.subscribe((newInput) => {
        if (newInput && newInput !== this.userCorrection) {
          // Only update if the new input is different
          this.userCorrection = newInput;
        }
      });
  }

  ngOnDestroy() {
    // Unsubscribe when the component is destroyed
    if (this.editRequestSubscription) {
      this.editRequestSubscription.unsubscribe();
    }
  }

  onCorrectionChange() {
    this.inputService.setCorrectionInput(this.userCorrection);
  }

  handleTab(event: KeyboardEvent) {
    const editor: HTMLTextAreaElement = event.target as HTMLTextAreaElement;

    // Handle the "Tab" key for indentation (inserting spaces)
    if (event.key === 'Tab') {
      event.preventDefault();

      const selectionStart = editor.selectionStart;
      const selectionEnd = editor.selectionEnd;

      const tab = '    '; // Define a constant tab (4 spaces)

      // Insert 4 spaces as a tab equivalent
      const value = editor.value;
      editor.value =
        value.substring(0, selectionStart) +
        tab +
        value.substring(selectionEnd);

      // Move the caret after the inserted tab
      editor.selectionStart = editor.selectionEnd = selectionStart + tab.length; // Move caret by 4 spaces
    }
  }

  handleEnter(event: KeyboardEvent) {
    const editor: HTMLTextAreaElement = event.target as HTMLTextAreaElement;

    // If the "Enter" key is pressed
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent the default Enter behavior

      const selectionStart = editor.selectionStart;
      const selectionEnd = editor.selectionEnd;
      const value = editor.value;

      const indent = this.getIndent(value, selectionStart);

      // Insert the new line with the same indentation as the current line
      const newLine = '\n' + indent; // New line with preserved indentation
      const newValue =
        value.substring(0, selectionStart) +
        newLine +
        value.substring(selectionEnd);

      // Update the textarea's value with the new line and move caret to the right position
      editor.value = newValue;
      editor.selectionStart = editor.selectionEnd =
        selectionStart + newLine.length; // Place the cursor after the indentation
    }
  }

  getIndent(input: string, selectionStart: number) {
    // Get the current line's indentation
    const currentLine = input.substring(0, selectionStart).split('\n').pop(); // Get the current line
    const indentMatch = currentLine?.match(/^(\s*)/); // Match leading spaces or tabs

    // Preserve indentation of the current line
    const indent = indentMatch ? indentMatch[1] : ''; // If there's no indentation, use an empty string
    return indent;
  }

  handleBracket(event: KeyboardEvent) {
    const editor: HTMLTextAreaElement = event.target as HTMLTextAreaElement;

    if (event.key === '{' || event.key === '(' || event.key === '[') {
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      const closingObject = this.closingChar(event.key);
      editor.value =
        editor.value.slice(0, start) +
        closingObject +
        editor.value.slice(start, editor.value.length);
      editor.selectionStart = start;
      editor.selectionEnd = end;
    }
  }

  handleKeys($event: KeyboardEvent) {
    // Preserve indentation of the current line
    this.handleTab($event);
    this.handleEnter($event);
    this.handleBracket($event);
    this.handleSnippets($event);
  }

  handleSnippets(e: KeyboardEvent) {
    // Trigger only on space key
    if (e.key === ' ') {
      const editor: HTMLTextAreaElement = e.target as HTMLTextAreaElement;
      const cursorPos = editor.selectionStart;

      // Get the word before the cursor
      const textBeforeCursor = editor.value.slice(0, cursorPos);
      const words = textBeforeCursor.split(/\s+/); // Split by spaces to get individual words
      const currentWord = words[words.length - 1]; // The word being typed

      const indent = this.getIndent(editor.value, editor.selectionStart);

      // Define a list of keywords and their snippets
      const snippets: Record<string, string> = {
        function: `function name() {\n  \n}`,
        for: `for (let i = 0; i < length; i++) {\n  \n${indent}}`,
        if: `if (condition) {\n  \n${indent}}`,
        try: `try {\n  \n${indent}} catch (error) {\n  \n${indent}}`,
        catch: `catch (error) {\n  \n${indent}}`,
      };

      // Check if the current word is in the snippets object
      if (snippets[currentWord]) {
        // Replace the current word with the full snippet
        const start = editor.selectionStart;
        const end = editor.selectionEnd;

        // Replace the word with the snippet
        editor.value =
          editor.value.slice(0, start - currentWord.length) + // Remove the word before the cursor
          snippets[currentWord] + // Insert the snippet
          editor.value.slice(end); // Keep the rest of the content

        // Move the cursor after the inserted snippet (just after the closing parenthesis)
        const snippetLength = snippets[currentWord].length;
        editor.selectionStart = editor.selectionEnd = start + snippetLength - 1; // Position cursor after snippet
      }
    }
  }

  closingChar(openingChar: string): string {
    if (openingChar === '{') return '}';
    if (openingChar === '(') return ')';
    if (openingChar === '[') return ']';
    return '';
  }
}
