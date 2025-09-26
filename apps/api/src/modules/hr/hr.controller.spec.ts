import {
  CreateDepartmentDto,
  CreateDesignationDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from '@kiro/shared/types/hr';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HRController } from './hr.controller';
import { HRService } from './hr.service';

describe('HRController', () => {
  let controller: HRController;
  let mockHRService: jest.Mocked<HRService>;

  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
    roles: ['hr_manager'],
  };

  const mockRequest = {
    user: mockUser,
  };

  const mockEmployee = {
    id: 'employee-123',
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    dateOfJoining: '2024-01-01',
    employmentType: 'Full-time',
    status: 'Active',
    companyId: 'company-123',
  };

  const mockDepartment = {
    id: 'dept-123',
    name: 'Engineering',
    code: 'ENG',
    companyId: 'company-123',
  };

  const mockDesignation = {
    id: 'desig-123',
    title: 'Software Engineer',
    code: 'SE',
    level: 1,
    companyId: 'company-123',
  };

  beforeEach(async () => {
    const mockHRServiceProvider = {
      createEmployee: jest.fn(),
      updateEmployee: jest.fn(),
      getEmployeeById: jest.fn(),
      getEmployees: jest.fn(),
      getOrganizationalHierarchy: jest.fn(),
      deactivateEmployee: jest.fn(),
      createDepartment: jest.fn(),
      updateDepartment: jest.fn(),
      getDepartmentById: jest.fn(),
      getDepartments: jest.fn(),
      createDesignation: jest.fn(),
      updateDesignation: jest.fn(),
      getDesignationById: jest.fn(),
      getDesignations: jest.fn(),
      createEmployeeDocument: jest.fn(),
      updateEmployeeDocument: jest.fn(),
      getEmployeeDocuments: jest.fn(),
      verifyEmployeeDocument: jest.fn(),
      createOnboardingTemplate: jest.fn(),
      getOnboardingTemplates: jest.fn(),
      getOnboardingTemplateById: jest.fn(),
      addOnboardingTask: jest.fn(),
      createEmployeeOnboarding: jest.fn(),
      getEmployeeOnboardings: jest.fn(),
      getEmployeeOnboardingById: jest.fn(),
      updateOnboardingTaskStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HRController],
      providers: [
        {
          provide: HRService,
          useValue: mockHRServiceProvider,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<HRController>(HRController);
    mockHRService = module.get(HRService);
  });

  describe('Employee Management', () => {
    describe('createEmployee', () => {
      it('should create an employee', async () => {
        const createEmployeeDto: CreateEmployeeDto = {
          employeeId: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@company.com',
          dateOfJoining: '2024-01-01',
          employmentType: 'Full-time',
        };

        mockHRService.createEmployee.mockResolvedValue(mockEmployee as any);

        const result = await controller.createEmployee(
          createEmployeeDto,
          mockRequest
        );

        expect(result).toEqual(mockEmployee);
        expect(mockHRService.createEmployee).toHaveBeenCalledWith(
          mockUser.companyId,
          createEmployeeDto
        );
      });
    });

    describe('getEmployees', () => {
      it('should return employees directory', async () => {
        const mockDirectory = {
          employees: [mockEmployee],
          departments: [mockDepartment],
          designations: [mockDesignation],
          totalCount: 1,
        };

        mockHRService.getEmployees.mockResolvedValue(mockDirectory as any);

        const result = await controller.getEmployees({}, mockRequest);

        expect(result).toEqual(mockDirectory);
        expect(mockHRService.getEmployees).toHaveBeenCalledWith(
          mockUser.companyId,
          {}
        );
      });

      it('should filter employees by search term', async () => {
        const filter = { search: 'John' };
        const mockDirectory = {
          employees: [mockEmployee],
          departments: [mockDepartment],
          designations: [mockDesignation],
          totalCount: 1,
        };

        mockHRService.getEmployees.mockResolvedValue(mockDirectory as any);

        const result = await controller.getEmployees(filter, mockRequest);

        expect(result).toEqual(mockDirectory);
        expect(mockHRService.getEmployees).toHaveBeenCalledWith(
          mockUser.companyId,
          filter
        );
      });
    });

    describe('getEmployee', () => {
      it('should return employee by id', async () => {
        mockHRService.getEmployeeById.mockResolvedValue(mockEmployee as any);

        const result = await controller.getEmployee('employee-123');

        expect(result).toEqual(mockEmployee);
        expect(mockHRService.getEmployeeById).toHaveBeenCalledWith(
          'employee-123'
        );
      });
    });

    describe('updateEmployee', () => {
      it('should update an employee', async () => {
        const updateEmployeeDto: UpdateEmployeeDto = {
          firstName: 'Jane',
          lastName: 'Smith',
        };

        const updatedEmployee = { ...mockEmployee, ...updateEmployeeDto };
        mockHRService.updateEmployee.mockResolvedValue(updatedEmployee as any);

        const result = await controller.updateEmployee(
          'employee-123',
          updateEmployeeDto,
          mockRequest
        );

        expect(result).toEqual(updatedEmployee);
        expect(mockHRService.updateEmployee).toHaveBeenCalledWith(
          'employee-123',
          mockUser.companyId,
          updateEmployeeDto
        );
      });
    });

    describe('deactivateEmployee', () => {
      it('should deactivate an employee', async () => {
        const deactivatedEmployee = {
          ...mockEmployee,
          status: 'Terminated',
          isActive: false,
        };
        mockHRService.deactivateEmployee.mockResolvedValue(
          deactivatedEmployee as any
        );

        const result = await controller.deactivateEmployee(
          'employee-123',
          { dateOfLeaving: '2024-12-31' },
          mockRequest
        );

        expect(result).toEqual(deactivatedEmployee);
        expect(mockHRService.deactivateEmployee).toHaveBeenCalledWith(
          'employee-123',
          mockUser.companyId,
          '2024-12-31'
        );
      });
    });

    describe('getOrganizationalHierarchy', () => {
      it('should return organizational hierarchy', async () => {
        const mockHierarchy = [
          {
            employee: mockEmployee,
            level: 0,
            children: [],
          },
        ];

        mockHRService.getOrganizationalHierarchy.mockResolvedValue(
          mockHierarchy as any
        );

        const result = await controller.getOrganizationalHierarchy(mockRequest);

        expect(result).toEqual(mockHierarchy);
        expect(mockHRService.getOrganizationalHierarchy).toHaveBeenCalledWith(
          mockUser.companyId
        );
      });
    });
  });

  describe('Department Management', () => {
    describe('createDepartment', () => {
      it('should create a department', async () => {
        const createDepartmentDto: CreateDepartmentDto = {
          name: 'Engineering',
          code: 'ENG',
          description: 'Engineering Department',
        };

        mockHRService.createDepartment.mockResolvedValue(mockDepartment as any);

        const result = await controller.createDepartment(
          createDepartmentDto,
          mockRequest
        );

        expect(result).toEqual(mockDepartment);
        expect(mockHRService.createDepartment).toHaveBeenCalledWith(
          mockUser.companyId,
          createDepartmentDto
        );
      });
    });

    describe('getDepartments', () => {
      it('should return all departments', async () => {
        const departments = [mockDepartment];
        mockHRService.getDepartments.mockResolvedValue(departments as any);

        const result = await controller.getDepartments(mockRequest);

        expect(result).toEqual(departments);
        expect(mockHRService.getDepartments).toHaveBeenCalledWith(
          mockUser.companyId
        );
      });
    });

    describe('getDepartment', () => {
      it('should return department by id', async () => {
        mockHRService.getDepartmentById.mockResolvedValue(
          mockDepartment as any
        );

        const result = await controller.getDepartment('dept-123');

        expect(result).toEqual(mockDepartment);
        expect(mockHRService.getDepartmentById).toHaveBeenCalledWith(
          'dept-123'
        );
      });
    });

    describe('updateDepartment', () => {
      it('should update a department', async () => {
        const updateDepartmentDto = {
          name: 'Software Engineering',
          description: 'Updated description',
        };

        const updatedDepartment = { ...mockDepartment, ...updateDepartmentDto };
        mockHRService.updateDepartment.mockResolvedValue(
          updatedDepartment as any
        );

        const result = await controller.updateDepartment(
          'dept-123',
          updateDepartmentDto,
          mockRequest
        );

        expect(result).toEqual(updatedDepartment);
        expect(mockHRService.updateDepartment).toHaveBeenCalledWith(
          'dept-123',
          mockUser.companyId,
          updateDepartmentDto
        );
      });
    });
  });

  describe('Designation Management', () => {
    describe('createDesignation', () => {
      it('should create a designation', async () => {
        const createDesignationDto: CreateDesignationDto = {
          title: 'Software Engineer',
          code: 'SE',
          level: 1,
          departmentId: 'dept-123',
        };

        mockHRService.createDesignation.mockResolvedValue(
          mockDesignation as any
        );

        const result = await controller.createDesignation(
          createDesignationDto,
          mockRequest
        );

        expect(result).toEqual(mockDesignation);
        expect(mockHRService.createDesignation).toHaveBeenCalledWith(
          mockUser.companyId,
          createDesignationDto
        );
      });
    });

    describe('getDesignations', () => {
      it('should return all designations', async () => {
        const designations = [mockDesignation];
        mockHRService.getDesignations.mockResolvedValue(designations as any);

        const result = await controller.getDesignations(undefined, mockRequest);

        expect(result).toEqual(designations);
        expect(mockHRService.getDesignations).toHaveBeenCalledWith(
          mockUser.companyId,
          undefined
        );
      });

      it('should filter designations by department', async () => {
        const designations = [mockDesignation];
        mockHRService.getDesignations.mockResolvedValue(designations as any);

        const result = await controller.getDesignations(
          'dept-123',
          mockRequest
        );

        expect(result).toEqual(designations);
        expect(mockHRService.getDesignations).toHaveBeenCalledWith(
          mockUser.companyId,
          'dept-123'
        );
      });
    });

    describe('getDesignation', () => {
      it('should return designation by id', async () => {
        mockHRService.getDesignationById.mockResolvedValue(
          mockDesignation as any
        );

        const result = await controller.getDesignation('desig-123');

        expect(result).toEqual(mockDesignation);
        expect(mockHRService.getDesignationById).toHaveBeenCalledWith(
          'desig-123'
        );
      });
    });

    describe('updateDesignation', () => {
      it('should update a designation', async () => {
        const updateDesignationDto = {
          title: 'Senior Software Engineer',
          level: 2,
        };

        const updatedDesignation = {
          ...mockDesignation,
          ...updateDesignationDto,
        };
        mockHRService.updateDesignation.mockResolvedValue(
          updatedDesignation as any
        );

        const result = await controller.updateDesignation(
          'desig-123',
          updateDesignationDto,
          mockRequest
        );

        expect(result).toEqual(updatedDesignation);
        expect(mockHRService.updateDesignation).toHaveBeenCalledWith(
          'desig-123',
          mockUser.companyId,
          updateDesignationDto
        );
      });
    });
  });

  describe('Employee Document Management', () => {
    describe('createEmployeeDocument', () => {
      it('should create employee document', async () => {
        const createDocumentDto = {
          documentType: 'ID Proof',
          documentName: 'Passport',
          documentNumber: 'A1234567',
        };

        const mockDocument = {
          id: 'doc-123',
          employeeId: 'employee-123',
          ...createDocumentDto,
        };

        mockHRService.createEmployeeDocument.mockResolvedValue(
          mockDocument as any
        );

        const result = await controller.createEmployeeDocument(
          'employee-123',
          createDocumentDto,
          mockRequest
        );

        expect(result).toEqual(mockDocument);
        expect(mockHRService.createEmployeeDocument).toHaveBeenCalledWith(
          mockUser.companyId,
          {
            ...createDocumentDto,
            employeeId: 'employee-123',
          }
        );
      });
    });

    describe('getEmployeeDocuments', () => {
      it('should return employee documents', async () => {
        const mockDocuments = [
          {
            id: 'doc-123',
            employeeId: 'employee-123',
            documentType: 'ID Proof',
            documentName: 'Passport',
          },
        ];

        mockHRService.getEmployeeDocuments.mockResolvedValue(
          mockDocuments as any
        );

        const result = await controller.getEmployeeDocuments(
          'employee-123',
          mockRequest
        );

        expect(result).toEqual(mockDocuments);
        expect(mockHRService.getEmployeeDocuments).toHaveBeenCalledWith(
          'employee-123',
          mockUser.companyId
        );
      });
    });

    describe('verifyEmployeeDocument', () => {
      it('should verify employee document', async () => {
        const mockDocument = {
          id: 'doc-123',
          isVerified: true,
          verifiedBy: mockUser.id,
          verifiedAt: new Date().toISOString(),
        };

        mockHRService.verifyEmployeeDocument.mockResolvedValue(
          mockDocument as any
        );

        const result = await controller.verifyEmployeeDocument(
          'doc-123',
          mockRequest
        );

        expect(result).toEqual(mockDocument);
        expect(mockHRService.verifyEmployeeDocument).toHaveBeenCalledWith(
          'doc-123',
          mockUser.companyId,
          mockUser.id
        );
      });
    });
  });
});
