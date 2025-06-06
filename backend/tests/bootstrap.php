<?php

require __DIR__ . '/../vendor/autoload.php';

// Create test database if it doesn't exist
$testDbPath = __DIR__ . '/database/database.sqlite';
if (!file_exists($testDbPath)) {
    touch($testDbPath);
    chmod($testDbPath, 0666);
}

// Initialize test database
$pdo = new PDO('sqlite:' . $testDbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Create tables
$pdo->exec(file_get_contents(__DIR__ . '/../migrations/create_dropdown_tables.sql')); 