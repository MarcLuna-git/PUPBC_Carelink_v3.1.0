<?php

namespace App\Services;

use App\Models\User;
use App\Models\Appointment;
use Illuminate\Http\Request;

class KioskIdentity
{
    public static function student(Request $request): User
    {
        $request->validate([
            'student_id' => 'required|string|max:191',
            'method' => 'sometimes|in:qr,manual',
            'qr_hash' => 'required_if:method,qr|nullable|string|max:191',
        ]);
        $query = User::where('role', 'student')->where('status', 'active');
        $id = trim((string) $request->student_id);
        if ($request->filled('qr_hash')) {
            $hash = trim((string) $request->qr_hash);
            $query->whereHas('qrCode', function ($q) use ($hash) {
                $q->where('qr_code_hash', $hash)->where('is_active', true)
                    ->where(function ($q) { $q->whereNull('expires_at')->orWhere('expires_at', '>', now()); });
            });
            // Walang student ID ang raw hash; sa JSON scan, dapat tugma ang ID at hash.
            if ($id !== $hash) $query->where('student_id', $id);
        } else {
            $query->where('student_id', $id);
        }
        $student = $query->first();
        abort_unless($student, 422, 'Student ID or active QR code could not be verified.');
        return $student;
    }

    public static function appointment(User $student)
    {
        $appointment = Appointment::where('user_id', $student->id)
            ->whereDate('appointment_date', today())->where('status', 'approved')->orderBy('created_at')->first();
        abort_unless($appointment, 422, 'No approved appointment for today. Please contact the clinic for emergency assistance.');
        return $appointment;
    }
}
