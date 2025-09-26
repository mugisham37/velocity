import { Module } from '@nestjs/common';
import { MachineLearningService } from './machine-learning.service';
import { MaintenancePredictionService } from './maintenance-prediction.service';
import { PredictiveMaintenanceController } from './predictive-maintenance.controller';
import { PredictiveMaintenanceService } from './predictive-maintenance.service';

@Module({
  providers: [
    PredictiveMaintenanceService,
    MachineLearningService,
    MaintenancePredictionService,
  ],
  controllers: [PredictiveMaintenanceController],
  exports: [
    PredictiveMaintenanceService,
    MachineLearningService,
    MaintenancePredictionService,
  ],
})
export class PredictiveMaintenanceModule {}
