<?php

use PDO;

class CreateDraftSchema
{
    public function up(PDO $pdo)
    {
        $pdo->exec("CREATE TABLE IF NOT EXISTS form_drafts (
    id TEXT PRIMARY KEY,
    
    data BLOB, -- Store JSON string
    last_page TEXT,
    is_submitted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
");

        
    }

    public function down(PDO $pdo)
    {
        $tables = [
            "form_drafts",
           
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

        $migration = new CreateDraftSchema();
        $migration->down($pdo);
        $migration->up($pdo);
        echo "Migration completed successfully.\n";
    } catch (PDOException $e) {
        echo "Migration failed: " . $e->getMessage() . "\n";
        exit(1);
    }
}
