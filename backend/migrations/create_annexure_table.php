<?php

use PDO;

class CreateAnnexureSchema
{
    public function up(PDO $pdo)
    {
        $pdo->exec("CREATE TABLE IF NOT EXISTS annexure (
            id TEXT PRIMARY KEY ,
            invoice_date TEXT ,
            invoice_number TEXT ,
            commissionerate TEXT ,
            division TEXT ,
            range TEXT ,
            containerized TEXT ,
            non_containerized TEXT ,
            exam_date TEXT ,
            gross_weight TEXT ,
            net_weight TEXT ,
            lut_date TEXT ,
            officer_designation1 TEXT ,
            officer_designation2 TEXT ,
            question9a TEXT ,
            question9b TEXT ,
            question9c TEXT ,
            total_packages TEXT ,
            location_code TEXT ,
            manufacturer_name TEXT ,
            manufacturer_address TEXT ,
            manufacturer_gstin_no TEXT ,
            manufacturer_permission TEXT 
        )");

        
    }

    public function down(PDO $pdo)
    {
        $tables = [
            "annexure",
           
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

        $migration = new CreateAnnexureSchema();
        $migration->down($pdo);
        $migration->up($pdo);
        echo "Migration completed successfully.\n";
    } catch (PDOException $e) {
        echo "Migration failed: " . $e->getMessage() . "\n";
        exit(1);
    }
}
