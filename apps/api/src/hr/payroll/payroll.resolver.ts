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
    const result = await this.payrollService.createSalaryComponent(createDto);
    return result as SalaryComponent;
  }

  @Query(() => [SalaryComponent])
  async salaryComponents(): Promise<SalaryComponent[]> {
    const results = await this.payrollService.findAllSalaryComponents();
    return results as SalaryComponent[];
  }

  @Query(() => SalaryComponent)
  async salaryComponent(
    @Args('id', { type: () => ID }) id: string
  ): Promise<SalaryComponent> {
    const result = await this.payrollService.findSalaryComponent(id);
    return result as SalaryComponent;
  }

  // Salary Structure Management
  @Mutation(() => SalaryStructure)
  async createSalaryStructure(
    @Args('createSalaryStructureInput') createDto: CreateSalaryStructureDto
  ): Promise<SalaryStructure> {
    const result = await this.payrollService.createSalaryStructure(createDto);
    return result as SalaryStructure;
  }

  @Query(() => SalaryStructure)
  async salaryStructure(
    @Args('id', { type: () => ID }) id: string
  ): Promise<SalaryStructure> {
    const result = await this.payrollService.findSalaryStructure(id);
    return result as SalaryStructure;
  }

  @Query(() => SalaryStructure, { nullable: true })
  async employeeSalaryStructure(
    @Args('employeeId') employeeId: string
  ): Promise<SalaryStructure | null> {
    const result = await this.payrollService.getEmployeeSalaryStructure(employeeId);
    return result ? (result as SalaryStructure) : null;
  }

  // Payroll Run Management
  @Mutation(() => PayrollRun)
  async createPayrollRun(
    @Args('createPayrollRunInput') createDto: CreatePayrollRunDto
  ): Promise<PayrollRun> {
    const result = await this.payrollService.createPayrollRun(createDto);
    return result as PayrollRun;
  }

  @Query(() => [PayrollRun])
  async payrollRuns(): Promise<PayrollRun[]> {
    const results = await this.payrollService.findAllPayrollRuns();
    return results as PayrollRun[];
  }

  @Query(() => PayrollRun)
  async payrollRun(
    @Args('id', { type: () => ID }) id: string
  ): Promise<PayrollRun> {
    const result = await this.payrollService.findPayrollRun(id);
    return result as PayrollRun;
  }

  @Mutation(() => PayrollRun)
  async processPayroll(
    @Args('processPayrollInput') processDto: ProcessPayrollDto,
    @CurrentUser() user: any
  ): Promise<PayrollRun> {
    const result = await this.payrollService.processPayroll(processDto, user?.id);
    return result as PayrollRun;
  }

  @Mutation(() => PayrollRun)
  async approvePayrollRun(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any
  ): Promise<PayrollRun> {
    const result = await this.payrollService.approvePayrollRun(id, user?.id);
    return result as PayrollRun;
  }

  @Query(() => String)
  async payrollStats(
    @Args('year', { type: () => Int, nullable: true }) _year?: number
  ): Promise<string> {
    const stats = await this.payrollService.getPayrollStats();
    return JSON.stringify(stats);
  }
}
