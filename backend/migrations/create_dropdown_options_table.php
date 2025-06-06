<?php

use PDO;

class CreateDropdownSchema
{
    public function up(PDO $pdo)
    {
        $pdo->exec("CREATE TABLE IF NOT EXISTS dropdown_options (
        id TEXT PRIMARY KEY ,
        category VARCHAR(50) NOT NULL,
        value TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME DEFAULT UPDATED_TIMESTAMP
    )");

        
    }

    public function down(PDO $pdo)
    {
        $tables = [
            "dropdown_options",
           
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

        $migration = new CreateDropdownSchema();
        $migration->down($pdo);
        $migration->up($pdo);
        echo "Migration completed successfully.\n";
    } catch (PDOException $e) {
        echo "Migration failed: " . $e->getMessage() . "\n";
        exit(1);
    }
}
