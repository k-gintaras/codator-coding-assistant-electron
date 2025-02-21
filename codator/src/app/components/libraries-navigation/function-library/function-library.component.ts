import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FunctionLibraryService } from '../../../services/function-library.service';
import { FunctionScript } from '../../../interfaces/function-script.interface';
import { NgFor } from '@angular/common';
import { TextProcessingService } from '../../../services/text-processing.service';

@Component({
  selector: 'app-function-library',
  imports: [RouterLink, NgFor],
  templateUrl: './function-library.component.html',
  styleUrl: './function-library.component.scss',
})
export class FunctionLibraryComponent {
  functionLibrary: FunctionScript[] = [];

  constructor(
    private functionLibraryService: FunctionLibraryService,
    private textProcessingService: TextProcessingService,
    private router: Router
  ) {
    this.functionLibraryService.getAllFunctions().then((result) => {
      this.functionLibrary = result;
    });
  }

  navigateToFunction(id: string): void {
    this.router.navigate([`/edit-function`, id], { replaceUrl: true });
  }

  async handleTextProcessing(f: FunctionScript) {
    try {
      await this.textProcessingService.processCorrectionInput(f);
    } catch (error) {
      console.error('Text processing failed:', error);
    }
  }
}
