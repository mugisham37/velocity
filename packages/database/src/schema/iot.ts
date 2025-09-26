import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { assets } from './assets';
import { companies } from './companies';
import { users } from './users';

// Enums for IoT system
export const deviceStatusEnum = pgEnum('device_status', [
  'active',
  'inactive',
  'maintenance',
  'error',
  'offline',
]);

export const sensorTypeEnum = pgEnum('sensor_type', [
  'temperature',
  'humidity',
  'pressure',
  'vibration',
  'current',
  'voltage',
  'power',
  'flow',
  'level',
  'ph',
  'conductivity',
  'turbidity',
  'gps',
  'rfid',
  'proximity',
  'motion',
  'light',
  'sound',
  'gas',
  'smoke',
  'air_quality',
  'energy',
  'custom',
]);

export const alertSeverityEnum = pgEnum('alert_severity', [
  'low',
  'medium',
  'high',
  'critical',
]);

export const alertStatusEnum = pgEnum('alert_status', [
  'open',
  'acknowledged',
  'resolved',
  'closed',
]);

// IoT Devices table
export const iotDevices = pgTable(
  'iot_devices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    deviceId: varchar('device_id', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    deviceType: varchar('device_type', { length: 100 }).notNull(),
    manufacturer: varchar('manufacturer', { length: 100 }),
    model: varchar('model', { length: 100 }),
    firmwareVersion: varchar('firmware_version', { length: 50 }),
    status: deviceStatusEnum('status').default('inactive').notNull(),
    location: jsonb('location'), // {lat, lng, address, building, floor, room}
    configuration: jsonb('configuration'), // Device-specific config
    metadata: jsonb('metadata'), // Additional device info
    lastSeen: timestamp('last_seen', { withTimezone: true }),
    assetId: uuid('asset_id').references(() => assets.id),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  table => ({
    deviceIdIdx: index('idx_iot_devices_device_id').on(table.deviceId),
    statusIdx: index('idx_iot_devices_status').on(table.status),
    companyIdx: index('idx_iot_devices_company_id').on(table.companyId),
    assetIdx: index('idx_iot_devices_asset_id').on(table.assetId),
    lastSeenIdx: index('idx_iot_devices_last_seen').on(table.lastSeen),
  })
);

// IoT Sensors table
export const iotSensors = pgTable(
  'iot_sensors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    deviceId: uuid('device_id')
      .references(() => iotDevices.id)
      .notNull(),
    sensorId: varchar('sensor_id', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    sensorType: sensorTypeEnum('sensor_type').notNull(),
    unit: varchar('unit', { length: 20 }),
    minValue: decimal('min_value', { precision: 15, scale: 4 }),
    maxValue: decimal('max_value', { precision: 15, scale: 4 }),
    accuracy: decimal('accuracy', { precision: 10, scale: 6 }),
    resolution: decimal('resolution', { precision: 10, scale: 6 }),
    calibrationDate: timestamp('calibration_date', { withTimezone: true }),
    nextCalibrationDate: timestamp('next_calibration_date', {
      withTimezone: true,
    }),
    isActive: boolean('is_active').default(true).notNull(),
    configuration: jsonb('configuration'),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    deviceSensorIdx: index('idx_iot_sensors_device_sensor').on(
      table.deviceId,
      table.sensorId
    ),
    typeIdx: index('idx_iot_sensors_type').on(table.sensorType),
    companyIdx: index('idx_iot_sensors_company_id').on(table.companyId),
    activeIdx: index('idx_iot_sensors_active').on(table.isActive),
  })
);

// IoT Sensor Data (TimescaleDB hypertable - defined in SQL init)
// This table is created in SQL for TimescaleDB optimization
export const iotSensorData = pgTable(
  'iot_sensor_data',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    deviceId: varchar('device_id', { length: 100 }).notNull(),
    sensorType: varchar('sensor_type', { length: 50 }).notNull(),
    measurementType: varchar('measurement_type', { length: 50 }).notNull(),
    value: decimal('value', { precision: 15, scale: 4 }).notNull(),
    unit: varchar('unit', { length: 20 }),
    location: jsonb('location'),
    metadata: jsonb('metadata'),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .defaultNow()
      .notNull(),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
  },
  table => ({
    deviceTimestampIdx: index('idx_iot_sensor_data_device_timestamp').on(
      table.deviceId,
      table.timestamp
    ),
    typeTimestampIdx: index('idx_iot_sensor_data_type_timestamp').on(
      table.sensorType,
      table.timestamp
    ),
    companyTimestampIdx: index('idx_iot_sensor_data_company_timestamp').on(
      table.companyId,
      table.timestamp
    ),
  })
);

