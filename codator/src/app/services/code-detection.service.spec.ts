import { TestBed } from '@angular/core/testing';
import { CodeDetectionService } from './code-detection.service';

describe('CodeDetectionService', () => {
  let service: CodeDetectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CodeDetectionService);
  });

  it('should extract code and text correctly', () => {
    const message =
      'Some text before code ```javascript\nconsole.log("Hello World");\n``` more text ```json\n{"key": "value"}\n``` after text';

    const result = service.extractCodeAndText(message);

    expect(result.length).toBe(5);
    expect(result).toEqual([
      { text: 'Some text before code', code: '' },
      { text: '', code: 'console.log("Hello World");' },
      { text: 'more text', code: '' },
      { text: '', code: '{"key": "value"}' },
      { text: 'after text', code: '' },
    ]);
  });

  it('should handle content with only text', () => {
    const message = 'This is just some plain text, no code.';
    const result = service.extractCodeAndText(message);
    expect(result).toEqual([
      { text: 'This is just some plain text, no code.', code: '' },
    ]);
  });

  it('should handle content with only code blocks', () => {
    const message = '```javascript\nconsole.log("Hello World");\n```';
    const result = service.extractCodeAndText(message);
    expect(result).toEqual([{ text: '', code: 'console.log("Hello World");' }]);
  });

  it('should handle empty input', () => {
    const message = '';
    const result = service.extractCodeAndText(message);
    expect(result).toEqual([]);
  });

  it('should return empty code and text if no match found', () => {
    const message = 'Just some random characters!';
    const result = service.extractCodeAndText(message);
    expect(result).toEqual([
      { text: 'Just some random characters!', code: '' },
    ]);
  });
});
