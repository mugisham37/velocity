import {
  Field,
  ID,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
  Float,
} from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
// Custom JSON scalar type
const GraphQLJSONObject = Object;

// Enums
export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum WorkflowPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum WorkflowStepType {
  APPROVAL = 'approval',
  TASK = 'task',
  CONDITION = 'condition',
  PARALLEL = 'parallel',
  NOTIFICATION = 'notification',
  INTEGRATION = 'integration',
  DELAY = 'delay',
}

export enum WorkflowStepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DELEGATED = 'delegated',
}

// Register enums with GraphQL
registerEnumType(WorkflowStatus, { name: 'WorkflowStatus' });
registerEnumType(WorkflowPriority, { name: 'WorkflowPriority' });
registerEnumType(WorkflowStepType, { name: 'WorkflowStepType' });
registerEnumType(WorkflowStepStatus, { name: 'WorkflowStepStatus' });
registerEnumType(ApprovalStatus, { name: 'ApprovalStatus' });

// Workflow Definition Types
@ObjectType()
export class WorkflowNode {
  @Field()
  id!: string;

  @Field()
  type!: string;

  @Field()
  label!: string;

  @Field(() => GraphQLJSONObject)
  data!: any;

  @Field(() => GraphQLJSONObject)
  position!: { x: number; y: number };
}

@ObjectType()
export class WorkflowEdge {
  @Field()
  id!: string;

  @Field()
  source!: string;

  @Field()
  target!: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  data?: any;
}

@ObjectType()
export class WorkflowDefinition {
  @Field(() => [WorkflowNode])
  nodes!: WorkflowNode[];

  @Field(() => [WorkflowEdge])
  edges!: WorkflowEdge[];

  @Field(() => GraphQLJSONObject, { nullable: true })
  settings?: any;
}

// Main DTOs
@ObjectType()
export class Workflow {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  companyId!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  category!: string;

  @Field(() => Int)
  version!: number;

  @Field()
  isActive!: boolean;

  @Field()
  isTemplate!: boolean;

  @Field(() => WorkflowDefinition)
  definition!: WorkflowDefinition;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => GraphQLJSONObject, { nullable: true })
  permissions?: any;

  @Field(() => ID)
  createdBy!: string;

  @Field(() => ID, { nullable: true })
  updatedBy?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class WorkflowInstance {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  workflowId!: string;

  @Field(() => ID)
  companyId!: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => WorkflowStatus)
  status!: WorkflowStatus;

  @Field(() => WorkflowPriority)
  priority!: WorkflowPriority;

  @Field(() => GraphQLJSONObject, { nullable: true })
  contextData?: any;

  @Field({ nullable: true })
  currentStep?: string;

  @Field({ nullable: true })
  startedAt?: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field()
  slaBreached!: boolean;

  @Field({ nullable: true })
  slaBreachedAt?: Date;

  @Field(() => ID)
  initiatedBy!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  // Relations
  @Field(() => Workflow, { nullable: true })
  workflow?: Workflow;

  @Field(() => [WorkflowStep], { nullable: true })
  steps?: WorkflowStep[];
}

@ObjectType()
export class WorkflowStep {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  instanceId!: string;

  @Field()
  stepId!: string;

  @Field()
  name!: string;

  @Field(() => WorkflowStepType)
  type!: WorkflowStepType;

  @Field(() => WorkflowStepStatus)
  status!: WorkflowStepStatus;

  @Field(() => ID, { nullable: true })
  assignedTo?: string;

  @Field({ nullable: true })
  assignedRole?: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  inputData?: any;

  @Field(() => GraphQLJSONObject, { nullable: true })
  outputData?: any;

  @Field({ nullable: true })
  startedAt?: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field({ nullable: true })
  comments?: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  attachments?: any;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  // Relations
  @Field(() => [WorkflowApproval], { nullable: true })
  approvals?: WorkflowApproval[];
}

@ObjectType()
export class WorkflowApproval {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  stepId!: string;

  @Field(() => ID)
  instanceId!: string;

  @Field(() => ID)
  approverId!: string;

  @Field(() => ApprovalStatus)
  status!: ApprovalStatus;

  @Field({ nullable: true })
  decision?: string;

  @Field({ nullable: true })
  comments?: string;

  @Field({ nullable: true })
  reason?: string;

  @Field(() => ID, { nullable: true })
  delegatedTo?: string;

  @Field({ nullable: true })
  delegationReason?: string;

  @Field()
  requestedAt!: Date;

