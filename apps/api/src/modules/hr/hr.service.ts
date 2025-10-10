import { DatabaseService } from '@kiro/database';
import { departments, designations, employees } from '@kiro/database/schema/hr';
import {
  CreateDepartmentDto,
  CreateDesignationDto,
  CreateEmployeeDto,
  Department,
  Designation,
  Employee,
  EmployeeDirectory,
  EmployeeFilter,
  OrganizationalHierarchy,
  UpdateDepartmentDto,
  UpdateDesignationDto,
  UpdateEmployeeDto,
} from '@kiro/shared/types/hr';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjsmmon';
import { and, asc, eq, like, or } from '@kiro/database';

@Injectable()
export class HRService {
  constructor(private readonly db: DatabaseService) {}

  // Employee Management
  async createEmployee(
    companyId: string,
    data: CreateEmployeeDto
  ): Promise<Employee> {
    // Check if employee ID already exists
    const existingEmployee = await this.db.query.employees.findFirst({
      where: and(
        eq(employees.employeeId, data.employeeId),
        eq(employees.companyId, companyId)
      ),
    });

    if (existingEmployee) {
      throw new BadRequestException('Employee ID already exists');
    }

    // Validate department and designation if provided
    if (data.departmentId) {
      const department = await this.db.query.departments.findFirst({
        where: and(
          eq(departments.id, data.departmentId),
          eq(departments.companyId, companyId)
        ),
      });
      if (!department) {
        throw new NotFoundException('Department not found');
      }
    }

    if (data.designationId) {
      const designation = await this.db.query.designations.findFirst({
        where: and(
          eq(designations.id, data.designationId),
          eq(designations.companyId, companyId)
        ),
      });
      if (!designation) {
        throw new NotFoundException('Designation not found');
      }
    }

    // Validate reporting manager
    if (data.reportsToId) {
      const manager = await this.db.query.employees.findFirst({
        where: and(
          eq(employees.id, data.reportsToId),
          eq(employees.companyId, companyId)
        ),
      });
      if (!manager) {
        throw new NotFoundException('Reporting manager not found');
      }
    }

    const [newEmployee] = await this.db
      .insert(employees)
      .values({
        ...data,
        companyId,
      })
      .returning();

    return this.getEmployeeById(newEmployee.id);
  }

  async updateEmployee(
    id: string,
    companyId: string,
    data: UpdateEmployeeDto
  ): Promise<Employee> {
    const employee = await this.db.query.employees.findFirst({
      where: and(eq(employees.id, id), eq(employees.companyId, companyId)),
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Validate department and designation if provided
    if (data.departmentId) {
      const department = await this.db.query.departments.findFirst({
        where: and(
          eq(departments.id, data.departmentId),
          eq(departments.companyId, companyId)
        ),
      });
      if (!department) {
        throw new NotFoundException('Department not found');
      }
    }

    if (data.designationId) {
      const designation = await this.db.query.designations.findFirst({
        where: and(
          eq(designations.id, data.designationId),
          eq(designations.companyId, companyId)
        ),
      });
      if (!designation) {
        throw new NotFoundException('Designation not found');
      }
    }

    await this.db
      .update(employees)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(employees.id, id), eq(employees.companyId, companyId)));

    return this.getEmployeeById(id);
  }

