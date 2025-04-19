-- Drop existing tables if they exist
DROP TABLE IF EXISTS dropdown_options;
DROP TABLE IF EXISTS supplier_details;
DROP TABLE IF EXISTS exporter_details;
DROP TABLE IF EXISTS shipping_details;
DROP TABLE IF EXISTS arn_details;
DROP TABLE IF EXISTS dropdown_categories;

-- Create tables
CREATE TABLE dropdown_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE supplier_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    gstin TEXT NOT NULL,
    tax_invoice_no TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exporter_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    address TEXT NOT NULL,
    email TEXT NOT NULL,
    tax_id TEXT NOT NULL,
    ie_code TEXT NOT NULL,
    pan_no TEXT NOT NULL,
    gstin_no TEXT NOT NULL,
    state_code TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shipping_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    place_of_receipt TEXT NOT NULL,
    port_of_loading TEXT NOT NULL,
    port_of_discharge TEXT NOT NULL,
    final_destination TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE arn_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gst_circular TEXT NOT NULL,
    application_ref_no TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dropdown_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    value TEXT NOT NULL,
    label TEXT NOT NULL,
    related_record_id INTEGER,
    related_table TEXT,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category) REFERENCES dropdown_categories(name)
);

-- Insert default categories
INSERT INTO dropdown_categories (name, description) VALUES
    ('supplier', 'Supplier Details'),
    ('exporter', 'Exporter Details'),
    ('shipping', 'Shipping Details'),
    ('arn', 'ARN & Declaration'); 