import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentCompany } from '../../auth/decorators/current-company.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CreatePredictiveMaintenanceModelDto, PredictMaintenanceDto, TrainModelDto } from './dto/create-model.dto';
import { MaintenancePredictionService } from './maintenance-prediction.service';
import { PredictiveMaintenanceService } from './predictive-maintenance.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from /swagger';/;

@ApiTags('Predictive Maintenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('iot/predictive-maintenance')
export class PredictiveMaintenanceController {
  constructor(
    private readonly predictiveMaintenanceService: PredictiveMaintenanceService,
    private readonly maintenancePredictionService: MaintenancePredictionService,
  ) {}

  @Post('models')
  @Roles('admin', 'iot_manager', 'maintenance_manager')
  @ApiOperation({ summary: 'Create a new predictive maintenance model' })
  @ApiResponse({ status: 201, description: 'Model created successfully' })
  async createModel(
    @Body() createModelDto: CreatePredictiveMaintenanceModelDto,
    @CurrentCompany() companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.predictiveMaintenanceService.createModel(createModelDto, companyId, userId);
  }

  @Get('models')
  @Roles('admin', 'iot_manager', 'maintenance_manager', 'operator', 'viewer')
  @ApiOperation({ summary: 'Get all predictive maintenance models' })
  @ApiResponse({ status: 200, description: 'Models retrieved successfully' })
  async findAllModels(@CurrentCompany() companyId: string) {
    return this.predictiveMaintenanceService.findAll(companyId);
  }

  @Get('models/:id')
  @Roles('admin', 'iot_manager', 'maintenance_manager', 'operator', 'viewer')
  @ApiOperation({ summary: 'Get a predictive maintenance model by ID' })
  @ApiParam({ name: 'id', description: 'Model UUID' })
  @ApiResponse({ status: 200, description: 'Model retrieved successfully' })
  async findOneModel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCompany() companyId: string,
  ) {
    return this.predictiveMaintenanceService.findOne(id, companyId);
  }

  @Post('models/:id/train')
  @Roles('admin', 'iot_manager', 'maintenance_manager')
  @ApiOperation({ summary: 'Train a predictive maintenance model' })
  @ApiParam({ name: 'id', description: 'Model UUID' })
  @ApiResponse({ status: 200, description: 'Model training started successfully' })
  async trainModel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() trainDto: TrainModelDto,
    @CurrentCompany() companyId: string,
  ) {
    return this.predictiveMaintenanceService.trainModel(id, trainDto, companyId);
  }

  @Post('models/:id/predict')
  @Roles('admin', 'iot_manager', 'maintenance_manager', 'operator')
  @ApiOperation({ summary: 'Make a prediction using a trained model' })
  @ApiParam({ name: 'id', description: 'Model UUID' })
  @ApiResponse({ status: 200, description: 'Prediction made successfully' })
  async predict(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() predictDto: PredictMaintenanceDto,
    @CurrentCompany() companyId: string,
  ) {
    return this.predictiveMaintenanceService.predict(id, predictDto, companyId);
  }

  @Get('assets/:assetId/predictions')
  @Roles('admin', 'iot_manager', 'maintenance_manager', 'operator', 'viewer')
  @ApiOperation({ summary: 'Get predictions for an asset' })
  @ApiParam({ name: 'assetId', description: 'Asset UUID' })
  @ApiResponse({ status: 200, description: 'Predictions retrieved successfully' })
  async getAssetPredictions(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @CurrentCompany() companyId: string,
  ) {
    return this.predictiveMaintenanceService.getPredictions(assetId, companyId);
  }

  @Get('assets/:assetId/recommendations')
  @Roles('admin', 'iot_manager', 'maintenance_manager', 'operator', 'viewer')
  @ApiOperation({ summary: 'Get maintenance recommendations for an asset' })
  @ApiParam({ name: 'assetId', description: 'Asset UUID' })
  @ApiResponse({ status: 200, description: 'Recommendations generated successfully' })
  async getMaintenanceRecommendations(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @CurrentCompany() companyId: string,
  ) {
    return this.maintenancePredictionService.generateMaintenanceRecommendations(assetId, companyId);
  }

  @Get('insights')
  @Roles('admin', 'iot_manager', 'maintenance_manager', 'operator', 'viewer')
  @ApiOperation({ summary: 'Get company-wide maintenance insights' })
  @ApiResponse({ status: 200, description: 'Insights retrieved successfully' })
  async getMaintenanceInsights(@CurrentCompany() companyId: string) {
    return this.maintenancePredictionService.getMaintenanceInsights(companyId);
  }

  @Delete('models/:id')
  @Roles('admin', 'iot_manager', 'maintenance_manager')
  @ApiOperation({ summary: 'Delete a predictive maintenance model' })
  @ApiParam({ name: 'id', description: 'Model UUID' })
  @ApiResponse({ status: 200, description: 'Model deleted successfully' })
  async deleteModel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCompany() companyId: string,
  ) {
    await this.predictiveMaintenanceService.deleteModel(id, companyId);
    return { message: 'Model deleted successfully' };
  }
}
