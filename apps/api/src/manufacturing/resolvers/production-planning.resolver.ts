import { UseGuards, UseInterceptors } from '@nestjs/common';
import {
  Args,
  Context,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { PubSub } from '../../collaboration/utils/pubsub';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import {
  CapacityPlanFilterDto,
  CapacityUtilizationSummary,
  CreateCapacityPlanDto,
  CreateMRPRunDto,
  CreateProductionForecastDto,
  CreateProductionPlanDto,
  ForecastAccuracy,
  GanttChartItem,
  GenerateGanttChartDto,
  MRPResultFilterDto,
  MRPRunFilterDto,
  MRPSummary,
  ProductionForecastFilterDto,
  ProductionPlanFilterDto,
  ProductionPlanSummary,
  UpdateProductionForecastDto,
  UpdateProductionPlanDto,
} from '../dto/production-planning.dto';
import { ProductionPlanningService } from '../services/production-planning.service';

const pubSub = new PubSub();

@Resolver()
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuditInterceptor)
export class ProductionPlanningResolver {
  constructor(
    private readonly productionPlanningService: ProductionPlanningService
  ) {}

  // Production Plan Queries
  @Query('productionPlan')
  async getProductionPlan(@Args('id') id: string) {
    return this.productionPlanningService.findProductionPlanById(id);
  }

  @Query('productionPlans')
  async getProductionPlans(@Args('filter') filter: ProductionPlanFilterDto) {
    return this.productionPlanningService.findProductionPlans(filter);
  }

  @Query('productionPlanItems')
  async getProductionPlanItems(@Args('planId') planId: string) {
    return this.productionPlanningService.getProductionPlanItems(planId);
  }

  @Query('productionPlanSummary')
  async getProductionPlanSummary(
    @Args('companyId') companyId: string
  ): Promise<ProductionPlanSummary> {
    return this.productionPlanningService.getProductionPlanSummary(companyId);
  }

  // Production Plan Mutations
  @Mutation('createProductionPlan')
  async createProductionPlan(
    @Args('input') input: CreateProductionPlanDto,
    @Context() context: any
  ) {
    const userId = context.req.user.sub;
    const plan = await this.productionPlanningService.createProductionPlan(
      input,
      userId
    );

    // Publish subscription event
    pubSub.publish('productionPlanUpdated', { productionPlanUpdated: plan });

    return plan;
  }

  @Mutation('updateProductionPlan')
  async updateProductionPlan(
    @Args('id') id: string,
    @Args('input') input: UpdateProductionPlanDto,
    @Context() context: any
  ) {
    const userId = context.req.user.sub;
    const plan = await this.productionPlanningService.updateProductionPlan(
      id,
      input,
      userId
    );

    // Publish subscription event
    pubSub.publish('productionPlanUpdated', { productionPlanUpdated: plan });

    return plan;
  }

  @Mutation('deleteProductionPlan')
  async deleteProductionPlan(@Args('id') id: string): Promise<boolean> {
    await this.productionPlanningService.deleteProductionPlan(id);
    return true;
  }

  // MRP Queries
  @Query('mrpRun')
  async getMRPRun(@Args('id') id: string) {
    return this.productionPlanningService.findMRPRunById(id);
  }

  @Query('mrpRuns')
  async getMRPRuns(@Args('filter') filter: MRPRunFilterDto) {
    return this.productionPlanningService.findMRPRuns(filter);
  }

  @Query('mrpResults')
  async getMRPResults(@Args('filter') filter: MRPResultFilterDto) {
    return this.productionPlanningService.getMRPResults(filter);
  }

  @Query('mrpSummary')
  async getMRPSummary(@Args('runId') runId: string): Promise<MRPSummary> {
    return this.productionPlanningService.getMRPSummary(runId);
  }

  // MRP Mutations
  @Mutation('createMRPRun')
  async createMRPRun(
    @Args('input') input: CreateMRPRunDto,
    @Context() context: any
  ) {
    const userId = context.req.user.sub;
    const run = await this.productionPlanningService.createMRPRun(
      input,
      userId
    );

    // Publish subscription event
    pubSub.publish('mrpRunStatusChanged', { mrpRunStatusChanged: run });

    return run;
  }

  @Mutation('executeMRPRun')
  async executeMRPRun(@Args('id') id: string): Promise<boolean> {
    await this.productionPlanningService.executeMRPRun(id);

    // Get updated run and publish subscription event
    const run = await this.productionPlanningService.findMRPRunById(id);
    pubSub.publish('mrpRunStatusChanged', { mrpRunStatusChanged: run });

    // Get results and publish subscription event
    const results = await this.productionPlanningService.getMRPResults({
      mrpRunId: id,
    });
    pubSub.publish('mrpResultsUpdated', { mrpResultsUpdated: results });

    return true;
  }

  @Mutation('deleteMRPRun')
  async deleteMRPRun(@Args('id') id: string): Promise<boolean> {
    await this.productionPlanningService.deleteMRPRun(id);
    return true;
  }

  // Capacity Planning Queries
  @Query('capacityPlan')
  async getCapacityPlan(@Args('id') id: string) {
    return this.productionPlanningService.findCapacityPlanById(id);
  }

  @Query('capacityPlans')
  async getCapacityPlans(@Args('filter') filter: CapacityPlanFilterDto) {
    return this.productionPlanningService.findCapacityPlans(filter);
  }

  @Query('capacityPlanResults')
  async getCapacityPlanResults(@Args('planId') planId: string) {
    return this.productionPlanningService.getCapacityPlanResults(planId);
  }

