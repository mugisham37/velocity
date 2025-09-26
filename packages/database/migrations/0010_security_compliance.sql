-- Security & Compliance Tables Migration
-- Task 17: Security & Compliance Implementation

-- Security Events Table
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    source VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_security_events_company_id ON security_events(company_id);
CREATE INDEX idx_security_events_type ON security_events(type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_created_at ON securints(created_at);

-- Threat Intelligence Table
CREATE TABLE IF NOT EXISTS threat_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    threat_level VARCHAR(20) NOT NULL,
    source VARCHAR(100) NOT NULL,
    description TEXT,
    first_seen TIMESTAMP NOT NULL,
    last_seen TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_threat_intelligence_ip ON threat_intelligence(ip_address);
CREATE INDEX idx_threat_intelligence_threat_level ON threat_intelligence(threat_level);

-- Threat Detections Table
CREATE TABLE IF NOT EXISTS threat_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    threat_id VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    confidence INTEGER NOT NULL,
    source_ip VARCHAR(45),
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id) NOT NULL,
    details JSONB,
    recommendations JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_threat_detections_company_id ON threat_detections(company_id);
CREATE INDEX idx_threat_detections_threat_id ON threat_detections(threat_id);
CREATE INDEX idx_threat_detections_severity ON threat_detections(severity);

-- Vulnerabilities Table
CREATE TABLE IF NOT EXISTS vulnerabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cve_id VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    cvss_score INTEGER,
    category VARCHAR(50) NOT NULL,
    component VARCHAR(255) NOT NULL,
    version VARCHAR(50),
    fixed_version VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    discovered_at TIMESTAMP NOT NULL,
    fixed_at TIMESTAMP,
    references JSONB,
    remediation JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_vulnerabilities_severity ON vulnerabilities(severity);
CREATE INDEX idx_vulnerabilities_status ON vulnerabilities(status);
CREATE INDEX idx_vulnerabilities_category ON vulnerabilities(category);
CREATE INDEX idx_vulnerabilities_component ON vulnerabilities(component);

-- Vulnerability Scans Table
CREATE TABLE IF NOT EXISTS vulnerability_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id VARCHAR(100) NOT NULL UNIQUE,
    scan_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    summary JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_vulnerability_scans_scan_type ON vulnerability_scans(scan_type);
CREATE INDEX idx_vulnerability_scans_status ON vulnerability_scans(status);