// Equipment Metrics (TimescaleDB hypertable)
export const equipmentMetrics = pgTable(
  'equipment_metrics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    equipmentId: varchar('equipment_id', { length: 100 }).notNull(),
    metricName: varchar('metric_name', { length: 100 }).notNull(),
    metricValue: decimal('metric_value', { precision: 15, scale: 4 }).notNull(),
    unit: varchar('unit', { length: 20 }),
    status: varchar('status', { length: 20 }).default('normal'),
    alertThreshold: decimal('alert_threshold', { precision: 15, scale: 4 }),
    metadata: jsonb('metadata'),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .defaultNow()
      .notNull(),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
  },
  table => ({
    equipmentTimestampIdx: index(
      'idx_equipment_metrics_equipment_timestamp'
    ).on(table.equipmentId, table.timestamp),
    metricTimestampIdx: index('idx_equipment_metrics_metric_timestamp').on(
      table.metricName,
      table.timestamp
    ),
    companyTimestampIdx: index('idx_equipment_metrics_company_timestamp').on(
      table.companyId,
      table.timestamp
    ),
  })
);

// IoT Alerts table
export const iotAlerts = pgTable(
  'iot_alerts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    deviceId: uuid('device_id').references(() => iotDevices.id),
    sensorId: uuid('sensor_id').references(() => iotSensors.id),
    alertType: varchar('alert_type', { length: 100 }).notNull(),
    severity: alertSeverityEnum('severity').notNull(),
    status: alertStatusEnum('status').default('open').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    triggerValue: decimal('trigger_value', { precision: 15, scale: 4 }),
    thresholdValue: decimal('threshold_value', { precision: 15, scale: 4 }),
    metadata: jsonb('metadata'),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    acknowledgedBy: uuid('acknowledged_by').references(() => users.id),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedBy: uuid('resolved_by').references(() => users.id),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    deviceIdx: index('idx_iot_alerts_device_id').on(table.deviceId),
    severityIdx: index('idx_iot_alerts_severity').on(table.severity),
    statusIdx: index('idx_iot_alerts_status').on(table.status),
    companyIdx: index('idx_iot_alerts_company_id').on(table.companyId),
    createdAtIdx: index('idx_iot_alerts_created_at').on(table.createdAt),
  })
);

// IoT Gateway Configuration
export const iotGateways = pgTable(
  'iot_gateways',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    gatewayId: varchar('gateway_id', { length: 100 }).notNull().unique(),
    protocol: varchar('protocol', { length: 50 }).notNull(), // MQTT, HTTP, CoAP, etc.
    endpoint: varchar('endpoint', { length: 500 }).notNull(),
    port: varchar('port', { length: 10 }),
    username: varchar('username', { length: 100 }),
    password: varchar('password', { length: 255 }), // Should be encrypted
    certificatePath: varchar('certificate_path', { length: 500 }),
    configuration: jsonb('configuration'),
    isActive: boolean('is_active').default(true).notNull(),
    lastHeartbeat: timestamp('last_heartbeat', { withTimezone: true }),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    gatewayIdIdx: index('idx_iot_gateways_gateway_id').on(table.gatewayId),
    protocolIdx: index('idx_iot_gateways_protocol').on(table.protocol),
    companyIdx: index('idx_iot_gateways_company_id').on(table.companyId),
    activeIdx: index('idx_iot_gateways_active').on(table.isActive),
  })
);

// Predictive Maintenance Models
export const predictiveMaintenanceModels = pgTable(
  'predictive_maintenance_models',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    modelType: varchar('model_type', { length: 100 }).notNull(), // regression, classification, anomaly_detection
    algorithm: varchar('algorithm', { length: 100 }).notNull(), // random_forest, svm, neural_network, etc.
    targetVariable: varchar('target_variable', { length: 100 }).notNull(),
    features: jsonb('features').notNull(), // Array of feature names
    hyperparameters: jsonb('hyperparameters'),
    trainingData: jsonb('training_data'), // Reference to training dataset
    modelPath: varchar('model_path', { length: 500 }), // Path to saved model file
    accuracy: decimal('accuracy', { precision: 5, scale: 4 }),
    precision: decimal('precision', { precision: 5, scale: 4 }),
    recall: decimal('recall', { precision: 5, scale: 4 }),
    f1Score: decimal('f1_score', { precision: 5, scale: 4 }),
    isActive: boolean('is_active').default(false).notNull(),
    lastTrainedAt: timestamp('last_trained_at', { withTimezone: true }),
    nextTrainingAt: timestamp('next_training_at', { withTimezone: true }),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdBy: uuid('created_by').references(() => users.id),
  },
  table => ({
    nameIdx: index('idx_pm_models_name').on(table.name),
    typeIdx: index('idx_pm_models_type').on(table.modelType),
    companyIdx: index('idx_pm_models_company_id').on(table.companyId),
    activeIdx: index('idx_pm_models_active').on(table.isActive),
  })
);

