import { Injectable, Inject } from '@angular/core';
import { API_STRATEGY } from '../../api-strategy-provider';
import { ApiStrategy } from '../../interfaces/api.strategy.interface';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(@Inject(API_STRATEGY) private strategy: ApiStrategy) {}

  processText(input: string): Promise<string> {
    return this.strategy.processText(input);
  }
}
