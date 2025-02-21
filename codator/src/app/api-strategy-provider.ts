import { Injectable, InjectionToken } from '@angular/core';
import { environment } from '../environments/environment.electron';
import { ApiStrategy } from './interfaces/api.strategy.interface';
import { ElectronApiService } from './services/general-services/electron-api.service';
import { WebsiteApiService } from './services/general-services/website-api.service';
import { HttpClient } from '@angular/common/http';

export const API_STRATEGY = new InjectionToken<ApiStrategy>('API_STRATEGY');

@Injectable()
export class ApiStrategyProvider {
  private strategy: ApiStrategy;

  constructor(http: HttpClient) {
    this.strategy =
      environment.platform === 'electron'
        ? new ElectronApiService()
        : new WebsiteApiService(http);
  }

  getStrategy(): ApiStrategy {
    return this.strategy;
  }
}