// Predictive Maintenance Predictions
export const predictiveMaintenancePredictions = pgTable(
  'predictive_maintenance_predictions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    modelId: uuid('model_id')
      .references(() => predictiveMaintenanceModels.id)
      .notNull(),
    assetId: uuid('asset_id')
      .references(() => assets.id)
      .notNull(),
    deviceId: uuid('device_id').references(() => iotDevices.id),
    predictionType: varchar('prediction_type', { length: 100 }).notNull(), // failure_probability, remaining_useful_life, anomaly_score
    predictedValue: decimal('predicted_value', {
      precision: 15,
      scale: 4,
    }).notNull(),
    confidence: decimal('confidence', { precision: 5, scale: 4 }),
    features: jsonb('features'), // Input features used for prediction
    metadata: jsonb('metadata'),
    predictedAt: timestamp('predicted_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
  },
  table => ({
    modelAssetIdx: index('idx_pm_predictions_model_asset').on(
      table.modelId,
      table.assetId
    ),
    typeIdx: index('idx_pm_predictions_type').on(table.predictionType),
    predictedAtIdx: index('idx_pm_predictions_predicted_at').on(
      table.predictedAt
    ),
    companyIdx: index('idx_pm_predictions_company_id').on(table.companyId),
  })
);

// Environmental Monitoring
export const environmentalMonitoring = pgTable(
  'environmental_monitoring',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    locationId: varchar('location_id', { length: 100 }).notNull(),
    locationName: varchar('location_name', { length: 255 }).notNull(),
    monitoringType: varchar('monitoring_type', { length: 100 }).notNull(), // air_quality, temperature, humidity, noise, etc.
    deviceId: uuid('device_id').references(() => iotDevices.id),
    value: decimal('value', { precision: 15, scale: 4 }).notNull(),
    unit: varchar('unit', { length: 20 }).notNull(),
    qualityIndex: decimal('quality_index', { precision: 5, scale: 2 }), // 0-100 quality score
    status: varchar('status', { length: 50 }).default('normal').notNull(),
    alertThreshold: decimal('alert_threshold', { precision: 15, scale: 4 }),
    regulatoryLimit: decimal('regulatory_limit', { precision: 15, scale: 4 }),
    metadata: jsonb('metadata'),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .defaultNow()
      .notNull(),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
  },
  table => ({
    locationTypeIdx: index('idx_env_monitoring_location_type').on(
      table.locationId,
      table.monitoringType
    ),
    timestampIdx: index('idx_env_monitoring_timestamp').on(table.timestamp),
    statusIdx: index('idx_env_monitoring_status').on(table.status),
    companyIdx: index('idx_env_monitoring_company_id').on(table.companyId),
  })
);

// Energy Consumption Tracking
export const energyConsumption = pgTable(
  'energy_consumption',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    meterId: varchar('meter_id', { length: 100 }).notNull(),
    meterType: varchar('meter_type', { length: 50 }).notNull(), // electricity, gas, water, steam
    locationId: varchar('location_id', { length: 100 }).notNull(),
    locationName: varchar('location_name', { length: 255 }).notNull(),
    deviceId: uuid('device_id').references(() => iotDevices.id),
    consumption: decimal('consumption', { precision: 15, scale: 4 }).notNull(),
    unit: varchar('unit', { length: 20 }).notNull(), // kWh, m3, liters, etc.
    cost: decimal('cost', { precision: 15, scale: 2 }),
    currency: varchar('currency', { length: 3 }),
    tariffRate: decimal('tariff_rate', { precision: 10, scale: 6 }),
    peakHours: boolean('peak_hours').default(false),
    carbonFootprint: decimal('carbon_footprint', { precision: 15, scale: 4 }), // CO2 equivalent
    metadata: jsonb('metadata'),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .defaultNow()
      .notNull(),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
  },
  table => ({
    meterTimestampIdx: index('idx_energy_consumption_meter_timestamp').on(
      table.meterId,
      table.timestamp
    ),
    locationTimestampIdx: index('idx_energy_consumption_location_timestamp').on(
      table.locationId,
      table.timestamp
    ),
    typeTimestampIdx: index('idx_energy_consumption_type_timestamp').on(
      table.meterType,
      table.timestamp
    ),
    companyIdx: index('idx_energy_consumption_company_id').on(table.companyId),
  })
);

