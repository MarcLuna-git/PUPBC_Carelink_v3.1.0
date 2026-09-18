<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

interface UserRepositoryInterface
{
    public function create(array $data): User;
    public function findByStudentId(string $studentId): ?User;
    public function findByEmail(string $email): ?User;
    public function findById(string $id): ?User;
    public function update(User $user, array $data): bool;
    public function updateStatus(User $user, string $status): bool;
    public function recordLogin(User $user, string $ip): bool;
    public function verifyEmail(User $user): bool;
    public function getActiveStudents(): Collection;
    public function getPendingStudents(): Collection;
}