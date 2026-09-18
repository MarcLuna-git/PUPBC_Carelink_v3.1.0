<?php
/**
 * Supabase Connection Test
 * Tests the connection to Supabase PostgreSQL database via the connection pooler.
 */

$host = 'aws-0-ap-northeast-1.pooler.supabase.com';
$port = 6543;
$dbname = 'postgres';
$username = 'postgres.rbrhhuisskfdienbkqao';
$password = 'vincentysmoke666';

echo "=== Supabase Connection Test ===\n";
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
            PDO::ATTR_TIMEOUT => 15,
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]
    );

    echo "Connected to Supabase successfully!\n\n";

    // List tables
    $tables = $pdo->query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")->fetchAll(PDO::FETCH_COLUMN);
    if (empty($tables)) {
        echo "No tables found in the 'public' schema.\n";
    } else {
        $count = count($tables);
        echo "Tables in database ({$count} total):\n";
        foreach ($tables as $table) {
            echo "  - {$table}\n";
        }
    }

    // Show database version
    $version = $pdo->query("SHOW server_version")->fetchColumn();
    echo "\nPostgreSQL Version: {$version}\n";

    // Show current user
    $user = $pdo->query("SELECT current_user")->fetchColumn();
    echo "Current User: {$user}\n";

    // Show current database
    $db = $pdo->query("SELECT current_database()")->fetchColumn();
    echo "Current Database: {$db}\n";

} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
}
