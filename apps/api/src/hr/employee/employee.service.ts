import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db, eq, and, ilike, count, asc } from '@kiro/database';
import { employees } from '@kiro/database';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmploymentStatus } from '../enums';

@Injectable()
export class EmployeeService {
  constructor() {}

  async create(
    createEmployeeDto: CreateEmployeeDto,
    _createdBy?: string
  ) {
    // Check if employee already exists
    const existingEmployee = await db
      .select()
      .from(employees)
      .where(eq(employees.employeeId, createEmployeeDto.employeeId))
      .limit(1);

    if (existingEmployee.length > 0) {
      throw new ConflictException('Employee ID already exists');
    }

    // Check if email already exists
    if (createEmployeeDto.email) {
      const existingEmail = await db
        .select()
        .from(employees)
        .where(eq(employees.email, createEmployeeDto.email))
        .limit(1);

      if (existingEmail.length > 0) {
        throw new ConflictException('Email already exists');
      }
    }

    const [employee] = await db
      .insert(employees)
      .values({
        ...createEmployeeDto,
        dateOfBirth: createEmployeeDto.dateOfBirth || null,
        dateOfJoining: createEmployeeDto.hireDate,
        status: EmploymentStatus.ACTIVE,
      })
      .returning();

    return employee;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    departmentId?: string,
    status?: string
  ) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (search) {
      conditions.push(ilike(employees.firstName, `%${search}%`));
    }

    if (departmentId) {
      conditions.push(eq(employees.departmentId, departmentId));
    }

    if (status) {
      conditions.push(eq(employees.status, status));
    }

    let query = db
      .select()
      .from(employees)
      .orderBy(asc(employees.lastName), asc(employees.firstName))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const employeeList = await query;

    // Get total count
    let countQuery = db.select({ count: count() }).from(employees);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const countResult = await countQuery;
    const total = Number(countResult[0]?.count || 0);

    return {
      employees: employeeList,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (employee.length === 0) {
      throw new NotFoundException('Employee not found');
    }

    const result = employee[0];
    if (!result) {
      throw new NotFoundException('Employee not found');
    }

    return result;
  }

  async findByEmployeeId(employeeId: string) {
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.employeeId, employeeId))
      .limit(1);

    if (employee.length === 0) {
      throw new NotFoundException('Employee not found');
    }

    const result = employee[0];
    if (!result) {
      throw new NotFoundException('Employee not found');
    }

    return result;
  }

  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
    _updatedBy?: string
  ) {
    const employee = await this.findOne(id);

    // Check if employee ID is being changed and if it already exists
    if (
      updateEmployeeDto.employeeId &&
      updateEmployeeDto.employeeId !== employee['employeeId']
    ) {
      const existingEmployee = await db
        .select()
        .from(employees)
        .where(eq(employees.employeeId, updateEmployeeDto.employeeId))
        .limit(1);

      if (existingEmployee.length > 0) {
        throw new ConflictException('Employee ID already exists');
      }
    }

    // Check if email is being changed and if it already exists
    if (updateEmployeeDto.email && updateEmployeeDto.email !== employee['email']) {
      const existingEmail = await db
        .select()
        .from(employees)
        .where(eq(employees.email, updateEmployeeDto.email))
        .limit(1);

      if (existingEmail.length > 0) {
        throw new ConflictException('Email already exists');
      }
    }

    const updateData = {
      ...updateEmployeeDto,
      dateOfBirth: updateEmployeeDto.dateOfBirth || null,
      dateOfJoining: updateEmployeeDto.hireDate || employee['dateOfJoining'],
      dateOfLeaving: updateEmployeeDto.terminationDate || null,
    };

    const [updatedEmployee] = await db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning();

    return updatedEmployee;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await db
      .update(employees)
      .set({ isActive: false })
      .where(eq(employees.id, id));
  }

  async getOrganizationChart() {
    // Get all active employees
    const employeeList = await db
      .select()
      .from(employees)
      .where(eq(employees.status, EmploymentStatus.ACTIVE))
      .orderBy(asc(employees.lastName), asc(employees.firstName));

    // Return top-level managers (employees without managers)
    return employeeList.filter(emp => !emp['reportsToId']);
  }

  async getEmployeesByDepartment() {
    // This would need a proper GROUP BY query with Drizzle
    // For now, let's get all employees and group them manually
    const employeeList = await db
      .select()
      .from(employees)
      .where(eq(employees.status, EmploymentStatus.ACTIVE));

    const departmentCounts = employeeList.reduce((acc: Record<string, number>, emp) => {
      const dept = emp['departmentId'] || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(departmentCounts).map(([department, count]) => ({
      department,
      count,
    }));
  }

  async getEmployeeStats() {
    const employeeList = await db.select().from(employees);

    const result = {
      total: employeeList.length,
      active: 0,
      inactive: 0,
      terminated: 0,
      onLeave: 0,
    };

    employeeList.forEach(emp => {
      switch (emp['status']) {
        case EmploymentStatus.ACTIVE:
          result.active++;
          break;
        case EmploymentStatus.INACTIVE:
          result.inactive++;
          break;
        case EmploymentStatus.TERMINATED:
          result.terminated++;
          break;
      }
    });

    return result;
  }
}
