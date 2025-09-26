import {
  BatchLocation,
  BatchNumber,
  ProductRecall,
  QualityInspection,
  SerialNumber,
} from '@kiro/database';
import { Logger, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  BatchNumberFilterDto,
  CreateBatchLocationDto,
  CreateBatchNumberDto,
  CreateProductRecallDto,
  CreateQualityInspectionDto,
  ExpiryAlertDto,
  ProductRecallFilterDto,
  QualityInspectionFilterDto,
  RecallAnalyticsDto,
  SerialNumberFilterDto,
  TraceabilityQueryDto,
  TraceabilityReportDto,
  UpdateBatchNumberDto,
  UpdateProductRecallDto,
  UpdateQualityInspectionDto,
  UpdateSerialNumberDto,
} from '../dto/serial-batch-tracking.dto';
import { SerialBatchTrackingService } from '../services/serial-batch-tracking.service';

@Resolver()
@UseGuards(JwtAuthGuard)
export class SerialBatchTrackingResolver {
  private readonly logger = new Logger(SerialBatchTrackingResolver.name);

  constructor(
    private readonly serialBatchTrackingService: SerialBatchTrackingService
  ) {}

  // Serial Number Mutations
  @Mutation(() => SerialNumber)
  async createSerialNumber(
    @Args('input') input: CreateSerialNumberDto,
    @Context() context: any
  ): Promise<SerialNumber> {
    const { user } = context.req;
    this.logger.log(`Creating serial number: ${input.serialNumber}`);

    return this.serialBatchTrackingService.createSerialNumber(
      input,
      user.companyId,
      user.id
    );
  }

  @Mutation(() => SerialNumber)
  async updateSerialNumber(
    @Args('id') id: string,
    @Args('input') input: UpdateSerialNumberDto,
    @Context() context: any
  ): Promise<SerialNumber> {
    const { user } = context.req;
    this.logger.log(`Updating serial number: ${id}`);

    return this.serialBatchTrackingService.updateSerialNumber(
      id,
      input,
      user.companyId,
      user.id
    );
  }

  // Serial Number Queries
  @Query(() => [SerialNumber])
  async serialNumbers(
    @Args('filter', { nullable: true }) filter: SerialNumberFilterDto = {},
    @Args('limit', { nullable: true }) limit = 50,
    @Args('offset', { nullable: true }) offset = 0,
    @Context() context: any
  ): Promise<SerialNumber[]> {
    const { user } = context.req;
    this.logger.log(
      `Getting serial numbers with filter: ${JSON.stringify(filter)}`
    );

    return this.serialBatchTrackingService.getSerialNumbers(
      filter,
      user.companyId,
      limit,
      offset
    );
  }

  @Query(() => SerialNumber, { nullable: true })
  async serialNumber(
    @Args('serialNumber') serialNumber: string,
    @Context() context: any
  ): Promise<SerialNumber | null> {
    const { user } = context.req;
    this.logger.log(`Getting serial number: ${serialNumber}`);

    const results = await this.serialBatchTrackingService.getSerialNumbers(
      { serialNumber } as any,
      user.companyId,
      1,
      0
    );

    return results.length > 0 ? results[0] : null;
  }

  // Batch Number Mutations
  @Mutation(() => BatchNumber)
  async createBatchNumber(
    @Args('input') input: CreateBatchNumberDto,
    @Context() context: any
  ): Promise<BatchNumber> {
    const { user } = context.req;
    this.logger.log(`Creating batch number: ${input.batchNumber}`);

    return this.serialBatchTrackingService.createBatchNumber(
      input,
      user.companyId,
      user.id
    );
  }

  @Mutation(() => BatchNumber)
  async updateBatchNumber(
    @Args('id') id: string,
    @Args('input') input: UpdateBatchNumberDto,
    @Context() context: any
  ): Promise<BatchNumber> {
    const { user } = context.req;
    this.logger.log(`Updating batch number: ${id}`);

    return this.serialBatchTrackingService.updateBatchNumber(
      id,
      input,
      user.companyId,
      user.id
    );
  }

