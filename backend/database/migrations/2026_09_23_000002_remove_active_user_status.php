<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'archive_reason')) {
                $table->text('archive_reason')->nullable();
            }
            if (!Schema::hasColumn('users', 'archived_by')) {
                $table->foreignUuid('archived_by')->nullable()->constrained('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('users', 'archived_at')) {
                $table->timestamp('archived_at')->nullable();
            }
        });

        DB::table('users')->where('status', 'active')->update(['status' => null]);
        $driver = DB::connection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY status ENUM('pending','inactive','archived') NULL DEFAULT NULL");
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE users ALTER COLUMN status DROP NOT NULL');
            DB::statement('ALTER TABLE users ALTER COLUMN status SET DEFAULT NULL');
        }
    }

    public function down()
    {
        DB::table('users')->whereNull('status')->update(['status' => 'pending']);
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY status ENUM('pending','active','inactive','archived') NOT NULL DEFAULT 'pending'");
        }

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'archived_by')) {
                $table->dropForeign(['archived_by']);
                $table->dropColumn('archived_by');
            }
            foreach (['archive_reason', 'archived_at'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};