  async getEmployeeById(id: string): Promise<Employee> {
    const employee = await this.db.query.employees.findFirst({
      where: eq(employees.id, id),
      with: {
        department: true,
        designation: true,
        reportsTo: {
          columns: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        documents: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee as Employee;
  }

  async getEmployees(
    companyId: string,
    filter: EmployeeFilter = {}
  ): Promise<EmployeeDirectory> {
    const conditions = [eq(employees.companyId, companyId)];

    if (filter.search) {
      conditions.push(
        or(
          like(employees.firstName, `%${filter.search}%`),
          like(employees.lastName, `%${filter.search}%`),
          like(employees.employeeId, `%${filter.search}%`),
          like(employees.email, `%${filter.search}%`)
        )
      );
    }

    if (filter.departmentId) {
      conditions.push(eq(employees.departmentId, filter.departmentId));
    }

    if (filter.designationId) {
      conditions.push(eq(employees.designationId, filter.designationId));
    }

    if (filter.employmentType) {
      conditions.push(eq(employees.employmentType, filter.employmentType));
    }

    if (filter.status) {
      conditions.push(eq(employees.status, filter.status));
    }

    if (filter.reportsToId) {
      conditions.push(eq(employees.reportsToId, filter.reportsToId));
    }

    const employeesList = await this.db.query.employees.findMany({
      where: and(...conditions),
      with: {
        department: true,
        designation: true,
        reportsTo: {
          columns: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [asc(employees.firstName), asc(employees.lastName)],
    });

    const departmentsList = await this.db.query.departments.findMany({
      where: eq(departments.companyId, companyId),
      orderBy: asc(departments.name),
    });

    const designationsList = await this.db.query.designations.findMany({
      where: eq(designations.companyId, companyId),
      orderBy: asc(designations.title),
    });

    return {
      employees: employeesList as Employee[],
      departments: departmentsList as Department[],
      designations: designationsList as Designation[],
      totalCount: employeesList.length,
    };
  }

  async getOrganizationalHierarchy(
    companyId: string
  ): Promise<OrganizationalHierarchy[]> {
    const allEmployees = await this.db.query.employees.findMany({
      where: and(
        eq(employees.companyId, companyId),
        eq(employees.isActive, true)
      ),
      with: {
        department: true,
        designation: true,
      },
      orderBy: asc(employees.firstName),
    });

    // Build hierarchy starting from top-level employees (no manager)
    const topLevelEmployees = allEmployees.filter(emp => !emp.reportsToId);

    const buildHierarchy = (
      employee: any,
      level: number = 0
    ): OrganizationalHierarchy => {
      const subordinates = allEmployees.filter(
        emp => emp.reportsToId === employee.id
      );

      return {
        employee: employee as Employee,
        level,
        children: subordinates.map(sub => buildHierarchy(sub, level + 1)),
      };
    };

    return topLevelEmployees.map(emp => buildHierarchy(emp));
  }

  async deactivateEmployee(
    id: string,
    companyId: string,
    dateOfLeaving?: string
  ): Promise<Employee> {
    const employee = await this.db.query.employees.findFirst({
      where: and(eq(employees.id, id), eq(employees.companyId, companyId)),
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    await this.db
      .update(employees)
      .set({
        status: 'Terminated',
        dateOfLeaving: dateOfLeaving || new Date().toISOString().split('T')[0],
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(eq(employees.id, id), eq(employees.companyId, companyId)));

    return this.getEmployeeById(id);
  }

  // Department Management
  async createDepartment(
    companyId: string,
    data: CreateDepartmentDto
  ): Promise<Department> {
    // Check if department code already exists
    const existingDepartment = await this.db.query.departments.findFirst({
      where: and(
        eq(departments.code, data.code),
        eq(departments.companyId, companyId)
      ),
    });

    if (existingDepartment) {
      throw new BadRequestException('Department code already exists');
    }

    // Validate parent department if provided
    if (data.parentDepartmentId) {
      const parentDept = await this.db.query.departments.findFirst({
        where: and(
          eq(departments.id, data.parentDepartmentId),
          eq(departments.companyId, companyId)
        ),
      });
      if (!parentDept) {
        throw new NotFoundException('Parent department not found');
      }
    }

    const [newDepartment] = await this.db
      .insert(departments)
      .values({
        ...data,
        companyId,
      })
      .returning();

    return this.getDepartmentById(newDepartment.id);
  }

  async updateDepartment(
    id: string,
    companyId: string,
    data: UpdateDepartmentDto
  ): Promise<Department> {
    const department = await this.db.query.departments.findFirst({
      where: and(eq(departments.id, id), eq(departments.companyId, companyId)),
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    await this.db
      .update(departments)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(departments.id, id), eq(departments.companyId, companyId)));

    return this.getDepartmentById(id);
  }

  async getDepartmentById(id: string): Promise<Department> {
    const department = await this.db.query.departments.findFirst({
      where: eq(departments.id, id),
      with: {
        parentDepartment: true,
        childDepartments: true,
        headOfDepartment: {
          columns: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department as Department;
  }

  async getDepartments(companyId: string): Promise<Department[]> {
    const departmentsList = await this.db.query.departments.findMany({
      where: eq(departments.companyId, companyId),
      with: {
        parentDepartment: true,
        headOfDepartment: {
          columns: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: asc(departments.name),
    });

    return departmentsList as Department[];
  }

  // Designation Management
  async createDesignation(
    companyId: string,
    data: CreateDesignationDto
  ): Promise<Designation> {
    // Check if designation code already exists
    const existingDesignation = await this.db.query.designations.findFirst({
      where: and(
        eq(designations.code, data.code),
        eq(designations.companyId, companyId)
      ),
    });

    if (existingDesignation) {
      throw new BadRequestException('Designation code already exists');
    }

    const [newDesignation] = await this.db
      .insert(designations)
      .values({
        ...data,
        companyId,
      })
      .returning();

    return this.getDesignationById(newDesignation.id);
  }

  async updateDesignation(
    id: string,
    companyId: string,
    data: UpdateDesignationDto
  ): Promise<Designation> {
    const designation = await this.db.query.designations.findFirst({
      where: and(
        eq(designations.id, id),
        eq(designations.companyId, companyId)
      ),
    });

    if (!designation) {
      throw new NotFoundException('Designation not found');
    }

    await this.db
      .update(designations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(eq(designations.id, id), eq(designations.companyId, companyId))
      );

    return this.getDesignationById(id);
  }

  async getDesignationById(id: string): Promise<Designation> {
    const designation = await this.db.query.designations.findFirst({
      where: eq(designations.id, id),
      with: {
        department: true,
      },
    });

    if (!designation) {
      throw new NotFoundException('Designation not found');
    }

    return designation as Designation;
  }

  async getDesignations(
    companyId: string,
    departmentId?: string
  ): Promise<Designation[]> {
    const conditions = [eq(designations.companyId, companyId)];

    if (departmentId) {
      conditions.push(eq(designations.departmentId, departmentId));
    }

    const designationsList = await this.db.query.designations.findMany({
      where: and(...conditions),
      with: {
        department: true,
      },
      orderBy: [asc(designations.level), asc(designations.title)],
    });

    return designationsList as Designation[];
  }
}

  // Employee Document Management
  async createEmployeeDocument(companyId: string, data: CreateEmployeeDocumentDto): Promise<any> {
    // Verify employee belongs to company
    const employee = await this.db.query.employees.findFirst({
      where: and(
        eq(employees.id, data.employeeId),
        eq(employees.companyId, companyId)
      ),
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const [newDocument] = await this.db
      .insert(employeeDocuments)
      .values(data)
      .returning();

    return newDocument;
  }

  async updateEmployeeDocument(
    id: string,
    companyId: string,
    data: UpdateEmployeeDocumentDto
  ): Promise<any> {
    // Verify document exists and employee belongs to company
    const document = await this.db.query.employeeDocuments.findFirst({
      where: eq(employeeDocuments.id, id),
      with: {
        employee: true,
      },
    });

    if (!document || document.employee.companyId !== companyId) {
      throw new NotFoundException('Document not found');
    }

    await this.db
      .update(employeeDocuments)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(employeeDocuments.id, id));

    return this.db.query.employeeDocuments.findFirst({
      where: eq(employeeDocuments.id, id),
    });
  }

  async getEmployeeDocuments(employeeId: string, companyId: string): Promise<any[]> {
    // Verify employee belongs to company
    const employee = await this.db.query.employees.findFirst({
      where: and(
        eq(employees.id, employeeId),
        eq(employees.companyId, companyId)
      ),
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.db.query.employeeDocuments.findMany({
      where: eq(employeeDocuments.employeeId, employeeId),
      orderBy: desc(employeeDocuments.createdAt),
    });
  }

  async verifyEmployeeDocument(
    id: string,
    companyId: string,
    verifiedBy: string
  ): Promise<any> {
    // Verify document exists and employee belongs to company
    const document = await this.db.query.employeeDocuments.findFirst({
      where: eq(employeeDocuments.id, id),
      with: {
        employee: true,
      },
    });

    if (!document || document.employee.companyId !== companyId) {
      throw new NotFoundException('Document not found');
    }

    await this.db
      .update(employeeDocuments)
      .set({
        isVerified: true,
        verifiedBy,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(employeeDocuments.id, id));

    return this.db.query.employeeDocuments.findFirst({
      where: eq(employeeDocuments.id, id),
    });
  }

  // Onboarding Management
  async createOnboardingTemplate(
    companyId: string,
    data: CreateOnboardingTemplateDto
  ): Promise<any> {
    const [newTemplate] = await this.db
      .insert(onboardingTemplates)
      .values({
        ...data,
        companyId,
      })
      .returning();

    return this.getOnboardingTemplateById(newTemplate.id);
  }

  async getOnboardingTemplateById(id: string): Promise<any> {
    const template = await this.db.query.onboardingTemplates.findFirst({
      where: eq(onboardingTemplates.id, id),
      with: {
        department: true,
        designation: true,
        tasks: {
          orderBy: asc(onboardingTasks.sortOrder),
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Onboarding template not found');
    }

    return template;
  }

  async getOnboardingTemplates(companyId: string): Promise<any[]> {
    return this.db.query.onboardingTemplates.findMany({
      where: eq(onboardingTemplates.companyId, companyId),
      with: {
        department: true,
        designation: true,
        tasks: {
          orderBy: asc(onboardingTasks.sortOrder),
        },
      },
      orderBy: asc(onboardingTemplates.name),
    });
  }

  async addOnboardingTask(data: CreateOnboardingTaskDto): Promise<any> {
    const [newTask] = await this.db
      .insert(onboardingTasks)
      .values(data)
      .returning();

    return newTask;
  }

  async createEmployeeOnboarding(
    companyId: string,
    data: CreateEmployeeOnboardingDto
  ): Promise<any> {
    // Verify employee belongs to company
    const employee = await this.db.query.employees.findFirst({
      where: and(
        eq(employees.id, data.employeeId),
        eq(employees.companyId, companyId)
      ),
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Create onboarding record
    const [newOnboarding] = await this.db
      .insert(employeeOnboarding)
      .values(data)
      .returning();

    // If template is provided, create tasks from template
    if (data.onboardingTemplateId) {
      const template = await this.db.query.onboardingTemplates.findFirst({
        where: eq(onboardingTemplates.id, data.onboardingTemplateId),
        with: {
          tasks: true,
        },
      });

      if (template && template.tasks.length > 0) {
        const startDate = new Date(data.startDate);
        const onboardingTasksData = template.tasks.map(task => ({
          onboardingId: newOnboarding.id,
          taskId: task.id,
          dueDate: new Date(
            startDate.getTime() + task.daysFromStart * 24 * 60 * 60 * 1000
          ).toISOString().split('T')[0],
        }));

        await this.db.insert(employeeOnboardingTasks).values(onboardingTasksData);
      }
    }

    return this.getEmployeeOnboardingById(newOnboarding.id);
  }

  async getEmployeeOnboardingById(id: string): Promise<any> {
    const onboarding = await this.db.query.employeeOnboarding.findFirst({
      where: eq(employeeOnboarding.id, id),
      with: {
        employee: {
          columns: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        template: true,
        assignedTo: {
          columns: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        tasks: {
          with: {
            task: true,
            assignedTo: {
              columns: {
                id: true,
                employeeId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: asc(employeeOnboardingTasks.createdAt),
        },
      },
    });

    if (!onboarding) {
      throw new NotFoundException('Employee onboarding not found');
    }

    return onboarding;
  }

  async getEmployeeOnboardings(companyId: string, employeeId?: string): Promise<any[]> {
    const conditions = [];

    if (employeeId) {
      conditions.push(eq(employeeOnboarding.employeeId, employeeId));
    }

    const onboardings = await this.db.query.employeeOnboarding.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        employee: {
          columns: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            companyId: true,
          },
        },
        template: true,
        assignedTo: {
          columns: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: desc(employeeOnboarding.createdAt),
    });

    // Filter by company
    return onboardings.filter(onboarding => onboarding.employee.companyId === companyId);
  }

  async updateOnboardingTaskStatus(
    taskId: string,
    companyId: string,
    data: UpdateOnboardingTaskStatusDto
  ): Promise<any> {
    // Verify task exists and belongs to company employee
    const task = await this.db.query.employeeOnboardingTasks.findFirst({
      where: eq(employeeOnboardingTasks.id, taskId),
      with: {
        onboarding: {
          with: {
            employee: true,
          },
        },
      },
    });

    if (!task || task.onboarding.employee.companyId !== companyId) {
      throw new NotFoundException('Onboarding task not found');
    }

    await this.db
      .update(employeeOnboardingTasks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(employeeOnboardingTasks.id, taskId));

    // Check if all tasks are completed to update onboarding status
    const allTasks = await this.db.query.employeeOnboardingTasks.findMany({
      where: eq(employeeOnboardingTasks.onboardingId, task.onboardingId),
    });

    const completedTasks = allTasks.filter(t => t.status === 'Completed');
    const requiredTasks = allTasks.filter(t =>
      t.task ? (t.task as any).isRequired : true
    );

    if (completedTasks.length === requiredTasks.length) {
      await this.db
        .update(employeeOnboarding)
        .set({
          status: 'Completed',
          actualCompletionDate: new Date().toISOString().split('T')[0],
          updatedAt: new Date(),
        })
        .where(eq(employeeOnboarding.id, task.onboardingId));
    }

    return this.db.query.employeeOnboardingTasks.findFirst({
      where: eq(employeeOnboardingTasks.id, taskId),
      with: {
        task: true,
        assignedTo: {
          columns: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}
