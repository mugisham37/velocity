import { DatabaseService } from '@kiro/database';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemService } from './item.service';

describe('ItemService - Simple Test', () => {
  let service: ItemService;
  let mockDb: any;

  beforeEach(async () => {
    const mockDbService = {
      query: {
        items: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn(),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemService,
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = module.get<ItemService>(ItemService);
    mockDb = module.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
