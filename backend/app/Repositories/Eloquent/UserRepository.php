<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class UserRepository implements UserRepositoryInterface
{
    public function create(array $data): User
    {
        $user = User::create(array_merge($data, [
            'status' => 'pending',
        ]));

        // Create associated profile WITH DATA
        $user->profile()->create([
            'user_id' => $user->id,
            'course' => $data['course'] ?? null,
            'year' => $data['year'] ?? null,
            'section' => $data['section'] ?? null,
            'birthday' => $data['birthday'] ?? null,
            'gender' => $data['gender'] ?? null,
            'mobile_number' => $data['mobile_number'] ?? null,
        ]);

        return $user;
    }

    public function findByStudentId(string $studentId): ?User
    {
        return User::where('student_id', $studentId)->first();
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function findById(string $id): ?User
    {
        return User::find($id);
    }

    public function update(User $user, array $data): bool
    {
        return $user->update($data);
    }

    public function updateStatus(User $user, string $status): bool
    {
        return $user->update(['status' => $status]);
    }

    public function recordLogin(User $user, string $ip): bool
    {
        return $user->update([
            'last_login_at' => now(),
            'ip_address' => $ip,
        ]);
    }

    public function verifyEmail(User $user): bool
    {
        return $user->update([
            'email_verified_at' => now(),
            'status' => 'active',
        ]);
    }

    public function getActiveStudents(): Collection
    {
        return User::active()->verified()->get();
    }

    public function getPendingStudents(): Collection
    {
        return User::where('status', 'pending')->get();
    }
}