<?php
/**
 * Supabase Region/Connection Test
 * Tests the connection to Supabase PostgreSQL database via the connection pooler.
 */

$host = 'aws-0-ap-northeast-1.pooler.supabase.com';
$port = 6543;
$dbname = 'postgres';
$username = 'postgres.rbrhhuisskfdienbkqao';
$password = 'vincentysmoke666';

echo "=== Supabase Pooler Connection Test ===\n";
echo "Host: {$host}\n";
echo "Port: {$port}\n";
echo "Database: {$dbname}\n";
echo "Username: {$username}\n";
echo "SSL Mode: require\n";
echo "\n";

try {
    $pdo = new PDO(
        "pgsql:host={$host};port={$port};dbname={$dbname};sslmode=require",
        $username,
        $password,
        [
            PDO::ATTR_TIMEOUT => 8,
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]
    );

    echo "SUCCESS: Connected to Supabase!\n";

    $tables = $pdo->query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables: " . implode(', ', $tables) . "\n";

    $version = $pdo->query("SHOW server_version")->fetchColumn();
    echo "PostgreSQL Version: {$version}\n";

} catch (PDOException $e) {
    echo "FAILED: " . $e->getMessage() . "\n";
}
