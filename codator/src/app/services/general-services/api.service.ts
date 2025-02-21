import { Injectable } from '@angular/core';
import { ApiStrategy } from '../../interfaces/api.strategy.interface';

@Injectable({
  providedIn: 'root',
})
export class ApiService implements ApiStrategy {
  async processText(input: string): Promise<string> {
    return input;
  }
}
