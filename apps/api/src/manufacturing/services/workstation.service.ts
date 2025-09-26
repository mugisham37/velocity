import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '@velocity/database';
import { NewWorkstation, Workstation, workstations } from '@velocity/datchema';
import { and, desc, eq, like, or } from 'drizzle-orm';
import {
  CreateWorkstationDto,
  UpdateWorkstationDto,
  WorkstationCapacityInfo,
  WorkstationCostBreakdown,
  WorkstationFilterDto,
} from '../dto/workstation.dto';

@Injectable()
export class WorkstationService {
  async createWorkstation(
    createWorkstationDto: CreateWorkstationDto
  ): Promise<Workstation> {
    // Check if workstation name already exists for the company
    const existingWorkstation = await db
      .select()
      .from(workstations)
      .where(
        and(
          eq(
            workstations.workstationName,
            createWorkstationDto.workstationName
          ),
          eq(workstations.companyId, createWorkstationDto.companyId)
        )
      )
      .limit(1);

    if (existingWorkstation.length > 0) {
      throw new ConflictException(
        `Workstation ${createWorkstationDto.workstationName} already exists for this company`
      );
    }

    const workstationData: NewWorkstation = {
      workstationName: createWorkstationDto.workstationName,
      workstationType: createWorkstationDto.workstationType,
      companyId: createWorkstationDto.companyId,
      warehouseId: createWorkstationDto.warehouseId,
      description: createWorkstationDto.description,
      hourRate: createWorkstationDto.hourRate || 0,
      hourRateElectricity: createWorkstationDto.hourRateElectricity || 0,
      hourRateConsumable: createWorkstationDto.hourRateConsumable || 0,
      hourRateRent: createWorkstationDto.hourRateRent || 0,
      hourRateLabour: createWorkstationDto.hourRateLabour || 0,
      productionCapacity: createWorkstationDto.productionCapacity || 1,
      workingHoursStart: createWorkstationDto.workingHoursStart,
      workingHoursEnd: createWorkstationDto.workingHoursEnd,
      holidayList: createWorkstationDto.holidayList,
    };

    const [newWorkstation] = await db
      .insert(workstations)
      .values(workstationData)
      .returning();

    return newWorkstation;
  }

