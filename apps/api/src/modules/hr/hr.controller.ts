import {
  CreateDepartmentSchema,
  CreateDesignationSchema,
  CreateEmployeeDocumentSchema,
  CreateEmployeeOnboardingSchema,
  CreateEmployeeSchema,
  CreateOnboardingTaskSchema,
  CreateOnboardingTemplateSchema,
  EmployeeFilterSchema,
  UpdateDepartmentSchema,
  UpdateDesignationSchema,
  UpdateEmployeeDocumentSchema,
  UpdateEmployeeSchema,
  UpdateOnboardingTaskStatusSchema,
} from '@kiro/shared/types/hr';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HRService } from './hr.service';

@Controller('hr')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HRController {
  constructor(private readonly hrService: HRService) {}

  // Employee Management Endpoints
  @Post('employees')
  @Roles('hr_manager', 'admin')
  async createEmployee(
    @Body(new ZodValidationPipe(CreateEmployeeSchema)) createEmployeeDto: any,
    @Request() req: any
  ) {
    return this.hrService.createEmployee(req.user.companyId, createEmployeeDto);
  }

  @Get('employees')
  @Roles('hr_manager', 'hr_user', 'manager', 'admin')
  async getEmployees(
    @Query(new ZodValidationPipe(EmployeeFilterSchema)) filter: any,
    @Request() req: any
  ) {
    return this.hrService.getEmployees(req.user.companyId, filter);
  }

  @Get('employees/hierarchy')
  @Roles('hr_manager', 'hr_user', 'manager', 'admin')
  async getOrganizationalHierarchy(@Request() req: any) {
    return this.hrService.getOrganizationalHierarchy(req.user.companyId);
  }

  @Get('employees/:id')
  @Roles('hr_manager', 'hr_user', 'manager', 'employee', 'admin')
  async getEmployee(@Param('id', ParseUUIDPipe) id: string) {
    return this.hrService.getEmployeeById(id);
  }

  @Put('employees/:id')
  @Roles('hr_madmin')
  async updateEmployee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateEmployeeSchema)) updateEmployeeDto: any,
    @Request() req: any
  ) {
    return this.hrService.updateEmployee(
      id,
      req.user.companyId,
      updateEmployeeDto
    );
  }

  @Patch('employees/:id/deactivate')
  @Roles('hr_manager', 'admin')
  async deactivateEmployee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { dateOfLeaving?: string },
    @Request() req: any
  ) {
    return this.hrService.deactivateEmployee(
      id,
      req.user.companyId,
      body.dateOfLeaving
    );
  }

  // Department Management Endpoints
  @Post('departments')
  @Roles('hr_manager', 'admin')
  async createDepartment(
    @Body(new ZodValidationPipe(CreateDepartmentSchema))
    createDepartmentDto: any,
    @Request() req: any
  ) {
    return this.hrService.createDepartment(
      req.user.companyId,
      createDepartmentDto
    );
  }

  @Get('departments')
  @Roles('hr_manager', 'hr_user', 'manager', 'employee', 'admin')
  async getDepartments(@Request() req: any) {
    return this.hrService.getDepartments(req.user.companyId);
  }

  @Get('departments/:id')
  @Roles('hr_manager', 'hr_user', 'manager', 'employee', 'admin')
  async getDepartment(@Param('id', ParseUUIDPipe) id: string) {
    return this.hrService.getDepartmentById(id);
  }

  @Put('departments/:id')
  @Roles('hr_manager', 'admin')
  async updateDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateDepartmentSchema))
    updateDepartmentDto: any,
    @Request() req: any
  ) {
    return this.hrService.updateDepartment(
      id,
      req.user.companyId,
      updateDepartmentDto
    );
  }

  // Designation Management Endpoints
  @Post('designations')
  @Roles('hr_manager', 'admin')
  async createDesignation(
    @Body(new ZodValidationPipe(CreateDesignationSchema))
    createDesignationDto: any,
    @Request() req: any
  ) {
    return this.hrService.createDesignation(
      req.user.companyId,
      createDesignationDto
    );
  }

  @Get('designations')
  @Roles('hr_manager', 'hr_user', 'manager', 'employee', 'admin')
  async getDesignations(
    @Query('departmentId') departmentId: string,
    @Request() req: any
  ) {
    return this.hrService.getDesignations(req.user.companyId, departmentId);
  }

  @Get('designations/:id')
  @Roles('hr_manager', 'hr_user', 'manager', 'employee', 'admin')
  async getDesignation(@Param('id', ParseUUIDPipe) id: string) {
    return this.hrService.getDesignationById(id);
  }

  @Put('designations/:id')
  @Roles('hr_manager', 'admin')
  async updateDesignation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateDesignationSchema))
    updateDesignationDto: any,
    @Request() req: any
  ) {
    return this.hrService.updateDesignation(
      id,
      req.user.companyId,
      updateDesignationDto
    );
  }

  // Employee Document Management Endpoints
  @Post('employees/:employeeId/documents')
  @Roles('hr_manager', 'hr_user', 'admin')
  async createEmployeeDocument(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body(
      new ZodValidationPipe(
        CreateEmployeeDocumentSchema.omit({ employeeId: true })
      )
    )
    createDocumentDto: any,
    @Request() req: any
  ) {
    return this.hrService.createEmployeeDocument(req.user.companyId, {
      ...createDocumentDto,
      employeeId,
    });
  }

  @Get('employees/:employeeId/documents')
  @Roles('hr_manager', 'hr_user', 'manager', 'employee', 'admin')
  async getEmployeeDocuments(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Request() req: any
  ) {
    return this.hrService.getEmployeeDocuments(employeeId, req.user.companyId);
  }

  @Put('documents/:id')
  @Roles('hr_manager', 'hr_user', 'admin')
  async updateEmployeeDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateEmployeeDocumentSchema))
    updateDocumentDto: any,
    @Request() req: any
  ) {
    return this.hrService.updateEmployeeDocument(
      id,
      req.user.companyId,
      updateDocumentDto
    );
  }

  @Patch('documents/:id/verify')
  @Roles('hr_manager', 'admin')
  async verifyEmployeeDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any
  ) {
    return this.hrService.verifyEmployeeDocument(
      id,
      req.user.companyId,
      req.user.id
    );
  }

  // Onboarding Management Endpoints
  @Post('onboarding/templates')
  @Roles('hr_manager', 'admin')
  async createOnboardingTemplate(
    @Body(new ZodValidationPipe(CreateOnboardingTemplateSchema))
    createTemplateDto: any,
    @Request() req: any
  ) {
    return this.hrService.createOnboardingTemplate(
      req.user.companyId,
      createTemplateDto
    );
  }

  @Get('onboarding/templates')
  @Roles('hr_manager', 'hr_user', 'manager', 'admin')
  async getOnboardingTemplates(@Request() req: any) {
    return this.hrService.getOnboardingTemplates(req.user.companyId);
  }

  @Get('onboarding/templates/:id')
  @Roles('hr_manager', 'hr_user', 'manager', 'admin')
  async getOnboardingTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return this.hrService.getOnboardingTemplateById(id);
  }

  @Post('onboarding/templates/:templateId/tasks')
  @Roles('hr_manager', 'admin')
  async addOnboardingTask(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body(
      new ZodValidationPipe(
        CreateOnboardingTaskSchema.omit({ templateId: true })
      )
    )
    createTaskDto: any
  ) {
    return this.hrService.addOnboardingTask({
      ...createTaskDto,
      templateId,
    });
  }

  @Post('onboarding')
  @Roles('hr_manager', 'hr_user', 'manager', 'admin')
  async createEmployeeOnboarding(
    @Body(new ZodValidationPipe(CreateEmployeeOnboardingSchema))
    createOnboardingDto: any,
    @Request() req: any
  ) {
    return this.hrService.createEmployeeOnboarding(
      req.user.companyId,
      createOnboardingDto
    );
  }

  @Get('onboarding')
  @Roles('hr_manager', 'hr_user', 'manager', 'admin')
  async getEmployeeOnboardings(
    @Query('employeeId') employeeId: string,
    @Request() req: any
  ) {
    return this.hrService.getEmployeeOnboardings(
      req.user.companyId,
      employeeId
    );
  }

  @Get('onboarding/:id')
  @Roles('hr_manager', 'hr_user', 'manager', 'employee', 'admin')
  async getEmployeeOnboarding(@Param('id', ParseUUIDPipe) id: string) {
    return this.hrService.getEmployeeOnboardingById(id);
  }

  @Patch('onboarding/tasks/:taskId')
  @Roles('hr_manager', 'hr_user', 'manager', 'admin')
  async updateOnboardingTaskStatus(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body(new ZodValidationPipe(UpdateOnboardingTaskStatusSchema))
    updateTaskDto: any,
    @Request() req: any
  ) {
    return this.hrService.updateOnboardingTaskStatus(
      taskId,
      req.user.companyId,
      updateTaskDto
    );
  }
}
