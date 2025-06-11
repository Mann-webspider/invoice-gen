<?php

use PDO;

class CreateInvoiceSchema
{
    public function up(PDO $pdo)
    {
        $pdo->exec("CREATE TABLE IF NOT EXISTS exporter_details (
            id TEXT PRIMARY KEY ,
            company_name TEXT ,
            company_address TEXT ,
            contact_number TEXT ,
            email TEXT ,
            tax_id TEXT ,
            ie_code TEXT ,
            pan_number TEXT ,
            gstin_number TEXT ,
            state_code TEXT ,
            authorized_name TEXT ,
            authorized_designation TEXT 
        )");

        $pdo->exec("CREATE TABLE IF NOT EXISTS buyer_details (
            id TEXT PRIMARY KEY,
            order_number TEXT,
            order_date DATE,
            po_number TEXT,
            consignee TEXT,
            notify_party TEXT
        )");

        $pdo->exec("CREATE TABLE IF NOT EXISTS shipping_details (
            id TEXT PRIMARY KEY,
            pre_carriage TEXT,
            place_of_receipt TEXT,
            shipping_number TEXT,
            port_of_loading TEXT,
            port_of_discharge TEXT,
            final_destination TEXT,
            country_of_origin TEXT,
            origin_details TEXT,
            country_of_final_destination TEXT,
            terms_of_delivery TEXT,
            payment TEXT,
            vessel_flight_no TEXT,
            shipping_method TEXT
        )");

        $pdo->exec("CREATE TABLE IF NOT EXISTS supplier_details (
            id TEXT PRIMARY KEY,
            supplier_name TEXT,
            supplier_address TEXT,
            gstin_number TEXT,
            tax_invoice_no TEXT,
            date DATE
        )");

        $pdo->exec("CREATE TABLE IF NOT EXISTS product_details (
            id TEXT PRIMARY KEY,
            marks INT,
            nos INT,
            frieght INT,
            insurance INT,
            total_price INT,
            total_pallet_count INT,
            product_ids BLOB,
            container_ids BLOB
        )");
        $pdo->exec("CREATE TABLE IF NOT EXISTS product_lists (
            id TEXT PRIMARY KEY,
            category_id TEXT,
            product_name TEXT,
            size TEXT,
            unit TEXT,
            quantity INT,
            sqm INT,
            total_sqm INT,
            price INT,
            total_price INT,
            net_weight INT,
            gross_weight INT
        )");

        $pdo->exec("CREATE TABLE IF NOT EXISTS container_information (
            id TEXT PRIMARY KEY,
            container_number TEXT,
            line_seal_number TEXT,
            rfid_number TEXT,
            design_no TEXT,
            quantity_box INT,
            net_weight INT,
            gross_weight INT
        )");

        $pdo->exec("CREATE TABLE IF NOT EXISTS package_information (
            id TEXT PRIMARY KEY,
            number_of_package INT,
            total_gross_weight INT,
            total_net_weight INT,
            gst_circular TEXT,
            app_ref_number TEXT,
            lut_date DATE,
            total_amount INT,
            total_sqm INT,
            taxable_value INT,
            gst_amount INT,
            amount_in_words TEXT
        )");

        $pdo->exec("CREATE TABLE IF NOT EXISTS invoice (
            id TEXT PRIMARY KEY,
            invoice_number TEXT,
            invoice_date TEXT,
            integrated_tax TEXT,
            payment_term TEXT,
            product_type TEXT,
            currancy_type TEXT,
            currancy_rate INT,
            exporter_id TEXT,
            buyer_id TEXT,
            product_id TEXT,
            supplier_ids BLOB,
            shipping_id TEXT,
            package_id TEXT,
            annexure_id TEXT,
            vgm_id TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )");
        $pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
        $pdo->exec("CREATE TABLE IF NOT EXISTS token_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )");
        $pdo->exec("CREATE TABLE IF NOT EXISTS invoice_numbers (
            id TEXT PRIMARY KEY,
            exporter_id TEXT NOT NULL,
            invoice_number TEXT NOT NULL,
            year TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )");
    }

    public function down(PDO $pdo)
    {
        $tables = [
            "invoice",
            "package_information",
            "container_information",
            "product_lists",
            "product_details",
            "supplier_details",
            "shipping_details",
            "buyer_information",
            "exporter_details",
            "users",
            "token_sessions",
            "invoice_numbers",
        ];

        foreach ($tables as $table) {
            $pdo->exec("DROP TABLE IF EXISTS $table");
        }
    }
}

// Run if executed directly
if (realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'])) {
    try {
        $pdo = new PDO('sqlite:' . __DIR__ . '/../database/database.sqlite');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $migration = new CreateInvoiceSchema();
        $migration->down($pdo);
        $migration->up($pdo);
        echo "Migration completed successfully.\n";
    } catch (PDOException $e) {
        echo "Migration failed: " . $e->getMessage() . "\n";
        exit(1);
    }
}