  async updateWorkstation(
    id: string,
    updateWorkstationDto: UpdateWorkstationDto
  ): Promise<Workstation> {
    const existingWorkstation = await this.findWorkstationById(id);

    // Check if new name conflicts with existing workstation (if name is being changed)
    if (
      updateWorkstationDto.workstationName &&
      updateWorkstationDto.workstationName !==
        existingWorkstation.workstationName
    ) {
      const conflictingWorkstation = await db
        .select()
        .from(workstations)
        .where(
          and(
            eq(
              workstations.workstationName,
              updateWorkstationDto.workstationName
            ),
            eq(workstations.companyId, existingWorkstation.companyId)
          )
        )
        .limit(1);

      if (conflictingWorkstation.length > 0) {
        throw new ConflictException(
          `Workstation ${updateWorkstationDto.workstationName} already exists for this company`
        );
      }
    }

    const updateData: Partial<NewWorkstation> = {
      workstationName: updateWorkstationDto.workstationName,
      workstationType: updateWorkstationDto.workstationType,
      warehouseId: updateWorkstationDto.warehouseId,
      description: updateWorkstationDto.description,
      hourRate: updateWorkstationDto.hourRate,
      hourRateElectricity: updateWorkstationDto.hourRateElectricity,
      hourRateConsumable: updateWorkstationDto.hourRateConsumable,
      hourRateRent: updateWorkstationDto.hourRateRent,
      hourRateLabour: updateWorkstationDto.hourRateLabour,
      productionCapacity: updateWorkstationDto.productionCapacity,
      workingHoursStart: updateWorkstationDto.workingHoursStart,
      workingHoursEnd: updateWorkstationDto.workingHoursEnd,
      holidayList: updateWorkstationDto.holidayList,
      isActive: updateWorkstationDto.isActive,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const [updatedWorkstation] = await db
      .update(workstations)
      .set(updateData)
      .where(eq(workstations.id, id))
      .returning();

    return updatedWorkstation;
  }

  async findWorkstationById(id: string): Promise<Workstation> {
    const [workstation] = await db
      .select()
      .from(workstations)
      .where(eq(workstations.id, id))
      .limit(1);

    if (!workstation) {
      throw new NotFoundException(`Workstation with ID ${id} not found`);
    }

    return workstation;
  }

  async findWorkstations(filter: WorkstationFilterDto): Promise<Workstation[]> {
    let query = db.select().from(workstations);

    const conditions = [];

    if (filter.companyId) {
      conditions.push(eq(workstations.companyId, filter.companyId));
    }

    if (filter.warehouseId) {
      conditions.push(eq(workstations.warehouseId, filter.warehouseId));
    }

    if (filter.workstationType) {
      conditions.push(eq(workstations.workstationType, filter.workstationType));
    }

    if (filter.isActive !== undefined) {
      conditions.push(eq(workstations.isActive, filter.isActive));
    }

    if (filter.search) {
      conditions.push(
        or(
          like(workstations.workstationName, `%${filter.search}%`),
          like(workstations.workstationType, `%${filter.search}%`),
          like(workstations.description, `%${filter.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(workstations.createdAt));
  }

  async getWorkstationCapacityInfo(
    id: string
  ): Promise<WorkstationCapacityInfo> {
    const workstation = await this.findWorkstationById(id);

    // Calculate daily working hours
    let dailyWorkingHours = 8; // Default 8 hours
    if (workstation.workingHoursStart && workstation.workingHoursEnd) {
      const startTime = this.parseTime(workstation.workingHoursStart);
      const endTime = this.parseTime(workstation.workingHoursEnd);
      dailyWorkingHours = endTime - startTime;
    }

    // For now, we'll return basic capacity info
    // In a real implementation, this would consider current workload, scheduled operations, etc.
    const totalCapacity =
      (workstation.productionCapacity || 1) * dailyWorkingHours;
    const availableCapacity = totalCapacity; // Would be calculated based on current workload
    const utilizationPercentage =
      ((totalCapacity - availableCapacity) / totalCapacity) * 100;

    return {
      totalCapacity,
      availableCapacity,
      utilizationPercentage,
      workingHoursStart: workstation.workingHoursStart || '08:00',
      workingHoursEnd: workstation.workingHoursEnd || '17:00',
      dailyWorkingHours,
    };
  }

  async getWorkstationCostBreakdown(
    id: string
  ): Promise<WorkstationCostBreakdown> {
    const workstation = await this.findWorkstationById(id);

    const hourRate = workstation.hourRate || 0;
    const electricityCost = workstation.hourRateElectricity || 0;
    const consumableCost = workstation.hourRateConsumable || 0;
    const rentCost = workstation.hourRateRent || 0;
    const labourCost = workstation.hourRateLabour || 0;

    const totalHourlyRate =
      hourRate + electricityCost + consumableCost + rentCost + labourCost;

    return {
      hourRate,
      electricityCost,
      consumableCost,
      rentCost,
      labourCost,
      totalHourlyRate,
      currency: 'USD', // This could be retrieved from company settings
    };
  }

  async deleteWorkstation(id: string): Promise<void> {
    const workstation = await this.findWorkstationById(id);

    // In a real implementation, you might want to check if the workstation is being used
    // in any active BOMs or work orders before allowing deletion

    await db.delete(workstations).where(eq(workstations.id, id));
  }

  async getWorkstationsByCompany(companyId: string): Promise<Workstation[]> {
    return await db
      .select()
      .from(workstations)
      .where(
        and(
          eq(workstations.companyId, companyId),
          eq(workstations.isActive, true)
        )
      )
      .orderBy(workstations.workstationName);
  }

  async getWorkstationsByType(
    companyId: string,
    workstationType: string
  ): Promise<Workstation[]> {
    return await db
      .select()
      .from(workstations)
      .where(
        and(
          eq(workstations.companyId, companyId),
          eq(workstations.workstationType, workstationType),
          eq(workstations.isActive, true)
        )
      )
      .orderBy(workstations.workstationName);
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + minutes / 60;
  }
}
