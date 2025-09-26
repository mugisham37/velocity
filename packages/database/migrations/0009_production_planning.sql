-- Production Planning Tables Migration
-- This migration adds tables for production planning, MRP, capacity planning, and forecasting

-- Production Plans (master production schedule)
CREATE TABLE production_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name VARCHAR(255) NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
 from_date TIMESTAMP NOT NULL,
    to_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    description TEXT,
    get_items_from_open_sales_orders BOOLEAN DEFAULT false,
    download_materials_required BOOLEAN DEFAULT false,
    ignore_existing_ordered_qty BOOLEAN DEFAULT false,
    consider_min_order_qty BOOLEAN DEFAULT false,
    include_non_stock_items BOOLEAN DEFAULT false,
    include_subcontracted_items BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Production Plan Items
CREATE TABLE production_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_plan_id UUID NOT NULL REFERENCES production_plans(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    item_code VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    bom_id UUID REFERENCES boms(id),
    bom_no VARCHAR(50),
    planned_qty DECIMAL(15,6) NOT NULL,
    pending_qty DECIMAL(15,6) DEFAULT 0,
    produced_qty DECIMAL(15,6) DEFAULT 0,
    uom VARCHAR(50) NOT NULL,
    warehouse_id UUID REFERENCES warehouses(id),
    planned_start_date TIMESTAMP,
    planned_end_date TIMESTAMP,
    actual_start_date TIMESTAMP,
    actual_end_date TIMESTAMP,
    description TEXT,
    sales_order_id UUID,
    sales_order_item VARCHAR(100),
    material_request_id UUID,
    work_order_id UUID,
    idx INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Material Requirements Planning (MRP)
CREATE TABLE mrp_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_name VARCHAR(255) NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    from_date TIMESTAMP NOT NULL,
    to_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    include_non_stock_items BOOLEAN DEFAULT false,
    include_subcontracted_items BOOLEAN DEFAULT false,
    ignore_existing_ordered_qty BOOLEAN DEFAULT false,
    consider_min_order_qty BOOLEAN DEFAULT false,
    consider_safety_stock BOOLEAN DEFAULT true,
    warehouse_id UUID REFERENCES warehouses(id),
    item_group_id UUID,
    buyer_id UUID,
    project_id UUID,
    run_start_time TIMESTAMP,
    run_end_time TIMESTAMP,
    error_log TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- MRP Results
CREATE TABLE mrp_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mrp_run_id UUID NOT NULL REFERENCES mrp_runs(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    item_code VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    warehouse_id UUID REFERENCES warehouses(id),
    required_date TIMESTAMP NOT NULL,
    planned_order_date TIMESTAMP,
    planned_order_receipt TIMESTAMP,
    gross_requirement DECIMAL(15,6) DEFAULT 0,
    scheduled_receipts DECIMAL(15,6) DEFAULT 0,
    projected_available_balance DECIMAL(15,6) DEFAULT 0,
    net_requirement DECIMAL(15,6) DEFAULT 0,
    planned_order_quantity DECIMAL(15,6) DEFAULT 0,
    uom VARCHAR(50) NOT NULL,
    lead_time_days INTEGER DEFAULT 0,
    safety_stock DECIMAL(15,6) DEFAULT 0,
    min_order_qty DECIMAL(15,6) DEFAULT 0,
    max_order_qty DECIMAL(15,6) DEFAULT 0,
    order_multiple DECIMAL(15,6) DEFAULT 1,
    action_required VARCHAR(100),
    source_document VARCHAR(255),
    source_document_id UUID,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Capacity Planning
CREATE TABLE capacity_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name VARCHAR(255) NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    from_date TIMESTAMP NOT NULL,
    to_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    workstation_id UUID REFERENCES workstations(id),
    include_work_orders BOOLEAN DEFAULT true,
    include_production_plans BOOLEAN DEFAULT true,
    include_maintenance_schedule BOOLEAN DEFAULT false,
    capacity_uom VARCHAR(50) DEFAULT 'Hours',
    run_start_time TIMESTAMP,
    run_end_time TIMESTAMP,
    error_log TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Capacity Plan Results
CREATE TABLE capacity_plan_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capacity_plan_id UUID NOT NULL REFERENCES capacity_plans(id) ON DELETE CASCADE,
    workstation_id UUID NOT NULL REFERENCES workstations(id),
    workstation_name VARCHAR(255) NOT NULL,
    planning_date TIMESTAMP NOT NULL,
    available_capacity DECIMAL(15,2) DEFAULT 0,
    planned_capacity DECIMAL(15,2) DEFAULT 0,
    capacity_utilization DECIMAL(5,2) DEFAULT 0,
    overload_hours DECIMAL(15,2) DEFAULT 0,
    underload_hours DECIMAL(15,2) DEFAULT 0,
    capacity_uom VARCHAR(50) DEFAULT 'Hours',
    source_document VARCHAR(255),
    source_document_id UUID,
    operation_id UUID,
    operation_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Production Forecasts
CREATE TABLE production_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_name VARCHAR(255) NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    item_code VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    forecast_date TIMESTAMP NOT NULL,
    forecast_quantity DECIMAL(15,6) NOT NULL,
    uom VARCHAR(50) NOT NULL,
    warehouse_id UUID REFERENCES warehouses(id),
    sales_order_id UUID,
    forecast_type VARCHAR(50) DEFAULT 'Manual',
    confidence_level DECIMAL(5,2) DEFAULT 0,
    seasonal_factor DECIMAL(5,4) DEFAULT 1,
    trend_factor DECIMAL(5,4) DEFAULT 1,
    actual_quantity DECIMAL(15,6) DEFAULT 0,
    variance DECIMAL(15,6) DEFAULT 0,
    variance_percentage DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_production_plan_name ON production_plans(plan_name);
CREATE INDEX idx_production_plan_company_id ON production_plans(company_id);
CREATE INDEX idx_production_plan_status ON production_plans(status);
CREATE INDEX idx_production_plan_from_date ON production_plans(from_date);
CREATE INDEX idx_production_plan_to_date ON production_plans(to_date);

CREATE INDEX idx_production_plan_items_plan_id ON production_plan_items(production_plan_id);
CREATE INDEX idx_production_plan_items_item_id ON production_plan_items(item_id);
CREATE INDEX idx_production_plan_items_bom_id ON production_plan_items(bom_id);
CREATE INDEX idx_production_plan_items_warehouse_id ON production_plan_items(warehouse_id);
CREATE INDEX idx_production_plan_items_planned_start_date ON production_plan_items(planned_start_date);

CREATE INDEX idx_mrp_run_name ON mrp_runs(run_name);
CREATE INDEX idx_mrp_run_company_id ON mrp_runs(company_id);
CREATE INDEX idx_mrp_run_status ON mrp_runs(status);
CREATE INDEX idx_mrp_run_from_date ON mrp_runs(from_date);
CREATE INDEX idx_mrp_run_to_date ON mrp_runs(to_date);

CREATE INDEX idx_mrp_results_run_id ON mrp_results(mrp_run_id);
CREATE INDEX idx_mrp_results_item_id ON mrp_results(item_id);
CREATE INDEX idx_mrp_results_warehouse_id ON mrp_results(warehouse_id);
CREATE INDEX idx_mrp_results_required_date ON mrp_results(required_date);
CREATE INDEX idx_mrp_results_action_required ON mrp_results(action_required);

CREATE INDEX idx_capacity_plan_name ON capacity_plans(plan_name);
CREATE INDEX idx_capacity_plan_company_id ON capacity_plans(company_id);
CREATE INDEX idx_capacity_plan_status ON capacity_plans(status);
CREATE INDEX idx_capacity_plan_from_date ON capacity_plans(from_date);
CREATE INDEX idx_capacity_plan_to_date ON capacity_plans(to_date);
CREATE INDEX idx_capacity_plan_workstation_id ON capacity_plans(workstation_id);

CREATE INDEX idx_capacity_plan_results_plan_id ON capacity_plan_results(capacity_plan_id);
CREATE INDEX idx_capacity_plan_results_workstation_id ON capacity_plan_results(workstation_id);
CREATE INDEX idx_capacity_plan_results_planning_date ON capacity_plan_results(planning_date);

CREATE INDEX idx_production_forecast_name ON production_forecasts(forecast_name);
CREATE INDEX idx_production_forecast_company_id ON production_forecasts(company_id);
CREATE INDEX idx_production_forecast_item_id ON production_forecasts(item_id);
CREATE INDEX idx_production_forecast_date ON production_forecasts(forecast_date);
CREATE INDEX idx_production_forecast_type ON production_forecasts(forecast_type);

-- Add constraints
ALTER TABLE production_plans ADD CONSTRAINT chk_production_plan_status
    CHECK (status IN ('Draft', 'Submitted', 'Completed', 'Cancelled'));

ALTER TABLE production_plans ADD CONSTRAINT chk_production_plan_dates
    CHECK (to_date >= from_date);

ALTER TABLE mrp_runs ADD CONSTRAINT chk_mrp_run_status
    CHECK (status IN ('Draft', 'Running', 'Completed', 'Failed'));

ALTER TABLE mrp_runs ADD CONSTRAINT chk_mrp_run_dates
    CHECK (to_date >= from_date);

ALTER TABLE capacity_plans ADD CONSTRAINT chk_capacity_plan_status
    CHECK (status IN ('Draft', 'Running', 'Completed', 'Failed'));

ALTER TABLE capacity_plans ADD CONSTRAINT chk_capacity_plan_dates
    CHECK (to_date >= from_date);

ALTER TABLE production_forecasts ADD CONSTRAINT chk_forecast_type
    CHECK (forecast_type IN ('Manual', 'AI_Generated', 'Historical_Average'));

ALTER TABLE production_forecasts ADD CONSTRAINT chk_confidence_level
    CHECK (confidence_level >= 0 AND confidence_level <= 100);

-- Add comments for documentation
COMMENT ON TABLE production_plans IS 'Master production schedule for planning production activities';
COMMENT ON TABLE production_plan_items IS 'Individual items in a production plan with quantities and dates';
COMMENT ON TABLE mrp_runs IS 'Material Requirements Planning execution runs';
COMMENT ON TABLE mrp_results IS 'Results from MRP calculations showing material requirements';
COMMENT ON TABLE capacity_plans IS 'Capacity planning runs for workstation utilization analysis';
COMMENT ON TABLE capacity_plan_results IS 'Results from capacity planning showing workstation utilization';
COMMENT ON TABLE production_forecasts IS 'Production demand forecasts for items';
