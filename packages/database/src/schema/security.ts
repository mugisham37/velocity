import { relations } from 'drizzle-orm';
import {
    boolean,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { users } from './users';

// Security Events
export const securityEvents = pgTable('security_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(), // LOGIN_FAILURE, SUSPICIOUS_ACTIVITY, etc.
  severity: varchar('severity', { length: 20 }).notNull( // LOW, MEDIUM, HIGH, CRITICAL
  source: varchar('source', { length: 100 }).notNull(),
  userId: uuid('user_id').references(() => users.id),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const securityEventsRelations = relations(securityEvents, ({ one }) => ({
  user: one(users, {
    fields: [securityEvents.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [securityEvents.companyId],
    references: [companies.id],
  }),
}));

// Threat Intelligence
export const threatIntelligence = pgTable('threat_intelligence', {
  id: uuid('id').primaryKey().defaultRandom(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull().unique(),
  threatLevel: varchar('threat_level', { length: 20 }).notNull(),
  source: varchar('source', { length: 100 }).notNull(),
  description: text('description'),
  firstSeen: timestamp('first_seen').notNull(),
  lastSeen: timestamp('last_seen').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Threat Detections
export const threatDetections = pgTable('threat_detections', {
  id: uuid('id').primaryKey().defaultRandom(),
  threatId: varchar('threat_id', { length: 100 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  confidence: integer('confidence').notNull(), // 0-100
  sourceIp: varchar('source_ip', { length: 45 }),
  userId: uuid('user_id').references(() => users.id),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  details: jsonb('details'),
  recommendations: jsonb('recommendations'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const threatDetectionsRelations = relations(threatDetections, ({ one }) => ({
  user: one(users, {
    fields: [threatDetections.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [threatDetections.companyId],
    references: [companies.id],
  }),
}));

// Vulnerabilities
export const vulnerabilities = pgTable('vulnerabilities', {
  id: uuid('id').primaryKey().defaultRandom(),
  cveId: varchar('cve_id', { length: 50 }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  cvssScore: integer('cvss_score'),
  category: varchar('category', { length: 50 }).notNull(),
  component: varchar('component', { length: 255 }).notNull(),
  version: varchar('version', { length: 50 }),
  fixedVersion: varchar('fixed_version', { length: 50 }),
  status: varchar('status', { length: 50 }).notNull(),
  discoveredAt: timestamp('discovered_at').notNull(),
  fixedAt: timestamp('fixed_at'),
  references: jsonb('references'),
  remediation: jsonb('remediation'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Vulnerability Scans
export const vulnerabilityScans = pgTable('vulnerability_scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  scanId: varchar('scan_id', { length: 100 }).notNull().unique(),
  scanType: varchar('scan_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  summary: jsonb('summary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Compliance Assessments
export const complianceAssessments = pgTable('compliance_assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  frameworkId: varchar('framework_id', { length: 50 }).notNull(),
  assessmentDate: timestamp('assessment_date').notNull(),
  assessor: uuid('assessor').references(() => users.id).notNull(),
  scope: text('scope'),
  overallScore: integer('overall_score'),
  status: varchar('status', { length: 50 }).notNull(),
  recommendations: jsonb('recommendations'),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const complianceAssessmentsRelations = relations(complianceAssessments, ({ one, many }) => ({
  assessorUser: one(users, {
    fields: [complianceAssessments.assessor],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [complianceAssessments.companyId],
    references: [companies.id],
  }),
  findings: many(complianceFindings),
}));

// Compliance Findings
export const complianceFindings = pgTable('compliance_findings', {
  id: uuid('id').primaryKey().defaultRandom(),
  assessmentId: uuid('assessment_id').references(() => complianceAssessments.id).notNull(),
  requirementId: varchar('requirement_id', { length: 100 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  description: text('description').notNull(),
  evidence: jsonb('evidence'),
  remediation: jsonb('remediation'),
  dueDate: timestamp('due_date'),
  status: varchar('status', { length: 50 }).notNull(),
  assignee: varchar('assignee', { length: 255 }),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const complianceFindingsRelations = relations(complianceFindings, ({ one }) => ({
  assessment: one(complianceAssessments, {
    fields: [complianceFindings.assessmentId],
    references: [complianceAssessments.id],
  }),
  company: one(companies, {
    fields: [complianceFindings.companyId],
    references: [companies.id],
  }),
}));

// Data Subjects (GDPR)
export const dataSubjects = pgTable('data_subjects', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  consentStatus: jsonb('consent_status'),
  dataCategories: jsonb('data_categories'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const dataSubjectsRelations = relations(dataSubjects, ({ one, many }) => ({
  company: one(companies, {
    fields: [dataSubjects.companyId],
    references: [companies.id],
  }),
  requests: many(dataRequests),
}));

// Data Processing Activities
export const dataProcessingActivities = pgTable('data_processing_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  purpose: text('purpose').notNull(),
  legalBasis: varchar('legal_basis', { length: 50 }).notNull(),
  dataCategories: jsonb('data_categories'),
  recipients: jsonb('recipients'),
  retentionPeriod: integer('retention_period').notNull(), // in days
  crossBorderTransfer: boolean('cross_border_transfer').default(false),
  safeguards: jsonb('safeguards'),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const dataProcessingActivitiesRelations = relations(dataProcessingActivities, ({ one }) => ({
  company: one(companies, {
    fields: [dataProcessingActivities.companyId],
    references: [companies.id],
  }),
}));

// Data Requests (GDPR)
export const dataRequests = pgTable('data_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(), // ACCESS, RECTIFICATION, ERASURE, etc.
  subjectId: varchar('subject_id', { length: 255 }).notNull(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  requestDate: timestamp('request_date').notNull(),
  completionDate: timestamp('completion_date'),
  description: text('description'),
  response: text('response'),
  documents: jsonb('documents'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const dataRequestsRelations = relations(dataRequests, ({ one }) => ({
  company: one(companies, {
    fields: [dataRequests.companyId],
    references: [companies.id],
  }),
}));

// Data Breaches
export const dataBreaches = pgTable('data_breaches', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  affectedRecords: integer('affected_records').notNull(),
  dataCategories: jsonb('data_categories'),
  cause: text('cause').notNull(),
  discoveredAt: timestamp('discovered_at').notNull(),
  reportedAt: timestamp('reported_at'),
  containedAt: timestamp('contained_at'),
  resolvedAt: timestamp('resolved_at'),
  notificationRequired: boolean('notification_required').default(false),
  authorityNotified: boolean('authority_notified').default(false),
  subjectsNotified: boolean('subjects_notified').default(false),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  remediation: jsonb('remediation'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const dataBreachesRelations = relations(dataBreaches, ({ one }) => ({
  company: one(companies, {
    fields: [dataBreaches.companyId],
    references: [companies.id],
  }),
}));

// Privacy Impact Assessments
export const privacyImpactAssessments = pgTable('privacy_impact_assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  processingActivity: varchar('processing_activity', { length: 255 }).notNull(),
  riskLevel: varchar('risk_level', { length: 20 }).notNull(),
  dataTypes: jsonb('data_types'),
  risks: jsonb('risks'),
  mitigations: jsonb('mitigations'),
  status: varchar('status', { length: 50 }).notNull(),
  assessor: uuid('assessor').references(() => users.id).notNull(),
  reviewer: uuid('reviewer').references(() => users.id),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const privacyImpactAssessmentsRelations = relations(privacyImpactAssessments, ({ one }) => ({
  assessorUser: one(users, {
    fields: [privacyImpactAssessments.assessor],
    references: [users.id],
  }),
  reviewerUser: one(users, {
    fields: [privacyImpactAssessments.reviewer],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [privacyImpactAssessments.companyId],
    references: [companies.id],
  }),
}));

// API Keys
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  keyHash: varchar('key_hash', { length: 255 }).notNull(),
  prefix: varchar('prefix', { length: 20 }).notNull(),
  permissions: jsonb('permissions'),
  userId: uuid('user_id').references(() => users.id).notNull(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [apiKeys.companyId],
    references: [companies.id],
  }),
}));

// Security Configurations
export const securityConfigurations = pgTable('security_configurations', {
  id: uuid('id').primaryKey().defaultRandom(),
  component: varchar('component', { length: 100 }).notNull(),
  setting: varchar('setting', { length: 100 }).notNull(),
  currentValue: jsonb('current_value'),
  recommendedValue: jsonb('recommended_value'),
  severity: varchar('severity', { length: 20 }).notNull(),
  description: text('description'),
  remediation: text('remediation'),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  lastChecked: timestamp('last_checked').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const securityConfigurationsRelations = relations(securityConfigurations, ({ one }) => ({
  company: one(companies, {
    fields: [securityConfigurations.companyId],
    references: [companies.id],
  }),
}));
