import { Test, TestingModule } from '@nestjs/testing';
import { WorkstationService } from './workstation.service';

describe('WorkstationService - Simple Tests', () => {
  let service: WorkstationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkstationService],
    }).compile();

    service = module.get<WorkstationService>(WorkstationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have createWorkstation method', () => {
    expect(service.createWorkstation).toBeDefined();
    expect(typeof service.createWorkstation).toBe('function');
  });

  it('should have updateWorkstation method', () => {
    expect(service.updateWorkstation).toBeDefined();
    expect(typeof service.updateWorkstation).toBe('function');
  });

  it('should have findWorkstationById method', () => {
    expect(service.findWorkstationById).toBeDefined();
    expect(typeof service.findWorkstationById).toBe('function');
  });

  it('should have findWorkstations method', () => {
    expect(service.findWorkstations).toBeDefined();
    expect(typeof service.findWorkstations).toBe('function');
  });

  it('should have getWorkstationCapacityInfo method', () => {
    expect(service.getWorkstationCapacityInfo).toBeDefined();
    expect(typeof service.getWorkstationCapacityInfo).toBe('function');
  });

  it('should have getWorkstationCostBreakdown method', () => {
    expect(service.getWorkstationCostBreakdown).toBeDefined();
    expect(typeof service.getWorkstationCostBreakdown).toBe('function');
  });

  it('should have deleteWorkstation method', () => {
    expect(service.deleteWorkstation).toBeDefined();
    expect(typeof service.deleteWorkstation).toBe('function');
  });

  it('should have getWorkstationsByCompany method', () => {
    expect(service.getWorkstationsByCompany).toBeDefined();
    expect(typeof service.getWorkstationsByCompany).toBe('function');
  });

  it('should have getWorkstationsByType method', () => {
    expect(service.getWorkstationsByType).toBeDefined();
    expect(typeof service.getWorkstationsByType).toBe('function');
  });
});
