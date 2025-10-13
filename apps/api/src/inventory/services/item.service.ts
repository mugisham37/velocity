import {
  DatabaseService,
  itemAttributeValues,
  itemAttributes,
  itemCategories,
  itemCrossReferences,
  itemDocuments,
  itemLifecycle,
  itemPricingTiers,
  itemVariants,
  items,
  type Item,
  type ItemAttribute,
  type ItemAttributeValue,
  type ItemCategory,
  type ItemCrossReference,
  type ItemDocument,
  type ItemLifecycle,
  type ItemPricingTier,
  type ItemVariant,
} from '../../database';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, or, sql } from '../../database';
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

@Injectable()
export class ItemService {
  constructor(private readonly db: DatabaseService) {}

  // Item Management
  async createItem(
    createItemDto: CreateItemDto,
    userId: string
  ): Promise<Item> {
    // Check if item code already exists for the company
    const existingItem = await this.db.db
      .select()
      .from(items)
      .where(
        and(
          eq(items.itemCode, createItemDto.itemCode),
          eq(items.companyId, createItemDto.companyId)
        )
      )
      .limit(1);

    if (existingItem.length > 0) {
      throw new ConflictException(
        `Item with code '${createItemDto.itemCode}' already exists`
      );
    }

    // Validate category if provided
    if (createItemDto.categoryId) {
      const category = await this.db.db
        .select()
        .from(itemCategories)
        .where(
          and(
            eq(itemCategories.id, createItemDto.categoryId),
            eq(itemCategories.companyId, createItemDto.companyId)
          )
        )
        .limit(1);

      if (category.length === 0) {
        throw new NotFoundException('Item category not found');
      }
    }

    // Validate template item if provided
    if (createItemDto.templateItemId) {
      const templateItem = await this.db.db
        .select()
        .from(items)
        .where(
          and(
            eq(items.id, createItemDto.templateItemId),
            eq(items.companyId, createItemDto.companyId),
            eq(items.hasVariants, true)
          )
        )
        .limit(1);

      if (templateItem.length === 0) {
        throw new NotFoundException(
          'Template item not found or does not support variants'
        );
      }
    }

    // Prepare data for insertion, converting types as needed
    const insertData = {
      ...createItemDto,
      // Convert numeric fields to strings for decimal columns, use null instead of undefined
      length: createItemDto.length?.toString() || null,
      width: createItemDto.width?.toString() || null,
      height: createItemDto.height?.toString() || null,
      weight: createItemDto.weight?.toString() || null,
      standardRate: createItemDto.standardRate?.toString() || null,
      valuationRate: createItemDto.valuationRate?.toString() || null,
      salesUomConversionFactor: createItemDto.salesUomConversionFactor?.toString() || null,
      purchaseUomConversionFactor: createItemDto.purchaseUomConversionFactor?.toString() || null,
      reorderLevel: createItemDto.reorderLevel?.toString() || null,
      reorderQty: createItemDto.reorderQty?.toString() || null,
      minOrderQty: createItemDto.minOrderQty?.toString() || null,
      maxOrderQty: createItemDto.maxOrderQty?.toString() || null,
      createdBy: userId,
      updatedBy: userId,
    };

    const [newItem] = await this.db.db
      .insert(items)
      .values(insertData)
      .returning();

    if (!newItem) {
      throw new Error('Failed to create item');
    }

    return newItem;
  }

