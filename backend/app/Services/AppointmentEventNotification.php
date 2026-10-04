<?php

namespace App\Services;

use App\Mail\StudentAppointmentStatusMail;
use App\Models\Appointment;
use App\Models\Notification;
use App\Models\User;

class AppointmentEventNotification
{
    // Call inside the transaction that changes the appointment. The row rolls
    // back on failure; the existing mail service sends only after the commit.
    public function send(Appointment $appointment, ?string $event = null, bool $notifyNurses = false): void
    {
        $mail = new StudentAppointmentStatusMail($appointment, $event);
        Notification::create([
            'user_id' => $appointment->user_id,
            'type' => 'appointment_' . $mail->event,
            'title' => $mail->title,
            'message' => $mail->eventMessage . ' Schedule: ' . $mail->appointmentDate
                . ' at ' . $mail->timeSlot . ' (Asia/Manila).'
                . ($mail->reason ? ' Reason: ' . $mail->reason : ''),
            'data' => [
                'appointment_id' => $appointment->id,
                'reference_number' => $appointment->reference_number,
                'appointment_date' => $appointment->appointment_date->toDateString(),
                'time_slot' => $appointment->time_slot,
                'status' => $appointment->status,
            ],
            'read' => false,
        ]);
        if ($notifyNurses) {
            $this->notifyActiveNurses(
                $appointment,
                'appointment_' . $mail->event,
                $mail->title,
                'A student appointment was cancelled by the clinic. Schedule: '
                    . $mail->appointmentDate . ' at ' . $mail->timeSlot . ' (Asia/Manila).'
                    . ($mail->reason ? ' Reason: ' . $mail->reason : '')
            );
        }
        app(StudentAppointmentMail::class)->afterCommit($appointment, $mail->event);
    }

    public function notifyActiveNurses(
        Appointment $appointment,
        string $type,
        string $title,
        string $message
    ): void {
        User::nurses()
            ->where(function ($query) {
                $query->whereNull('status')->orWhere('status', 'active');
            })
            ->get(['id'])
            ->each(function (User $nurse) use ($appointment, $type, $title, $message) {
                Notification::create([
                    'user_id' => $nurse->id,
                    'type' => $type,
                    'title' => $title,
                    'message' => $message,
                    'data' => [
                        'appointment_id' => $appointment->id,
                        'reference_number' => $appointment->reference_number,
                        'appointment_date' => $appointment->appointment_date->toDateString(),
                        'time_slot' => $appointment->time_slot,
                        'status' => $appointment->status,
                    ],
                    'read' => false,
                ]);
            });
    }
}
