import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '../../swagger';
import { CurrentCompany } from '../../auth/decorators/current-company.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import {
  BulkSensorDataDto,
  EquipmentMetricDto,
  SensorDataDto,
} from './dto/sensor-data.dto';
import { IoTGatewayService } from './gateway.service';
import { HttpGatewayService } from './http-gateway.service';

@ApiTags('IoT Gateway')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('iot/gateway')
export class IoTGatewayController {
  constructor(
    private readonly gatewayService: IoTGatewayService,
    private readonly httpGateway: HttpGatewayService
  ) {}

  @Get('status')
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator', 'viewer')
  @ApiOperation({ summary: 'Get IoT gateway status' })
  @ApiResponse({
    status: 200,
    description: 'Gateway status retrieved successfully',
  })
  async getGatewayStatus() {
    return this.gatewayService.getGatewayStatus();
  }

  @Post('sensor-data')
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator', 'device')
  @ApiOperation({ summary: 'Receive sensor data via HTTP' })
  @ApiResponse({
    status: 201,
    description: 'Sensor data processed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid sensor data' })
  async receiveSensorData(
    @Body() sensorData: SensorDataDto,
    @CurrentCompany() companyId: string
  ) {
    return this.httpGateway.receiveSensorData(sensorData, companyId);
  }

  @Post('sensor-data/bulk')
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator', 'device')
  @ApiOperation({ summary: 'Receive bulk sensor data via HTTP' })
  @ApiResponse({
    status: 201,
    description: 'Bulk sensor data processed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid bulk sensor data' })
  async receiveBulkSensorData(
    @Body() bulkData: BulkSensorDataDto,
    @CurrentCompany() companyId: string
  ) {
    return this.httpGateway.receiveBulkSensorData(bulkData, companyId);
  }

  @Post('equipment-metrics')
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator', 'device')
  @ApiOperation({ summary: 'Receive equipment metrics via HTTP' })
  @ApiResponse({
    status: 201,
    description: 'Equipment metrics processed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid equipment metrics' })
  async receiveEquipmentMetrics(
    @Body() equipmentMetric: EquipmentMetricDto,
    @CurrentCompany() companyId: string
  ) {
    return this.httpGateway.receiveEquipmentMetrics(equipmentMetric, companyId);
  }

  @Get('devices/:deviceId/status')
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator', 'viewer')
  @ApiOperation({ summary: 'Get device status' })
  @ApiParam({ name: 'deviceId', description: 'Device identifier' })
  @ApiResponse({
    status: 200,
    description: 'Device status retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async getDeviceStatus(
    @Param('deviceId') deviceId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.httpGateway.getDeviceStatus(deviceId, companyId);
  }

  @Post('devices/:deviceId/commands')
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator')
  @ApiOperation({ summary: 'Send command to device' })
  @ApiParam({ name: 'deviceId', description: 'Device identifier' })
  @ApiQuery({
    name: 'protocol',
    enum: ['mqtt', 'http'],
    required: false,
    description: 'Communication protocol',
  })
  @ApiResponse({ status: 200, description: 'Command sent successfully' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async sendCommand(
    @Param('deviceId') deviceId: string,
    @Body() command: any,
    @Query('protocol') protocol: 'mqtt' | 'http' = 'mqtt',
    @CurrentCompany() _companyId: string
  ) {
    await this.gatewayService.sendCommandToDevice(deviceId, command, protocol);
    return { success: true, message: `Command sent to device ${deviceId}` };
  }

  @Post('mqtt/publish')
  @Roles('admin', 'iot_manager', 'facility_manager')
  @ApiOperation({ summary: 'Publish message to MQTT topic' })
  @ApiResponse({ status: 200, description: 'Message published successfully' })
  @ApiResponse({ status: 400, description: 'Invalid topic or payload' })
  async publishToTopic(@Body() body: { topic: string; payload: any }) {
    await this.gatewayService.publishToTopic(body.topic, body.payload);
    return {
      success: true,
      message: `Message published to topic ${body.topic}`,
    };
  }

  @Get('realtime-metrics')
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator', 'viewer')
  @ApiOperation({ summary: 'Get real-time IoT metrics' })
  @ApiQuery({
    name: 'timeRange',
    required: false,
    description: 'Time range for metrics (e.g., 1h, 24h, 7d)',
  })
  @ApiResponse({
    status: 200,
    description: 'Real-time metrics retrieved successfully',
  })
  async getRealtimeMetrics(
    @Query('timeRange') timeRange: string = '1h',
    @CurrentCompany() companyId: string
  ) {
    return this.gatewayService.getRealtimeMetrics(companyId, timeRange);
  }

  @Get('realtime-data')
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator', 'viewer')
  @ApiOperation({ summary: 'Get real-time sensor data with filters' })
  @ApiQuery({
    name: 'deviceIds',
    required: false,
    description: 'Comma-separated device IDs',
  })
  @ApiQuery({
    name: 'sensorTypes',
    required: false,
    description: 'Comma-separated sensor types',
  })
  @ApiQuery({
    name: 'timeRange',
    required: false,
    description: 'Time range for data',
  })
  @ApiResponse({
    status: 200,
    description: 'Real-time data retrieved successfully',
  })
  async getRealtimeData(
    @CurrentCompany() companyId: string,
    @Query('deviceIds') deviceIds?: string,
    @Query('sensorTypes') sensorTypes?: string,
    @Query('timeRange') timeRange?: string
  ) {
    const filters = {
      ...(deviceIds && { deviceIds: deviceIds.split(',') }),
      ...(sensorTypes && { sensorTypes: sensorTypes.split(',') }),
      ...(timeRange && { timeRange }),
    };

    return this.httpGateway.getRealtimeData(companyId, filters);
  }

  @Post('validate-sensor-data')
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator', 'device')
  @ApiOperation({ summary: 'Validate sensor data format' })
  @ApiResponse({ status: 200, description: 'Sensor data validation result' })
  async validateSensorData(@Body() sensorData: SensorDataDto) {
    return this.httpGateway.validateSensorData(sensorData);
  }
}

