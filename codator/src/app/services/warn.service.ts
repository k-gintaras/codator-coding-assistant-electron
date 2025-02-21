import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class WarnService {
  constructor(private snackBar: MatSnackBar) {}

  /**
   * Displays a warning message via Snackbar.
   * @param msg - The message to display
   * @param options - Optional configurations for logging and error handling
   */
  warn(msg: string | Error): void {
    // Display the snackbar
    this.snackBar.open(msg.toString(), 'Close', {
      duration: 3000, // Snackbar duration in ms
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['warn-snackbar'], // Custom styling
    });

    // If it's an Error object, use its stack trace
    if (msg instanceof Error) {
      console.error('Error: ');
      console.error(msg);
    } else {
      console.log('Warning: ');
      console.log(msg);
    }
  }
}
