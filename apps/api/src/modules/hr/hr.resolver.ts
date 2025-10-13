import type {
  CreateDepartmentDto,
  CreateDesignationDto,
  CreateEmployeeDocumentDto,
  CreateEmployeeDto,
  CreateEmployeeOnboardingDto,
  CreateOnboardingTaskDto,
  CreateOnboardingTemplateDto,
  EmployeeFilter,
  UpdateDepartmentDto,
  UpdateDesignationDto,
  UpdateEmployeeDocumentDto,
  UpdateEmployeeDto,
  UpdateOnboardingTaskStatusDto,
} from '../../shared';
import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { HRService } from './hr.service';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
export class HRResolver {
  constructor(private readonly hrService: HRService) {}

  // Employee Queries
  @Query()
  @Roles('hr_manager', 'hr_user', 'manager', 'admin')
  async employees(
    @Args('filter', { nullable: true }) filter: EmployeeFilter,
    @Context() context: any
  ) {
    return this.hrService.getEmployees(context.req.user.companyId, filter);
  }

  @Query()
  @Roles('hr_manager', 'hr_user', 'manager', 'employee', 'admin')
  async employee(@Args('id') id: string) {
    return this.hrService.getEmployeeById(id);
  }

  @Query()
  @Roles('hr_manager', 'hr_user', 'manager', 'admin')
  async organizationalHierarchy(@Context() context: any) {
    return this.hrService.getOrganizationalHierarchy(context.req.user.companyId);
  }

  // Department Queries
  @Query()
  @Roles('hr_manager', 'hr_user', 'manager', 'employee', 'admin')
  async departments(@Context() context: any) {
    return this.hrService.getDepartments(context.req.user.companyId);
  }

  @Query()
  @Roles('hr_manager', 'hr_user', 'manager', 'employee', 'admin')
  async department(@Args('id') id: string) {
    return this.hrService.getDepartmentById(id);
  }

  // Designation Queries
  @Query()
  @Roles('hr_manager', 'hr_user', 'manager', 'employee', 'admin')
  async designations(
    @Args('departmentId', { nullable: true }) departmentId: string,
    @Context() context: any
  ) {
    return this.hrService.getDesignations(context.req.user.companyId, departmentId);
  }

  @Query()
  @Roles('hr_manager', 'hr_user', 'manager', 'employee', 'admin')
  async designation(@Args('id') id: string) {
    return this.hrService.getDesignationById(id);
  }

  // Employee Document Queries
  @Query()
  @Roles('hr_manager', 'hr_user', 'manager', 'employee', 'admin')
  async employeeDocuments(
    @Args('employeeId') employeeId: string,
    @Context() context: any
  ) {
    return this.hrService.getEmployeeDocuments(employeeId, context.req.user.companyId);
  }

  // Onboarding Queries
  @Query()
  @Roles('hr_manager', 'hr_user', 'manager', 'admin')
  async onboardingTemplates(@Context() context: any) {
    return this.hrService.getOnboardingTemplates(context.req.user.companyId);
  }

  @Query()
  @Roles('hr_manager', 'hr_user', 'manager', 'admin')
  async onboardingTemplate(@Args('id') id: string) {
    return this.hrService.getOnboardingTemplateById(id);
  }

  @Query()
  @Roles('hr_manager', 'hr_user', 'manager', 'admin')
  async employeeOnboardings(
    @Args('employeeId', { nullable: true }) employeeId: string,
    @Context() context: any
  ) {
    return this.hrService.getEmployeeOnboardings(context.req.user.companyId, employeeId);
  }

  @Query()
  @Roles('hr_manager', 'hr_user', 'manager', 'employee', 'admin')
  async employeeOnboarding(@Args('id') id: string) {
    return this.hrService.getEmployeeOnboardingById(id);
  }

  // Employee Mutations
  @Mutation()
  @Roles('hr_manager', 'admin')
  async createEmployee(
    @Args('input') input: CreateEmployeeDto,
    @Context() context: any
  ) {
    return this.hrService.createEmployee(context.req.user.companyId, input);
  }

