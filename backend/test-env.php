<?php
require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__,'/.env');
$dotenv->load();

echo "LICENSE_KEY: " . $_ENV['LICENSE_KEY'] . "\n";
echo "Length: " . strlen($_ENV['LICENSE_KEY']) . "\n";
