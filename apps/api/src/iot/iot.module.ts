import { Module } from '@nestjs/common';
import { IoTAlertsModule } from './alerts/alerts.module';
import { IoTAnalyticsModule } from './analytics/analytics.module';
import { IoTDevicesModule } from './devices/devices.module';
import { EnergyMonitoringModule } from './energy/energy.module';
import { EnvironmentalMonitoringModule } from './environmental/environmental.module';
import { IoTGatewayModule } from './gateway/gateway.module';
import { PredictiveMaintenanceModule } from './predictive-maintenance/predictive-maintenance.module';
import { IoTSensorsModule } from './sensors/sensors.module';

@Module({
  imports: [
    IoTDevicesModule,
    IoTSensorsModule,
    IoTGatewayModule,
    IoTAlertsModule,
    PredictiveMaintenanceModule,
    EnvironmentalMonitoringModule,
    EnergyMonitoringModule,
    IoTAnalyticsModule,
  ],
  exports: [
    IoTDevicesModule,
    IoTSensorsModule,
    IoTGatewayModule,
    IoTAlertsModule,
    PredictiveMaintenanceModule,
    EnvironmentalMonitoringModule,
    EnergyMonitoringModule,
    IoTAnalyticsModule,
  ],
})
export class IoTModule {}
