import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // <-- Import this
import { CommonModule } from '@angular/common';
import { AssistantLibraryComponent } from '../libraries-navigation/assistant-library/assistant-library.component';
import { FunctionLibraryComponent } from '../libraries-navigation/function-library/function-library.component';
import { RouterOutlet } from '@angular/router';
import { MemoryLibraryComponent } from '../libraries-navigation/memory-library/memory-library.component';
import { NavigationLibraryComponent } from '../libraries-navigation/navigation-library/navigation-library.component';

@Component({
  selector: 'app-codator',
  imports: [
    CommonModule,
    FormsModule,
    AssistantLibraryComponent,
    FunctionLibraryComponent,
    MemoryLibraryComponent,
    RouterOutlet,
    NavigationLibraryComponent,
  ],
  templateUrl: './codator.component.html',
  styleUrl: './codator.component.scss',
})
export class CodatorComponent {}
