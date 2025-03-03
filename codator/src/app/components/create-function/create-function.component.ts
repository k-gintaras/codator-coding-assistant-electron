import { Component, OnInit } from '@angular/core';
import { FunctionScript } from '../../interfaces/function-script.interface';
import { FunctionLibraryService } from '../../services/function-library.service';
import { FormsModule } from '@angular/forms';
import { CodingComponent } from '../chat/coding/coding.component';
import { NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router'; // For route params

@Component({
  standalone: true,
  imports: [CodingComponent, FormsModule, NgIf],
  selector: 'app-create-function',
  templateUrl: './create-function.component.html',
  styleUrls: ['./create-function.component.scss'],
})
export class CreateFunctionComponent implements OnInit {
  functionScript: FunctionScript = {
    id: '',
    name: '',
    code: `
    function wordReplacer(text) {
      return text.replace(/good/g, 'great');
    }
    return wordReplacer(text);
  `,
    description: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  statusMessage: string | null = null;

  constructor(
    private functionLibraryService: FunctionLibraryService,
    private route: ActivatedRoute // For accessing route params
  ) {
    this.route.paramMap.subscribe((params) => {
      this.functionScript.id = params.get('id') || ''; // Get the 'id' from the URL
      if (!this.functionScript.id) {
        // Handle the case when there's no id
        console.log('No ID provided, creating new function');
      }
    });
  }

  ngOnInit(): void {
    // Check if there's an ID in the route (for editing an existing function)
    this.route.params.subscribe((params) => {
      const functionId = params['id'];
      if (functionId) {
        this.loadFunction(functionId); // Load the function for editing
      }
    });
  }

  loadFunction(functionId: string): void {
    this.functionLibraryService.get(functionId).then((functionScript) => {
      if (functionScript) {
        this.functionScript = functionScript;
      } else {
        this.statusMessage = 'Function not found.';
      }
    });
  }

  onSubmit(): void {
    if (this.functionScript.name && this.functionScript.code) {
      const saveOrUpdate = this.functionScript.id
        ? this.functionLibraryService.update(
            this.functionScript.id,
            this.functionScript
          ) // Update existing function
        : this.functionLibraryService.save(this.functionScript); // Save new function

      saveOrUpdate.then((success) => {
        this.statusMessage = success
          ? `Function ${
              this.functionScript.id ? 'updated' : 'saved'
            } successfully!`
          : 'Failed to save or update the function.';
      });
    }
  }

  onCodeChange(output: string): void {
    this.functionScript.code = output;
  }
}
