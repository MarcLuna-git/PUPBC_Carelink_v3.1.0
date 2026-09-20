<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppointmentSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'date', 'time_slot', 'max_slots', 'booked_count'
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public static function getAvailableSlots($date)
    {
        $timeSlots = [
            '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', 
            '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
            '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', 
            '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
        ];

        $slots = [];
        
        foreach ($timeSlots as $time) {
            $bookedCount = Appointment::whereDate('appointment_date', $date)
                ->where('time_slot', $time)
                ->whereIn('status', ['approved', 'pending'])
                ->count();
            $isPast = self::isPastSlot($date, $time);

            $slots[] = [
                'time' => $time,
                'max' => 10,
                'booked' => $bookedCount,
                'available' => $isPast ? 0 : max(0, 10 - $bookedCount),
                'is_full' => $isPast || $bookedCount >= 10,
            ];
        }

        return $slots;
    }

    public static function isSlotAvailable($date, $timeSlot)
    {
        if (self::isPastSlot($date, $timeSlot)) {
            return false;
        }

        $bookedCount = Appointment::whereDate('appointment_date', $date)
            ->where('time_slot', $timeSlot)
            ->whereIn('status', ['approved', 'pending'])
            ->count();

        return $bookedCount < 10;
    }

    private static function isPastSlot($date, $timeSlot): bool
    {
        $slot = Carbon::createFromFormat('Y-m-d g:i A', Carbon::parse($date)->format('Y-m-d') . ' ' . $timeSlot);

        return $slot->isPast();
    }

    public static function remainingSlots($date, $timeSlot)
    {
        $bookedCount = Appointment::whereDate('appointment_date', $date)
            ->where('time_slot', $timeSlot)
            ->whereIn('status', ['approved', 'pending'])
            ->count();

        return max(0, 10 - $bookedCount);
    }
}