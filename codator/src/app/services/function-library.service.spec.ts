import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MemoryService } from './memory.service';
import { FunctionLibraryService } from './function-library.service';
import { FunctionScript } from '../interfaces/function-script.interface';

describe('FunctionLibraryService', () => {
  let service: FunctionLibraryService;
  let memoryService: jasmine.SpyObj<MemoryService>;

  beforeEach(() => {
    const memoryServiceSpy = jasmine.createSpyObj('MemoryService', [
      'createMemory',
      'updateTagsForMemory',
      'getMemoriesByTags',
      'getMemory',
      'updateMemory',
      'deleteMemory',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        FunctionLibraryService,
        { provide: MemoryService, useValue: memoryServiceSpy },
      ],
    });

    service = TestBed.inject(FunctionLibraryService);
    memoryService = TestBed.inject(
      MemoryService
    ) as jasmine.SpyObj<MemoryService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('save()', () => {
    it('should save a function script and associate it with a "function" tag', async () => {
      const script: FunctionScript = {
        name: 'Test Function',
        description: 'Description',
        code: 'console.log("test");',
        id: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      memoryService.createMemory.and.returnValue(Promise.resolve('123'));
      memoryService.updateTagsForMemory.and.returnValue(Promise.resolve(true));

      const result = await service.save(script);

      expect(result).toBe(true);
      expect(memoryService.createMemory).toHaveBeenCalledWith({
        id: '',
        type: 'knowledge',
        description: 'Test Function:Description',
        data: { data: 'console.log("test");' }, // Expecting an object with function code inside
        createdAt: null,
        updatedAt: null,
      });
      expect(memoryService.updateTagsForMemory).toHaveBeenCalledWith('123', [
        'function',
      ]);
    });

    it('should return false if creating memory fails', async () => {
      const script: FunctionScript = {
        name: 'Test Function',
        description: 'Description',
        code: 'console.log("test");',
        id: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      memoryService.createMemory.and.returnValue(Promise.resolve(''));
      memoryService.updateTagsForMemory.and.returnValue(Promise.resolve(true));

      const result = await service.save(script);

      expect(result).toBe(false);
    });
  });

  describe('getAllFunctions()', () => {
    it('should retrieve all functions associated with the "function" tag', async () => {
      const memories: Memory[] = [
        {
          id: '123',
          type: 'knowledge',
          description: 'Test Function:Description',
          data: { data: 'console.log("test");' }, // Expecting an object with function code inside
          createdAt: new Date('2022-01-01T00:00:00Z'),
          updatedAt: new Date('2022-01-01T01:00:00Z'),
        },
      ];

      memoryService.getMemoriesByTags.and.returnValue(
        Promise.resolve(memories)
      );

      const functions = await service.getAllFunctions();

      expect(functions.length).toBe(1);
      expect(functions[0].name).toBe('Test Function');
      expect(functions[0].description).toBe('Description');
    });
  });

  describe('get()', () => {
    it('should retrieve a specific function by id', async () => {
      const memory: Memory = {
        id: '123',
        type: 'knowledge',
        description: 'Test Function:Description',
        data: { data: 'console.log("test");' }, // Expecting an object with function code inside
        createdAt: new Date('2022-01-01T00:00:00Z'),
        updatedAt: new Date('2022-01-01T01:00:00Z'),
      };

      memoryService.getMemory.and.returnValue(Promise.resolve(memory));

      const fn = await service.get('123');

      expect(fn).toEqual({
        id: '123',
        name: 'Test Function',
        description: 'Description',
        code: 'console.log("test");',
        createdAt: new Date('2022-01-01T00:00:00Z'),
        updatedAt: new Date('2022-01-01T01:00:00Z'),
      });
    });

    it('should return null if function is not found', async () => {
      memoryService.getMemory.and.returnValue(Promise.resolve(null));

      const fn = await service.get('999');

      expect(fn).toBeNull();
    });
  });

  describe('update()', () => {
    it('should update an existing function memory', async () => {
      const updatedScript: FunctionScript = {
        id: '123',
        name: 'Updated Function',
        description: 'Updated Description',
        code: 'console.log("updated");',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      memoryService.updateMemory.and.returnValue(Promise.resolve(true));

      const result = await service.update('123', updatedScript);

      expect(result).toBe(true);
      expect(memoryService.updateMemory).toHaveBeenCalledWith({
        id: '123',
        type: 'knowledge',
        description: 'Updated Function:Updated Description',
        data: { data: 'console.log("updated");' }, // Expecting an object with function code inside
        createdAt: null,
        updatedAt: null,
      });
    });
  });

  describe('delete()', () => {
    it('should delete a function memory by id', async () => {
      memoryService.deleteMemory.and.returnValue(Promise.resolve(true));

      const result = await service.delete('123');

      expect(result).toBe(true);
      expect(memoryService.deleteMemory).toHaveBeenCalledWith('123');
    });
  });
});
