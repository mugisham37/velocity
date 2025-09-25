import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export enum ItemType {
  STOCK = 'Stock',
  SERVICE = 'Service',
  NON_STOCK = 'Non-Stock',
}

export enum ItemStage {
  INTRODUCTION = 'Introduction',
  GROWTH = 'Growth',
  MATURITY = 'Maturity',
  DECLINE = 'Decline',
  TINUATION = 'Discontinuation',
}

export enum BarcodeType {
  EAN = 'EAN',
  UPC = 'UPC',
  CODE128 = 'Code128',
  CODE39 = 'Code39',
  QR = 'QR',
}

export class CreateItemDto {
  @IsString()
  @Length(1, 50)
  itemCode: string;

  @IsString()
  @Length(1, 255)
  itemName: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  itemGroup?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ItemType)
  itemType?: ItemType = ItemType.STOCK;

  @IsOptional()
  @IsBoolean()
  hasVariants?: boolean = false;

  @IsOptional()
  @IsUUID()
  templateItemId?: string;

  @IsOptional()
  @IsEnum(ItemStage)
  currentStage?: ItemStage = ItemStage.INTRODUCTION;

  @IsString()
  @Length(1, 20)
  stockUom: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  salesUom?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  purchaseUom?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salesUomConversionFactor?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchaseUomConversionFactor?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(0)
  standardRate?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valuationRate?: number = 0;

  @IsOptional()
  @IsBoolean()
  isStockItem?: boolean = true;

  @IsOptional()
  @IsBoolean()
  hasSerialNo?: boolean = false;

  @IsOptional()
  @IsBoolean()
  hasBatchNo?: boolean = false;

  @IsOptional()
  @IsBoolean()
  hasExpiryDate?: boolean = false;

  @IsOptional()
  @IsBoolean()
  inspectionRequired?: boolean = false;

  @IsOptional()
  @IsString()
  qualityInspectionTemplate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderLevel?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderQty?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minOrderQty?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxOrderQty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  leadTimeDays?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsString()
  weightUom?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsString()
  dimensionUom?: string;

  @IsOptional()
  @IsString()
  taxCategory?: string;

  @IsOptional()
  @IsString()
  incomeAccount?: string;

  @IsOptional()
  @IsString()
  expenseAccount?: string;

  @IsOptional()
  @IsString()
  costOfGoodsSoldAccount?: string;

  @IsOptional()
  @IsString()
  assetAccount?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  manufacturerPartNo?: string;

  @IsOptional()
  @IsString()
  @Length(2, 3)
  countryOfOrigin?: string;

  @IsOptional()
  @IsString()
  hsCode?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsEnum(BarcodeType)
  barcodeType?: BarcodeType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsBoolean()
  isSalesItem?: boolean = true;

  @IsOptional()
  @IsBoolean()
  isPurchaseItem?: boolean = true;

  @IsOptional()
  @IsBoolean()
  isFixedAsset?: boolean = false;

  @IsUUID()
  companyId: string;
}

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  itemName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  itemGroup?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ItemStage)
  currentStage?: ItemStage;

  @IsOptional()
  @IsDateString()
  discontinuedDate?: string;

  @IsOptional()
  @IsUUID()
  replacementItemId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  salesUom?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  purchaseUom?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salesUomConversionFactor?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchaseUomConversionFactor?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  standardRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valuationRate?: number;

  @IsOptional()
  @IsBoolean()
  inspectionRequired?: boolean;

  @IsOptional()
  @IsString()
  qualityInspectionTemplate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderLevel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderQty?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minOrderQty?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxOrderQty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  leadTimeDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsString()
  weightUom?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsString()
  dimensionUom?: string;

  @IsOptional()
  @IsString()
  taxCategory?: string;

  @IsOptional()
  @IsString()
  incomeAccount?: string;

  @IsOptional()
  @IsString()
  expenseAccount?: string;

  @IsOptional()
  @IsString()
  costOfGoodsSoldAccount?: string;

  @IsOptional()
  @IsString()
  assetAccount?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  manufacturerPartNo?: string;

  @IsOptional()
  @IsString()
  @Length(2, 3)
  countryOfOrigin?: string;

  @IsOptional()
  @IsString()
  hsCode?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsEnum(BarcodeType)
  barcodeType?: BarcodeType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isSalesItem?: boolean;

  @IsOptional()
  @IsBoolean()
  isPurchaseItem?: boolean;

  @IsOptional()
  @IsBoolean()
  isFixedAsset?: boolean;
}

