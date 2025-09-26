import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee, EmployeeStatus } from './entities/employee.entity';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>
  ) {}

  async create(
    createEmployeeDto: CreateEmployeeDto,
    createdBy?: string
  ): Promise<Employee> {
    // Check if employee  already exists
    const existingEmployee = await this.employeeRepository.findOne({
      where: { employeeId: createEmployeeDto.employeeId },
    });

    if (existingEmployee) {
      throw new ConflictException('Employee ID already exists');
    }

    // Check if email already exists
    const existingEmail = await this.employeeRepository.findOne({
      where: { email: createEmployeeDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const employee = this.employeeRepository.create({
      ...createEmployeeDto,
      dateOfBirth: createEmployeeDto.dateOfBirth
        ? new Date(createEmployeeDto.dateOfBirth)
        : undefined,
      hireDate: new Date(createEmployeeDto.hireDate),
      terminationDate: createEmployeeDto.terminationDate
        ? new Date(createEmployeeDto.terminationDate)
        : undefined,
      status: createEmployeeDto.status || EmployeeStatus.ACTIVE,
      createdBy,
    });

    return this.employeeRepository.save(employee);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    department?: string,
    status?: EmployeeStatus
  ): Promise<{ employees: Employee[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<Employee> = {};

    if (search) {
      where.firstName = ILike(`%${search}%`);
    }

    if (department) {
      where.department = department;
    }

    if (status) {
      where.status = status;
    }

    const [employees, total] = await this.employeeRepository.findAndCount({
      where,
      relations: ['manager', 'directReports'],
      skip,
      take: limit,
      order: { lastName: 'ASC', firstName: 'ASC' },
    });

    return {
      employees,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: ['manager', 'directReports'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async findByEmployeeId(employeeId: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { employeeId },
      relations: ['manager', 'directReports'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
    updatedBy?: string
  ): Promise<Employee> {
    const employee = await this.findOne(id);

    // Check if employee ID is being changed and if it already exists
    if (
      updateEmployeeDto.employeeId &&
      updateEmployeeDto.employeeId !== employee.employeeId
    ) {
      const existingEmployee = await this.employeeRepository.findOne({
        where: { employeeId: updateEmployeeDto.employeeId },
      });

      if (existingEmployee) {
        throw new ConflictException('Employee ID already exists');
      }
    }

    // Check if email is being changed and if it already exists
    if (updateEmployeeDto.email && updateEmployeeDto.email !== employee.email) {
      const existingEmail = await this.employeeRepository.findOne({
        where: { email: updateEmployeeDto.email },
      });

      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    const updateData = {
      ...updateEmployeeDto,
      dateOfBirth: updateEmployeeDto.dateOfBirth
        ? new Date(updateEmployeeDto.dateOfBirth)
        : undefined,
      hireDate: updateEmployeeDto.hireDate
        ? new Date(updateEmployeeDto.hireDate)
        : undefined,
      terminationDate: updateEmployeeDto.terminationDate
        ? new Date(updateEmployeeDto.terminationDate)
        : undefined,
      updatedBy,
    };

    await this.employeeRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const employee = await this.findOne(id);
    await this.employeeRepository.remove(employee);
  }

  async getOrganizationChart(): Promise<Employee[]> {
    // Get all employees with their manager relationships
    const employees = await this.employeeRepository.find({
      relations: ['manager', 'directReports'],
      where: { status: EmployeeStatus.ACTIVE },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });

    // Return top-level managers (employees without managers)
    return employees.filter(emp => !emp.manager);
  }

  async getEmployeesByDepartment(): Promise<
    { department: string; count: number }[]
  > {
    const result = await this.employeeRepository
      .createQueryBuilder('employee')
      .select('employee.department', 'department')
      .addSelect('COUNT(*)', 'count')
      .where('employee.status = :status', { status: EmployeeStatus.ACTIVE })
      .groupBy('employee.department')
      .getRawMany();

    return result.map(item => ({
      department: item.department || 'Unassigned',
      count: parseInt(item.count),
    }));
  }

  async getEmployeeStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    terminated: number;
    onLeave: number;
  }> {
    const stats = await this.employeeRepository
      .createQueryBuilder('employee')
      .select('employee.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('employee.status')
      .getRawMany();

    const result = {
      total: 0,
      active: 0,
      inactive: 0,
      terminated: 0,
      onLeave: 0,
    };

    stats.forEach(stat => {
      const count = parseInt(stat.count);
      result.total += count;

      switch (stat.status) {
        case EmployeeStatus.ACTIVE:
          result.active = count;
          break;
        case EmployeeStatus.INACTIVE:
          result.inactive = count;
          break;
        case EmployeeStatus.TERMINATED:
          result.terminated = count;
          break;
        case EmployeeStatus.ON_LEAVE:
          result.onLeave = count;
          break;
      }
    });

    return result;
  }
}
