<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>PUPBC CareLink appointment</title></head>
<body>
    @if ($status === 'pending')
        <h1>Appointment request received</h1>
        <p>Your appointment request is pending clinic approval. This email does not confirm approval.</p>
    @else
        <h1>Appointment cancelled</h1>
        <p>Your appointment has been cancelled at your request.</p>
    @endif
    <p>Reference: {{ $referenceNumber }}</p>
    <p>Schedule: {{ $appointmentDate }} at {{ $timeSlot }} (Asia/Manila)</p>
    <p>Sign in to PUPBC CareLink to view your appointments and notifications.</p>
</body>
</html>
