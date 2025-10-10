import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeService } from './employee.service';
import { Employee } from './entities/employee.entity';
import { EmploymentStatus } from '../enums';

@Resolver(() => Employee)
@UseGuards(JwtAuthGuard)
export class EmployeeResolver {
  constructor(private readonly employeeService: EmployeeService) {}

  @Mutation(() => Employee)
  async createEmployee(
    @Args('createEmployeeInput') createEmployeeDto: CreateEmployeeDto,
    @CurrentUser() user: any
  ): Promise<Employee> {
    const result = await this.employeeService.create(createEmployeeDto, user?.id);
    return result as Employee;
  }

  @Query(() => [Employee])
  async employees(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('search', { nullable: true }) search?: string,
    @Args('department', { nullable: true }) department?: string,
    @Args('status', { type: () => EmploymentStatus, nullable: true })
    status?: EmploymentStatus
  ): Promise<Employee[]> {
    const result = await this.employeeService.findAll(
      page,
      limit,
      search,
      department,
      status
    );
    return result.employees as Employee[];
  }

  @Query(() => Employee)
  async employee(
    @Args('id', { type: () => ID }) id: string
  ): Promise<Employee> {
    const result = await this.employeeService.findOne(id);
    return result as Employee;
  }

  @Query(() => Employee)
  async employeeByEmployeeId(
    @Args('employeeId') employeeId: string
  ): Promise<Employee> {
    const result = await this.employeeService.findByEmployeeId(employeeId);
    return result as Employee;
  }

  @Mutation(() => Employee)
  async updateEmployee(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateEmployeeInput') updateEmployeeDto: UpdateEmployeeDto,
    @CurrentUser() user: any
  ): Promise<Employee> {
    const result = await this.employeeService.update(id, updateEmployeeDto, user?.id);
    return result as Employee;
  }

  @Mutation(() => Boolean)
  async removeEmployee(
    @Args('id', { type: () => ID }) id: string
  ): Promise<boolean> {
    await this.employeeService.remove(id);
    return true;
  }

  @Query(() => [Employee])
  async organizationChart(): Promise<Employee[]> {
    const results = await this.employeeService.getOrganizationChart();
    return results as Employee[];
  }

  @Query(() => String)
  async employeesByDepartment(): Promise<string> {
    const stats = await this.employeeService.getEmployeesByDepartment();
    return JSON.stringify(stats);
  }

  @Query(() => String)
  async employeeStats(): Promise<string> {
    const stats = await this.employeeService.getEmployeeStats();
    return JSON.stringify(stats);
  }
}
