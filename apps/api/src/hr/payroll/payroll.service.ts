import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db, eq, and, desc } from '../../database';
import { 
  payrollComponents, 
  salaryStructures, 
  salaryStructureComponents,
  payrollRuns,
  payrollEntries,
  payrollEntryComponents,
  employees 
} from '../../database';
import { EmployeeService } from '../employee/employee.service';
import { AttendanceService } from '../attendance/attendance.service';
import {
  CreateSalaryComponentDto,
  CreateSalaryStructureDto,
  CreatePayrollRunDto,
  ProcessPayrollDto,
} from './dto/create-payroll.dto';
import { PayrollStatus, ComponentType } from '../enums';

@Injectable()
export class PayrollService {
  constructor(
    private employeeService: EmployeeService,
    private attendanceService: AttendanceService
  ) {}

  // Salary Component Management
  async createSalaryComponent(createSalaryComponentDto: CreateSalaryComponentDto) {
    const [component] = await db
      .insert(payrollComponents)
      .values(createSalaryComponentDto)
      .returning();
    return component;
  }

  async findAllSalaryComponents() {
    return await db
      .select()
      .from(payrollComponents)
      .where(eq(payrollComponents.isActive, true))
      .orderBy(payrollComponents.name);
  }

  async findSalaryComponent(id: string) {
    const components = await db
      .select()
      .from(payrollComponents)
      .where(eq(payrollComponents.id, id))
      .limit(1);

    if (components.length === 0) {
      throw new NotFoundException('Salary component not found');
    }

    return components[0];
  }

  // Salary Structure Management
  async createSalaryStructure(createSalaryStructureDto: CreateSalaryStructureDto) {
    const employee = await this.employeeService.findOne(createSalaryStructureDto.employeeId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const [structure] = await db
      .insert(salaryStructures)
      .values({
        employeeId: createSalaryStructureDto.employeeId,
        baseSalary: createSalaryStructureDto.baseSalary,
        currency: 'USD',
        frequency: createSalaryStructureDto.frequency || 'Monthly',
        effectiveFrom: createSalaryStructureDto.effectiveFrom,
        effectiveTo: createSalaryStructureDto.effectiveTo || null,
        isActive: true,
        companyId: createSalaryStructureDto.companyId,
      })
      .returning();

    // Add components
    if (createSalaryStructureDto.components && createSalaryStructureDto.components.length > 0 && structure) {
      const componentValues = createSalaryStructureDto.components.map(comp => ({
        salaryStructureId: structure.id,
        componentId: comp.componentId,
        amount: comp.amount || null,
        percentage: comp.percentage || null,
        isActive: true,
      }));

      await db.insert(salaryStructureComponents).values(componentValues);
    }

    return structure;
  }

  async findSalaryStructureByEmployee(employeeId: string) {
    return await db
      .select()
      .from(salaryStructures)
      .where(
        and(
          eq(salaryStructures.employeeId, employeeId),
          eq(salaryStructures.isActive, true)
        )
      )
      .orderBy(desc(salaryStructures.effectiveFrom))
      .limit(1);
  }

  // Add missing methods
  async findSalaryStructure(id: string) {
    const structures = await db
      .select()
      .from(salaryStructures)
      .where(eq(salaryStructures.id, id))
      .limit(1);

    if (structures.length === 0) {
      throw new NotFoundException('Salary structure not found');
    }

    const result = structures[0];
    if (!result) {
      throw new NotFoundException('Salary structure not found');
    }

    return result;
  }

  async getEmployeeSalaryStructure(employeeId: string) {
    const structures = await this.findSalaryStructureByEmployee(employeeId);
    return structures.length > 0 ? structures[0] : null;
  }

  async approvePayrollRun(id: string, approvedBy: string) {
    const [updatedRun] = await db
      .update(payrollRuns)
      .set({
        status: PayrollStatus.COMPLETED,
        approvedBy,
        approvedAt: new Date(),
      })
      .where(eq(payrollRuns.id, id))
      .returning();

    if (!updatedRun) {
      throw new NotFoundException('Payroll run not found');
    }

    return updatedRun;
  }

  // Payroll Run Management
  async createPayrollRun(createPayrollRunDto: CreatePayrollRunDto) {
    const [payrollRun] = await db
      .insert(payrollRuns)
      .values({
        ...createPayrollRunDto,
        status: PayrollStatus.DRAFT,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        employeeCount: 0,
        processedBy: null,
        processedAt: null,
        approvedBy: null,
        approvedAt: null,
      })
      .returning();

    return payrollRun;
  }

  async findAllPayrollRuns() {
    return await db
      .select()
      .from(payrollRuns)
      .orderBy(desc(payrollRuns.payrollDate));
  }

  async findPayrollRun(id: string) {
    const runs = await db
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.id, id))
      .limit(1);

    if (runs.length === 0) {
      throw new NotFoundException('Payroll run not found');
    }