  async updateItem(
    id: string,
    updateItemDto: UpdateItemDto,
    userId: string
  ): Promise<Item> {
    const existingItem = await this.db.db
      .select()
      .from(items)
      .where(eq(items.id, id))
      .limit(1);

    if (existingItem.length === 0) {
      throw new NotFoundException('Item not found');
    }

    const item = existingItem[0];
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Validate category if provided
    if (updateItemDto.categoryId) {
      const category = await this.db.db
        .select()
        .from(itemCategories)
        .where(
          and(
            eq(itemCategories.id, updateItemDto.categoryId),
            eq(itemCategories.companyId, item.companyId)
          )
        )
        .limit(1);

      if (category.length === 0) {
        throw new NotFoundException('Item category not found');
      }
    }

    // Validate replacement item if provided
    if (updateItemDto.replacementItemId) {
      const replacementItem = await this.db.db
        .select()
        .from(items)
        .where(
          and(
            eq(items.id, updateItemDto.replacementItemId),
            eq(items.companyId, item.companyId)
          )
        )
        .limit(1);

      if (replacementItem.length === 0) {
        throw new NotFoundException('Replacement item not found');
      }
    }

    // Prepare update data, converting types as needed
    const updateData = {
      ...updateItemDto,
      // Convert date strings to Date objects, use null instead of undefined
      discontinuedDate: updateItemDto.discontinuedDate ? new Date(updateItemDto.discontinuedDate) : null,
      // Convert numeric fields to strings for decimal columns, use null instead of undefined
      length: updateItemDto.length?.toString() || null,
      width: updateItemDto.width?.toString() || null,
      height: updateItemDto.height?.toString() || null,
      weight: updateItemDto.weight?.toString() || null,
      standardRate: updateItemDto.standardRate?.toString() || null,
      valuationRate: updateItemDto.valuationRate?.toString() || null,
      salesUomConversionFactor: updateItemDto.salesUomConversionFactor?.toString() || null,
      purchaseUomConversionFactor: updateItemDto.purchaseUomConversionFactor?.toString() || null,
      reorderLevel: updateItemDto.reorderLevel?.toString() || null,
      reorderQty: updateItemDto.reorderQty?.toString() || null,
      minOrderQty: updateItemDto.minOrderQty?.toString() || null,
      maxOrderQty: updateItemDto.maxOrderQty?.toString() || null,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    const [updatedItem] = await this.db.db
      .update(items)
      .set(updateData)
      .where(eq(items.id, id))
      .returning();

    if (!updatedItem) {
      throw new Error('Failed to update item');
    }

    return updatedItem;
  }

  async getItem(id: string): Promise<
    Item & {
      category?: ItemCategory | undefined;
      attributeValues?: (ItemAttributeValue & { attribute: ItemAttribute })[] | undefined;
      documents?: ItemDocument[] | undefined;
      lifecycle?: ItemLifecycle[] | undefined;
      crossReferences?: (ItemCrossReference & { referenceItem: Item })[] | undefined;
      pricingTiers?: ItemPricingTier[] | undefined;
    }
  > {
    // Get the main item
    const itemResult = await this.db.db
      .select()
      .from(items)
      .where(eq(items.id, id))
      .limit(1);

    if (itemResult.length === 0) {
      throw new NotFoundException('Item not found');
    }

    const item = itemResult[0];
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Get related data separately for now (can be optimized with joins later)
    const [
      category,
      attributeValues,
      documents,
      lifecycle,
      crossReferences,
      pricingTiers,
    ] = await Promise.all([
      // Category
      item.categoryId
        ? this.db.db
            .select()
            .from(itemCategories)
            .where(eq(itemCategories.id, item.categoryId))
            .limit(1)
            .then((result) => result[0] || null)
        : Promise.resolve(null),
      
      // Attribute values (simplified for now)
      this.db.db
        .select()
        .from(itemAttributeValues)
        .where(eq(itemAttributeValues.itemId, id))
        .then((values) => values as any[]),
      
      // Documents
      this.db.db
        .select()
        .from(itemDocuments)
        .where(
          and(
            eq(itemDocuments.itemId, id),
            eq(itemDocuments.isActive, true)
          )
        ),
      
      // Lifecycle
      this.db.db
        .select()
        .from(itemLifecycle)
        .where(eq(itemLifecycle.itemId, id))
        .orderBy(desc(itemLifecycle.effectiveDate)),
      
      // Cross references (simplified for now)
      this.db.db
        .select()
        .from(itemCrossReferences)
        .where(
          and(
            eq(itemCrossReferences.itemId, id),
            eq(itemCrossReferences.isActive, true)
          )
        )
        .then((refs) => refs as any[]),
      
      // Pricing tiers
      this.db.db
        .select()
        .from(itemPricingTiers)
        .where(
          and(
            eq(itemPricingTiers.itemId, id),
            eq(itemPricingTiers.isActive, true)
          )
        ),
    ]);

    // Ensure all required properties are present
    const result = {
      ...item,
      // Ensure all required properties from Item type are present
      length: item.length || null,
      width: item.width || null,
      height: item.height || null,
      weight: item.weight || null,
      dimensionUom: item.dimensionUom || null,
      weightUom: item.weightUom || null,
      brand: item.brand || null,
      manufacturer: item.manufacturer || null,
      manufacturerPartNo: item.manufacturerPartNo || null,
      countryOfOrigin: item.countryOfOrigin || null,
      hsCode: item.hsCode || null,
      barcode: item.barcode || null,
      barcodeType: item.barcodeType || null,
      taxCategory: item.taxCategory || null,
      incomeAccount: item.incomeAccount || null,
      expenseAccount: item.expenseAccount || null,
      costOfGoodsSoldAccount: item.costOfGoodsSoldAccount || null,
      assetAccount: item.assetAccount || null,
      salesUom: item.salesUom || null,
      purchaseUom: item.purchaseUom || null,
      qualityInspectionTemplate: item.qualityInspectionTemplate || null,
      maxOrderQty: item.maxOrderQty || null,
      discontinuedDate: item.discontinuedDate || null,
      replacementItemId: item.replacementItemId || null,
      templateItemId: item.templateItemId || null,
      categoryId: item.categoryId || null,
      itemGroup: item.itemGroup || null,
      description: item.description || null,
      createdBy: item.createdBy || null,
      updatedBy: item.updatedBy || null,
      // Add the related data
      category: category || undefined,
      attributeValues,
      documents,
      lifecycle,
      crossReferences,
      pricingTiers,
    };

    return result;
  }

  async getItems(
    filterDto: ItemFilterDto,
    companyId: string
  ): Promise<{
    items: Item[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'itemName',
      sortOrder = 'asc',
      ...filters
    } = filterDto;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(items.companyId, companyId)];

    if (filters.search) {
      whereConditions.push(
        or(
          ilike(items.itemCode, `%${filters.search}%`),
          ilike(items.itemName, `%${filters.search}%`),
          ilike(items.description, `%${filters.search}%`)
        )!
      );
    }

    if (filters.categoryId) {
      whereConditions.push(eq(items.categoryId, filters.categoryId));
    }

    if (filters.itemType) {
      whereConditions.push(eq(items.itemType, filters.itemType));
    }

    if (filters.currentStage) {
      whereConditions.push(eq(items.currentStage, filters.currentStage));
    }

    if (filters.brand) {
      whereConditions.push(eq(items.brand, filters.brand));
    }

    if (filters.manufacturer) {
      whereConditions.push(eq(items.manufacturer, filters.manufacturer));
    }

    if (filters.isActive !== undefined) {
      whereConditions.push(eq(items.isActive, filters.isActive));
    }

    if (filters.isSalesItem !== undefined) {
      whereConditions.push(eq(items.isSalesItem, filters.isSalesItem));
    }

    if (filters.isPurchaseItem !== undefined) {
      whereConditions.push(eq(items.isPurchaseItem, filters.isPurchaseItem));
    }

    if (filters.hasVariants !== undefined) {
      whereConditions.push(eq(items.hasVariants, filters.hasVariants));
    }

    if (filters.hasSerialNo !== undefined) {
      whereConditions.push(eq(items.hasSerialNo, filters.hasSerialNo));
    }

    if (filters.hasBatchNo !== undefined) {
      whereConditions.push(eq(items.hasBatchNo, filters.hasBatchNo));
    }

    const whereClause = and(...whereConditions);

    // Get total count
    const countResult = await this.db.db
      .select({ count: count() })
      .from(items)
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count) || 0;

