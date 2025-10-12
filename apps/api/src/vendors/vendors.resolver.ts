import type { User } from '@kiro/database';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateVendorCategoryInput,
  CreateVendorContactInput,
  CreateVendorEvaluationInput,
  CreateVendorInput,
  UpdateVendorInput,
} from './dto/create-vendor.dto';
import {
  Vendor,
  VendorAnalytics,
  VendorCategory,
  VendorContact,
  VendorEvaluation,
  VendorPerformanceSummary,
} from './entities/vendor.entity';
import { VendorsService } from './vendors.service';

@Resolver(() => Vendor)
@UseGuards(JwtAuthGuard)
export class VendorsResolver {
  constructor(private readonly vendorsService: VendorsService) {}

  @Mutation(() => Vendor)
  async createVendor(
    @Args('input') input: CreateVendorInput,
    @CurrentUser() user: User
  ): Promise<Vendor> {
    return this.vendorsService.createVendor(
      input,
      user.companyId,
      user.id
    ) as Promise<Vendor>;
  }

  @Mutation(() => Vendor)
  async updateVendor(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateVendorInput,
    @CurrentUser() user: User
  ): Promise<Vendor> {
    return this.vendorsService.updateVendor(
      id,
      input,
      user.companyId,
      user.id
    ) as Promise<Vendor>;
  }

  @Mutation(() => Boolean)
  async deleteVendor(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    await this.vendorsService.delete(id, user.companyId);
    return true;
  }

  @Query(() => Vendor, { nullable: true })
  async vendor(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<Vendor | null> {
    return this.vendorsService.findById(
      id,
      user.companyId
    ) as Promise<Vendor | null>;
  }

  @Query(() => Vendor, { nullable: true })
  async vendorByCode(
    @Args('code') code: string,
    @CurrentUser() user: User
  ): Promise<Vendor | null> {
    return this.vendorsService.findByVendorCode(
      code,
      user.companyId
    ) as Promise<Vendor | null>;
  }

  @Mutation(() => VendorContact)
  async createVendorContact(
    @Args('input') input: CreateVendorContactInput,
    @CurrentUser() user: User
  ): Promise<VendorContact> {
    return this.vendorsService.createVendorContact(
      input,
      user.companyId,
      user.id
    ) as Promise<VendorContact>;
  }

  @Mutation(() => VendorCategory)
  async createVendorCategory(
    @Args('input') input: CreateVendorCategoryInput,
    @CurrentUser() user: User
  ): Promise<VendorCategory> {
    return this.vendorsService.createVendorCategory(
      input,
      user.companyId,
      user.id
    ) as Promise<VendorCategory>;
  }

  @Mutation(() => VendorEvaluation)
  async createVendorEvaluation(
    @Args('input') input: CreateVendorEvaluationInput,
    @CurrentUser() user: User
  ): Promise<VendorEvaluation> {
    return this.vendorsService.createVendorEvaluation(
      {
        vendorId: input.vendorId,
        evaluationDate: new Date(input.evaluationDate),
        overallScore: input.overallScore,
        qualityScore: input.qualityScore ?? null,
        deliveryScore: input.deliveryScore ?? null,
        costScore: input.costScore ?? null,
        serviceScore: input.serviceScore ?? null,
        comments: input.comments ?? null,
        recommendations: input.recommendations ?? null,
        nextEvaluationDate: input.nextEvaluationDate
          ? new Date(input.nextEvaluationDate)
          : null,
      },
      user.companyId,
      user.id
    ) as Promise<VendorEvaluation>;
  }

  @Mutation(() => Boolean)
  async createVendorPortalUser(
    @Args('vendorId', { type: () => ID }) vendorId: string,
    @Args('contactId', { type: () => ID, nullable: true })
    contactId: string | undefined,
    @Args('username') username: string,
    @Args('email') email: string,
    @Args('password') password: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    await this.vendorsService.createPortalUser(
      {
        vendorId,
        contactId: contactId ?? null,
        username,
        email,
        password,
      },
      user.companyId,
      user.id
    );
    return true;
  }

  @Query(() => VendorPerformanceSummary)
  async vendorPerformanceSummary(
    @Args('vendorId', { type: () => ID }) vendorId: string,
    @CurrentUser() user: User
  ): Promise<VendorPerformanceSummary> {
    return this.vendorsService.getVendorPerformanceSummary(
      vendorId,
      user.companyId
    ) as Promise<VendorPerformanceSummary>;
  }

  @Query(() => VendorAnalytics)
  async vendorAnalytics(@CurrentUser() user: User): Promise<VendorAnalytics> {
    return this.vendorsService.getVendorAnalytics(
      user.companyId
    ) as Promise<VendorAnalytics>;
  }
}
