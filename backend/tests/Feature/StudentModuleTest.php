<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\AppointmentCheckin;
use App\Models\HealthProfile;
use App\Models\Notification;
use App\Models\User;
use App\Services\AuthService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class StudentModuleTest extends TestCase
{
    use DatabaseTransactions;

    private function student(array $attributes = []): User
    {
        return User::create(array_merge([
            'student_id' => 'STUDENT-' . Str::random(10),
            'first_name' => 'Student',
            'last_name' => 'Test',
            'email' => Str::uuid() . '@example.test',
            'password' => Hash::make('TestPassword123!'),
            'birthday' => '2002-05-15',
            'role' => 'student',
            'status' => 'inactive',
        ], $attributes));
    }

    private function appointment(User $student, string $date, string $status = 'approved'): Appointment
    {
        return Appointment::create([
            'user_id' => $student->id,
            'service' => 'Consultation',
            'appointment_date' => $date,
            'time_slot' => '4:30 PM',
            'status' => $status,
        ]);
    }

    private function completeHealthProfile(User $student): void
    {
        HealthProfile::create([
            'user_id' => $student->id,
            'emergency_name' => 'Guardian',
            'emergency_relationship' => 'Parent',
            'emergency_phone' => '09123456789',
            'consent_signature' => 'Student Test',
            'consent_date' => Carbon::now('Asia/Manila')->toDateString(),
            'agree_privacy' => true,
            'agree_terms' => true,
            'medical_history' => [],
            'family_history' => [],
        ]);
    }

    public function test_student_appointment_list_uses_latest_checkin_chronologically(): void
    {
        $student = $this->student();
        $firstAppointment = $this->appointment($student, Carbon::tomorrow('Asia/Manila')->toDateString());
        $secondAppointment = $this->appointment($student, Carbon::now('Asia/Manila')->addDays(2)->toDateString());

        foreach ([$firstAppointment, $secondAppointment] as $appointment) {
            $olderCheckin = AppointmentCheckin::create([
                'appointment_id' => $appointment->id,
                'user_id' => $student->id,
                'queue_number' => 'R-001',
                'queue_type' => 'regular',
                'status' => 'completed',
                'checked_in_at' => now()->subHour(),
                'check_in_time' => now()->subHour(),
            ]);
            $olderCheckin->created_at = now()->subHour();
            $olderCheckin->save();

            AppointmentCheckin::create([
                'appointment_id' => $appointment->id,
                'user_id' => $student->id,
                'queue_number' => 'R-002',
                'queue_type' => 'regular',
                'status' => 'waiting',
                'checked_in_at' => now(),
                'check_in_time' => now(),
            ]);
        }

        $rows = $this->actingAs($student, 'api')
            ->getJson('/api/student/appointments')
            ->assertOk()
            ->json('data');

        $this->assertCount(2, $rows);
        $this->assertSame(['R-002'], array_values(array_unique(array_column(array_column($rows, 'queue'), 'queue_number'))));
    }

    public function test_student_login_does_not_depend_on_legacy_status(): void
    {
        foreach (['inactive', 'archived', 'pending'] as $status) {
            $student = $this->student(['status' => $status]);
            $result = app(AuthService::class)->login([
                'student_id' => $student->student_id,
                'birthday' => '2002-05-15',
                'password' => 'TestPassword123!',
            ]);

            $this->assertSame($student->id, $result['user']->id);
        }
    }

    public function test_qr_hash_is_returned_only_for_an_approved_appointment_today(): void
    {
        $student = $this->student();
        $this->completeHealthProfile($student);
        $student->qrCode()->create([
            'qr_code_hash' => 'student-module-active-hash',
            'is_active' => true,
        ]);
        $this->appointment($student, Carbon::tomorrow('Asia/Manila')->toDateString());

        $this->actingAs($student, 'api')
            ->getJson('/api/student/qr')
            ->assertOk()
            ->assertJsonPath('data.available', false)
            ->assertJsonPath('data.qr_code_hash', null);

        $this->appointment($student, Carbon::now('Asia/Manila')->toDateString());

        $this->getJson('/api/student/qr')
            ->assertOk()
            ->assertJsonPath('data.available', true)
            ->assertJsonPath('data.qr_code_hash', 'student-module-active-hash');
    }

    public function test_notification_actions_are_scoped_and_delete_persists(): void
    {
        $student = $this->student();
        $other = $this->student();
        $own = Notification::create([
            'user_id' => $student->id,
            'type' => 'appointment',
            'title' => 'Own',
            'message' => 'Own notification',
            'read' => false,
        ]);
        $foreign = Notification::create([
            'user_id' => $other->id,
            'type' => 'appointment',
            'title' => 'Foreign',
            'message' => 'Foreign notification',
            'read' => false,
        ]);

        $this->actingAs($student, 'api')
            ->getJson('/api/student/notifications?limit=1')
            ->assertOk()
            ->assertJsonPath('unread_count', 1);

        $this->patchJson('/api/student/notifications/' . $foreign->id . '/read')
            ->assertNotFound();
        $this->deleteJson('/api/student/notifications/' . $own->id)
            ->assertOk()
            ->assertJsonPath('unread_count', 0);

        $this->assertDatabaseMissing('notifications', ['id' => $own->id]);
        $this->assertDatabaseHas('notifications', ['id' => $foreign->id]);
    }
}
