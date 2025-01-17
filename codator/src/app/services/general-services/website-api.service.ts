import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiStrategy } from '../../interfaces/api.strategy.interface';

@Injectable({
  providedIn: 'root',
})
export class WebsiteApiService implements ApiStrategy {
  constructor(private http: HttpClient) {}

  async processText(input: string): Promise<string> {
    // TODO: or some other way to process text ONLINE...
    const result = await this.http
      .post<{ result: string }>(
        'https://<firebase-function-url>/process-text',
        { input }
      )
      .toPromise();
    if (!result) return '';
    return result.result;
  }
}