  @Query('capacityUtilizationSummary')
  async getCapacityUtilizationSummary(
    @Args('planId') planId: string
  ): Promise<CapacityUtilizationSummary[]> {
    return this.productionPlanningService.getCapacityUtilizationSummary(planId);
  }

  // Capacity Planning Mutations
  @Mutation('createCapacityPlan')
  async createCapacityPlan(
    @Args('input') input: CreateCapacityPlanDto,
    @Context() context: any
  ) {
    const userId = context.req.user.sub;
    const plan = await this.productionPlanningService.createCapacityPlan(
      input,
      userId
    );

    // Publish subscription event
    pubSub.publish('capacityPlanStatusChanged', {
      capacityPlanStatusChanged: plan,
    });

    return plan;
  }

  @Mutation('executeCapacityPlan')
  async executeCapacityPlan(@Args('id') id: string): Promise<boolean> {
    await this.productionPlanningService.executeCapacityPlan(id);

    // Get updated plan and publish subscription event
    const plan = await this.productionPlanningService.findCapacityPlanById(id);
    pubSub.publish('capacityPlanStatusChanged', {
      capacityPlanStatusChanged: plan,
    });

    // Get utilization summary and publish subscription event
    const utilization =
      await this.productionPlanningService.getCapacityUtilizationSummary(id);
    pubSub.publish('capacityUtilizationUpdated', {
      capacityUtilizationUpdated: utilization,
    });

    return true;
  }

  @Mutation('deleteCapacityPlan')
  async deleteCapacityPlan(@Args('id') id: string): Promise<boolean> {
    await this.productionPlanningService.deleteCapacityPlan(id);
    return true;
  }

  // Production Forecast Queries
  @Query('productionForecast')
  async getProductionForecast(@Args('id') id: string) {
    return this.productionPlanningService.findProductionForecastById(id);
  }

  @Query('productionForecasts')
  async getProductionForecasts(
    @Args('filter') filter: ProductionForecastFilterDto
  ) {
    return this.productionPlanningService.findProductionForecasts(filter);
  }

  @Query('forecastAccuracy')
  async getForecastAccuracy(
    @Args('companyId') companyId: string
  ): Promise<ForecastAccuracy[]> {
    return this.productionPlanningService.getForecastAccuracy(companyId);
  }

  // Production Forecast Mutations
  @Mutation('createProductionForecast')
  async createProductionForecast(
    @Args('input') input: CreateProductionForecastDto,
    @Context() context: any
  ) {
    const userId = context.req.user.sub;
    const forecast =
      await this.productionPlanningService.createProductionForecast(
        input,
        userId
      );

    // Update forecast accuracy and publish subscription event
    const accuracy = await this.productionPlanningService.getForecastAccuracy(
      input.companyId
    );
    pubSub.publish('forecastAccuracyUpdated', {
      forecastAccuracyUpdated: accuracy,
    });

    return forecast;
  }

  @Mutation('updateProductionForecast')
  async updateProductionForecast(
    @Args('id') id: string,
    @Args('input') input: UpdateProductionForecastDto
  ) {
    const forecast =
      await this.productionPlanningService.updateProductionForecast(id, input);

    // If actual quantity was updated, refresh forecast accuracy
    if (input.actualQuantity !== undefined) {
      const existingForecast =
        await this.productionPlanningService.findProductionForecastById(id);
      const accuracy = await this.productionPlanningService.getForecastAccuracy(
        existingForecast.companyId
      );
      pubSub.publish('forecastAccuracyUpdated', {
        forecastAccuracyUpdated: accuracy,
      });
    }

    return forecast;
  }

  @Mutation('deleteProductionForecast')
  async deleteProductionForecast(@Args('id') id: string): Promise<boolean> {
    await this.productionPlanningService.deleteProductionForecast(id);
    return true;
  }

  // Gantt Chart Query
  @Query('generateGanttChart')
  async generateGanttChart(
    @Args('input') input: GenerateGanttChartDto
  ): Promise<GanttChartItem[]> {
    return this.productionPlanningService.generateGanttChart(input);
  }

  // Subscriptions
  @Subscription('productionPlanUpdated')
  productionPlanUpdated(@Args('planId') _planId: string) {
    return pubSub.asyncIterator('productionPlanUpdated');
  }

  @Subscription('productionPlanItemUpdated')
  productionPlanItemUpdated(@Args('planId') _planId: string) {
    return pubSub.asyncIterator('productionPlanItemUpdated');
  }

  @Subscription('mrpRunStatusChanged')
  mrpRunStatusChanged(@Args('runId') _runId: string) {
    return pubSub.asyncIterator('mrpRunStatusChanged');
  }

  @Subscription('mrpResultsUpdated')
  mrpResultsUpdated(@Args('runId') _runId: string) {
    return pubSub.asyncIterator('mrpResultsUpdated');
  }

  @Subscription('capacityPlanStatusChanged')
  capacityPlanStatusChanged(@Args('planId') _planId: string) {
    return pubSub.asyncIterator('capacityPlanStatusChanged');
  }

  @Subscription('capacityUtilizationUpdated')
  capacityUtilizationUpdated(@Args('planId') _planId: string) {
    return pubSub.asyncIterator('capacityUtilizationUpdated');
  }

  @Subscription('forecastAccuracyUpdated')
  forecastAccuracyUpdated(@Args('companyId') _companyId: string) {
    return pubSub.asyncIterator('forecastAccuracyUpdated');
  }
}
