-- Migration: REX SOO Submission System
-- Description: Creates tables for managing REX SOO export submissions with CSV data and PDF documents

-- Create rex_submissions table to store CSV submission data
CREATE TABLE IF NOT EXISTS rex_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- CSV Data Fields
    rex_importer_id VARCHAR(500),
    destination_country_id VARCHAR(200),
    freight_route VARCHAR(200),
    bl_no VARCHAR(200),
    bl_date DATE,
    container_no VARCHAR(200),
    ad_code VARCHAR(100),
    serial VARCHAR(100),
    year VARCHAR(50),
    exp_date DATE,
    bill_of_export_no VARCHAR(200),
    bill_of_export_date DATE,
    hs_code VARCHAR(100),
    quantity NUMERIC(15, 2),
    unit_type VARCHAR(100),
    invoice_no VARCHAR(200),
    invoice_date DATE,
    currency VARCHAR(20),
    invoice_value NUMERIC(15, 2),
    declaration_date DATE,

    -- Submission Metadata
    status VARCHAR(50) DEFAULT 'pending',
    credits_used NUMERIC(10, 2) DEFAULT 0,
    csv_file_name TEXT,
    zip_file_name TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rex_documents table to store uploaded PDF files
CREATE TABLE IF NOT EXISTS rex_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES rex_submissions(id) ON DELETE CASCADE,

    -- Document Information
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('bl', 'invoice')),
    file_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',

    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_rex_submissions_user_id ON rex_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_rex_submissions_bl_no ON rex_submissions(bl_no);
CREATE INDEX IF NOT EXISTS idx_rex_submissions_invoice_no ON rex_submissions(invoice_no);
CREATE INDEX IF NOT EXISTS idx_rex_submissions_created_at ON rex_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rex_submissions_status ON rex_submissions(status);

CREATE INDEX IF NOT EXISTS idx_rex_documents_submission_id ON rex_documents(submission_id);
CREATE INDEX IF NOT EXISTS idx_rex_documents_type ON rex_documents(document_type);

-- Insert service template for REX SOO Submission
INSERT INTO service_templates (
    service_id,
    service_name,
    description,
    credit_cost,
    template_path,
    automation_script_path,
    validation_rules,
    created_at,
    updated_at
) VALUES (
    'rex-soo-submission',
    'REX SOO Submission',
    'Upload CSV with BL and Invoice PDFs for REX SOO export submissions',
    2.0,
    '/templates/rex-soo-submission-template.csv',
    NULL,
    '{"required_fields": ["RexImporterId", "DestinationCountryId", "BLNo", "InvoiceNo"], "file_types": ["csv", "zip"]}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (service_id) DO UPDATE SET
    service_name = EXCLUDED.service_name,
    description = EXCLUDED.description,
    updated_at = NOW();

COMMENT ON TABLE rex_submissions IS 'Stores REX SOO export submission data from CSV uploads';
COMMENT ON TABLE rex_documents IS 'Stores Bill of Lading and Commercial Invoice PDF documents linked to submissions';
