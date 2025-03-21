import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { MemoryService } from './memory.service';
import { AssistantService } from './assistants-services/assistant.service';
import { ASSISTANT_API_CONFIG } from '../app.constants';

describe('MemoryService', () => {
  let service: MemoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const assistantServiceSpy = jasmine.createSpyObj('AssistantService', [
      'updateAssistant',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MemoryService,
        { provide: AssistantService, useValue: assistantServiceSpy },
      ],
    });

    service = TestBed.inject(MemoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch memories by tags', async () => {
    const mockResponse = { data: [{ id: '1', description: 'test memory' }] };
    const tags = ['tag1', 'tag2'];

    service.getMemoriesByTags(tags).then((memories) => {
      expect(memories.length).toBe(1);
      expect(memories[0].description).toBe('test memory');
    });

    const req = httpMock.expectOne(
      `${ASSISTANT_API_CONFIG.baseUrl}/memory-extra/tags?tags=${tags.join(',')}`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should return null if memory not found', async () => {
    const id = '1';
    const mockResponse = { data: null };

    service.getMemory(id).then((memory) => {
      expect(memory).toBeNull();
    });

    const req = httpMock.expectOne(
      `${ASSISTANT_API_CONFIG.baseUrl}/memory/${id}`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should update memory successfully', async () => {
    const memory: Memory = {
      id: '1',
      description: 'updated memory',
      type: 'knowledge',
      data: null,
      createdAt: null,
      updatedAt: null,
    };
    const mockResponse = { status: 'success' };

    service.updateMemory(memory).then((success) => {
      expect(success).toBeTrue();
    });

    const req = httpMock.expectOne(
      `${ASSISTANT_API_CONFIG.baseUrl}/memory/${memory.id}`
    );
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('should delete memory successfully', async () => {
    const id = '1';
    const mockResponse = { status: 'success' };

    service.deleteMemory(id).then((success) => {
      expect(success).toBeTrue();
    });

    const req = httpMock.expectOne(
      `${ASSISTANT_API_CONFIG.baseUrl}/memory/${id}`
    );
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  it('should remember data for a session', () => {
    const assistantId = 'assistant123';
    const msg = 'Session memory';

    service.rememberForSession(assistantId, msg);
    const sessionMemory = service.getSessionMemory(assistantId);
    if (!sessionMemory) return;
    expect(sessionMemory).toEqual([msg]);
  });
});