  @Field({ nullable: true })
  respondedAt?: Date;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class WorkflowTemplate {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  category!: string;

  @Field({ nullable: true })
  industry?: string;

  @Field(() => WorkflowDefinition)
  definition!: WorkflowDefinition;

  @Field(() => Int)
  usageCount!: number;

  @Field()
  isPublic!: boolean;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => ID)
  createdBy!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

// Input Types
@InputType()
export class WorkflowNodeInput {
  @Field()
  @IsString()
  id!: string;

  @Field()
  @IsString()
  type!: string;

  @Field()
  @IsString()
  label!: string;

  @Field(() => GraphQLJSONObject)
  @IsObject()
  data!: any;

  @Field(() => GraphQLJSONObject)
  @IsObject()
  position!: { x: number; y: number };
}

@InputType()
export class WorkflowEdgeInput {
  @Field()
  @IsString()
  id!: string;

  @Field()
  @IsString()
  source!: string;

  @Field()
  @IsString()
  target!: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  @IsOptional()
  @IsObject()
  data?: any;
}

@InputType()
export class WorkflowDefinitionInput {
  @Field(() => [WorkflowNodeInput])
  @IsArray()
  nodes!: WorkflowNodeInput[];

  @Field(() => [WorkflowEdgeInput])
  @IsArray()
  edges!: WorkflowEdgeInput[];

  @Field(() => GraphQLJSONObject, { nullable: true })
  @IsOptional()
  @IsObject()
  settings?: any;
}

@InputType()
export class CreateWorkflowInput {
  @Field()
  @IsString()
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field()
  @IsString()
  category!: string;

  @Field(() => WorkflowDefinitionInput)
  definition!: WorkflowDefinitionInput;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @Field(() => GraphQLJSONObject, { nullable: true })
  @IsOptional()
  @IsObject()
  permissions?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;
}

@InputType()
export class UpdateWorkflowInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field(() => WorkflowDefinitionInput, { nullable: true })
  @IsOptional()
  definition?: WorkflowDefinitionInput;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @Field(() => GraphQLJSONObject, { nullable: true })
  @IsOptional()
  @IsObject()
  permissions?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class CreateWorkflowInstanceInput {
  @Field(() => ID)
  @IsUUID()
  workflowId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => WorkflowPriority, { nullable: true })
  @IsOptional()
  @IsEnum(WorkflowPriority)
  priority?: WorkflowPriority;

  @Field(() => GraphQLJSONObject, { nullable: true })
  @IsOptional()
  @IsObject()
  contextData?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

@InputType()
export class WorkflowApprovalInput {
  @Field(() => ID)
  @IsUUID()
  approvalId!: string;

  @Field()
  @IsString()
  decision!: string; // 'approve', 'reject', 'delegate'

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  comments?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  delegatedTo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  delegationReason?: string;
}

@InputType()
export class CreateWorkflowTemplateInput {
  @Field()
  @IsString()
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field()
  @IsString()
  category!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  industry?: string;

  @Field(() => WorkflowDefinitionInput)
  definition!: WorkflowDefinitionInput;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

// Analytics DTOs
@ObjectType()
export class WorkflowAnalytics {
  @Field(() => ID)
  id!: string;

  @Field(() => ID, { nullable: true })
  workflowId?: string;

  @Field(() => ID, { nullable: true })
  instanceId?: string;

  @Field(() => ID)
  companyId!: string;

  @Field()
  metricType!: string;

  @Field(() => GraphQLJSONObject)
  metricValue!: any;

  @Field()
  period!: string;

  @Field()
  date!: Date;

  @Field()
  createdAt!: Date;
}

@ObjectType()
export class WorkflowMetrics {
  @Field(() => Int)
  totalWorkflows!: number;

  @Field(() => Int)
  activeInstances!: number;

  @Field(() => Int)
  completedToday!: number;

  @Field(() => Int)
  overdueTasks!: number;

  @Field(() => Int)
  slaBreaches!: number;

  @Field(() => Float)
  averageCompletionTime!: number;

  @Field(() => [WorkflowCategoryMetric])
  byCategory!: WorkflowCategoryMetric[];
}

@ObjectType()
export class WorkflowCategoryMetric {
  @Field()
  category!: string;

  @Field(() => Int)
  count!: number;

  @Field(() => Float)
  averageTime!: number;
}

@InputType()
export class WorkflowAnalyticsFilter {
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  categories?: string[];

  @Field(() => [WorkflowStatus], { nullable: true })
  @IsOptional()
  @IsArray()
  statuses?: WorkflowStatus[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  workflowIds?: string[];
}
