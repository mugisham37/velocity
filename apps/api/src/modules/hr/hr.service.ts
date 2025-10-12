import { DatabaseService } from '@kiro/database';
import {
  departments,
  designations,
  employees,
  employeeDocuments,
  onboardingTemplates,
  onboardingTasks,
  employeeOnboarding,
  employeeOnboardingTasks,
} from '@kiro/database/schema/hr';
import type {
  CreateDepartmentDto,
  CreateDesignationDto,
  CreateEmployeeDto,
  CreateEmployeeDocumentDto,
  CreateOnboardingTemplateDto,
  CreateOnboardingTaskDto,
  CreateEmployeeOnboardingDto,
  UpdateDepartmentDto,
  UpdateDesignationDto,
  UpdateEmployeeDto,
  UpdateEmployeeDocumentDto,
  UpdateOnboardingTaskStatusDto,
  Department,
  Designation,
  Employee,
  EmployeeDirectory,
  EmployeeFilter,
  OrganizationalHierarchy,
} from '@kiro/shared';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, like, or } from '@kiro/database';

@Injectable()
export class HRService {
  constructor(private readonly db: DatabaseService) {}

  // Employee Management
  async createEmployee(
    companyId: string,
    data: CreateEmployeeDto
  ): Promise<Employee> {
    // Check if employee ID already exists
    const existingEmployee = await this.db.db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.employeeId, data.employeeId),
          eq(employees.companyId, companyId)
        )
      )
      .limit(1);

    if (existingEmployee.length > 0) {
      throw new BadRequestException('Employee ID already exists');
    }

    // Validate department and designation if provided
    if (data.departmentId) {
      const department = await this.db.db
        .select()
        .from(departments)
        .where(
          and(
            eq(departments.id, data.departmentId),
            eq(departments.companyId, companyId)
          )
        )
        .limit(1);
      if (department.length === 0) {
        throw new NotFoundException('Department not found');
      }
    }

    if (data.designationId) {
      const designation = await this.db.db
        .select()
        .from(designations)
        .where(
          and(
            eq(designations.id, data.designationId),
            eq(designations.companyId, companyId)
          )
        )
        .limit(1);
      if (designation.length === 0) {
        throw new NotFoundException('Designation not found');
      }
    }

    // Validate reporting manager
    if (data.reportsToId) {
      const manager = await this.db.db
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.id, data.reportsToId),
            eq(employees.companyId, companyId)
          )
        )
        .limit(1);
      if (manager.length === 0) {
        throw new NotFoundException('Reporting manager not found');
      }
    }

    const [newEmployee] = await this.db.db
      .insert(employees)
      .values({
        companyId,
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || null,
        email: data.email || null,
        phone: data.phone || null,
        personalEmail: data.personalEmail || null,
        dateOfBirth: data.dateOfBirth || null,
        gender: data.gender || null,
        maritalStatus: data.maritalStatus || null,
        nationality: data.nationality || null,
        dateOfJoining: data.dateOfJoining,
        employmentType: data.employmentType,
        departmentId: data.departmentId || null,
        designationId: data.designationId || null,
        reportsToId: data.reportsToId || null,
        currentAddress: data.currentAddress || null,
        permanentAddress: data.permanentAddress || null,
        emergencyContact: data.emergencyContact || null,
      })
      .returning();

    return this.getEmployeeById(newEmployee!['id']);
  }

  async updateEmployee(
    id: string,
    companyId: string,
    data: UpdateEmployeeDto
  ): Promise<Employee> {
    const employee = await this.db.db
      .select()
      .from(employees)
      .where(and(eq(employees.id, id), eq(employees.companyId, companyId)))
      .limit(1);

    if (employee.length === 0) {
      throw new NotFoundException('Employee not found');
    }

    // Validate department and designation if provided
    if (data.departmentId) {
      const department = await this.db.db
        .select()
        .from(departments)
        .where(
          and(
            eq(departments.id, data.departmentId),
            eq(departments.companyId, companyId)
          )
        )
        .limit(1);
      if (department.length === 0) {
        throw new NotFoundException('Department not found');
      }
    }

    if (data.designationId) {
      const designation = await this.db.db
        .select()
        .from(designations)
        .where(
          and(
            eq(designations.id, data.designationId),
            eq(designations.companyId, companyId)
          )
        )
        .limit(1);
      if (designation.length === 0) {
        throw new NotFoundException('Designation not found');
      }
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.middleName !== undefined)
      updateData.middleName = data.middleName || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.personalEmail !== undefined)
      updateData.personalEmail = data.personalEmail || null;
    if (data.dateOfBirth !== undefined)
      updateData.dateOfBirth = data.dateOfBirth || null;
    if (data.gender !== undefined) updateData.gender = data.gender || null;
    if (data.maritalStatus !== undefined)
      updateData.maritalStatus = data.maritalStatus || null;
    if (data.nationality !== undefined)
      updateData.nationality = data.nationality || null;
    if (data.dateOfJoining !== undefined)
      updateData.dateOfJoining = data.dateOfJoining;
    if (data.employmentType !== undefined)
      updateData.employmentType = data.employmentType;
    if (data.departmentId !== undefined)
      updateData.departmentId = data.departmentId || null;
    if (data.designationId !== undefined)
      updateData.designationId = data.designationId || null;
    if (data.reportsToId !== undefined)
      updateData.reportsToId = data.reportsToId || null;
    if (data.currentAddress !== undefined)
      updateData.currentAddress = data.currentAddress || null;
    if (data.permanentAddress !== undefined)
      updateData.permanentAddress = data.permanentAddress || null;
    if (data.emergencyContact !== undefined)
      updateData.emergencyContact = data.emergencyContact || null;

    await this.db.db
      .update(employees)
      .set(updateData)
      .where(and(eq(employees.id, id), eq(employees.companyId, companyId)));

    return this.getEmployeeById(id);
  }

  async getEmployeeById(id: string): Promise<Employee> {
    const employee = await this.db.db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (employee.length === 0) {
      throw new NotFoundException('Employee not found');
    }

    const result = employee[0]!;
    return {
      id: result['id'],
      employeeId: result['employeeId'],
      firstName: result['firstName'],
      lastName: result['lastName'],
      middleName: result['middleName'] || undefined,
      email: result['email'] || undefined,
      phone: result['phone'] || undefined,
      personalEmail: result['personalEmail'] || undefined,
      dateOfBirth: result['dateOfBirth'] || undefined,
      gender: result['gender'] || undefined,
      maritalStatus: result['maritalStatus'] || undefined,
      nationality: result['nationality'] || undefined,
      dateOfJoining: result['dateOfJoining'],
      dateOfLeaving: result['dateOfLeaving'] || undefined,
      employmentType: result['employmentType'],
      status: result['status'],
      departmentId: result['departmentId'] || undefined,
      designationId: result['designationId'] || undefined,
      reportsToId: result['reportsToId'] || undefined,
      companyId: result['companyId'],
      currentAddress: result['currentAddress'] || undefined,
      permanentAddress: result['permanentAddress'] || undefined,
      emergencyContact: result['emergencyContact'] || undefined,
      isActive: result['isActive'] ?? true,
      createdAt: result['createdAt'].toISOString(),
      updatedAt: result['updatedAt'].toISOString(),
    } as Employee;
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
        )!
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

    const employeesList = await this.db.db
      .select()
      .from(employees)
      .where(and(...conditions))
      .orderBy(asc(employees.firstName), asc(employees.lastName));

    const departmentsList = await this.db.db
      .select()
      .from(departments)
      .where(eq(departments.companyId, companyId))
      .orderBy(asc(departments.name));

    const designationsList = await this.db.db
      .select()
      .from(designations)
      .where(eq(designations.companyId, companyId))
      .orderBy(asc(designations.title));

    return {
      employees: employeesList.map(emp => ({
        id: emp['id'],
        employeeId: emp['employeeId'],
        firstName: emp['firstName'],
        lastName: emp['lastName'],
        middleName: emp['middleName'] || undefined,
        email: emp['email'] || undefined,
        phone: emp['phone'] || undefined,
        personalEmail: emp['personalEmail'] || undefined,
        dateOfBirth: emp['dateOfBirth'] || undefined,
        gender: emp['gender'] || undefined,
        maritalStatus: emp['maritalStatus'] || undefined,
        nationality: emp['nationality'] || undefined,
        dateOfJoining: emp['dateOfJoining'],
        dateOfLeaving: emp['dateOfLeaving'] || undefined,
        employmentType: emp['employmentType'],
        status: emp['status'],
        departmentId: emp['departmentId'] || undefined,
        designationId: emp['designationId'] || undefined,
        reportsToId: emp['reportsToId'] || undefined,
        companyId: emp['companyId'],
        currentAddress: emp['currentAddress'] || undefined,
        permanentAddress: emp['permanentAddress'] || undefined,
        emergencyContact: emp['emergencyContact'] || undefined,
        isActive: emp['isActive'] ?? true,
        createdAt: emp['createdAt'].toISOString(),
        updatedAt: emp['updatedAt'].toISOString(),
      })) as Employee[],
      departments: departmentsList.map(dept => ({
        id: dept['id'],
        name: dept['name'],
        code: dept['code'],
        description: dept['description'] || undefined,
        parentDepartmentId: dept['parentDepartmentId'] || undefined,
        headOfDepartmentId: dept['headOfDepartmentId'] || undefined,
        companyId: dept['companyId'],
        isActive: dept['isActive'] ?? true,
        createdAt: dept['createdAt'].toISOString(),
        updatedAt: dept['updatedAt'].toISOString(),
      })) as Department[],
      designations: designationsList.map(designation => ({
        id: designation['id'],
        title: designation['title'],
        code: designation['code'],
        description: designation['description'] || undefined,
        level: designation['level'] || 1,
        departmentId: designation['departmentId'] || undefined,
        companyId: designation['companyId'],
        isActive: designation['isActive'] ?? true,
        createdAt: designation['createdAt'].toISOString(),
        updatedAt: designation['updatedAt'].toISOString(),
      })) as Designation[],
      totalCount: employeesList.length,
    };
  }

  async getOrganizationalHierarchy(
    companyId: string
  ): Promise<OrganizationalHierarchy[]> {
    const allEmployees = await this.db.db
      .select()
      .from(employees)
      .where(
        and(eq(employees.companyId, companyId), eq(employees.isActive, true))
      )
      .orderBy(asc(employees.firstName));

    // Build hierarchy starting from top-level employees (no manager)
    const topLevelEmployees = allEmployees.filter(
      (emp: any) => !emp.reportsToId
    );

    const buildHierarchy = (
      employee: any,
      level: number = 0
    ): OrganizationalHierarchy => {
      const subordinates = allEmployees.filter(
        (emp: any) => emp.reportsToId === employee.id
      );

      return {
        employee: employee as Employee,
        level,
        children: subordinates.map((sub: any) =>
          buildHierarchy(sub, level + 1)
        ),
      };
    };

    return topLevelEmployees.map((emp: any) => buildHierarchy(emp));
  }

  async deactivateEmployee(
    id: string,
    companyId: string,
    dateOfLeaving?: string
  ): Promise<Employee> {
    const employee = await this.db.db
      .select()
      .from(employees)
      .where(and(eq(employees.id, id), eq(employees.companyId, companyId)))
      .limit(1);

    if (employee.length === 0) {
      throw new NotFoundException('Employee not found');
    }

    await this.db.db
      .update(employees)
      .set({
        status: 'Terminated',
        dateOfLeaving: dateOfLeaving || new Date().toISOString().split('T')[0]!,
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
    const existingDepartment = await this.db.db
      .select()
      .from(departments)
      .where(
        and(
          eq(departments.code, data.code),
          eq(departments.companyId, companyId)
        )
      )
      .limit(1);

    if (existingDepartment.length > 0) {
      throw new BadRequestException('Department code already exists');
    }

    // Validate parent department if provided
    if (data.parentDepartmentId) {
      const parentDept = await this.db.db
        .select()
        .from(departments)
        .where(
          and(
            eq(departments.id, data.parentDepartmentId),
            eq(departments.companyId, companyId)
          )
        )
        .limit(1);
      if (parentDept.length === 0) {
        throw new NotFoundException('Parent department not found');
      }
    }

    const [newDepartment] = await this.db.db
      .insert(departments)
      .values({
        ...data,
        companyId,
      })
      .returning();

    return this.getDepartmentById(newDepartment!['id']);
  }

  async updateDepartment(
    id: string,
    companyId: string,
    data: UpdateDepartmentDto
  ): Promise<Department> {
    const department = await this.db.db
      .select()
      .from(departments)
      .where(and(eq(departments.id, id), eq(departments.companyId, companyId)))
      .limit(1);

    if (department.length === 0) {
      throw new NotFoundException('Department not found');
    }

    await this.db.db
      .update(departments)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(departments.id, id), eq(departments.companyId, companyId)));

    return this.getDepartmentById(id);
  }

  async getDepartmentById(id: string): Promise<Department> {
    const department = await this.db.db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);

    if (department.length === 0) {
      throw new NotFoundException('Department not found');
    }

    const result = department[0]!;
    return {
      id: result['id'],
      name: result['name'],
      code: result['code'],
      description: result['description'] || undefined,
      parentDepartmentId: result['parentDepartmentId'] || undefined,
      headOfDepartmentId: result['headOfDepartmentId'] || undefined,
      companyId: result['companyId'],
      isActive: result['isActive'] ?? true,
      createdAt: result['createdAt'].toISOString(),
      updatedAt: result['updatedAt'].toISOString(),
    } as Department;
  }

  async getDepartments(companyId: string): Promise<Department[]> {
    const departmentsList = await this.db.db
      .select()
      .from(departments)
      .where(eq(departments.companyId, companyId))
      .orderBy(asc(departments.name));

    return departmentsList.map(department => ({
      id: department['id'],
      name: department['name'],
      code: department['code'],
      description: department['description'] || undefined,
      parentDepartmentId: department['parentDepartmentId'] || undefined,
      headOfDepartmentId: department['headOfDepartmentId'] || undefined,
      companyId: department['companyId'],
      isActive: department['isActive'] ?? true,
      createdAt: department['createdAt'].toISOString(),
      updatedAt: department['updatedAt'].toISOString(),
    })) as Department[];
  }

  // Designation Management
  async createDesignation(
    companyId: string,
    data: CreateDesignationDto
  ): Promise<Designation> {
    // Check if designation code already exists
    const existingDesignation = await this.db.db
      .select()
      .from(designations)
      .where(
        and(
          eq(designations.code, data.code),
          eq(designations.companyId, companyId)
        )
      )
      .limit(1);

    if (existingDesignation.length > 0) {
      throw new BadRequestException('Designation code already exists');
    }

    const [newDesignation] = await this.db.db
      .insert(designations)
      .values({
        companyId,
        title: data.title,
        code: data.code,
        description: data.description || null,
        level: data.level || 1,
        departmentId: data.departmentId || null,
      })
      .returning();

    return this.getDesignationById(newDesignation!.id);
  }

  async updateDesignation(
    id: string,
    companyId: string,
    data: UpdateDesignationDto
  ): Promise<Designation> {
    const designation = await this.db.db
      .select()
      .from(designations)
      .where(
        and(eq(designations.id, id), eq(designations.companyId, companyId))
      )
      .limit(1);

    if (designation.length === 0) {
      throw new NotFoundException('Designation not found');
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.description !== undefined)
      updateData.description = data.description || null;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.departmentId !== undefined)
      updateData.departmentId = data.departmentId || null;

    await this.db.db
      .update(designations)
      .set(updateData)
      .where(
        and(eq(designations.id, id), eq(designations.companyId, companyId))
      );

    return this.getDesignationById(id);
  }

  async getDesignationById(id: string): Promise<Designation> {
    const designation = await this.db.db
      .select()
      .from(designations)
      .where(eq(designations.id, id))
      .limit(1);

    if (designation.length === 0) {
      throw new NotFoundException('Designation not found');
    }

    const result = designation[0]!;
    return {
      id: result.id,
      title: result.title,
      code: result.code,
      description: result.description || undefined,
      level: result.level || 1,
      departmentId: result.departmentId || undefined,
      companyId: result.companyId,
      isActive: result.isActive ?? true,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    } as Designation;
  }

  async getDesignations(
    companyId: string,
    departmentId?: string
  ): Promise<Designation[]> {
    const conditions = [eq(designations.companyId, companyId)];

    if (departmentId) {
      conditions.push(eq(designations.departmentId, departmentId));
    }

    const designationsList = await this.db.db
      .select()
      .from(designations)
      .where(and(...conditions))
      .orderBy(asc(designations.level), asc(designations.title));

    return designationsList.map(designation => ({
      id: designation.id,
      title: designation.title,
      code: designation.code,
      description: designation.description || undefined,
      level: designation.level || 1,
      departmentId: designation.departmentId || undefined,
      companyId: designation.companyId,
      isActive: designation.isActive ?? true,
      createdAt: designation.createdAt.toISOString(),
      updatedAt: designation.updatedAt.toISOString(),
    })) as Designation[];
  }

  // Employee Document Management
  async createEmployeeDocument(
    companyId: string,
    data: CreateEmployeeDocumentDto
  ): Promise<any> {
    // Verify employee belongs to company
    const employee = await this.db.db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.id, data.employeeId),
          eq(employees.companyId, companyId)
        )
      )
      .limit(1);

    if (employee.length === 0) {
      throw new NotFoundException('Employee not found');
    }

    const [newDocument] = await this.db.db
      .insert(employeeDocuments)
      .values({
        employeeId: data.employeeId,
        documentType: data.documentType,
        documentName: data.documentName,
        documentNumber: data.documentNumber || null,
        expiryDate: data.expiryDate || null,
      })
      .returning();

    return newDocument;
  }

  async updateEmployeeDocument(
    id: string,
    companyId: string,
    data: UpdateEmployeeDocumentDto
  ): Promise<any> {
    // Verify document exists and employee belongs to company
    const document = await this.db.db
      .select()
      .from(employeeDocuments)
      .where(eq(employeeDocuments.id, id))
      .limit(1);

    if (document.length === 0) {
      throw new NotFoundException('Document not found');
    }

    // Verify employee belongs to company
    const employee = await this.db.db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.id, document[0]!.employeeId),
          eq(employees.companyId, companyId)
        )
      )
      .limit(1);

    if (employee.length === 0) {
      throw new NotFoundException('Document not found');
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.documentType !== undefined)
      updateData.documentType = data.documentType;
    if (data.documentName !== undefined)
      updateData.documentName = data.documentName;
    if (data.documentNumber !== undefined)
      updateData.documentNumber = data.documentNumber || null;
    if (data.expiryDate !== undefined)
      updateData.expiryDate = data.expiryDate || null;

    await this.db.db
      .update(employeeDocuments)
      .set(updateData)
      .where(eq(employeeDocuments.id, id));

    return this.db.db
      .select()
      .from(employeeDocuments)
      .where(eq(employeeDocuments.id, id))
      .limit(1)
      .then(result => result[0]!);
  }

  async getEmployeeDocuments(
    employeeId: string,
    companyId: string
  ): Promise<any[]> {
    // Verify employee belongs to company
    const employee = await this.db.db
      .select()
      .from(employees)
      .where(
        and(eq(employees.id, employeeId), eq(employees.companyId, companyId))
      )
      .limit(1);

    if (employee.length === 0) {
      throw new NotFoundException('Employee not found');
    }

    return this.db.db
      .select()
      .from(employeeDocuments)
      .where(eq(employeeDocuments.employeeId, employeeId))
      .orderBy(desc(employeeDocuments.createdAt));
  }

  async verifyEmployeeDocument(
    id: string,
    companyId: string,
    verifiedBy: string
  ): Promise<any> {
    // Verify document exists and employee belongs to company
    const document = await this.db.db
      .select()
      .from(employeeDocuments)
      .where(eq(employeeDocuments.id, id))
      .limit(1);

    if (document.length === 0) {
      throw new NotFoundException('Document not found');
    }

    // Verify employee belongs to company
    const employee = await this.db.db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.id, document[0]!.employeeId),
          eq(employees.companyId, companyId)
        )
      )
      .limit(1);

    if (employee.length === 0) {
      throw new NotFoundException('Document not found');
    }

    await this.db.db
      .update(employeeDocuments)
      .set({
        isVerified: true,
        verifiedBy,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(employeeDocuments.id, id));

    return this.db.db
      .select()
      .from(employeeDocuments)
      .where(eq(employeeDocuments.id, id))
      .limit(1)
      .then(result => result[0]!);
  }

  // Onboarding Management
  async createOnboardingTemplate(
    companyId: string,
    data: CreateOnboardingTemplateDto
  ): Promise<any> {
    const [newTemplate] = await this.db.db
      .insert(onboardingTemplates)
      .values({
        companyId,
        name: data.name,
        description: data.description || null,
        departmentId: data.departmentId || null,
        designationId: data.designationId || null,
      })
      .returning();

    return this.getOnboardingTemplateById(newTemplate!.id);
  }

  async getOnboardingTemplateById(id: string): Promise<any> {
    const template = await this.db.db
      .select()
      .from(onboardingTemplates)
      .where(eq(onboardingTemplates.id, id))
      .limit(1);

    if (template.length === 0) {
      throw new NotFoundException('Onboarding template not found');
    }

    return template[0];
  }

  async getOnboardingTemplates(companyId: string): Promise<any[]> {
    return this.db.db
      .select()
      .from(onboardingTemplates)
      .where(eq(onboardingTemplates.companyId, companyId))
      .orderBy(asc(onboardingTemplates.name));
  }

  async addOnboardingTask(data: CreateOnboardingTaskDto): Promise<any> {
    const [newTask] = await this.db.db
      .insert(onboardingTasks)
      .values({
        templateId: data.templateId,
        taskName: data.taskName,
        description: data.description || null,
        assignedRole: data.assignedRole || null,
        daysFromStart: data.daysFromStart || 0,
        isRequired: data.isRequired ?? true,
        sortOrder: data.sortOrder || 0,
      })
      .returning();

    return newTask;
  }

  async createEmployeeOnboarding(
    companyId: string,
    data: CreateEmployeeOnboardingDto
  ): Promise<any> {
    // Verify employee belongs to company
    const employee = await this.db.db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.id, data.employeeId),
          eq(employees.companyId, companyId)
        )
      )
      .limit(1);

    if (employee.length === 0) {
      throw new NotFoundException('Employee not found');
    }

    // Create onboarding record
    const [newOnboarding] = await this.db.db
      .insert(employeeOnboarding)
      .values({
        employeeId: data.employeeId,
        onboardingTemplateId: data.onboardingTemplateId || null,
        startDate: data.startDate,
        expectedCompletionDate: data.expectedCompletionDate || null,
        assignedToId: data.assignedToId || null,
        notes: data.notes || null,
      })
      .returning();

    // If template is provided, create tasks from template
    if (data.onboardingTemplateId) {
      const template = await this.db.db
        .select()
        .from(onboardingTemplates)
        .where(eq(onboardingTemplates.id, data.onboardingTemplateId))
        .limit(1);

      if (template.length > 0) {
        const tasks = await this.db.db
          .select()
          .from(onboardingTasks)
          .where(eq(onboardingTasks.templateId, data.onboardingTemplateId));

        if (tasks.length > 0) {
          const startDate = new Date(data.startDate);
          const onboardingTasksData = tasks.map((task: any) => ({
            onboardingId: newOnboarding!.id,
            taskId: task['id'],
            dueDate:
              new Date(
                startDate.getTime() + task.daysFromStart * 24 * 60 * 60 * 1000
              )
                .toISOString()
                .split('T')[0] || null,
          }));

          await this.db.db
            .insert(employeeOnboardingTasks)
            .values(onboardingTasksData);
        }
      }
    }

    return this.getEmployeeOnboardingById(newOnboarding!.id);
  }

  async getEmployeeOnboardingById(id: string): Promise<any> {
    const onboarding = await this.db.db
      .select()
      .from(employeeOnboarding)
      .where(eq(employeeOnboarding.id, id))
      .limit(1);

    if (onboarding.length === 0) {
      throw new NotFoundException('Employee onboarding not found');
    }

    return onboarding[0];
  }

  async getEmployeeOnboardings(
    companyId: string,
    employeeId?: string
  ): Promise<any[]> {
    const conditions = [];

    if (employeeId) {
      conditions.push(eq(employeeOnboarding.employeeId, employeeId));
    }

    const onboardings = await this.db.db
      .select()
      .from(employeeOnboarding)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(employeeOnboarding.createdAt));

    // Filter by company by checking employee's company
    const filteredOnboardings = [];
    for (const onboarding of onboardings) {
      const employee = await this.db.db
        .select()
        .from(employees)
        .where(eq(employees.id, onboarding.employeeId))
        .limit(1);

      if (employee.length > 0 && employee[0]!['companyId'] === companyId) {
        filteredOnboardings.push(onboarding);
      }
    }

    return filteredOnboardings;
  }

  async updateOnboardingTaskStatus(
    taskId: string,
    companyId: string,
    data: UpdateOnboardingTaskStatusDto
  ): Promise<any> {
    // Verify task exists and belongs to company employee
    const task = await this.db.db
      .select()
      .from(employeeOnboardingTasks)
      .where(eq(employeeOnboardingTasks.id, taskId))
      .limit(1);

    if (task.length === 0) {
      throw new NotFoundException('Onboarding task not found');
    }

    // Verify onboarding belongs to company
    const onboarding = await this.db.db
      .select()
      .from(employeeOnboarding)
      .where(eq(employeeOnboarding.id, task[0]!.onboardingId))
      .limit(1);

    if (onboarding.length === 0) {
      throw new NotFoundException('Onboarding task not found');
    }

    // Verify employee belongs to company
    const employee = await this.db.db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.id, onboarding[0]!.employeeId),
          eq(employees.companyId, companyId)
        )
      )
      .limit(1);

    if (employee.length === 0) {
      throw new NotFoundException('Onboarding task not found');
    }

    await this.db.db
      .update(employeeOnboardingTasks)
      .set({
        status: data.status,
        assignedToId: data.assignedToId || null,
        completedDate: data.completedDate || null,
        notes: data.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(employeeOnboardingTasks.id, taskId));

    // Check if all tasks are completed to update onboarding status
    const allTasks = await this.db.db
      .select()
      .from(employeeOnboardingTasks)
      .where(eq(employeeOnboardingTasks.onboardingId, task[0]!.onboardingId));

    const completedTasks = allTasks.filter(
      (t: any) => t.status === 'Completed'
    );
    const requiredTasks = allTasks.filter((_t: any) => {
      // Assume all tasks are required for now since we don't have task details
      return true;
    });

    if (completedTasks.length === requiredTasks.length) {
      await this.db.db
        .update(employeeOnboarding)
        .set({
          status: 'Completed',
          actualCompletionDate: new Date().toISOString().split('T')[0] || null,
          updatedAt: new Date(),
        })
        .where(eq(employeeOnboarding.id, task[0]!.onboardingId));
    }

    return this.db.db
      .select()
      .from(employeeOnboardingTasks)
      .where(eq(employeeOnboardingTasks.id, taskId))
      .limit(1)
      .then(result => result[0]!);
  }
}
