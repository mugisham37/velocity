import { DatabaseService } from '@kiro/database';
import {
  CreateDepartmentDto,
  CreateDesignationDto,
  CreateEmployeeDocumentDto,
  CreateEmployeeDto,
  CreateEmployeeOnboardingDto,
  CreateOnboardingTemplateDto,
  UpdateEmployeeDto,
} from '@kiro/shared/types/hr';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HRService } from './hr.service';

describe('HRService', () => {
  let service: HRService;
  let mockDb: jest.Mocked<DatabaseService>;

  const mockCompanyId = 'company-123';
  const mockEmployeeId = 'employee-123';
  const mockDepartmentId = 'dept-123';
  const mockDesignationId = 'desig-123';

  const mockEmployee = {
    id: mockEmployeeId,
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    dateOfJoining: '2024-01-01',
    employmentType: 'Full-time',
    status: 'Active',
    companyId: mockCompanyId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDepartment = {
    id: mockDepartmentId,
    name: 'Engineering',
    code: 'ENG',
    companyId: mockCompanyId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDesignation = {
    id: mockDesignationId,
    title: 'Software Engineer',
    code: 'SE',
    level: 1,
    companyId: mockCompanyId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockDbService = {
      query: {
        employees: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        departments: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        designations: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        employeeDocuments: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        onboardingTemplates: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        employeeOnboarding: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        employeeOnboardingTasks: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
      },
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn(),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn(),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HRService,
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = module.get<HRService>(HRService);
    mockDb = module.get(DatabaseService);
  });

  describe('Employee Management', () => {
    describe('createEmployee', () => {
      const createEmployeeDto: CreateEmployeeDto = {
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        dateOfJoining: '2024-01-01',
        employmentType: 'Full-time',
        departmentId: mockDepartmentId,
        designationId: mockDesignationId,
      };

      it('should create an employee successfully', async () => {
        mockDb.query.employees.findFirst.mockResolvedValue(null); // No existing employee
        mockDb.query.departments.findFirst.mockResolvedValue(mockDepartment);
        mockDb.query.designations.findFirst.mockResolvedValue(mockDesignation);
        mockDb.insert().values().returning.mockResolvedValue([mockEmployee]);

        // Mock getEmployeeById
        mockDb.query.employees.findFirst.mockResolvedValueOnce({
          ...mockEmployee,
          department: mockDepartment,
          designation: mockDesignation,
        });

        const result = await service.createEmployee(
          mockCompanyId,
          createEmployeeDto
        );

        expect(result).toBeDefined();
        expect(mockDb.insert).toHaveBeenCalled();
      });

      it('should throw BadRequestException if employee ID already exists', async () => {
        mockDb.query.employees.findFirst.mockResolvedValue(mockEmployee);

        await expect(
          service.createEmployee(mockCompanyId, createEmployeeDto)
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw NotFoundException if department not found', async () => {
        mockDb.query.employees.findFirst.mockResolvedValue(null);
        mockDb.query.departments.findFirst.mockResolvedValue(null);

        await expect(
          service.createEmployee(mockCompanyId, createEmployeeDto)
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException if designation not found', async () => {
        mockDb.query.employees.findFirst.mockResolvedValue(null);
        mockDb.query.departments.findFirst.mockResolvedValue(mockDepartment);
        mockDb.query.designations.findFirst.mockResolvedValue(null);

        await expect(
          service.createEmployee(mockCompanyId, createEmployeeDto)
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateEmployee', () => {
      const updateEmployeeDto: UpdateEmployeeDto = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      it('should update an employee successfully', async () => {
        mockDb.query.employees.findFirst.mockResolvedValue(mockEmployee);
        mockDb.update().set().where.mockResolvedValue(undefined);

        // Mock getEmployeeById for return value
        mockDb.query.employees.findFirst.mockResolvedValueOnce({
          ...mockEmployee,
          ...updateEmployeeDto,
        });

        const result = await service.updateEmployee(
          mockEmployeeId,
          mockCompanyId,
          updateEmployeeDto
        );

        expect(result).toBeDefined();
        expect(mockDb.update).toHaveBeenCalled();
      });

      it('should throw NotFoundException if employee not found', async () => {
        mockDb.query.employees.findFirst.mockResolvedValue(null);

        await expect(
          service.updateEmployee(
            mockEmployeeId,
            mockCompanyId,
            updateEmployeeDto
          )
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('getEmployeeById', () => {
      it('should return employee with relations', async () => {
        const employeeWithRelations = {
          ...mockEmployee,
          department: mockDepartment,
          designation: mockDesignation,
          reportsTo: null,
          documents: [],
        };

        mockDb.query.employees.findFirst.mockResolvedValue(
          employeeWithRelations
        );

        const result = await service.getEmployeeById(mockEmployeeId);

        expect(result).toEqual(employeeWithRelations);
      });

      it('should throw NotFoundException if employee not found', async () => {
        mockDb.query.employees.findFirst.mockResolvedValue(null);

        await expect(service.getEmployeeById(mockEmployeeId)).rejects.toThrow(
          NotFoundException
        );
      });
    });

    describe('getEmployees', () => {
      it('should return employees with directory information', async () => {
        const employees = [mockEmployee];
        const departments = [mockDepartment];
        const designations = [mockDesignation];

        mockDb.query.employees.findMany.mockResolvedValue(employees);
        mockDb.query.departments.findMany.mockResolvedValue(departments);
        mockDb.query.designations.findMany.mockResolvedValue(designations);

        const result = await service.getEmployees(mockCompanyId);

        expect(result).toEqual({
          employees,
          departments,
          designations,
          totalCount: employees.length,
        });
      });

      it('should filter employees by search term', async () => {
        const filter = { search: 'John' };
        mockDb.query.employees.findMany.mockResolvedValue([mockEmployee]);
        mockDb.query.departments.findMany.mockResolvedValue([mockDepartment]);
        mockDb.query.designations.findMany.mockResolvedValue([mockDesignation]);

        const result = await service.getEmployees(mockCompanyId, filter);

        expect(result.employees).toHaveLength(1);
        expect(mockDb.query.employees.findMany).toHaveBeenCalled();
      });
    });

    describe('deactivateEmployee', () => {
      it('should deactivate employee successfully', async () => {
        mockDb.query.employees.findFirst.mockResolvedValue(mockEmployee);
        mockDb.update().set().where.mockResolvedValue(undefined);

        // Mock getEmployeeById for return value
        mockDb.query.employees.findFirst.mockResolvedValueOnce({
          ...mockEmployee,
          status: 'Terminated',
          isActive: false,
        });

        const result = await service.deactivateEmployee(
          mockEmployeeId,
          mockCompanyId,
          '2024-12-31'
        );

        expect(result).toBeDefined();
        expect(mockDb.update).toHaveBeenCalled();
      });

      it('should throw NotFoundException if employee not found', async () => {
        mockDb.query.employees.findFirst.mockResolvedValue(null);

        await expect(
          service.deactivateEmployee(mockEmployeeId, mockCompanyId)
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Department Management', () => {
    describe('createDepartment', () => {
      const createDepartmentDto: CreateDepartmentDto = {
        name: 'Engineering',
        code: 'ENG',
        description: 'Engineering Department',
      };

      it('should create a department successfully', async () => {
        mockDb.query.departments.findFirst.mockResolvedValue(null); // No existing department
        mockDb.insert().values().returning.mockResolvedValue([mockDepartment]);

        // Mock getDepartmentById
        mockDb.query.departments.findFirst.mockResolvedValueOnce(
          mockDepartment
        );

        const result = await service.createDepartment(
          mockCompanyId,
          createDepartmentDto
        );

        expect(result).toBeDefined();
        expect(mockDb.insert).toHaveBeenCalled();
      });

      it('should throw BadRequestException if department code already exists', async () => {
        mockDb.query.departments.findFirst.mockResolvedValue(mockDepartment);

        await expect(
          service.createDepartment(mockCompanyId, createDepartmentDto)
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('getDepartments', () => {
      it('should return all departments for company', async () => {
        const departments = [mockDepartment];
        mockDb.query.departments.findMany.mockResolvedValue(departments);

        const result = await service.getDepartments(mockCompanyId);

        expect(result).toEqual(departments);
        expect(mockDb.query.departments.findMany).toHaveBeenCalled();
      });
    });
  });

  describe('Designation Management', () => {
    describe('createDesignation', () => {
      const createDesignationDto: CreateDesignationDto = {
        title: 'Software Engineer',
        code: 'SE',
        level: 1,
        departmentId: mockDepartmentId,
      };

      it('should create a designation successfully', async () => {
        mockDb.query.designations.findFirst.mockResolvedValue(null); // No existing designation
        mockDb.insert().values().returning.mockResolvedValue([mockDesignation]);

        // Mock getDesignationById
        mockDb.query.designations.findFirst.mockResolvedValueOnce(
          mockDesignation
        );

        const result = await service.createDesignation(
          mockCompanyId,
          createDesignationDto
        );

        expect(result).toBeDefined();
        expect(mockDb.insert).toHaveBeenCalled();
      });

      it('should throw BadRequestException if designation code already exists', async () => {
        mockDb.query.designations.findFirst.mockResolvedValue(mockDesignation);

        await expect(
          service.createDesignation(mockCompanyId, createDesignationDto)
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('getDesignations', () => {
      it('should return all designations for company', async () => {
        const designations = [mockDesignation];
        mockDb.query.designations.findMany.mockResolvedValue(designations);

        const result = await service.getDesignations(mockCompanyId);

        expect(result).toEqual(designations);
        expect(mockDb.query.designations.findMany).toHaveBeenCalled();
      });

      it('should filter designations by department', async () => {
        const designations = [mockDesignation];
        mockDb.query.designations.findMany.mockResolvedValue(designations);

        const result = await service.getDesignations(
          mockCompanyId,
          mockDepartmentId
        );

        expect(result).toEqual(designations);
        expect(mockDb.query.designations.findMany).toHaveBeenCalled();
      });
    });
  });

  describe('Employee Document Management', () => {
    describe('createEmployeeDocument', () => {
      const createDocumentDto: CreateEmployeeDocumentDto = {
        employeeId: mockEmployeeId,
        documentType: 'ID Proof',
        documentName: 'Passport',
        documentNumber: 'A1234567',
      };

      it('should create employee document successfully', async () => {
        mockDb.query.employees.findFirst.mockResolvedValue(mockEmployee);
        const mockDocument = { id: 'doc-123', ...createDocumentDto };
        mockDb.insert().values().returning.mockResolvedValue([mockDocument]);

        const result = await service.createEmployeeDocument(
          mockCompanyId,
          createDocumentDto
        );

        expect(result).toEqual(mockDocument);
        expect(mockDb.insert).toHaveBeenCalled();
      });

      it('should throw NotFoundException if employee not found', async () => {
        mockDb.query.employees.findFirst.mockResolvedValue(null);

        await expect(
          service.createEmployeeDocument(mockCompanyId, createDocumentDto)
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('getEmployeeDocuments', () => {
      it('should return employee documents', async () => {
        mockDb.query.employees.findFirst.mockResolvedValue(mockEmployee);
        const mockDocuments = [
          {
            id: 'doc-123',
            employeeId: mockEmployeeId,
            documentType: 'ID Proof',
          },
        ];
        mockDb.query.employeeDocuments.findMany.mockResolvedValue(
          mockDocuments
        );

        const result = await service.getEmployeeDocuments(
          mockEmployeeId,
          mockCompanyId
        );

        expect(result).toEqual(mockDocuments);
      });

      it('should throw NotFoundException if employee not found', async () => {
        mockDb.query.employees.findFirst.mockResolvedValue(null);

        await expect(
          service.getEmployeeDocuments(mockEmployeeId, mockCompanyId)
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Onboarding Management', () => {
    describe('createOnboardingTemplate', () => {
      const createTemplateDto: CreateOnboardingTemplateDto = {
        name: 'Engineering Onboarding',
        description: 'Standard onboarding for engineers',
        departmentId: mockDepartmentId,
      };

      it('should create onboarding template successfully', async () => {
        const mockTemplate = {
          id: 'template-123',
          ...createTemplateDto,
          companyId: mockCompanyId,
        };
        mockDb.insert().values().returning.mockResolvedValue([mockTemplate]);
        mockDb.query.onboardingTemplates.findFirst.mockResolvedValue(
          mockTemplate
        );

        const result = await service.createOnboardingTemplate(
          mockCompanyId,
          createTemplateDto
        );

        expect(result).toBeDefined();
        expect(mockDb.insert).toHaveBeenCalled();
      });
    });

    describe('createEmployeeOnboarding', () => {
      const createOnboardingDto: CreateEmployeeOnboardingDto = {
        employeeId: mockEmployeeId,
        startDate: '2024-01-01',
        onboardingTemplateId: 'template-123',
      };

      it('should create employee onboarding successfully', async () => {
        mockDb.query.employees.findFirst.mockResolvedValue(mockEmployee);
        const mockOnboarding = { id: 'onboarding-123', ...createOnboardingDto };
        mockDb.insert().values().returning.mockResolvedValue([mockOnboarding]);

        const mockTemplate = {
          id: 'template-123',
          tasks: [
            { id: 'task-1', daysFromStart: 0 },
            { id: 'task-2', daysFromStart: 1 },
          ],
        };
        mockDb.query.onboardingTemplates.findFirst.mockResolvedValue(
          mockTemplate
        );
        mockDb.insert().values.mockResolvedValue(undefined); // For tasks insertion
        mockDb.query.employeeOnboarding.findFirst.mockResolvedValue(
          mockOnboarding
        );

        const result = await service.createEmployeeOnboarding(
          mockCompanyId,
          createOnboardingDto
        );

        expect(result).toBeDefined();
        expect(mockDb.insert).toHaveBeenCalledTimes(2); // Onboarding + tasks
      });

      it('should throw NotFoundException if employee not found', async () => {
        mockDb.query.employees.findFirst.mockResolvedValue(null);

        await expect(
          service.createEmployeeOnboarding(mockCompanyId, createOnboardingDto)
        ).rejects.toThrow(NotFoundException);
      });
    });
  });
});