    // Get items with pagination and sorting
    const validSortColumns = ['itemName', 'itemCode', 'createdAt', 'updatedAt'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'itemName';
    
    let orderByClause;
    if (sortColumn === 'itemName') {
      orderByClause = sortOrder === 'desc' ? desc(items.itemName) : asc(items.itemName);
    } else if (sortColumn === 'itemCode') {
      orderByClause = sortOrder === 'desc' ? desc(items.itemCode) : asc(items.itemCode);
    } else if (sortColumn === 'createdAt') {
      orderByClause = sortOrder === 'desc' ? desc(items.createdAt) : asc(items.createdAt);
    } else {
      orderByClause = sortOrder === 'desc' ? desc(items.updatedAt) : asc(items.updatedAt);
    }

    const itemsList = await this.db.db
      .select()
      .from(items)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      items: itemsList,
      total: totalCount,
      page,
      limit,
      totalPages,
    };
  }

  async deleteItem(id: string): Promise<void> {
    const existingItem = await this.db.db
      .select()
      .from(items)
      .where(eq(items.id, id))
      .limit(1);

    if (existingItem.length === 0) {
      throw new NotFoundException('Item not found');
    }

    // Check if item is used in any transactions (this would be implemented based on other modules)
    // For now, we'll just delete the item
    await this.db.db.delete(items).where(eq(items.id, id));
  }

  // Item Category Management
  async createItemCategory(
    createCategoryDto: CreateItemCategoryDto
  ): Promise<ItemCategory> {
    // Check if category code already exists for the company
    const existingCategory = await this.db.db
      .select()
      .from(itemCategories)
      .where(
        and(
          eq(itemCategories.categoryCode, createCategoryDto.categoryCode),
          eq(itemCategories.companyId, createCategoryDto.companyId)
        )
      )
      .limit(1);

    if (existingCategory.length > 0) {
      throw new ConflictException(
        `Category with code '${createCategoryDto.categoryCode}' already exists`
      );
    }

    // Validate parent category if provided
    if (createCategoryDto.parentCategoryId) {
      const parentCategory = await this.db.db
        .select()
        .from(itemCategories)
        .where(
          and(
            eq(itemCategories.id, createCategoryDto.parentCategoryId),
            eq(itemCategories.companyId, createCategoryDto.companyId)
          )
        )
        .limit(1);

      if (parentCategory.length === 0) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const [newCategory] = await this.db.db
      .insert(itemCategories)
      .values(createCategoryDto)
      .returning();

    if (!newCategory) {
      throw new Error('Failed to create category');
    }

    return newCategory;
  }

  async updateItemCategory(
    id: string,
    updateCategoryDto: UpdateItemCategoryDto
  ): Promise<ItemCategory> {
    const existingCategory = await this.db.db
      .select()
      .from(itemCategories)
      .where(eq(itemCategories.id, id))
      .limit(1);

    if (existingCategory.length === 0) {
      throw new NotFoundException('Category not found');
    }

    const category = existingCategory[0];
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Validate parent category if provided
    if (updateCategoryDto.parentCategoryId) {
      const parentCategory = await this.db.db
        .select()
        .from(itemCategories)
        .where(
          and(
            eq(itemCategories.id, updateCategoryDto.parentCategoryId),
            eq(itemCategories.companyId, category.companyId)
          )
        )
        .limit(1);

      if (parentCategory.length === 0) {
        throw new NotFoundException('Parent category not found');
      }

      // Prevent circular reference
      if (updateCategoryDto.parentCategoryId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }
    }

    const [updatedCategory] = await this.db.db
      .update(itemCategories)
      .set({
        ...updateCategoryDto,
        updatedAt: new Date(),
      })
      .where(eq(itemCategories.id, id))
      .returning();

    if (!updatedCategory) {
      throw new Error('Failed to update category');
    }

    return updatedCategory;
  }

  async getItemCategories(companyId: string): Promise<ItemCategory[]> {
    return this.db.db
      .select()
      .from(itemCategories)
      .where(eq(itemCategories.companyId, companyId))
      .orderBy(asc(itemCategories.categoryName));
  }

  async getItemCategoryHierarchy(companyId: string): Promise<ItemCategory[]> {
    // Get root categories (no parent)
    return this.db.db
      .select()
      .from(itemCategories)
      .where(
        and(
          eq(itemCategories.companyId, companyId),
          sql`${itemCategories.parentCategoryId} IS NULL`
        )
      )
      .orderBy(asc(itemCategories.categoryName));
  }

  // Item Attribute Management
  async createItemAttribute(
    createAttributeDto: CreateItemAttributeDto
  ): Promise<ItemAttribute> {
    const [newAttribute] = await this.db.db
      .insert(itemAttributes)
      .values(createAttributeDto)
      .returning();

    if (!newAttribute) {
      throw new Error('Failed to create attribute');
    }

    return newAttribute;
  }

  async getItemAttributes(companyId: string): Promise<ItemAttribute[]> {
    return this.db.db
      .select()
      .from(itemAttributes)
      .where(eq(itemAttributes.companyId, companyId))
      .orderBy(asc(itemAttributes.attributeName));
  }

  async setItemAttributeValue(
    createAttributeValueDto: CreateItemAttributeValueDto
  ): Promise<ItemAttributeValue> {
    // Check if attribute value already exists
    const existingValue = await this.db.db
      .select()
      .from(itemAttributeValues)
      .where(
        and(
          eq(itemAttributeValues.itemId, createAttributeValueDto.itemId),
          eq(itemAttributeValues.attributeId, createAttributeValueDto.attributeId)
        )
      )
      .limit(1);

    if (existingValue.length > 0 && existingValue[0]) {
      // Update existing value
      const [updatedValue] = await this.db.db
        .update(itemAttributeValues)
        .set({
          value: createAttributeValueDto.value,
          updatedAt: new Date(),
        })
        .where(eq(itemAttributeValues.id, existingValue[0].id))
        .returning();

      if (!updatedValue) {
        throw new Error('Failed to update attribute value');
      }

      return updatedValue;
    } else {
      // Create new value
      const [newValue] = await this.db.db
        .insert(itemAttributeValues)
        .values(createAttributeValueDto)
        .returning();

      if (!newValue) {
        throw new Error('Failed to create attribute value');
      }

      return newValue;
    }
  }

  // Item Variant Management
  async createItemVariant(
    createVariantDto: CreateItemVariantDto
  ): Promise<ItemVariant> {
    // Validate template item
    const templateItem = await this.db.db
      .select()
      .from(items)
      .where(
        and(
          eq(items.id, createVariantDto.templateItemId),
          eq(items.hasVariants, true)
        )
      )
      .limit(1);

    if (templateItem.length === 0) {
      throw new NotFoundException(
        'Template item not found or does not support variants'
      );
    }

    // Validate variant item
    const variantItem = await this.db.db
      .select()
      .from(items)
      .where(eq(items.id, createVariantDto.variantItemId))
      .limit(1);

    if (variantItem.length === 0) {
      throw new NotFoundException('Variant item not found');
    }

    // Ensure variantAttributes is provided
    const insertData = {
      ...createVariantDto,
      variantAttributes: createVariantDto.variantAttributes || {},
    };

    const [newVariant] = await this.db.db
      .insert(itemVariants)
      .values(insertData)
      .returning();

    if (!newVariant) {
      throw new Error('Failed to create variant');
    }

    return newVariant;
  }

  async getItemVariants(
    templateItemId: string
  ): Promise<(ItemVariant & { variantItem: Item })[]> {
    // Get variants and their items separately for now
    const variants = await this.db.db
      .select()
      .from(itemVariants)
      .where(eq(itemVariants.templateItemId, templateItemId));

    const variantsWithItems = await Promise.all(
      variants.map(async (variant) => {
        const variantItem = await this.db.db
          .select()
          .from(items)
          .where(eq(items.id, variant.variantItemId))
          .limit(1);
        
        if (!variantItem[0]) {
          throw new NotFoundException(`Variant item not found for variant ${variant.id}`);
        }
        
        return {
          ...variant,
          variantItem: variantItem[0],
        };
      })
    );

    return variantsWithItems;
  }

  // Item Cross Reference Management
  async createItemCrossReference(
    createCrossRefDto: CreateItemCrossReferenceDto
  ): Promise<ItemCrossReference> {
    // Validate both items exist
    const [item, referenceItem] = await Promise.all([
      this.db.db
        .select()
        .from(items)
        .where(eq(items.id, createCrossRefDto.itemId))
        .limit(1),
      this.db.db
        .select()
        .from(items)
        .where(eq(items.id, createCrossRefDto.referenceItemId))
        .limit(1),
    ]);

    if (item.length === 0 || referenceItem.length === 0) {
      throw new NotFoundException('One or both items not found');
    }

    if (createCrossRefDto.itemId === createCrossRefDto.referenceItemId) {
      throw new BadRequestException('Item cannot reference itself');
    }

    const [newCrossRef] = await this.db.db
      .insert(itemCrossReferences)
      .values(createCrossRefDto)
      .returning();

    if (!newCrossRef) {
      throw new Error('Failed to create cross reference');
    }

    return newCrossRef;
  }

  async getItemCrossReferences(
    itemId: string
  ): Promise<(ItemCrossReference & { referenceItem: Item })[]> {
    const crossRefs = await this.db.db
      .select()
      .from(itemCrossReferences)
      .where(
        and(
          eq(itemCrossReferences.itemId, itemId),
          eq(itemCrossReferences.isActive, true)
        )
      )
      .orderBy(
        asc(itemCrossReferences.referenceType),
        asc(itemCrossReferences.priority)
      );

    const crossRefsWithItems = await Promise.all(
      crossRefs.map(async (crossRef) => {
        const referenceItem = await this.db.db
          .select()
          .from(items)
          .where(eq(items.id, crossRef.referenceItemId))
          .limit(1);
        
        if (!referenceItem[0]) {
          throw new NotFoundException(`Reference item not found for cross reference ${crossRef.id}`);
        }
        
        return {
          ...crossRef,
          referenceItem: referenceItem[0],
        };
      })
    );

    return crossRefsWithItems;
  }

  // Item Document Management
  async createItemDocument(
    createDocumentDto: CreateItemDocumentDto
  ): Promise<ItemDocument> {
    // If this is set as primary, unset other primary documents of the same type
    if (createDocumentDto.isPrimary) {
      await this.db.db
        .update(itemDocuments)
        .set({ isPrimary: false })
        .where(
          and(
            eq(itemDocuments.itemId, createDocumentDto.itemId),
            eq(itemDocuments.documentType, createDocumentDto.documentType),
            eq(itemDocuments.isPrimary, true)
          )
        );
    }

    const [newDocument] = await this.db.db
      .insert(itemDocuments)
      .values(createDocumentDto)
      .returning();

    if (!newDocument) {
      throw new Error('Failed to create document');
    }

    return newDocument;
  }

  async getItemDocuments(itemId: string): Promise<ItemDocument[]> {
    return this.db.db
      .select()
      .from(itemDocuments)
      .where(
        and(
          eq(itemDocuments.itemId, itemId),
          eq(itemDocuments.isActive, true)
        )
      )
      .orderBy(desc(itemDocuments.isPrimary), asc(itemDocuments.documentType));
  }

  // Item Lifecycle Management
  async createItemLifecycleEntry(
    createLifecycleDto: CreateItemLifecycleDto
  ): Promise<ItemLifecycle> {
    // Convert string date to Date object
    const insertData = {
      ...createLifecycleDto,
      effectiveDate: new Date(createLifecycleDto.effectiveDate),
    };

    const [newLifecycleEntry] = await this.db.db
      .insert(itemLifecycle)
      .values(insertData)
      .returning();

    if (!newLifecycleEntry) {
      throw new Error('Failed to create lifecycle entry');
    }

    // Update item's current stage
    await this.db.db
      .update(items)
      .set({
        currentStage: createLifecycleDto.stage,
        discontinuedDate:
          createLifecycleDto.stage === 'Discontinuation'
            ? new Date(createLifecycleDto.effectiveDate)
            : null,
      })
      .where(eq(items.id, createLifecycleDto.itemId));

    return newLifecycleEntry;
  }

  async getItemLifecycle(itemId: string): Promise<ItemLifecycle[]> {
    return this.db.db
      .select()
      .from(itemLifecycle)
      .where(eq(itemLifecycle.itemId, itemId))
      .orderBy(desc(itemLifecycle.effectiveDate));
  }

  // Item Pricing Management
  async createItemPricingTier(
    createPricingDto: CreateItemPricingTierDto
  ): Promise<ItemPricingTier> {
    // Convert data types for database insertion
    const insertData = {
      ...createPricingDto,
      minQty: createPricingDto.minQty.toString(),
      maxQty: createPricingDto.maxQty?.toString() || null,
      rate: createPricingDto.rate.toString(),
      discountPercent: createPricingDto.discountPercent?.toString() || null,
      validFrom: new Date(createPricingDto.validFrom),
      validUpto: createPricingDto.validUpto ? new Date(createPricingDto.validUpto) : null,
    };

    const [newPricingTier] = await this.db.db
      .insert(itemPricingTiers)
      .values(insertData)
      .returning();

    if (!newPricingTier) {
      throw new Error('Failed to create pricing tier');
    }

    return newPricingTier;
  }

  async getItemPricingTiers(
    itemId: string,
    customerId?: string
  ): Promise<ItemPricingTier[]> {
    const whereConditions = [
      eq(itemPricingTiers.itemId, itemId),
      eq(itemPricingTiers.isActive, true),
    ];

    if (customerId) {
      whereConditions.push(
        or(
          eq(itemPricingTiers.customerId, customerId),
          sql`${itemPricingTiers.customerId} IS NULL`
        )!
      );
    }

    return this.db.db
      .select()
      .from(itemPricingTiers)
      .where(and(...whereConditions))
      .orderBy(
        desc(itemPricingTiers.customerId), // Customer-specific pricing first
        asc(itemPricingTiers.minQty)
      );
  }

  // Utility Methods
  async getItemByCode(
    itemCode: string,
    companyId: string
  ): Promise<Item | null> {
    const result = await this.db.db
      .select()
      .from(items)
      .where(and(eq(items.itemCode, itemCode), eq(items.companyId, companyId)))
      .limit(1);
    
    return result[0] || null;
  }

  async getItemsByCategory(categoryId: string): Promise<Item[]> {
    return this.db.db
      .select()
      .from(items)
      .where(eq(items.categoryId, categoryId))
      .orderBy(asc(items.itemName));
  }

  async searchItems(
    searchTerm: string,
    companyId: string,
    limit: number = 10
  ): Promise<Item[]> {
    return this.db.db
      .select()
      .from(items)
      .where(
        and(
          eq(items.companyId, companyId),
          eq(items.isActive, true),
          or(
            ilike(items.itemCode, `%${searchTerm}%`),
            ilike(items.itemName, `%${searchTerm}%`),
            ilike(items.barcode, `%${searchTerm}%`)
          )!
        )
      )
      .limit(limit)
      .orderBy(asc(items.itemName));
  }
}

