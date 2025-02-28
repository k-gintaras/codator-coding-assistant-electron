// src/app/config/api.config.ts

import {
  trigger,
  transition,
  animate,
  keyframes,
  style,
} from '@angular/animations';

export const ASSISTANT_API_CONFIG = {
  baseUrl: 'http://192.168.1.182:3001',
  assistantUrl: '/assistant',
  feedbackUrl: '/feedback',
  memoryUrl: '/memory',
  taskUrl: '/task',
  relationshipGraphUrl: '/relationship-graph',
  tagUrl: '/tag',
  promptUrl: '/prompt',
};

export const APP_STATE = {
  testing: false,
};

/**
 * this is used to separate different ideas in one prompt, often it is # or ### or ... or <3
 */
export const PROMPT_SEPARATOR = '...\n###\n🤍 Consider: ';
export const PROMPT_INTRO = 'Please: ';

export const ANIMATIONS = {
  shake: trigger('shake', [
    transition(':enter', [
      animate(
        '0.5s',
        keyframes([
          style({ transform: 'translateX(0)', offset: 0 }),
          style({ transform: 'translateX(-10px)', offset: 0.25 }),
          style({ transform: 'translateX(10px)', offset: 0.5 }),
          style({ transform: 'translateX(-10px)', offset: 0.75 }),
          style({ transform: 'translateX(0)', offset: 1 }),
        ])
      ),
    ]),
  ]),
};
