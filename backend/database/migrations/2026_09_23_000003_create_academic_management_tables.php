<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('academic_periods', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedSmallInteger('academic_year_start');
            $table->unsignedSmallInteger('academic_year_end');
            $table->string('semester', 30);
            $table->boolean('is_active')->default(false);
            $table->timestamps();
            $table->unique(['academic_year_start', 'academic_year_end', 'semester']);
        });

        Schema::create('courses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->string('name', 150);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('course_sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('academic_period_id')->constrained('academic_periods')->onDelete('cascade');
            $table->foreignUuid('course_id')->constrained('courses')->onDelete('cascade');
            $table->string('year_level', 30);
            $table->string('section_code', 30);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['academic_period_id', 'course_id', 'year_level', 'section_code'], 'course_section_assignment_unique');
        });

        Schema::create('student_enrollments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('course_section_id')->constrained('course_sections')->onDelete('restrict');
            $table->string('status', 30)->default('enrolled');
            $table->date('enrolled_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'course_section_id']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('student_enrollments');
        Schema::dropIfExists('course_sections');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('academic_periods');
    }
};