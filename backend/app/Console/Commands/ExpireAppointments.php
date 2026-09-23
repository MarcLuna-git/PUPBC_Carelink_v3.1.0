<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Models\Notification;
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
            ->whereDate('appointment_date', '<', today())
            ->orderBy('id')
            ->chunkById(100, function ($appointments) use (&$count) {
                foreach ($appointments as $appointment) {
                    DB::transaction(function () use ($appointment, &$count) {
                        $locked = Appointment::whereKey($appointment->id)->lockForUpdate()->first();
                        if (!$locked || $locked->status !== 'pending' || !$locked->appointment_date->isBefore(today())) {
                            return;
                        }

                        $locked->update(['status' => 'expired']);
                        Notification::create([
                            'user_id' => $locked->user_id,
                            'type' => 'appointment_expired',
                            'title' => 'Appointment Expired',
                            'message' => 'Your pending appointment expired because its appointment date has passed.',
                            'data' => ['appointment_id' => $locked->id],
                        ]);
                        $count++;
                    });
                }
            });

        $this->info("Expired {$count} appointment(s).");
        return self::SUCCESS;
    }
}