  // Batch Number Queries
  @Query(() => [BatchNumber])
  async batchNumbers(
    @Args('filter', { nullable: true }) filter: BatchNumberFilterDto = {},
    @Args('limit', { nullable: true }) limit = 50,
    @Args('offset', { nullable: true }) offset = 0,
    @Context() context: any
  ): Promise<BatchNumber[]> {
    const { user } = context.req;
    this.logger.log(
      `Getting batch numbers with filter: ${JSON.stringify(filter)}`
    );

    return this.serialBatchTrackingService.getBatchNumbers(
      filter,
      user.companyId,
      limit,
      offset
    );
  }

  @Query(() => BatchNumber, { nullable: true })
  async batchNumber(
    @Args('batchNumber') batchNumber: string,
    @Args('itemId') itemId: string,
    @Context() context: any
  ): Promise<BatchNumber | null> {
    const { user } = context.req;
    this.logger.log(`Getting batch number: ${batchNumber} for item: ${itemId}`);

    const results = await this.serialBatchTrackingService.getBatchNumbers(
      { batchNumber, itemId } as any,
      user.companyId,
      1,
      0
    );

    return results.length > 0 ? results[0] : null;
  }

  // Batch Location Mutations
  @Mutation(() => BatchLocation)
  async createBatchLocation(
    @Args('input') input: CreateBatchLocationDto,
    @Context() context: any
  ): Promise<BatchLocation> {
    const { user } = context.req;
    this.logger.log(`Creating batch location for batch: ${input.batchId}`);

    return this.serialBatchTrackingService.createBatchLocation(
      input,
      user.companyId
    );
  }

  // Product Recall Mutations
  @Mutation(() => ProductRecall)
  async createProductRecall(
    @Args('input') input: CreateProductRecallDto,
    @Context() context: any
  ): Promise<ProductRecall> {
    const { user } = context.req;
    this.logger.log(`Creating product recall: ${input.recallNumber}`);

    return this.serialBatchTrackingService.createProductRecall(
      input,
      user.companyId,
      user.id
    );
  }

  @Mutation(() => ProductRecall)
  async updateProductRecall(
    @Args('id') id: string,
    @Args('input') input: UpdateProductRecallDto,
    @Context() context: any
  ): Promise<ProductRecall> {
    const { user } = context.req;
    this.logger.log(`Updating product recall: ${id}`);

    return this.serialBatchTrackingService.updateProductRecall(
      id,
      input,
      user.companyId,
      user.id
    );
  }

  // Product Recall Queries
  @Query(() => [ProductRecall])
  async productRecalls(
    @Args('filter', { nullable: true }) filter: ProductRecallFilterDto = {},
    @Args('limit', { nullable: true }) limit = 50,
    @Args('offset', { nullable: true }) offset = 0,
    @Context() context: any
  ): Promise<ProductRecall[]> {
    const { user } = context.req;
    this.logger.log(
      `Getting product recalls with filter: ${JSON.stringify(filter)}`
    );

    return this.serialBatchTrackingService.getProductRecalls(
      filter,
      user.companyId,
      limit,
      offset
    );
  }

  // Quality Inspection Mutations
  @Mutation(() => QualityInspection)
  async createQualityInspection(
    @Args('input') input: CreateQualityInspectionDto,
    @Context() context: any
  ): Promise<QualityInspection> {
    const { user } = context.req;
    this.logger.log(`Creating quality inspection: ${input.inspectionNumber}`);

    return this.serialBatchTrackingService.createQualityInspection(
      input,
      user.companyId
    );
  }

  @Mutation(() => QualityInspection)
  async updateQualityInspection(
    @Args('id') id: string,
    @Args('input') input: UpdateQualityInspectionDto,
    @Context() context: any
  ): Promise<QualityInspection> {
    const { user } = context.req;
    this.logger.log(`Updating quality inspection: ${id}`);

    return this.serialBatchTrackingService.updateQualityInspection(
      id,
      input,
      user.companyId
    );
  }

