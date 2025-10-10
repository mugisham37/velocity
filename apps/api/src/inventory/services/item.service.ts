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
  type ItemDocument,
  type ItemLifecycle,
  type ItemPricingTier,
  type ItemVariant,
} from '@kiro/database';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, or, sql } from '@kiro/database';
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
    const existingItem = await this.db.query.items.findFirst({
      where: and(
        eq(items.itemCode, createItemDto.itemCode),
        eq(items.companyId, createItemDto.companyId)
      ),
    });

    if (existingItem) {
      throw new ConflictException(
        `Item with code '${createItemDto.itemCode}' already exists`
      );
    }

    // Validate category if provided
    if (createItemDto.categoryId) {
      const category = await this.db.query.itemCategories.findFirst({
        where: and(
          eq(itemCategories.id, createItemDto.categoryId),
          eq(itemCategories.companyId, createItemDto.companyId)
        ),
      });

      if (!category) {
        throw new NotFoundException('Item category not found');
      }
    }

    // Validate template item if provided
    if (createItemDto.templateItemId) {
      const templateItem = await this.db.query.items.findFirst({
        where: and(
          eq(items.id, createItemDto.templateItemId),
          eq(items.companyId, createItemDto.companyId),
          eq(items.hasVariants, true)
        ),
      });

      if (!templateItem) {
        throw new NotFoundException(
          'Template item not found or does not support variants'
        );
      }
    }

    const [newItem] = await this.db
      .insert(items)
      .values({
        ...createItemDto,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return newItem;
  }

  async updateItem(
    id: string,
    updateItemDto: UpdateItemDto,
    userId: string
  ): Promise<Item> {
    const existingItem = await this.db.query.items.findFirst({
      where: eq(items.id, id),
    });

    if (!existingItem) {
      throw new NotFoundException('Item not found');
    }

    // Validate category if provided
    if (updateItemDto.categoryId) {
      const category = await this.db.query.itemCategories.findFirst({
        where: and(
          eq(itemCategories.id, updateItemDto.categoryId),
          eq(itemCategories.companyId, existingItem.companyId)
        ),
      });

      if (!category) {
        throw new NotFoundException('Item category not found');
      }
    }

    // Validate replacement item if provided
    if (updateItemDto.replacementItemId) {
      const replacementItem = await this.db.query.items.findFirst({
        where: and(
          eq(items.id, updateItemDto.replacementItemId),
          eq(items.companyId, existingItem.companyId)
        ),
      });

      if (!replacementItem) {
        throw new NotFoundException('Replacement item not found');
      }
    }

    const [updatedItem] = await this.db
      .update(items)
      .set({
        ...updateItemDto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(items.id, id))
      .returning();

    return updatedItem;
  }

  async getItem(id: string): Promise<
    Item & {
      category?: ItemCategory;
      attributeValues?: (ItemAttributeValue & { attribute: ItemAttribute })[];
      documents?: ItemDocument[];
      lifecycle?: ItemLifecycle[];
      crossReferences?: (ItemCrossReference & { referenceItem: Item })[];
      pricingTiers?: ItemPricingTier[];
    }
  > {
    const item = await this.db.query.items.findFirst({
      where: eq(items.id, id),
      with: {
        category: true,
        attributeValues: {
          with: {
            attribute: true,
          },
        },
        documents: true,
        lifecycle: {
          orderBy: desc(itemLifecycle.effectiveDate),
        },
        crossReferences: {
          with: {
            referenceItem: true,
          },
        },
        pricingTiers: {
          where: eq(itemPricingTiers.isActive, true),
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    return item;
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
        )
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
    const [{ count: totalCount }] = await this.db
      .select({ count: count() })
      .from(items)
      .where(whereClause);

    // Get items with pagination and sorting
    const orderBy =
      sortOrder === 'desc' ? desc(items[sortBy]) : asc(items[sortBy]);

    const itemsList = await this.db.query.items.findMany({
      where: whereClause,
      with: {
        category: true,
      },
      orderBy,
      limit,
      offset,
    });

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
    const existingItem = await this.db.query.items.findFirst({
      where: eq(items.id, id),
    });

    if (!existingItem) {
      throw new NotFoundException('Item not found');
    }

    // Check if item is used in any transactions (this would be implemented based on other modules)
    // For now, we'll just delete the item
    await this.db.delete(items).where(eq(items.id, id));
  }

  // Item Category Management
  async createItemCategory(
    createCategoryDto: CreateItemCategoryDto
  ): Promise<ItemCategory> {
    // Check if category code already exists for the company
    const existingCategory = await this.db.query.itemCategories.findFirst({
      where: and(
        eq(itemCategories.categoryCode, createCategoryDto.categoryCode),
        eq(itemCategories.companyId, createCategoryDto.companyId)
      ),
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category with code '${createCategoryDto.categoryCode}' already exists`
      );
    }

    // Validate parent category if provided
    if (createCategoryDto.parentCategoryId) {
      const parentCategory = await this.db.query.itemCategories.findFirst({
        where: and(
          eq(itemCategories.id, createCategoryDto.parentCategoryId),
          eq(itemCategories.companyId, createCategoryDto.companyId)
        ),
      });

      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const [newCategory] = await this.db
      .insert(itemCategories)
      .values(createCategoryDto)
      .returning();

    return newCategory;
  }

  async updateItemCategory(
    id: string,
    updateCategoryDto: UpdateItemCategoryDto
  ): Promise<ItemCategory> {
    const existingCategory = await this.db.query.itemCategories.findFirst({
      where: eq(itemCategories.id, id),
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    // Validate parent category if provided
    if (updateCategoryDto.parentCategoryId) {
      const parentCategory = await this.db.query.itemCategories.findFirst({
        where: and(
          eq(itemCategories.id, updateCategoryDto.parentCategoryId),
          eq(itemCategories.companyId, existingCategory.companyId)
        ),
      });

      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }

      // Prevent circular reference
      if (updateCategoryDto.parentCategoryId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }
    }

    const [updatedCategory] = await this.db
      .update(itemCategories)
      .set({
        ...updateCategoryDto,
        updatedAt: new Date(),
      })
      .where(eq(itemCategories.id, id))
      .returning();

    return updatedCategory;
  }

  async getItemCategories(companyId: string): Promise<ItemCategory[]> {
    return this.db.query.itemCategories.findMany({
      where: eq(itemCategories.companyId, companyId),
      with: {
        childCategories: true,
      },
      orderBy: asc(itemCategories.categoryName),
    });
  }

  async getItemCategoryHierarchy(companyId: string): Promise<ItemCategory[]> {
    // Get root categories (no parent)
    return this.db.query.itemCategories.findMany({
      where: and(
        eq(itemCategories.companyId, companyId),
        sql`${itemCategories.parentCategoryId} IS NULL`
      ),
      with: {
        childCategories: {
          with: {
            childCategories: {
              with: {
                childCategories: true, // Support up to 4 levels
              },
            },
          },
        },
      },
      orderBy: asc(itemCategories.categoryName),
    });
  }

  // Item Attribute Management
  async createItemAttribute(
    createAttributeDto: CreateItemAttributeDto
  ): Promise<ItemAttribute> {
    const [newAttribute] = await this.db
      .insert(itemAttributes)
      .values(createAttributeDto)
      .returning();

    return newAttribute;
  }

  async getItemAttributes(companyId: string): Promise<ItemAttribute[]> {
    return this.db.query.itemAttributes.findMany({
      where: eq(itemAttributes.companyId, companyId),
      orderBy: asc(itemAttributes.attributeName),
    });
  }

  async setItemAttributeValue(
    createAttributeValueDto: CreateItemAttributeValueDto
  ): Promise<ItemAttributeValue> {
    // Check if attribute value already exists
    const existingValue = await this.db.query.itemAttributeValues.findFirst({
      where: and(
        eq(itemAttributeValues.itemId, createAttributeValueDto.itemId),
        eq(itemAttributeValues.attributeId, createAttributeValueDto.attributeId)
      ),
    });

    if (existingValue) {
      // Update existing value
      const [updatedValue] = await this.db
        .update(itemAttributeValues)
        .set({
          value: createAttributeValueDto.value,
          updatedAt: new Date(),
        })
        .where(eq(itemAttributeValues.id, existingValue.id))
        .returning();

      return updatedValue;
    } else {
      // Create new value
      const [newValue] = await this.db
        .insert(itemAttributeValues)
        .values(createAttributeValueDto)
        .returning();

      return newValue;
    }
  }

  // Item Variant Management
  async createItemVariant(
    createVariantDto: CreateItemVariantDto
  ): Promise<ItemVariant> {
    // Validate template item
    const templateItem = await this.db.query.items.findFirst({
      where: and(
        eq(items.id, createVariantDto.templateItemId),
        eq(items.hasVariants, true)
      ),
    });

    if (!templateItem) {
      throw new NotFoundException(
        'Template item not found or does not support variants'
      );
    }

    // Validate variant item
    const variantItem = await this.db.query.items.findFirst({
      where: eq(items.id, createVariantDto.variantItemId),
    });

    if (!variantItem) {
      throw new NotFoundException('Variant item not found');
    }

    const [newVariant] = await this.db
      .insert(itemVariants)
      .values(createVariantDto)
      .returning();

    return newVariant;
  }

  async getItemVariants(
    templateItemId: string
  ): Promise<(ItemVariant & { variantItem: Item })[]> {
    return this.db.query.itemVariants.findMany({
      where: eq(itemVariants.templateItemId, templateItemId),
      with: {
        variantItem: true,
      },
    });
  }

  // Item Cross Reference Management
  async createItemCrossReference(
    createCrossRefDto: CreateItemCrossReferenceDto
  ): Promise<ItemCrossReference> {
    // Validate both items exist
    const [item, referenceItem] = await Promise.all([
      this.db.query.items.findFirst({
        where: eq(items.id, createCrossRefDto.itemId),
      }),
      this.db.query.items.findFirst({
        where: eq(items.id, createCrossRefDto.referenceItemId),
      }),
    ]);

    if (!item || !referenceItem) {
      throw new NotFoundException('One or both items not found');
    }

    if (createCrossRefDto.itemId === createCrossRefDto.referenceItemId) {
      throw new BadRequestException('Item cannot reference itself');
    }

    const [newCrossRef] = await this.db
      .insert(itemCrossReferences)
      .values(createCrossRefDto)
      .returning();

    return newCrossRef;
  }

  async getItemCrossReferences(
    itemId: string
  ): Promise<(ItemCrossReference & { referenceItem: Item })[]> {
    return this.db.query.itemCrossReferences.findMany({
      where: and(
        eq(itemCrossReferences.itemId, itemId),
        eq(itemCrossReferences.isActive, true)
      ),
      with: {
        referenceItem: true,
      },
      orderBy: [
        asc(itemCrossReferences.referenceType),
        asc(itemCrossReferences.priority),
      ],
    });
  }

  // Item Document Management
  async createItemDocument(
    createDocumentDto: CreateItemDocumentDto
  ): Promise<ItemDocument> {
    // If this is set as primary, unset other primary documents of the same type
    if (createDocumentDto.isPrimary) {
      await this.db
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

    const [newDocument] = await this.db
      .insert(itemDocuments)
      .values(createDocumentDto)
      .returning();

    return newDocument;
  }

  async getItemDocuments(itemId: string): Promise<ItemDocument[]> {
    return this.db.query.itemDocuments.findMany({
      where: and(
        eq(itemDocuments.itemId, itemId),
        eq(itemDocuments.isActive, true)
      ),
      orderBy: [desc(itemDocuments.isPrimary), asc(itemDocuments.documentType)],
    });
  }

  // Item Lifecycle Management
  async createItemLifecycleEntry(
    createLifecycleDto: CreateItemLifecycleDto
  ): Promise<ItemLifecycle> {
    const [newLifecycleEntry] = await this.db
      .insert(itemLifecycle)
      .values(createLifecycleDto)
      .returning();

    // Update item's current stage
    await this.db
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
    return this.db.query.itemLifecycle.findMany({
      where: eq(itemLifecycle.itemId, itemId),
      orderBy: desc(itemLifecycle.effectiveDate),
    });
  }

  // Item Pricing Management
  async createItemPricingTier(
    createPricingDto: CreateItemPricingTierDto
  ): Promise<ItemPricingTier> {
    const [newPricingTier] = await this.db
      .insert(itemPricingTiers)
      .values(createPricingDto)
      .returning();

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
        )
      );
    }

    return this.db.query.itemPricingTiers.findMany({
      where: and(...whereConditions),
      orderBy: [
        desc(itemPricingTiers.customerId), // Customer-specific pricing first
        asc(itemPricingTiers.minQty),
      ],
    });
  }

  // Utility Methods
  async getItemByCode(
    itemCode: string,
    companyId: string
  ): Promise<Item | null> {
    return this.db.query.items.findFirst({
      where: and(eq(items.itemCode, itemCode), eq(items.companyId, companyId)),
    });
  }

  async getItemsByCategory(categoryId: string): Promise<Item[]> {
    return this.db.query.items.findMany({
      where: eq(items.categoryId, categoryId),
      orderBy: asc(items.itemName),
    });
  }

  async searchItems(
    searchTerm: string,
    companyId: string,
    limit: number = 10
  ): Promise<Item[]> {
    return this.db.query.items.findMany({
      where: and(
        eq(items.companyId, companyId),
        eq(items.isActive, true),
        or(
          ilike(items.itemCode, `%${searchTerm}%`),
          ilike(items.itemName, `%${searchTerm}%`),
          ilike(items.barcode, `%${searchTerm}%`)
        )
      ),
      limit,
      orderBy: asc(items.itemName),
    });
  }
}