  @Mutation()
  @Roles('hr_manager', 'admin')
  async updateEmployee(
    @Args('id') id: string,
    @Args('input') input: UpdateEmployeeDto,
    @Context() context: any
  ) {
    return this.hrService.updateEmployee(id, context.req.user.companyId, input);
  }

  @Mutation()
  @Roles('hr_manager', 'admin')
  async deactivateEmployee(
    @Args('id') id: string,
    @Args('dateOfLeaving', { nullable: true }) dateOfLeaving: string,
    @Context() context: any
  ) {
    return this.hrService.deactivateEmployee(id, context.req.user.companyId, dateOfLeaving);
  }

  // Department Mutations
  @Mutation()
  @Roles('hr_manager', 'admin')
  async createDepartment(
    @Args('input') input: CreateDepartmentDto,
    @Context() context: any
  ) {
    return this.hrService.createDepartment(context.req.user.companyId, input);
  }

  @Mutation()
  @Roles('hr_manager', 'admin')
  async updateDepartment(
    @Args('id') id: string,
    @Args('input') input: UpdateDepartmentDto,
    @Context() context: any
  ) {
    return this.hrService.updateDepartment(id, context.req.user.companyId, input);
  }

  // Designation Mutations
  @Mutation()
  @Roles('hr_manager', 'admin')
  async createDesignation(
    @Args('input') input: CreateDesignationDto,
    @Context() context: any
  ) {
    return this.hrService.createDesignation(context.req.user.companyId, input);
  }

  @Mutation()
  @Roles('hr_manager', 'admin')
  async updateDesignation(
    @Args('id') id: string,
    @Args('input') input: UpdateDesignationDto,
    @Context() context: any
  ) {
    return this.hrService.updateDesignation(id, context.req.user.companyId, input);
  }

  // Employee Document Mutations
  @Mutation()
  @Roles('hr_manager', 'hr_user', 'admin')
  async createEmployeeDocument(
    @Args('input') input: CreateEmployeeDocumentDto,
    @Context() context: any
  ) {
    return this.hrService.createEmployeeDocument(context.req.user.companyId, input);
  }

  @Mutation()
  @Roles('hr_manager', 'hr_user', 'admin')
  async updateEmployeeDocument(
    @Args('id') id: string,
    @Args('input') input: UpdateEmployeeDocumentDto,
    @Context() context: any
  ) {
    return this.hrService.updateEmployeeDocument(id, context.req.user.companyId, input);
  }

  @Mutation()
  @Roles('hr_manager', 'admin')
  async verifyEmployeeDocument(
    @Args('id') id: string,
    @Context() context: any
  ) {
    return this.hrService.verifyEmployeeDocument(
      id,
      context.req.user.companyId,
      context.req.user.id
    );
  }

  // Onboarding Mutations
  @Mutation()
  @Roles('hr_manager', 'admin')
  async createOnboardingTemplate(
    @Args('input') input: CreateOnboardingTemplateDto,
    @Context() context: any
  ) {
    return this.hrService.createOnboardingTemplate(context.req.user.companyId, input);
  }

  @Mutation()
  @Roles('hr_manager', 'admin')
  async addOnboardingTask(@Args('input') input: CreateOnboardingTaskDto) {
    return this.hrService.addOnboardingTask(input);
  }

  @Mutation()
  @Roles('hr_manager', 'hr_user', 'manager', 'admin')
  async createEmployeeOnboarding(
    @Args('input') input: CreateEmployeeOnboardingDto,
    @Context() context: any
  ) {
    return this.hrService.createEmployeeOnboarding(context.req.user.companyId, input);
  }

  @Mutation()
  @Roles('hr_manager', 'hr_user', 'manager', 'admin')
  async updateOnboardingTaskStatus(
    @Args('taskId') taskId: string,
    @Args('input') input: UpdateOnboardingTaskStatusDto,
    @Context() context: any
  ) {
    return this.hrService.updateOnboardingTaskStatus(
      taskId,
      context.req.user.companyId,
      input
    );
  }
}

