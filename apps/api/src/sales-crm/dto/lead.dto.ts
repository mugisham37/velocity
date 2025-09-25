import { Field, Float, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

@InputType()
export class CreateLeadInput {
  @Field()
  @IsString()
  firstName: string;

  @Field()
  @IsString()
  lastName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  company?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  industry?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  website?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsObject()
  address?: any;

  @Field()
  @IsEnum([
    'Website',
    'Email Campaign',
    'Social Media',
    'Referral',
    'Cold Call',
    'Trade Show',
    'Advertisement',
    'Partner',
    'Other',
  ])
  source:
    | 'Website'
    | 'Email Campaign'
    | 'Social Media'
    | 'Referral'
    | 'Cold Call'
    | 'Trade Show'
    | 'Advertisement'
    | 'Partner'
    | 'Other';

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  territory?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}

@InputType()
export class UpdateLeadInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  company?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  industry?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  website?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsObject()
  address?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum([
    'Website',
    'Email Campaign',
    'Social Media',
    'Referral',
    'Cold Call',
    'Trade Show',
    'Advertisement',
    'Partner',
    'Other',
  ])
  source?:
    | 'Website'
    | 'Email Campaign'
    | 'Social Media'
    | 'Referral'
    | 'Cold Call'
    | 'Trade Show'
    | 'Advertisement'
    | 'Partner'
    | 'Other';

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum([
    'New',
    'Contacted',
    'Qualified',
    'Proposal',
    'Negotiation',
    'Converted',
    'Lost',
    'Unqualified',
  ])
  status?:
    | 'New'
    | 'Contacted'
    | 'Qualified'
    | 'Proposal'
    | 'Negotiation'
    | 'Converted'
    | 'Lost'
    | 'Unqualified';

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  territory?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  nextFollowUpDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}

@InputType()
export class CreateLeadActivityInput {
  @Field(() => ID)
  @IsString()
  leadId: string;

  @Field()
  @IsString()
  activityType: string;

  @Field()
  @IsString()
  subject: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field()
  @IsDateString()
  activityDate: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  outcome?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  nextAction?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  nextActionDate?: string;
}

@InputType()
export class LeadConversionInput {
  @Field()
  createCustomer: boolean;

  @Field()
  createOpportunity: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsObject()
  customerData?: {
    customerName: string;
    customerType?: 'Individual' | 'Company';
    email?: string;
    phone?: string;
    website?: string;
    billingAddress?: any;
    shippingAddress?: any;
  };

  @Field({ nullable: true })
  @IsOptional()
  @IsObject()
  opportunityData?: {
    name: string;
    amount: number;
    expectedCloseDate?: string;
    stage?:
      | 'Prospecting'
      | 'Qualification'
      | 'Needs Analysis'
      | 'Value Proposition'
      | 'Proposal'
      | 'Negotiation';
    probability?: number;
    description?: string;
  };
}

@InputType()
export class LeadFilterInput {
  @Field(() => [String], { nullable: true })
  @IsOptional()
  status?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  source?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  assignedTo?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  territory?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  industry?: string[];

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  minScore?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  nextFollowUpAfter?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  nextFollowUpBefore?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}
