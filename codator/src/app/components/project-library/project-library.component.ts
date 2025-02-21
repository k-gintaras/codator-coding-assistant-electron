import { NgFor } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-project-library',
  imports: [NgFor],
  templateUrl: './project-library.component.html',
  styleUrl: './project-library.component.scss',
})
export class ProjectLibraryComponent {
  projects: { id: string; name: string }[] = [{ id: 'qq', name: 'pewpew' }];
}
