import { Field, ID, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

@InputType()
export class VendorContactInput {
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
  designation?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  department?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

@InputType()
export class CreateVendorInput {
  @Field()
  @IsString()
  vendorName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['Individual', 'Company'])
  vendorType?: 'Individual' | 'Company';

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  parentVendorId?: string;

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
  website?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  taxId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @Field({ nullable: true })
  @IsOptional()
  billingAddress?: any;

  @Field({ nullable: true })
  @IsOptional()
  shippingAddress?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field(() => [VendorContactInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorContactInput)
  contacts?: VendorContactInput[];

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
}

@InputType()
export class UpdateVendorInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  vendorName?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  parentVendorId?: string;

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
  website?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  taxId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @Field({ nullable: true })
  @IsOptional()
  billingAddress?: any;

  @Field({ nullable: true })
  @IsOptional()
  shippingAddress?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}

@InputType()
export class CreateVendorContactInput {
  @Field(() => ID)
  @IsString()
  vendorId: string;

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
  designation?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  department?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

@InputType()
export class CreateVendorCategoryInput {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  parentCategoryId?: string;
}

@InputType()
export class CreateVendorEvaluationInput {
  @Field(() => ID)
  @IsString()
  vendorId: string;

  @Field()
  @IsDateString()
  evaluationDate: string;

  @Field()
  @IsNumber()
  overallScore: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  qualityScore?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  deliveryScore?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  costScore?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  serviceScore?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  comments?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  recommendations?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  nextEvaluationDate?: string;
}