-- Compliance Assessments Table
CREATE TABLE IF NOT EXISTS compliance_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id VARCHAR(50) NOT NULL,
    assessment_date TIMESTAMP NOT NULL,
    assessor UUID REFERENCES users(id) NOT NULL,
    scope TEXT,
    overall_score INTEGER,
    status VARCHAR(50) NOT NULL,
    recommendations JSONB,
    company_id UUID REFERENCES companies(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_compliance_assessments_company_id ON compliance_assessments(company_id);
CREATE INDEX idx_compliance_assessments_framework_id ON compliance_assessments(framework_id);
CREATE INDEX idx_compliance_assessments_status ON compliance_assessments(status);

-- Compliance Findings Table
CREATE TABLE IF NOT EXISTS compliance_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES compliance_assessments(id) NOT NULL,
    requirement_id VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB,
    remediation JSONB,
    due_date TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    assignee VARCHAR(255),
    company_id UUID REFERENCES companies(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_compliance_findings_assessment_id ON compliance_findings(assessment_id);
CREATE INDEX idx_compliance_findings_company_id ON compliance_findings(company_id);
CREATE INDEX idx_compliance_findings_severity ON compliance_findings(severity);
CREATE INDEX idx_compliance_findings_status ON compliance_findings(status);

-- Data Subjects Table (GDPR)
CREATE TABLE IF NOT EXISTS data_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_id UUID REFERENCES companies(id) NOT NULL,
    consent_status JSONB,
    data_categories JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(email, company_id)
);

CREATE INDEX idx_data_subjects_company_id ON data_subjects(company_id);
CREATE INDEX idx_data_subjects_email ON data_subjects(email);

-- Data Processing Activities Table
CREATE TABLE IF NOT EXISTS data_processing_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    legal_basis VARCHAR(50) NOT NULL,
    data_categories JSONB,
    recipients JSONB,
    retention_period INTEGER NOT NULL,
    cross_border_transfer BOOLEAN DEFAULT FALSE,
    safeguards JSONB,
    company_id UUID REFERENCES companies(id) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_data_processing_activities_company_id ON data_processing_activities(company_id);
CREATE INDEX idx_data_processing_activities_is_active ON data_processing_activities(is_active);

-- Data Requests Table (GDPR)
CREATE TABLE IF NOT EXISTS data_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    subject_id VARCHAR(255) NOT NULL,
    company_id UUID REFERENCES companies(id) NOT NULL,
    status VARCHAR(50) NOT NULL,
    request_date TIMESTAMP NOT NULL,
    completion_date TIMESTAMP,
    description TEXT,
    response TEXT,
    documents JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_data_requests_company_id ON data_requests(company_id);
CREATE INDEX idx_data_requests_type ON data_requests(type);
CREATE INDEX idx_data_requests_status ON data_requests(status);
CREATE INDEX idx_data_requests_subject_id ON data_requests(subject_id);

-- Data Breaches Table
CREATE TABLE IF NOT EXISTS data_breaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    affected_records INTEGER NOT NULL,
    data_categories JSONB,
    cause TEXT NOT NULL,
    discovered_at TIMESTAMP NOT NULL,
    reported_at TIMESTAMP,
    contained_at TIMESTAMP,
    resolved_at TIMESTAMP,
    notification_required BOOLEAN DEFAULT FALSE,
    authority_notified BOOLEAN DEFAULT FALSE,
    subjects_notified BOOLEAN DEFAULT FALSE,
    company_id UUID REFERENCES companies(id) NOT NULL,
    status VARCHAR(50) NOT NULL,
    remediation JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_data_breaches_company_id ON data_breaches(company_id);
CREATE INDEX idx_data_breaches_severity ON data_breaches(severity);
CREATE INDEX idx_data_breaches_status ON data_breaches(status);

-- Privacy Impact Assessments Table
CREATE TABLE IF NOT EXISTS privacy_impact_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    processing_activity VARCHAR(255) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    data_types JSONB,
    risks JSONB,
    mitigations JSONB,
    status VARCHAR(50) NOT NULL,
    assessor UUID REFERENCES users(id) NOT NULL,
    reviewer UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_privacy_impact_assessments_company_id ON privacy_impact_assessments(company_id);
CREATE INDEX idx_privacy_impact_assessments_status ON privacy_impact_assessments(status);
CREATE INDEX idx_privacy_impact_assessments_risk_level ON privacy_impact_assessments(risk_level);

-- API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    prefix VARCHAR(20) NOT NULL,
    permissions JSONB,
    user_id UUID REFERENCES users(id) NOT NULL,
    company_id UUID REFERENCES companies(id) NOT NULL,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_company_id ON api_keys(company_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(prefix);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- Security Configurations Table
CREATE TABLE IF NOT EXISTS security_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component VARCHAR(100) NOT NULL,
    setting VARCHAR(100) NOT NULL,
    current_value JSONB,
    recommended_value JSONB,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    remediation TEXT,
    company_id UUID REFERENCES companies(id) NOT NULL,
    last_checked TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_security_configurations_company_id ON security_configurations(company_id);
CREATE INDEX idx_security_configurations_component ON security_configurations(component);
CREATE INDEX idx_security_configurations_severity ON security_configurations(severity);

-- Add MFA backup codes to users table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'mfa_backup_codes') THEN
        ALTER TABLE users ADD COLUMN mfa_backup_codes TEXT;
    END IF;
END $$;

-- Create security-related roles and permissions
INSERT INTO roles (name, description, permissions, company_id)
SELECT
    'Security Administrator',
    'Full access to security and compliance features',
    ARRAY['SECURITY_ADMIN', 'VULNERABILITY_MANAGE', 'THREAT_MONITOR', 'COMPLIANCE_MANAGE'],
    id
FROM companies
ON CONFLICT (name, company_id) DO NOTHING;

INSERT INTO roles (name, description, permissions, company_id)
SELECT
    'Compliance Officer',
    'Access to compliance and data protection features',
    ARRAY['COMPLIANCE_ADMIN', 'DATA_PROTECTION_MANAGE', 'AUDIT_VIEW'],
    id
FROM companies
ON CONFLICT (name, company_id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_company_created ON audit_logs(company_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_mfa_enabled ON users(mfa_enabled) WHERE mfa_enabled = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, expires_at) WHERE is_active = true;

-- Add comments for documentation
COMMENT ON TABLE security_events IS 'Security events and incidents tracking';
COMMENT ON TABLE threat_intelligence IS 'Threat intelligence data from various sources';
COMMENT ON TABLE threat_detections IS 'Real-time threat detection results';
COMMENT ON TABLE vulnerabilities IS 'Security vulnerabilities discovered in the system';
COMMENT ON TABLE compliance_assessments IS 'Compliance framework assessments (SOX, GDPR, etc.)';
COMMENT ON TABLE data_subjects IS 'GDPR data subjects and their consent status';
COMMENT ON TABLE data_requests IS 'GDPR data subject requests (access, erasure, etc.)';
COMMENT ON TABLE data_breaches IS 'Data breach incidents and response tracking';
COMMENT ON TABLE privacy_impact_assessments IS 'Privacy Impact Assessments for data processing activities';

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vulnerabilities_updated_at BEFORE UPDATE ON vulnerabilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_assessments_updated_at BEFORE UPDATE ON compliance_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_findings_updated_at BEFORE UPDATE ON compliance_findings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_subjects_updated_at BEFORE UPDATE ON data_subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_processing_activities_updated_at BEFORE UPDATE ON data_processing_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_requests_updated_at BEFORE UPDATE ON data_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_breaches_updated_at BEFORE UPDATE ON data_breaches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_privacy_impact_assessments_updated_at BEFORE UPDATE ON privacy_impact_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_security_configurations_updated_at BEFORE UPDATE ON security_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
