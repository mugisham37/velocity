import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceService } from '../attendance/attendance.service';
import { EmployeeService } from '../employee/employee.service';
import { CreateSalaryComponentDto } from './dto/create-payroll.dto';
import {
  PayrollEntry,
  PayrollEntryComponent,
  PayrollRun,
  SalaryComponent,
  SalaryStructure,
  SalaryStructureComponent,
} from './entities/payroll.entity';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(SalaryComponent)
    private salaryComponentRepository: Repository<SalaryComponent>,
    @InjectRepository(SalaryStructure)
    private salaryStructureRepository: Repository<SalaryStructure>,
    @InjectRepository(SalaryStructureComponent)
    private salaryStructureComponentRepository: Repository<SalaryStructureComponent>,
    @InjectRepository(PayrollRun)
    private payrollRunRepository: Repository<PayrollRun>,
    @InjectRepository(PayrollEntry)
    private payrollEntryRepository: Repository<PayrollEntry>,
    @InjectRepository(PayrollEntryComponent)
    private payrollEntryComponentRepository: Repository<PayrollEntryComponent>,
    private employeeService: EmployeeService,
    private attendanceService: AttendanceService
  ) {}

  // Salary Component Management
  async createSalaryComponent(
    createDto: CreateSalaryComponentDto
  ): Promise<SalaryComponent> {
    const component = this.salaryComponentRepository.create(createDto);
    return this.salaryComponentRepository.save(component);
  }

  async findAllSalaryComponents(): Promise<SalaryComponent[]> {
    return this.salaryComponentRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findSalaryComponent(id: string): Promise<SalaryComponent> {
    const component = await this.salaryComponentRepository.findOne({
      where: { id },
    });
    if (!component) {
      throw new NotFoundException('Salary component not found');
    }
    return component;
  }
  // Salary Structure Management
  async createSalaryStructure(
    createDto: CreateSalaryStructureDto
  ): Promise<SalaryStructure> {
    const employee = await this.employeeService.findOne(createDto.employeeId);

    // Deactivate existing active salary structure
    await this.salaryStructureRepository.update(
      { employee: { id: createDto.employeeId }, isActive: true },
      { isActive: false, effectiveTo: new Date(createDto.effectiveFrom) }
    );

    const structure = this.salaryStructureRepository.create({
      ...createDto,
      employee,
      effectiveFrom: new Date(createDto.effectiveFrom),
      effectiveTo: createDto.effectiveTo
        ? new Date(createDto.effectiveTo)
        : undefined,
    });

    const savedStructure = await this.salaryStructureRepository.save(structure);

    // Create salary structure components
    for (const componentDto of createDto.components) {
      const component = await this.findSalaryComponent(
        componentDto.componentId
      );
      const structureComponent = this.salaryStructureComponentRepository.create(
        {
          salaryStructure: savedStructure,
          component,
          amount: componentDto.amount,
          percentage: componentDto.percentage,
        }
      );
      await this.salaryStructureComponentRepository.save(structureComponent);
    }

    return this.findSalaryStructure(savedStructure.id);
  }

  async findSalaryStructure(id: string): Promise<SalaryStructure> {
    const structure = await this.salaryStructureRepository.findOne({
      where: { id },
      relations: ['employee', 'components', 'components.component'],
    });

    if (!structure) {
      throw new NotFoundException('Salary structure not found');
    }

    return structure;
  }

  async getEmployeeSalaryStructure(
    employeeId: string
  ): Promise<SalaryStructure | null> {
    return this.salaryStructureRepository.findOne({
      where: { employee: { id: employeeId }, isActive: true },
      relations: ['employee', 'components', 'components.component'],
    });
  }

  // Payroll Run Management
  async createPayrollRun(createDto: CreatePayrollRunDto): Promise<PayrollRun> {
    const payrollRun = this.payrollRunRepository.create({
      ...createDto,
      payrollDate: new Date(createDto.payrollDate),
      startDate: new Date(createDto.startDate),
      endDate: new Date(createDto.endDate),
    });

    return this.payrollRunRepository.save(payrollRun);
  }

  async findAllPayrollRuns(): Promise<PayrollRun[]> {
    return this.payrollRunRepository.find({
      relations: ['entries', 'entries.employee'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPayrollRun(id: string): Promise<PayrollRun> {
    const payrollRun = await this.payrollRunRepository.findOne({
      where: { id },
      relations: [
        'entries',
        'entries.employee',
        'entries.components',
        'entries.components.component',
      ],
    });

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    return payrollRun;
  }

  async processPayroll(
    processDto: ProcessPayrollDto,
    processedBy?: string
  ): Promise<PayrollRun> {
    const payrollRun = await this.findPayrollRun(processDto.payrollRunId);

    if (payrollRun.status !== PayrollStatus.DRAFT) {
      throw new BadRequestException('Payroll run is not in draft status');
    }

    // Get employees to process
    const employees = await this.employeeService.findAll(1, 1000); // Get all employees
    let employeesToProcess = employees.employees;

    // Calculate payroll for each employee
    let totalGrossPay = 0;
    let totalDeductions = 0;
    let totalNetPay = 0;
    let employeeCount = 0;

    for (const employee of employeesToProcess) {
      const salaryStructure = await this.getEmployeeSalaryStructure(
        employee.id
      );
      if (!salaryStructure) continue;

      // Get attendance data for the payroll period
      const attendanceStats = await this.attendanceService.getAttendanceStats(
        employee.id,
        payrollRun.startDate.getMonth() + 1,
        payrollRun.startDate.getFullYear()
      );

      const payrollEntry = await this.calculatePayrollEntry(
        payrollRun,
        employee,
        salaryStructure,
        attendanceStats
      );

      totalGrossPay += payrollEntry.grossPay;
      totalDeductions += payrollEntry.totalDeductions;
      totalNetPay += payrollEntry.netPay;
      employeeCount++;
    }

    // Update payroll run totals
    payrollRun.totalGrossPay = totalGrossPay;
    payrollRun.totalDeductions = totalDeductions;
    payrollRun.totalNetPay = totalNetPay;
    payrollRun.employeeCount = employeeCount;
    payrollRun.status = PayrollStatus.PROCESSED;
    payrollRun.processedBy = processedBy;
    payrollRun.processedAt = new Date();

    return this.payrollRunRepository.save(payrollRun);
  }

  private async calculatePayrollEntry(
    payrollRun: PayrollRun,
    employee: any,
    salaryStructure: SalaryStructure,
    attendanceStats: any
  ): Promise<PayrollEntry> {
    const payrollEntry = this.payrollEntryRepository.create({
      payrollRun,
      employee,
      baseSalary: salaryStructure.baseSalary,
      workedDays: attendanceStats.present || 0,
      paidDays: attendanceStats.present || 0,
      overtimeHours: attendanceStats.totalOvertimeHours || 0,
    });

    const savedEntry = await this.payrollEntryRepository.save(payrollEntry);

    let totalEarnings = salaryStructure.baseSalary;
    let totalDeductions = 0;

    // Calculate each component
    for (const structureComponent of salaryStructure.components) {
      if (!structureComponent.isActive) continue;

      const amount = this.calculateComponentAmount(
        structureComponent,
        salaryStructure.baseSalary,
        attendanceStats
      );

      const entryComponent = this.payrollEntryComponentRepository.create({
        payrollEntry: savedEntry,
        component: structureComponent.component,
        amount,
        calculation: `Base: ${salaryStructure.baseSalary}`,
      });

      await this.payrollEntryComponentRepository.save(entryComponent);

      if (structureComponent.component.type === ComponentType.EARNING) {
        totalEarnings += amount;
      } else if (
        structureComponent.component.type === ComponentType.DEDUCTION
      ) {
        totalDeductions += amount;
      }
    }

    // Update payroll entry totals
    savedEntry.totalEarnings = totalEarnings;
    savedEntry.totalDeductions = totalDeductions;
    savedEntry.grossPay = totalEarnings;
    savedEntry.netPay = totalEarnings - totalDeductions;

    return this.payrollEntryRepository.save(savedEntry);
  }

  private calculateComponentAmount(
    structureComponent: SalaryStructureComponent,
    baseSalary: number,
    attendanceStats: any
  ): number {
    const component = structureComponent.component;

    if (structureComponent.amount) {
      return structureComponent.amount;
    }

    if (structureComponent.percentage) {
      const calculatedAmount =
        (baseSalary * structureComponent.percentage) / 100;
      return component.maxAmount
        ? Math.min(calculatedAmount, component.maxAmount)
        : calculatedAmount;
    }

    if (component.fixedAmount) {
      return component.fixedAmount;
    }

    if (component.percentage) {
      const calculatedAmount = (baseSalary * component.percentage) / 100;
      return component.maxAmount
        ? Math.min(calculatedAmount, component.maxAmount)
        : calculatedAmount;
    }

    return 0;
  }

  async approvePayrollRun(
    id: string,
    approvedBy?: string
  ): Promise<PayrollRun> {
    const payrollRun = await this.findPayrollRun(id);

    if (payrollRun.status !== PayrollStatus.PROCESSED) {
      throw new BadRequestException(
        'Payroll run must be processed before approval'
      );
    }

    payrollRun.status = PayrollStatus.APPROVED;
    payrollRun.approvedBy = approvedBy;
    payrollRun.approvedAt = new Date();

    return this.payrollRunRepository.save(payrollRun);
  }

  async getPayrollStats(year?: number): Promise<any> {
    const currentYear = year || new Date().getFullYear();

    const payrollRuns = await this.payrollRunRepository.find({
      where: {
        payrollDate: new Date(`${currentYear}-01-01`),
      },
    });

    const stats = {
      totalRuns: payrollRuns.length,
      totalEmployees: payrollRuns.reduce(
        (sum, run) => sum + run.employeeCount,
        0
      ),
      totalGrossPay: payrollRuns.reduce(
        (sum, run) => sum + run.totalGrossPay,
        0
      ),
      totalDeductions: payrollRuns.reduce(
        (sum, run) => sum + run.totalDeductions,
        0
      ),
      totalNetPay: payrollRuns.reduce((sum, run) => sum + run.totalNetPay, 0),
      byStatus: {
        draft: payrollRuns.filter(r => r.status === PayrollStatus.DRAFT).length,
        processed: payrollRuns.filter(r => r.status === PayrollStatus.PROCESSED)
          .length,
        approved: payrollRuns.filter(r => r.status === PayrollStatus.APPROVED)
          .length,
        paid: payrollRuns.filter(r => r.status === PayrollStatus.PAID).length,
      },
    };

    return stats;
  }
}
