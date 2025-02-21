import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);

// const originalWarn = console.warn;
// const originalError = console.error;
// const originalLog = console.log;

// console.log = (...args) => {
//   if (args[0]?.includes('zone.js')) {
//     return;
//   }
//   originalLog(...args);
// };

// console.warn = (...args) => {
//   if (args[0]?.includes('zone.js')) {
//     return;
//   }
//   originalWarn(...args);
// };

// console.error = (...args) => {
//   if (args[0]?.includes('zone.js')) {
//     return;
//   }
//   originalError(...args);
// };
