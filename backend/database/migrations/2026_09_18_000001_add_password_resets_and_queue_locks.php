<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::create('password_resets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->string('otp_hash');
            $table->timestamp('expires_at');
            $table->boolean('is_used')->default(false);
            $table->timestamps();
            $table->index(['user_id', 'is_used']);
        });
        // A persistent mutex serializes allocation and visit lifecycle changes.
        Schema::create('clinic_queue_locks', function (Blueprint $table) {
            $table->unsignedInteger('id')->primary();
        });
        DB::table('clinic_queue_locks')->insert(['id' => 1]);
        Schema::create('clinic_queue_counters', function (Blueprint $table) {
            $table->date('queue_date');
            $table->string('queue_type', 20);
            $table->unsignedInteger('last_number')->default(0);
            $table->primary(['queue_date', 'queue_type']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('clinic_queue_counters');
        Schema::dropIfExists('clinic_queue_locks');
        Schema::dropIfExists('password_resets');
    }
};
