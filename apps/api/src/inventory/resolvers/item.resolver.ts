import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import {
  CreateItemAttributeDto,
  CreateItemAttributeValueDto,
  CreateItemCategoryDto,
  CreateItemCrossReferenceDto,
  CreateItemDocumentDto,
  CreateItemDto,
  CreateItemLifecycleDto,
  CreateItemPricingTierDto,
  CreateItemVariantDto,
  ItemFilterDto,
  UpdateItemCategoryDto,
  UpdateItemDto,
} from '../dto/item.dto';
import { ItemService } from '../services/item.service';

@Resolver('Item')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ItemResolver {
  constructor(private readonly itemService: ItemService) {}

  @Mutation('createItem')
  @Roles('inventory_manager', 'admin')
  async createItem(
    @Args('input') createItemDto: CreateItemDto,
    @Context() context: any
  ) {
    const userId = context.req.user.id;
    return this.itemService.createItem(createItemDto, userId);
  }

  @Mutation('updateItem')
  @Roles('inventory_manager', 'admin')
  async updateItem(
    @Args('id') id: string,
    @Args('input') updateItemDto: UpdateItemDto,
    @Context() context: any
  ) {
    const userId = context.req.user.id;
    return this.itemService.updateItem(id, updateItemDto, userId);
  }

  @Query('item')
  @Roles('inventory_user', 'inventory_manager', 'admin')
  async getItem(@Args('id') id: string) {
    return this.itemService.getItem(id);
  }

  @Query('items')
  @Roles('inventory_user', 'inventory_manager', 'admin')
  async getItems(
    @Args('filter') filterDto: ItemFilterDto,
    @Context() context: any
  ) {
    const companyId = context.req.user.companyId;
    return this.itemService.getItems(filterDto, companyId);
  }

  @Mutation('deleteItem')
  @Roles('inventory_manager', 'admin')
  async deleteItem(@Args('id') id: string) {
    await this.itemService.deleteItem(id);
    return { success: true };
  }

  @Query('searchItems')
  @Roles('inventory_user', 'inventory_manager', 'admin')
  async searchItems(
    @Args('searchTerm') searchTerm: string,
    @Args('limit', { defaultValue: 10 }) limit: number,
    @Context() context: any
  ) {
    const companyId = context.req.user.companyId;
    return this.itemService.searchItems(searchTerm, companyId, limit);
  }

  @Query('itemByCode')
  @Roles('inventory_user', 'inventory_manager', 'admin')
  async getItemByCode(
    @Args('itemCode') itemCode: string,
    @Context() context: any
  ) {
    const companyId = context.req.user.companyId;
    return this.itemService.getItemByCode(itemCode, companyId);
  }

  // Item Category Resolvers
  @Mutation('createItemCategory')
  @Roles('inventory_manager', 'admin')
  async createItemCategory(
    @Args('input') createCategoryDto: CreateItemCategoryDto
  ) {
    return this.itemService.createItemCategory(createCategoryDto);
  }

  @Mutation('updateItemCategory')
  @Roles('inventory_manager', 'admin')
  async updateItemCategory(
    @Args('id') id: string,
    @Args('input') updateCategoryDto: UpdateItemCategoryDto
  ) {
    return this.itemService.updateItemCategory(id, updateCategoryDto);
  }

  @Query('itemCategories')
  @Roles('inventory_user', 'inventory_manager', 'admin')
  async getItemCategories(@Context() context: any) {
    const companyId = context.req.user.companyId;
    return this.itemService.getItemCategories(companyId);
  }

  @Query('itemCategoryHierarchy')
  @Roles('inventory_user', 'inventory_manager', 'admin')
  async getItemCategoryHierarchy(@Context() context: any) {
    const companyId = context.req.user.companyId;
    return this.itemService.getItemCategoryHierarchy(companyId);
  }

  @Query('itemsByCategory')
  @Roles('inventory_user', 'inventory_manager', 'admin')
  async getItemsByCategory(@Args('categoryId') categoryId: string) {
    return this.itemService.getItemsByCategory(categoryId);
  }

  // Item Attribute Resolvers
  @Mutation('createItemAttribute')
  @Roles('inventory_manager', 'admin')
  async createItemAttribute(
    @Args('input') createAttributeDto: CreateItemAttributeDto
  ) {
    return this.itemService.createItemAttribute(createAttributeDto);
  }

  @Query('itemAttributes')
  @Roles('inventory_user', 'inventory_manager', 'admin')
  async getItemAttributes(@Context() context: any) {
    const companyId = context.req.user.companyId;
    return this.itemService.getItemAttributes(companyId);
  }

  @Mutation('setItemAttributeValue')
  @Roles('inventory_manager', 'admin')
  async setItemAttributeValue(
    @Args('input') createAttributeValueDto: CreateItemAttributeValueDto
  ) {
    return this.itemService.setItemAttributeValue(createAttributeValueDto);
  }

  // Item Variant Resolvers
  @Mutation('createItemVariant')
  @Roles('inventory_manager', 'admin')
  async createItemVariant(
    @Args('input') createVariantDto: CreateItemVariantDto
  ) {
    return this.itemService.createItemVariant(createVariantDto);
  }

  @Query('itemVariants')
  @Roles('inventory_user', 'inventory_manager', 'admin')
  async getItemVariants(@Args('templateItemId') templateItemId: string) {
    return this.itemService.getItemVariants(templateItemId);
  }

  // Item Cross Reference Resolvers
  @Mutation('createItemCrossReference')
  @Roles('inventory_manager', 'admin')
  async createItemCrossReference(
    @Args('input') createCrossRefDto: CreateItemCrossReferenceDto
  ) {
    return this.itemService.createItemCrossReference(createCrossRefDto);
  }

  @Query('itemCrossReferences')
  @Roles('inventory_user', 'inventory_manager', 'admin')
  async getItemCrossReferences(@Args('itemId') itemId: string) {
    return this.itemService.getItemCrossReferences(itemId);
  }

  // Item Document Resolvers
  @Mutation('createItemDocument')
  @Roles('inventory_manager', 'admin')
  async createItemDocument(
    @Args('input') createDocumentDto: CreateItemDocumentDto
  ) {
    return this.itemService.createItemDocument(createDocumentDto);
  }

  @Query('itemDocuments')
  @Roles('inventory_user', 'inventory_manager', 'admin')
  async getItemDocuments(@Args('itemId') itemId: string) {
    return this.itemService.getItemDocuments(itemId);
  }

  // Item Lifecycle Resolvers
  @Mutation('createItemLifecycleEntry')
  @Roles('inventory_manager', 'admin')
  async createItemLifecycleEntry(
    @Args('input') createLifecycleDto: CreateItemLifecycleDto
  ) {
    return this.itemService.createItemLifecycleEntry(createLifecycleDto);
  }

  @Query('itemLifecycle')
  @Roles('inventory_user', 'inventory_manager', 'admin')
  async getItemLifecycle(@Args('itemId') itemId: string) {
    return this.itemService.getItemLifecycle(itemId);
  }

  // Item Pricing Resolvers
  @Mutation('createItemPricingTier')
  @Roles('inventory_manager', 'admin')
  async createItemPricingTier(
    @Args('input') createPricingDto: CreateItemPricingTierDto
  ) {
    return this.itemService.createItemPricingTier(createPricingDto);
  }

  @Query('itemPricingTiers')
  @Roles('inventory_user', 'inventory_manager', 'admin')
  async getItemPricingTiers(
    @Args('itemId') itemId: string,
    @Args('customerId', { nullable: true }) customerId?: string
  ) {
    return this.itemService.getItemPricingTiers(itemId, customerId);
  }
}

