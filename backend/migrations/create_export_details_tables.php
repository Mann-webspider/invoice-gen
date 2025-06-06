<?php

use PDO;

class CreateExportDetailsTables
{
    public function up(PDO $pdo)
    {
        // Create exporters table
        $pdo->exec("CREATE TABLE IF NOT EXISTS exporters_dropdown (
            id TEXT PRIMARY KEY ,
            company_name TEXT NOT NULL,
            company_address TEXT NOT NULL,
            contact_number TEXT NOT NULL,
            email TEXT NOT NULL,
            tax_id TEXT NOT NULL,
            ie_code TEXT NOT NULL,
            pan_number TEXT NOT NULL,
            gstin_number TEXT NOT NULL,
            state_code TEXT NOT NULL,
            authorized_name TEXT NOT NULL,
            authorized_designation TEXT NOT NULL,
            company_prefix TEXT NOT NULL,
            last_invoice_number INT NOT NULL DEFAULT 0,
            invoice_year TEXT NOT NULL DEFAULT 2025,
            letterhead_top_image TEXT DEFAULT '',
            letterhead_bottom_image TEXT DEFAULT '',
            stamp_image TEXT DEFAULT ''
        )");


        // Create suppliers table
        $pdo->exec(statement: "CREATE TABLE IF NOT EXISTS suppliers_dropdown (
            id TEXT PRIMARY KEY ,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            permission TEXT NOT NULL,
            gstin_number TEXT NOT NULL
        )");

        // Create arn_declarations table
        $pdo->exec("CREATE TABLE IF NOT EXISTS arn_dropdown (
            id TEXT PRIMARY KEY ,
            arn TEXT NOT NULL,
            gst_circular TEXT NOT NULL
        )");

        $pdo->exec("CREATE TABLE IF NOT EXISTS product_category (
            id TEXT PRIMARY KEY,
            description TEXT NOT NULL,
            hsn_code TEXT NOT NULL
        )");
        $pdo->exec("CREATE TABLE IF NOT EXISTS product_size_dropdown (
            id TEXT PRIMARY KEY,
            size TEXT NOT NULL,
            sqm INT NOT NULL
        )");
        

    }

    public function down(PDO $pdo)
    {
        $pdo->exec("DROP TABLE IF EXISTS exporters_dropdown");
        $pdo->exec("DROP TABLE IF EXISTS product_category");
        $pdo->exec("DROP TABLE IF EXISTS product_size_dropdown");
        $pdo->exec("DROP TABLE IF EXISTS suppliers_dropdown");
        $pdo->exec("DROP TABLE IF EXISTS arn_dropdown");
    }
}

// Run migration if file is executed directly
if (realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'])) {
    try {
        $pdo = new PDO('sqlite:' . __DIR__ . '/../database/database.sqlite');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $migration = new CreateExportDetailsTables();
        $migration->down($pdo);
        $migration->up($pdo);
        echo "Migration completed successfully.\n";
    } catch (PDOException $e) {
        echo "Migration failed: " . $e->getMessage() . "\n";
        exit(1);
    }
}