  // Quality Inspection Queries
  @Query(() => [QualityInspection])
  async qualityInspections(
    @Args('filter', { nullable: true }) filter: QualityInspectionFilterDto = {},
    @Args('limit', { nullable: true }) limit = 50,
    @Args('offset', { nullable: true }) offset = 0,
    @Context() context: any
  ): Promise<QualityInspection[]> {
    const { user } = context.req;
    this.logger.log(
      `Getting quality inspections with filter: ${JSON.stringify(filter)}`
    );

    // Note: This method needs to be implemented in the service
    // return this.serialBatchTrackingService.getQualityInspections(
    //   filter,
    //   user.companyId,
    //   limit,
    //   offset
    // );

    // Temporary return empty array until service method is implemented
    return [];
  }

  // Traceability Queries
  @Query(() => TraceabilityReportDto)
  async traceabilityReport(
    @Args('query') query: TraceabilityQueryDto,
    @Context() context: any
  ): Promise<TraceabilityReportDto> {
    const { user } = context.req;
    this.logger.log(`Getting traceability report for item: ${query.itemId}`);

    return this.serialBatchTrackingService.getTraceabilityReport(
      query,
      user.companyId
    );
  }

  // Analytics Queries
  @Query(() => RecallAnalyticsDto)
  async recallAnalytics(@Context() context: any): Promise<RecallAnalyticsDto> {
    const { user } = context.req;
    this.logger.log(`Getting recall analytics for company: ${user.companyId}`);

    return this.serialBatchTrackingService.getRecallAnalytics(user.companyId);
  }

  @Query(() => [ExpiryAlertDto])
  async expiryAlerts(
    @Args('daysAhead', { nullable: true }) daysAhead = 30,
    @Context() context: any
  ): Promise<ExpiryAlertDto[]> {
    const { user } = context.req;
    this.logger.log(`Getting expiry alerts for ${daysAhead} days ahead`);

    return this.serialBatchTrackingService.getExpiryAlerts(
      user.companyId,
      daysAhead
    );
  }

  // Batch Expiry Management
  @Query(() => [BatchNumber])
  async expiringBatches(
    @Args('daysAhead', { nullable: true }) daysAhead = 30,
    @Context() context: any
  ): Promise<BatchNumber[]> {
    const { user } = context.req;
    this.logger.log(`Getting batches expiring in ${daysAhead} days`);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    return this.serialBatchTrackingService.getBatchNumbers(
      {
        expiringBefore: expiryDate.toISOString(),
        isActive: true,
      },
      user.companyId,
      100,
      0
    );
  }

  // Serial Number Maintenance Alerts
  @Query(() => [SerialNumber])
  async maintenanceDueSerials(
    @Args('daysAhead', { nullable: true }) daysAhead = 7,
    @Context() context: any
  ): Promise<SerialNumber[]> {
    const { user } = context.req;
    this.logger.log(
      `Getting serials with maintenance due in ${daysAhead} days`
    );

    const maintenanceDate = new Date();
    maintenanceDate.setDate(maintenanceDate.getDate() + daysAhead);

    return this.serialBatchTrackingService.getSerialNumbers(
      {
        maintenanceDueBefore: maintenanceDate.toISOString(),
        status: 'Available' as any,
      },
      user.companyId,
      100,
      0
    );
  }

  // Warranty Expiry Alerts
  @Query(() => [SerialNumber])
  async warrantyExpiringSerials(
    @Args('daysAhead', { nullable: true }) daysAhead = 30,
    @Context() context: any
  ): Promise<SerialNumber[]> {
    const { user } = context.req;
    this.logger.log(
      `Getting serials with warranty expiring in ${daysAhead} days`
    );

    const warrantyDate = new Date();
    warrantyDate.setDate(warrantyDate.getDate() + daysAhead);

    return this.serialBatchTrackingService.getSerialNumbers(
      {
        warrantyExpiringBefore: warrantyDate.toISOString(),
      },
      user.companyId,
      100,
      0
    );
  }
}
