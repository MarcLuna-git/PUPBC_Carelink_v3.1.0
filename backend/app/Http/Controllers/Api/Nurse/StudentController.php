<?php

namespace App\Http\Controllers\Api\Nurse;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $query = User::where('role', 'student')->with('studentProfile');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('first_name', 'like', "%{$request->search}%")
                  ->orWhere('last_name', 'like', "%{$request->search}%")
                  ->orWhere('student_id', 'like', "%{$request->search}%");
            });
        }

        if ($request->course) {
            $query->whereHas('studentProfile', fn($q) => $q->where('course', $request->course));
        }

        foreach (['year', 'section'] as $field) {
            if ($request->filled($field)) {
                $query->whereHas('studentProfile', fn($q) => $q->where($field, $request->input($field)));
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $students = $query->orderBy('last_name')->paginate(20);

        return response()->json(['success' => true, 'data' => $students]);
    }

    public function search(Request $request)
    {
        $students = User::where('role', 'student')
            ->where(function ($q) use ($request) {
                $q->where('first_name', 'like', "%{$request->q}%")
                  ->orWhere('last_name', 'like', "%{$request->q}%")
                  ->orWhere('student_id', 'like', "%{$request->q}%");
            })
            ->limit(10)->get();

        return response()->json(['success' => true, 'data' => $students]);
    }

    public function show($id)
    {
        $student = User::where('role', 'student')
            ->with(['studentProfile', 'healthProfile'])
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $student]);
    }

    public function healthProfile($id)
    {
        $student = User::where('role', 'student')->with('healthProfile')->findOrFail($id);
        return response()->json(['success' => true, 'data' => $student->healthProfile]);
    }

    public function appointments($id)
    {
        $appointments = \App\Models\Appointment::where('user_id', $id)
            ->orderBy('appointment_date', 'desc')->get();
        return response()->json(['success' => true, 'data' => $appointments]);
    }

    public function consultations($id)
    {
        $consultations = \App\Models\Consultation::where('user_id', $id)
            ->with('nurse:id,first_name,last_name')
            ->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $consultations]);
    }

    public function emergencyEncounters($id)
    {
        $encounters = \App\Models\EmergencyEncounter::with('nurse:id,first_name,last_name')
            ->where('user_id', $id)->latest('incident_datetime')->get();
        return response()->json(['success' => true, 'data' => $encounters]);
    }

    public function clinicHistory($id)
    {
        User::where('role', 'student')->findOrFail($id);
        return response()->json(['success' => true, 'data' => app(\App\Services\ClinicHistory::class)->forStudent($id)]);
    }
}
