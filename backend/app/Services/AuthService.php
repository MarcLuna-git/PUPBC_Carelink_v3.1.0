<?php

namespace App\Services;

use App\Models\User;
use App\Models\PasswordReset;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Mail\PasswordResetMail;
use App\Mail\VerifyEmail;
use App\Models\PendingRegistration;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AuthService
{
    protected UserRepositoryInterface $userRepository;

    public function __construct(
        UserRepositoryInterface $userRepository
    ) {
        $this->userRepository = $userRepository;
    }

    protected function register(array $data): array
    {
        $user = $this->userRepository->create([
            'student_id' => $data['student_id'],
            'first_name' => $data['first_name'],
            'middle_name' => $data['middle_name'] ?? null,
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'password' => $data['password_hash'],
            'role' => 'student',
            'birthday' => $data['birthday'] ?? null,
            'gender' => isset($data['gender']) ? strtolower($data['gender']) : null,
            'course' => $data['course'] ?? null,
            'year' => $data['year'] ?? null,
            'section' => $data['section'] ?? null,
            'mobile_number' => $data['mobile_number'] ?? null,
            // Called only after a valid registration OTP.
            'email_verified_at' => now(),
            'status' => 'active',
        ]);

        // Create the student profile record so course/year/section are
        // immediately available in the dashboard and at the kiosk.
        \App\Models\StudentProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'course' => $data['course'] ?? null,
                'year' => $data['year'] ?? null,
                'section' => $data['section'] ?? null,
                'birthday' => $data['birthday'] ?? null,
                'gender' => isset($data['gender']) ? strtolower($data['gender']) : null,
                'mobile_number' => $data['mobile_number'] ?? null,
            ]
        );

        $this->generateQRCode($user);

        return ['user' => $user, 'message' => 'Registration successful. You can now login.'];
    }

    public function requestRegistrationOtp(array $data): array
    {
        if (
            User::where('email', $data['email'])->orWhere('student_id', $data['student_id'])->exists()
            || PendingRegistration::where('email', '!=', $data['email'])
                ->where('student_id', $data['student_id'])
                ->exists()
        ) {
            throw new \Exception('This email or Student ID is already registered.');
        }

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $data['password_hash'] = Hash::make($data['password']);
        unset($data['password'], $data['password_confirmation']);
        $pending = PendingRegistration::updateOrCreate(
            ['email' => $data['email']],
            [
                'student_id' => $data['student_id'],
                'payload' => $data,
                'otp_hash' => Hash::make($otp),
                'expires_at' => now()->addMinutes(5),
            ]
        );

        $mailUser = new User([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
        ]);

        try {
            Mail::to($data['email'])->send(new VerifyEmail($mailUser, $otp));
        } catch (\Throwable $e) {
            $pending->delete();
            \Log::error('Registration OTP email failed: ' . $e->getMessage());
            throw new \Exception('We could not send the verification code. Check the email address or mail settings and try again.');
        }

        return ['message' => 'A 6-digit verification code was sent to your email.'];
    }

    public function verifyRegistration(string $email, string $otp): array
    {
        return DB::transaction(function () use ($email, $otp) {
        $pending = PendingRegistration::where('email', $email)->lockForUpdate()->first();
        if (!$pending || $pending->expires_at->isPast() || !Hash::check($otp, $pending->otp_hash)) {
            throw new \Exception('Invalid or expired verification code.');
        }

        if (User::where('email', $email)->orWhere('student_id', $pending->student_id)->exists()) {
            throw new \Exception('This email or Student ID is already registered.');
        }

        $user = $this->register($pending->payload)['user'];
        $pending->delete();

        return ['user' => $user, 'message' => 'Registration successful. You can now login.'];
        });
    }

    public function login(array $credentials): array
    {
        $user = $this->userRepository->findByStudentId($credentials['student_id']);
        if (!$user || $user->role !== 'student' || $user->status !== 'active') throw new \Exception('Invalid credentials.');

        if ($user->role === 'student') {
            $birthday = $user->birthday instanceof \DateTime ? $user->birthday->format('Y-m-d') : Carbon::parse($user->birthday)->format('Y-m-d');
            if ($birthday !== $credentials['birthday']) throw new \Exception('Invalid birthday.');
        }

        if ($user->status === 'archived') throw new \Exception('Account archived.');
        if ($user->status === 'inactive') throw new \Exception('Account inactive.');
        if (!$this->verifyPassword($credentials['password'], $user->password)) throw new \Exception('Invalid password.');

        $token = JWTAuth::fromUser($user);
        $ttl = JWTAuth::factory()->getTTL();

        return ['user' => $user, 'token' => $token, 'token_type' => 'bearer', 'expires_in' => $ttl * 60, 'role' => $user->role];
    }

    public function nurseLogin(string $email, string $password): array
    {
        $user = User::where('email', $email)->where('role', 'nurse')->first();
        if (!$user || $user->status !== 'active' || !$this->verifyPassword($password, $user->password)) {
            throw new \Exception('Invalid credentials.');
        }

        $token = JWTAuth::fromUser($user);
        $ttl = JWTAuth::factory()->getTTL();

        return [
            'user' => $user,
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => $ttl * 60,
            'role' => $user->role
        ];
    }

    public function forgotPassword(array $data): array
    {
        $user = $this->userRepository->findByEmail($data['email']);
        if (!$user) throw new \Exception('Email not found.');

        PasswordReset::where('user_id', $user->id)->where('is_used', false)->update(['is_used' => true]);
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $reset = PasswordReset::create([
            'user_id' => $user->id,
            'otp_hash' => Hash::make($otp),
            'expires_at' => now()->addMinutes(5),
            'is_used' => false
        ]);

        try {
            Mail::to($user->email)->send(new PasswordResetMail($user, $otp));
        } catch (\Exception $e) {
            \Log::error('Email failed: ' . $e->getMessage());
            $reset->update(['is_used' => true]);
            throw new \Exception('We could not send the password reset code. Please try again later.');
        }

        return ['message' => 'OTP sent.'];
    }

    public function resetPassword(array $data): array
    {
        return DB::transaction(function () use ($data) {
        $user = $this->userRepository->findByEmail($data['email']);
        if (!$user) throw new \Exception('Email not found.');

        $pr = PasswordReset::where('user_id', $user->id)
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->latest()->lockForUpdate()->first();

        if (!$pr || !Hash::check($data['otp'], $pr->otp_hash)) throw new \Exception('Invalid or expired OTP.');

        $pr->update(['is_used' => true]);
        $this->userRepository->update($user, ['password' => Hash::make($data['password'])]);
        return ['message' => 'Password reset.'];
        });
    }

    public function changePassword(array $data): array
    {
        $user = auth()->user();

        if (!$user || !$this->verifyPassword($data['current_password'], $user->password)) {
            throw new \Exception('Current password is incorrect.');
        }

        $this->userRepository->update($user, [
            'password' => Hash::make($data['new_password']),
        ]);

        return ['message' => 'Password updated successfully.'];
    }

    public function logout(): bool
    {
        JWTAuth::invalidate(JWTAuth::getToken());
        return true;
    }

    public function refreshToken(): array
    {
        $token = JWTAuth::refresh(JWTAuth::getToken());
        $ttl = JWTAuth::factory()->getTTL();
        return ['token' => $token, 'token_type' => 'bearer', 'expires_in' => $ttl * 60];
    }

    public function getAuthenticatedUser()
    {
        return auth()->user()->load('profile', 'qrCode');
    }

    protected function verifyPassword(string $input, string $stored): bool
    {
        return Hash::check($input, $stored);
    }

    protected function generateQRCode(User $user): void
    {
        $hash = hash('sha256', $user->id . Str::random(32));
        $user->qrCode()->create(['qr_code_hash' => $hash, 'is_active' => true]);
    }
}
