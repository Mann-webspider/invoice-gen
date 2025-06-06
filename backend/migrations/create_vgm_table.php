<?php

use PDO;

class CreateVgmSchema
{
    public function up(PDO $pdo)
    {
        $pdo->exec("CREATE TABLE IF NOT EXISTS vgm (
            id TEXT PRIMARY KEY ,
            invoice_number TEXT ,
            shipper_name TEXT,
            ie_code TEXT,
            authorized_name TEXT,
            authorized_contact TEXT,
            container_number TEXT,
            container_size TEXT,
            permissible_weight TEXT,
            weighbridge_registration TEXT,
            verified_gross_mass TEXT,
            unit_of_measurement TEXT,
            dt_weighing TEXT ,
            weighing_slip_no TEXT,
            type TEXT,
            IMDG_class TEXT,
            containers_id BLOB
        )");
        $pdo->exec("CREATE TABLE IF NOT EXISTS vgm_container (
            id TEXT PRIMARY KEY,
            booking_no TEXT NOT NULL,
            container_no TEXT NOT NULL,
            
            tare_weight TEXT NOT NULL,
            gross_weight TEXT NOT NULL,
            total_vgm TEXT NOT NULL

           
        )");

        
    }

    public function down(PDO $pdo)
    {
        $tables = [
            "vgm_container",
            "vgm"
           
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

        $migration = new CreateVgmSchema();
        $migration->down($pdo);
        $migration->up($pdo);
        echo "Migration completed successfully.\n";
    } catch (PDOException $e) {
        echo "Migration failed: " . $e->getMessage() . "\n";
        exit(1);
    }
}
