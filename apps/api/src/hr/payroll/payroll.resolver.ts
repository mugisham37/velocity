import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CreatePayrollRunDto,
  CreateSalaryComponentDto,
  CreateSalaryStructureDto,
  ProcessPayrollDto,
} from './dto/create-payroll.dto';
import {
  PayrollRun,
  SalaryComponent,
  SalaryStructure,
} from './entities/payroll.entity';
import { PayrollService } from './payroll.service';

@Resolver(() => SalaryComponent)
@UseGuards(JwtAuthGuard)
export class PayrollResolver {
  constructor(private readonly payrollService: PayrollService) {}

  // Salary Component Management
  @Mutation(() => SalaryComponent)
  async createSalaryComponent(
    @Args('createSalaryComponentInput') createDto: CreateSalaryComponentDto
  ): Promise<SalaryComponent> {
    return this.payrollService.createSalaryComponent(createDto);
  }

  @Query(() => [SalaryComponent])
  async salaryComponents(): Promise<SalaryComponent[]> {
    return this.payrollService.findAllSalaryComponents();
  }

  @Query(() => SalaryComponent)
  async salaryComponent(
    @Args('id', { type: () => ID }) id: string
  ): Promise<SalaryComponent> {
    return this.payrollService.findSalaryComponent(id);
  }

  // Salary Structure Management
  @Mutation(() => SalaryStructure)
  async createSalaryStructure(
    @Args('createSalaryStructureInput') createDto: CreateSalaryStructureDto
  ): Promise<SalaryStructure> {
    return this.payrollService.createSalaryStructure(createDto);
  }

  @Query(() => SalaryStructure)
  async salaryStructure(
    @Args('id', { type: () => ID }) id: string
  ): Promise<SalaryStructure> {
    return this.payrollService.findSalaryStructure(id);
  }

  @Query(() => SalaryStructure, { nullable: true })
  async employeeSalaryStructure(
    @Args('employeeId') employeeId: string
  ): Promise<SalaryStructure | null> {
    return this.payrollService.getEmployeeSalaryStructure(employeeId);
  }

  // Payroll Run Management
  @Mutation(() => PayrollRun)
  async createPayrollRun(
    @Args('createPayrollRunInput') createDto: CreatePayrollRunDto
  ): Promise<PayrollRun> {
    return this.payrollService.createPayrollRun(createDto);
  }

  @Query(() => [PayrollRun])
  async payrollRuns(): Promise<PayrollRun[]> {
    return this.payrollService.findAllPayrollRuns();
  }

  @Query(() => PayrollRun)
  async payrollRun(
    @Args('id', { type: () => ID }) id: string
  ): Promise<PayrollRun> {
    return this.payrollService.findPayrollRun(id);
  }

  @Mutation(() => PayrollRun)
  async processPayroll(
    @Args('processPayrollInput') processDto: ProcessPayrollDto,
    @CurrentUser() user: any
  ): Promise<PayrollRun> {
    return this.payrollService.processPayroll(processDto, user?.id);
  }

  @Mutation(() => PayrollRun)
  async approvePayrollRun(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any
  ): Promise<PayrollRun> {
    return this.payrollService.approvePayrollRun(id, user?.id);
  }

  @Query(() => String)
  async payrollStats(
    @Args('year', { type: () => Int, nullable: true }) year?: number
  ): Promise<string> {
    const stats = await this.payrollService.getPayrollStats(year);
    return JSON.stringify(stats);
  }
}
