import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InputService {
  private promptInputSubject = new BehaviorSubject<string>(''); // To track loading state
  promptInput$ = this.promptInputSubject.asObservable(); // Observable for loading state

  private correctionInputSubject = new BehaviorSubject<string>(''); // To track loading state
  correctionInput$ = this.correctionInputSubject.asObservable(); // Observable for loading state

  private correctionOutputSubject = new BehaviorSubject<string>(''); // To track loading state
  correctionOutput$ = this.correctionOutputSubject.asObservable(); // Observable for loading state

  // New subject to handle edit requests
  private requestEditInputSubject = new BehaviorSubject<string>(''); // Request to edit input
  requestEditInput$ = this.requestEditInputSubject.asObservable();

  setPromptInput(str: string) {
    this.promptInputSubject.next(str);
  }

  // Only update if the value has changed to avoid unnecessary loops
  setCorrectionInput(correction: string) {
    if (correction !== this.correctionInputSubject.getValue()) {
      this.correctionInputSubject.next(correction);
    }
  }

  // Only update if the value has changed to avoid unnecessary loops
  setCorrectionOutput(correction: string) {
    if (correction !== this.correctionOutputSubject.getValue()) {
      this.correctionOutputSubject.next(correction);
    }
  }

  // Method to set the new edit input
  setRequestEditInput(newInput: string) {
    if (newInput !== this.requestEditInputSubject.getValue()) {
      this.requestEditInputSubject.next(newInput);
    }
  }

  getPromptInputObservable() {
    return this.promptInput$;
  }

  getCorrectionInputObservable() {
    return this.correctionInput$;
  }

  getCorrectionOutputObservable() {
    return this.correctionInput$;
  }

  getRequestEditObservable() {
    return this.correctionInput$;
  }

  getPromptInput() {
    return this.promptInputSubject.getValue();
  }

  getCorrectionInput() {
    return this.correctionInputSubject.getValue();
  }

  getCorrectionOutput() {
    return this.correctionInputSubject.getValue();
  }

  getRequestEditInput() {
    return this.requestEditInputSubject.getValue();
  }
}
