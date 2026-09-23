<?php

namespace App\Mail;

use App\Models\Appointment;
use Illuminate\Mail\Mailable;
use InvalidArgumentException;

class StudentAppointmentStatusMail extends Mailable
{
    public $appointmentId;
    public $referenceNumber;
    public $appointmentDate;
    public $timeSlot;
    public $status;

    public function __construct(Appointment $appointment)
    {
        if (!in_array($appointment->status, ['pending', 'cancelled'], true)) {
            throw new InvalidArgumentException('Unsupported Student appointment email status.');
        }

        $this->appointmentId = $appointment->id;
        $this->referenceNumber = $appointment->reference_number;
        $this->appointmentDate = $appointment->appointment_date->format('M j, Y');
        $this->timeSlot = $appointment->time_slot;
        $this->status = $appointment->status;
    }

    public function build()
    {
        return $this->subject($this->status === 'pending'
            ? 'Appointment request received - PUPBC CareLink'
            : 'Appointment cancelled - PUPBC CareLink')
            ->view('emails.student-appointment-status');
    }
}
