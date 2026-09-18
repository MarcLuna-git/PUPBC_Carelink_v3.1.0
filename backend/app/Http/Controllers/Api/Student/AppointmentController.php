<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentSlot;
use App\Models\QRCode;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AppointmentController extends Controller
{
    public function index()
    {
        $appointments = Appointment::where('user_id', auth()->id())
            ->orderBy('appointment_date', 'desc')
            ->get();
        return response()->json(['success' => true, 'data' => $appointments]);
    }

    /**
     * Get available slots for a specific date
     */
    public function availableSlots(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        $slots = AppointmentSlot::getAvailableSlots($request->date);

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $request->date,
                'slots' => $slots,
            ]
        ]);
    }

    /**
     * Check if user already has an appointment on a date
     */
    public function checkDuplicate(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        $existing = Appointment::where('user_id', auth()->id())
            ->whereDate('appointment_date', $request->date)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        return response()->json([
            'success' => true,
            'has_existing' => $existing,
            'message' => $existing ? 'You already have an appointment on this date.' : null,
        ]);
    }

    public function store(Request $request)
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
        \App\Services\ClinicQueue::lock();
        abort_unless(auth()->user()->healthProfile && auth()->user()->healthProfile->isComplete(), 422, 'Complete your health profile before booking.');
        $request->validate([
            'service' => 'required|string',
            'appointment_date' => 'required|date|after_or_equal:today',
            'time_slot' => 'required|string|in:8:00 AM,8:30 AM,9:00 AM,9:30 AM,10:00 AM,10:30 AM,11:00 AM,11:30 AM,1:00 PM,1:30 PM,2:00 PM,2:30 PM,3:00 PM,3:30 PM,4:00 PM,4:30 PM',
            'concern' => 'nullable|string',
        ]);

        $this->ensureFutureSlot($request->appointment_date, $request->time_slot);

        // Check for duplicate appointment on same date
        $existingOnDate = Appointment::where('user_id', auth()->id())
            ->whereDate('appointment_date', $request->appointment_date)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($existingOnDate) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an appointment on this date. Please choose a different date.',
            ], 422);
        }

        // Check slot availability (max 10 per 30-min slot)
        if (!AppointmentSlot::isSlotAvailable($request->appointment_date, $request->time_slot)) {
            return response()->json([
                'success' => false,
                'message' => 'This time slot is already full (10/10). Please select a different time.',
            ], 422);
        }

        $appointment = Appointment::create([
            'user_id' => auth()->id(),
            'service' => $request->service,
            'appointment_date' => $request->appointment_date,
            'time_slot' => $request->time_slot,
            'concern' => $request->concern,
            'status' => 'pending',
            'reference_number' => 'APT-' . strtoupper(Str::random(8)),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Appointment booked successfully!',
            'data' => $appointment
        ], 201);
        }, 3);
    }

    public function update(Request $request, $id)
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $id) {
        \App\Services\ClinicQueue::lock();
        $request->validate([
            'service' => 'required|string',
            'appointment_date' => 'required|date|after_or_equal:today',
            'time_slot' => 'required|string|in:8:00 AM,8:30 AM,9:00 AM,9:30 AM,10:00 AM,10:30 AM,11:00 AM,11:30 AM,1:00 PM,1:30 PM,2:00 PM,2:30 PM,3:00 PM,3:30 PM,4:00 PM,4:30 PM',
            'concern' => 'nullable|string',
        ]);

        $appointment = Appointment::where('user_id', auth()->id())->findOrFail($id);
        if ($appointment->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending appointments can be edited.',
            ], 422);
        }

        $this->ensureFutureSlot($request->appointment_date, $request->time_slot);

        $existingOnDate = Appointment::where('user_id', auth()->id())
            ->whereDate('appointment_date', $request->appointment_date)
            ->whereIn('status', ['pending', 'approved'])
            ->where('id', '!=', $appointment->id)
            ->exists();

        if ($existingOnDate) {
            return response()->json([
                'success' => false,
                'message' => 'You already have another appointment on this date.',
            ], 422);
        }

        if (!AppointmentSlot::isSlotAvailable($request->appointment_date, $request->time_slot)) {
            return response()->json([
                'success' => false,
                'message' => 'This time slot is unavailable. Please select a different time.',
            ], 422);
        }

        $appointment->update($request->only('service', 'appointment_date', 'time_slot', 'concern'));

        return response()->json([
            'success' => true,
            'message' => 'Appointment updated successfully.',
            'data' => $appointment->fresh(),
        ]);
        }, 3);
    }

    private function ensureFutureSlot(string $date, string $time): void
    {
        $slot = Carbon::createFromFormat('Y-m-d g:i A', Carbon::parse($date)->format('Y-m-d') . ' ' . $time);
        if ($slot->isPast()) {
            abort(response()->json([
                'success' => false,
                'message' => 'Please choose a present or future appointment time.',
            ], 422));
        }
    }

    public function show($id)
    {
        $appointment = Appointment::where('user_id', auth()->id())->findOrFail($id);
        return response()->json(['success' => true, 'data' => $appointment]);
    }

    public function getQRCode()
    {
        $qrCode = QRCode::where('user_id', auth()->id())->first();

        if (!$qrCode) {
            return response()->json([
                'success' => false,
                'message' => 'QR code not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $qrCode,
        ]);
    }

    public function checkQRStatus()
    {
        $qrCode = QRCode::where('user_id', auth()->id())->first();

        return response()->json([
            'success' => true,
            'data' => [
                'exists' => !is_null($qrCode),
                'active' => (bool) ($qrCode ? $qrCode->is_active : false),
                'qr_code' => $qrCode,
            ],
        ]);
    }

    public function cancel($id)
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($id) {
            \App\Services\ClinicQueue::lock();
            $appointment = Appointment::where('user_id', auth()->id())->findOrFail($id);
            abort_unless(in_array($appointment->status, ['pending', 'approved'], true), 422, 'Only pending or approved appointments can be cancelled.');
            $checkins = \App\Models\AppointmentCheckin::where('appointment_id', $id);
            abort_if((clone $checkins)->where('status', 'serving')->exists(), 409, 'An ongoing consultation cannot be cancelled.');
            $checkins->where('status', 'waiting')->update(['status' => 'no_show']);
            $appointment->update(['status' => 'cancelled']);
            \Illuminate\Support\Facades\Cache::forget('nurse_dashboard_stats');
            return response()->json(['success' => true, 'message' => 'Appointment cancelled.']);
        }, 3);
    }
}