    const result = runs[0];
    if (!result) {
      throw new NotFoundException('Payroll run not found');
    }

    return result;
  }

  async processPayroll(processPayrollDto: ProcessPayrollDto, processedBy: string) {
    const payrollRun = await this.findPayrollRun(processPayrollDto.payrollRunId);
    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (payrollRun.status !== PayrollStatus.DRAFT) {
      throw new BadRequestException('Payroll run is not in draft status');
    }

    // Get all active employees
    const employeeList = await db
      .select()
      .from(employees)
      .where(eq(employees.isActive, true));

    let totalGrossPay = 0;
    let totalDeductions = 0;
    let totalNetPay = 0;

    // Process each employee
    for (const employee of employeeList) {
      const salaryStructure = await this.findSalaryStructureByEmployee(employee['id']);
      
      if (salaryStructure.length === 0) {
        continue; // Skip employees without salary structure
      }

      const structure = salaryStructure[0];
      if (!structure) {
        continue;
      }
      
      // Get attendance data for the period
      const attendanceStats = await this.attendanceService.getAttendanceStats(
        employee['id'],
        new Date(payrollRun.startDate).getMonth() + 1,
        new Date(payrollRun.startDate).getFullYear()
      );

      // Calculate basic pay
      const baseSalary = structure.baseSalary;
      let totalEarnings = baseSalary;
      let totalEmployeeDeductions = 0;

      // Get salary components
      const components = await db
        .select({
          component: payrollComponents,
          structureComponent: salaryStructureComponents,
        })
        .from(salaryStructureComponents)
        .leftJoin(payrollComponents, eq(salaryStructureComponents.componentId, payrollComponents.id))
        .where(eq(salaryStructureComponents.salaryStructureId, structure.id));

      // Calculate earnings and deductions
      for (const comp of components) {
        if (!comp.component) continue;

        let amount = 0;
        if (comp.structureComponent.amount) {
          amount = comp.structureComponent.amount;
        } else if (comp.structureComponent.percentage) {
          amount = (baseSalary * comp.structureComponent.percentage) / 100;
        }

        if (comp.component.type === ComponentType.EARNING) {
          totalEarnings += amount;
        } else if (comp.component.type === ComponentType.DEDUCTION) {
          totalEmployeeDeductions += amount;
        }
      }

      const grossPay = totalEarnings;
      const netPay = grossPay - totalEmployeeDeductions;

      // Create payroll entry
      const [entry] = await db
        .insert(payrollEntries)
        .values({
          payrollRunId: payrollRun.id,
          employeeId: employee['id'],
          baseSalary,
          totalEarnings,
          totalDeductions: totalEmployeeDeductions,
          grossPay,
          netPay,
          workedDays: attendanceStats.totalDays,
          paidDays: attendanceStats.present,
          overtimeHours: Math.round(attendanceStats.totalOvertimeHours),
          status: 'Draft',
          paymentDate: null,
          paymentMethod: null,
          paymentReference: null,
          companyId: employee['companyId'],
        })
        .returning();

      if (!entry) {
        continue;
      }

      // Add component entries
      for (const comp of components) {
        if (!comp.component) continue;

        let amount = 0;
        if (comp.structureComponent.amount) {
          amount = comp.structureComponent.amount;
        } else if (comp.structureComponent.percentage) {
          amount = (baseSalary * comp.structureComponent.percentage) / 100;
        }

        await db.insert(payrollEntryComponents).values({
          payrollEntryId: entry.id,
          componentId: comp.component.id,
          amount,
        });
      }

      totalGrossPay += grossPay;
      totalDeductions += totalEmployeeDeductions;
      totalNetPay += netPay;
    }

    // Update payroll run
    const [updatedRun] = await db
      .update(payrollRuns)
      .set({
        status: PayrollStatus.PROCESSING,
        totalGrossPay,
        totalDeductions,
        totalNetPay,
        employeeCount: employeeList.length,
        processedBy,
        processedAt: new Date(),
      })
      .where(eq(payrollRuns.id, payrollRun.id))
      .returning();

    return updatedRun;
  }

  async getPayrollStats() {
    const runs = await db.select().from(payrollRuns);

    const stats = {
      totalRuns: runs.length,
      draftRuns: runs.filter(run => run.status === PayrollStatus.DRAFT).length,
      processingRuns: runs.filter(run => run.status === PayrollStatus.PROCESSING).length,
      completedRuns: runs.filter(run => run.status === PayrollStatus.COMPLETED).length,
      cancelledRuns: runs.filter(run => run.status === PayrollStatus.CANCELLED).length,
      totalGrossPay: runs.reduce((sum, run) => sum + (run.totalGrossPay || 0), 0),
      totalNetPay: runs.reduce((sum, run) => sum + (run.totalNetPay || 0), 0),
    };

    return stats;
  }
}
