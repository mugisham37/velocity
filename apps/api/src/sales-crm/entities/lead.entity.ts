import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
export class Lead {
  @Field(() => ID)
  id: string;

  @Field()
  leadCode: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  company?: string;

  @Field({ nullable: true })
  jobTitle?: string;

  @Field({ nullable: true })
  industry?: string;

  @Field({ nullable: true })
  website?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  address?: any;

  @Field()
  source: string;

  @Field()
  status: string;

  @Field(() => Int)
  score: number;

  @Field({ nullable: true })
  qualificationNotes?: string;

  @Field(() => ID, { nullable: true })
  assignedTo?: string;

  @Field({ nullable: true })
  territory?: string;

  @Field(() => Float, { nullable: true })
  estimatedValue?: number;

  @Field({ nullable: true })
  expectedCloseDate?: Date;

  @Field({ nullable: true })
  lastContactDate?: Date;

  @Field({ nullable: true })
  nextFollowUpDate?: Date;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  customFields?: Record<string, any>;

  @Field()
  isConverted: boolean;

  @Field(() => ID, { nullable: true })
  convertedCustomerId?: string;

  @Field(() => ID, { nullable: true })
  convertedOpportunityId?: string;

  @Field(() => ID)
  companyId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class LeadActivity {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  leadId: string;

  @Field()
  activityType: string;

  @Field()
  subject: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  activityDate: Date;

  @Field(() => Int, { nullable: true })
  duration?: number;

  @Field({ nullable: true })
  outcome?: string;

  @Field({ nullable: true })
  nextAction?: string;

  @Field({ nullable: true })
  nextActionDate?: Date;

  @Field(() => ID)
  createdBy: string;

  @Field(() => ID)
  companyId: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class LeadScoringRule {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => GraphQLJSON)
  criteria: Record<string, any>;

  @Field(() => Int)
  points: number;

  @Field()
  isActive: boolean;

  @Field(() => ID)
  companyId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class LeadAnalytics {
  @Field(() => Int)
  totalLeads: number;

  @Field(() => Int)
  newLeads: number;

  @Field(() => Int)
  qualifiedLeads: number;

  @Field(() => Int)
  convertedLeads: number;

  @Field(() => Int)
  lostLeads: number;

  @Field(() => Float)
  averageScore: number;

  @Field(() => Float)
  totalEstimatedValue: number;

  @Field(() => Float)
  conversionRate: number;

  @Field(() => [LeadSourceAnalytics])
  leadsBySource: LeadSourceAnalytics[];

  @Field(() => [LeadStatusAnalytics])
  leadsByStatus: LeadStatusAnalytics[];
}

@ObjectType()
export class LeadSourceAnalytics {
  @Field()
  source: string;

  @Field(() => Int)
  count: number;

  @Field(() => Int)
  converted: number;
}

@ObjectType()
export class LeadStatusAnalytics {
  @Field()
  status: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class LeadsConnection {
  @Field(() => [Lead])
  leads: Lead[];

  @Field(() => Int)
  total: number;
}

@ObjectType()
export class LeadConversionResult {
  @Field({ nullable: true })
  customer?: any; // Would be Customer entity

  @Field({ nullable: true })
  opportunity?: any; // Would be Opportunity entity
}
