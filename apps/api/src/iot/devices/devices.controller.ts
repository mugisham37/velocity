import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { IoTDevicesService } from './devices.service';
import { CreateIoTDeviceDto } from './dto/create-device.dto';
import { DeviceQueryDto } from './dto/device-query.dto';
import { UpdateIoTDeviceDto } from './dto/update-device.dto';

@ApiTags('IoT Devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('iot/devices')
export class IoTDevicesController {
  constructor(private readonly devicesService: IoTDevicesService) {}

  @Post()
  @Roles('admin', 'iot_manager', 'facility_manager')
  @ApiOperation({ summary: 'Create a new IoT device' })
  @ApiResponse({ status: 201, description: 'IoT device created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Device ID already exists' })
  async create(
    @Body() createDeviceDto: CreateIoTDeviceDto,
    @CurrentCompany() companyId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.devicesService.create(createDeviceDto, companyId, userId);
  }

  @Get()
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator', 'viewer')
  @ApiOperation({
    summary: 'Get all IoT devices with filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'List of IoT devices retrieved successfully',
  })
  async findAll(
    @Query() query: DeviceQueryDto,
    @CurrentCompany() companyId: string
  ) {
    return this.devicesService.findAll(query, companyId);
  }

  @Get('stats')
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator', 'viewer')
  @ApiOperation({ summary: 'Get IoT device statistics' })
  @ApiResponse({
    status: 200,
    description: 'Device statistics retrieved successfully',
  })
  async getStats(@CurrentCompany() companyId: string) {
    return this.devicesService.getDeviceStats(companyId);
  }

  @Get(':id')
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator', 'viewer')
  @ApiOperation({ summary: 'Get an IoT device by ID' })
  @ApiParam({ name: 'id', description: 'Device UUID' })
  @ApiResponse({
    status: 200,
    description: 'IoT device retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCompany() companyId: string
  ) {
    return this.devicesService.findOne(id, companyId);
  }

  @Get('device-id/:deviceId')
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator', 'viewer')
  @ApiOperation({ summary: 'Get an IoT device by device ID' })
  @ApiParam({ name: 'deviceId', description: 'Device identifier' })
  @ApiResponse({
    status: 200,
    description: 'IoT device retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async findByDeviceId(
    @Param('deviceId') deviceId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.devicesService.findByDeviceId(deviceId, companyId);
  }

  @Patch(':id')
  @Roles('admin', 'iot_manager', 'facility_manager')
  @ApiOperation({ summary: 'Update an IoT device' })
  @ApiParam({ name: 'id', description: 'Device UUID' })
  @ApiResponse({ status: 200, description: 'IoT device updated successfully' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  @ApiResponse({ status: 409, description: 'Device ID conflict' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDeviceDto: UpdateIoTDeviceDto,
    @CurrentCompany() companyId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.devicesService.update(id, updateDeviceDto, companyId, userId);
  }

  @Patch(':id/status')
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator')
  @ApiOperation({ summary: 'Update device status' })
  @ApiParam({ name: 'id', description: 'Device UUID' })
  @ApiQuery({ name: 'status', description: 'New device status' })
  @ApiResponse({
    status: 200,
    description: 'Device status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status: string,
    @CurrentCompany() companyId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.devicesService.updateStatus(id, status, companyId, userId);
  }

  @Delete(':id')
  @Roles('admin', 'iot_manager')
  @ApiOperation({ summary: 'Delete an IoT device' })
  @ApiParam({ name: 'id', description: 'Device UUID' })
  @ApiResponse({ status: 200, description: 'IoT device deleted successfully' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCompany() companyId: string
  ) {
    await this.devicesService.remove(id, companyId);
    return { message: 'Device deleted successfully' };
  }
}

