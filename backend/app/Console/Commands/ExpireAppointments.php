<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Services\AppointmentEventNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExpireAppointments extends Command
{
    protected $signature = 'appointments:expire';
    protected $description = 'Expire pending appointments whose appointment date has passed';

    public function handle(): int
    {
        $count = 0;

        Appointment::where('status', 'pending')
            ->whereDate('appointment_date', '<', today('Asia/Manila')->toDateString())
            ->orderBy('id')
            ->chunkById(100, function ($appointments) use (&$count) {
                foreach ($appointments as $appointment) {
                    DB::transaction(function () use ($appointment, &$count) {
                        $locked = Appointment::whereKey($appointment->id)->lockForUpdate()->first();
                        if (!$locked || $locked->status !== 'pending' || $locked->appointment_date->toDateString() >= today('Asia/Manila')->toDateString()) {
                            return;
                        }

                        $locked->update(['status' => 'expired']);
                        app(AppointmentEventNotification::class)->send($locked);
                        $count++;
                    });
                }
            });

        $this->info("Expired {$count} appointment(s).");
        return self::SUCCESS;
    }
}