export class CreateItemCategoryDto {
  @IsString()
  @Length(1, 50)
  categoryCode: string;

  @IsString()
  @Length(1, 255)
  categoryName: string;

  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isGroup?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsUUID()
  companyId: string;
}

export class UpdateItemCategoryDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  categoryName?: string;

  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export enum AttributeType {
  TEXT = 'Text',
  NUMBER = 'Number',
  DATE = 'Date',
  BOOLEAN = 'Boolean',
  SELECT = 'Select',
}

export class CreateItemAttributeDto {
  @IsString()
  @Length(1, 100)
  attributeName: string;

  @IsEnum(AttributeType)
  attributeType: AttributeType;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean = false;

  @IsOptional()
  @IsString()
  defaultValue?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectOptions?: string[];

  @IsOptional()
  validationRules?: any;

  @IsUUID()
  companyId: string;
}

export class CreateItemAttributeValueDto {
  @IsUUID()
  itemId: string;

  @IsUUID()
  attributeId: string;

  @IsString()
  value: string;
}

export class CreateItemVariantDto {
  @IsUUID()
  templateItemId: string;

  @IsUUID()
  variantItemId: string;

  @IsOptional()
  variantAttributes?: Record<string, any>;
}

export enum CrossReferenceType {
  SUBSTITUTE = 'Substitute',
  ALTERNATIVE = 'Alternative',
  ACCESSORY = 'Accessory',
  RELATED = 'Related',
}

export class CreateItemCrossReferenceDto {
  @IsUUID()
  itemId: string;

  @IsUUID()
  referenceItemId: string;

  @IsEnum(CrossReferenceType)
  referenceType: CrossReferenceType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number = 1;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export enum DocumentType {
  IMAGE = 'Image',
  PDF = 'PDF',
  VIDEO = 'Video',
  MANUAL = 'Manual',
  CERTIFICATE = 'Certificate',
}

export class CreateItemDocumentDto {
  @IsUUID()
  itemId: string;

  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  @Length(1, 255)
  fileName: string;

  @IsString()
  @Length(1, 500)
  filePath: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fileSize?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  version?: number = 1;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  uploadedBy: string;
}

export class CreateItemLifecycleDto {
  @IsUUID()
  itemId: string;

  @IsEnum(ItemStage)
  stage: ItemStage;

  @IsDateString()
  effectiveDate: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsUUID()
  createdBy: string;
}

export class CreateItemPricingTierDto {
  @IsUUID()
  itemId: string;

  @IsString()
  @Length(1, 100)
  priceList: string;

  @IsString()
  @Length(3, 3)
  currency: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsNumber()
  @Min(0)
  minQty: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxQty?: number;

  @IsNumber()
  @Min(0)
  rate: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number = 0;

  @IsDateString()
  validFrom: string;

  @IsOptional()
  @IsDateString()
  validUpto?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class ItemFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(ItemType)
  itemType?: ItemType;

  @IsOptional()
  @IsEnum(ItemStage)
  currentStage?: ItemStage;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isSalesItem?: boolean;

  @IsOptional()
  @IsBoolean()
  isPurchaseItem?: boolean;

  @IsOptional()
  @IsBoolean()
  hasVariants?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSerialNo?: boolean;

  @IsOptional()
  @IsBoolean()
  hasBatchNo?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'itemName';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
