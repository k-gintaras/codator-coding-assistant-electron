import { Component } from '@angular/core';
import { routeHelper } from '../../../app.routes';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navigation-library',
  imports: [RouterLink],
  templateUrl: './navigation-library.component.html',
  styleUrl: './navigation-library.component.scss',
})
export class NavigationLibraryComponent {
  r = routeHelper;
}
