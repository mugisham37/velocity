import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentCompany } from '../../auth/decorators/current-company.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { IoTDevicesService } from './devices.service';
import { CreateIoTDeviceDto } from './dto/create-device.dto';
import { DeviceQueryDto } from './dto/device-query.dto';
import { UpdateIoTDeviceDto } from './dto/update-device.dto';

@Resolver('IoTDevice')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IoTDevicesResolver {
  constructor(private readonly devicesService: IoTDevicesService) {}

  @Mutation('createIoTDevice')
  @Roles('admin', 'iot_manager', 'facility_manager')
  async createDevice(
    @Args('input') createDeviceDto: CreateIoTDeviceDto,
    @CurrentCompany() companyId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.devicesService.create(createDeviceDto, companyId, userId);
  }

  @Query('iotDevices')
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator', 'viewer')
  async findAllDevices(
    @Args('query', { nullable: true })
    query: DeviceQueryDto = new DeviceQueryDto(),
    @CurrentCompany() companyId: string
  ) {
    return this.devicesService.findAll(query, companyId);
  }

  @Query('iotDevice')
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator', 'viewer')
  async findOneDevice(
    @Args('id', { type: () => ID }) id: string,
    @CurrentCompany() companyId: string
  ) {
    return this.devicesService.findOne(id, companyId);
  }

  @Query('iotDeviceByDeviceId')
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator', 'viewer')
  async findDeviceByDeviceId(
    @Args('deviceId') deviceId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.devicesService.findByDeviceId(deviceId, companyId);
  }

  @Query('iotDeviceStats')
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator', 'viewer')
  async getDeviceStats(@CurrentCompany() companyId: string) {
    return this.devicesService.getDeviceStats(companyId);
  }

  @Mutation('updateIoTDevice')
  @Roles('admin', 'iot_manager', 'facility_manager')
  async updateDevice(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') updateDeviceDto: UpdateIoTDeviceDto,
    @CurrentCompany() companyId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.devicesService.update(id, updateDeviceDto, companyId, userId);
  }

  @Mutation('updateIoTDeviceStatus')
  @Roles('admin', 'iot_manager', 'facility_manager', 'operator')
  async updateDeviceStatus(
    @Args('id', { type: () => ID }) id: string,
    @Args('status') status: string,
    @CurrentCompany() companyId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.devicesService.updateStatus(id, status, companyId, userId);
  }

  @Mutation('deleteIoTDevice')
  @Roles('admin', 'iot_manager')
  async removeDevice(
    @Args('id', { type: () => ID }) id: string,
    @CurrentCompany() companyId: string
  ) {
    await this.devicesService.remove(id, companyId);
    return { success: true, message: 'Device deleted successfully' };
  }
}

