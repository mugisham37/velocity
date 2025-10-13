import { z } from 'zod';

// Employee Management Types
export const CreateEmployeeSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  personalEmail: z.string().email('Invalid personal email format').optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  maritalStatus: z
    .enum(['Single', 'Married', 'Divorced', 'Widowed'])
    .optional(),
  nationality: z.string().optional(),

  // Employment Details
  dateOfJoining: z.string(),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contract', 'Intern']),
  departmentId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  reportsToId: z.string().uuid().optional(),

  // Address Information
  currentAddress: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  permanentAddress: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),

  // Emergency Contact
  emergencyContact: z
    .object({
      name: z.string().optional(),
      relationship: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
    })
    .optional(),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial().omit({
  employeeId: true,
});

export const EmployeeFilterSchema = z.object({
  search: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  employmentType: z
    .enum(['Full-time', 'Part-time', 'Contract', 'Intern'])
    .optional(),
  status: z.enum(['Active', 'Inactive', 'Terminated']).optional(),
  reportsToId: z.string().uuid().optional(),
});

// Department Management Types
export const CreateDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  code: z.string().min(1, 'Department code is required'),
  description: z.string().optional(),
  parentDepartmentId: z.string().uuid().optional(),
  headOfDepartmentId: z.string().uuid().optional(),
});

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial();

// Designation Management Types
export const CreateDesignationSchema = z.object({
  title: z.string().min(1, 'Designation title is required'),
  code: z.string().min(1, 'Designation code is required'),
  description: z.string().optional(),
  level: z.number().int().min(1).default(1),
  departmentId: z.string().uuid().optional(),
});

export const UpdateDesignationSchema = CreateDesignationSchema.partial();

// Employee Document Types
export const CreateEmployeeDocumentSchema = z.object({
  employeeId: z.string().uuid(),
  documentType: z.string().min(1, 'Document type is required'),
  documentName: z.string().min(1, 'Document name is required'),
  documentNumber: z.string().optional(),
  expiryDate: z.string().optional(),
});

export const UpdateEmployeeDocumentSchema =
  CreateEmployeeDocumentSchema.partial().omit({
    employeeId: true,
  });

// Onboarding Types
export const CreateOnboardingTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
});

export const CreateOnboardingTaskSchema = z.object({
  templateId: z.string().uuid(),
  taskName: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  assignedRole: z.string().optional(),
  daysFromStart: z.number().int().min(0).default(0),
  isRequired: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const CreateEmployeeOnboardingSchema = z.object({
  employeeId: z.string().uuid(),
  onboardingTemplateId: z.string().uuid().optional(),
  startDate: z.string(),
  expectedCompletionDate: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const UpdateOnboardingTaskStatusSchema = z.object({
  status: z.enum(['Pending', 'In Progress', 'Completed', 'Skipped']),
  assignedToId: z.string().uuid().optional(),
  completedDate: z.string().optional(),
  notes: z.string().optional(),
});

// Type exports
export type CreateEmployeeDto = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeDto = z.infer<typeof UpdateEmployeeSchema>;
export type EmployeeFilter = z.infer<typeof EmployeeFilterSchema>;

export type CreateDepartmentDto = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartmentDto = z.infer<typeof UpdateDepartmentSchema>;

export type CreateDesignationDto = z.infer<typeof CreateDesignationSchema>;
export type UpdateDesignationDto = z.infer<typeof UpdateDesignationSchema>;

export type CreateEmployeeDocumentDto = z.infer<
  typeof CreateEmployeeDocumentSchema
>;
export type UpdateEmployeeDocumentDto = z.infer<
  typeof UpdateEmployeeDocumentSchema
>;

export type CreateOnboardingTemplateDto = z.infer<
  typeof CreateOnboardingTemplateSchema
>;
export type CreateOnboardingTaskDto = z.infer<
  typeof CreateOnboardingTaskSchema
>;
export type CreateEmployeeOnboardingDto = z.infer<
  typeof CreateEmployeeOnboardingSchema
>;
export type UpdateOnboardingTaskStatusDto = z.infer<
  typeof UpdateOnboardingTaskStatusSchema
>;

// Response Types
export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  personalEmail?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  dateOfJoining: string;
  dateOfLeaving?: string;
  employmentType: string;
  status: string;
  departmentId?: string;
  designationId?: string;
  reportsToId?: string;
  companyId: string;
  currentAddress?: any;
  permanentAddress?: any;
  emergencyContact?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations
  department?: Department;
  designation?: Designation;
  reportsTo?: Employee;
  subordinates?: Employee[];
  documents?: EmployeeDocument[];
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentDepartmentId?: string;
  headOfDepartmentId?: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations
  parentDepartment?: Department;
  childDepartments?: Department[];
  headOfDepartment?: Employee;
  employees?: Employee[];
}

export interface Designation {
  id: string;
  title: string;
  code: string;
  description?: string;
  level: number;
  departmentId?: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations
  department?: Department;
  employees?: Employee[];
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  documentType: string;
  documentName: string;
  documentNumber?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  expiryDate?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingTemplate {
  id: string;
  name: string;
  description?: string;
  departmentId?: string;
  designationId?: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations
  tasks?: OnboardingTask[];
}

export interface OnboardingTask {
  id: string;
  templateId: string;
  taskName: string;
  description?: string;
  assignedRole?: string;
  daysFromStart: number;
  isRequired: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface EmployeeOnboarding {
  id: string;
  employeeId: string;
  onboardingTemplateId?: string;
  status: string;
  startDate: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  assignedToId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  employee?: Employee;
  template?: OnboardingTemplate;
  assignedTo?: Employee;
  tasks?: EmployeeOnboardingTask[];
}

export interface EmployeeOnboardingTask {
  id: string;
  onboardingId: string;
  taskId: string;
  status: string;
  assignedToId?: string;
  dueDate?: string;
  completedDate?: string;
  completedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  task?: OnboardingTask;
  assignedTo?: Employee;
}

// Organizational Hierarchy Types
export interface OrganizationalHierarchy {
  employee: Employee;
  level: number;
  children: OrganizationalHierarchy[];
}

export interface EmployeeDirectory {
  employees: Employee[];
  departments: Department[];
  designations: Designation[];
  totalCount: number;
}