// Relations
export const iotDevicesRelations = relations(iotDevices, ({ one, many }) => ({
  company: one(companies, {
    fields: [iotDevices.companyId],
    references: [companies.id],
  }),
  asset: one(assets, {
    fields: [iotDevices.assetId],
    references: [assets.id],
  }),
  createdByUser: one(users, {
    fields: [iotDevices.createdBy],
    references: [users.id],
  }),
  updatedByUser: one(users, {
    fields: [iotDevices.updatedBy],
    references: [users.id],
  }),
  sensors: many(iotSensors),
  alerts: many(iotAlerts),
  predictions: many(predictiveMaintenancePredictions),
  environmentalMonitoring: many(environmentalMonitoring),
  energyConsumption: many(energyConsumption),
}));

export const iotSensorsRelations = relations(iotSensors, ({ one, many }) => ({
  device: one(iotDevices, {
    fields: [iotSensors.deviceId],
    references: [iotDevices.id],
  }),
  company: one(companies, {
    fields: [iotSensors.companyId],
    references: [companies.id],
  }),
  alerts: many(iotAlerts),
}));

export const iotAlertsRelations = relations(iotAlerts, ({ one }) => ({
  device: one(iotDevices, {
    fields: [iotAlerts.deviceId],
    references: [iotDevices.id],
  }),
  sensor: one(iotSensors, {
    fields: [iotAlerts.sensorId],
    references: [iotSensors.id],
  }),
  company: one(companies, {
    fields: [iotAlerts.companyId],
    references: [companies.id],
  }),
  acknowledgedByUser: one(users, {
    fields: [iotAlerts.acknowledgedBy],
    references: [users.id],
  }),
  resolvedByUser: one(users, {
    fields: [iotAlerts.resolvedBy],
    references: [users.id],
  }),
}));

export const iotGatewaysRelations = relations(iotGateways, ({ one }) => ({
  company: one(companies, {
    fields: [iotGateways.companyId],
    references: [companies.id],
  }),
}));

export const predictiveMaintenanceModelsRelations = relations(
  predictiveMaintenanceModels,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [predictiveMaintenanceModels.companyId],
      references: [companies.id],
    }),
    createdByUser: one(users, {
      fields: [predictiveMaintenanceModels.createdBy],
      references: [users.id],
    }),
    predictions: many(predictiveMaintenancePredictions),
  })
);

export const predictiveMaintenancePredictionsRelations = relations(
  predictiveMaintenancePredictions,
  ({ one }) => ({
    model: one(predictiveMaintenanceModels, {
      fields: [predictiveMaintenancePredictions.modelId],
      references: [predictiveMaintenanceModels.id],
    }),
    asset: one(assets, {
      fields: [predictiveMaintenancePredictions.assetId],
      references: [assets.id],
    }),
    device: one(iotDevices, {
      fields: [predictiveMaintenancePredictions.deviceId],
      references: [iotDevices.id],
    }),
    company: one(companies, {
      fields: [predictiveMaintenancePredictions.companyId],
      references: [companies.id],
    }),
  })
);

export const environmentalMonitoringRelations = relations(
  environmentalMonitoring,
  ({ one }) => ({
    device: one(iotDevices, {
      fields: [environmentalMonitoring.deviceId],
      references: [iotDevices.id],
    }),
    company: one(companies, {
      fields: [environmentalMonitoring.companyId],
      references: [companies.id],
    }),
  })
);

export const energyConsumptionRelations = relations(
  energyConsumption,
  ({ one }) => ({
    device: one(iotDevices, {
      fields: [energyConsumption.deviceId],
      references: [iotDevices.id],
    }),
    company: one(companies, {
      fields: [energyConsumption.companyId],
      references: [companies.id],
    }),
  })
);
