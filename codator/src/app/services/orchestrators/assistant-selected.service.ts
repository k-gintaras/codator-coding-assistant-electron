import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AssistantFull } from '../assistants-api/assistant.service';

/**
 * Holds the currently selected assistant for global access across services.
 */
@Injectable({
  providedIn: 'root',
})
export class SelectedAssistantService {
  private readonly _selectedAssistant$ =
    new BehaviorSubject<AssistantFull | null>(null);

  /** Observable stream for the currently selected assistant */
  readonly selectedAssistant$: Observable<AssistantFull | null> =
    this._selectedAssistant$.asObservable();

  /**
   * Sets the current assistant.
   * @param assistant AssistantFull object to set as active.
   */
  setAssistant(assistant: AssistantFull): void {
    this._selectedAssistant$.next(assistant);
  }

  /**
   * Returns the currently selected assistant (snapshot).
   */
  getSelectedAssistant(): AssistantFull | null {
    return this._selectedAssistant$.value;
  }

  /**
   * Returns the ID of the selected assistant, or null if none is selected.
   */
  getSelectedAssistantId(): string | null {
    return this._selectedAssistant$.value?.id ?? null;
  }

  /**
   * Clears the selected assistant.
   */
  clear(): void {
    this._selectedAssistant$.next(null);
  }
}
