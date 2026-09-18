<?php
namespace App\Http\Controllers\Api\Student;
use App\Http\Controllers\Controller;
use App\Models\HealthProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
class HealthProfileController extends Controller
{
    public function show() { return response()->json(['success' => true, 'data' => auth()->user()->healthProfile]); }
    public function checkStatus()
    {
        $profile = HealthProfile::where('user_id', auth()->id())->first();
        return response()->json(['success' => true, 'data' => ['exists' => (bool) $profile, 'completed' => $profile && $profile->isComplete()]]);
    }
    public function store(Request $request)
    {
        abort_if(auth()->user()->healthProfile !== null, 409, 'Health profile already exists. Use update.');
        $data = $request->validate(HealthProfile::validationRules());
        $profile = HealthProfile::create(array_merge($data, ['user_id' => auth()->id(), 'completed_at' => now()]));
        return response()->json(['success' => true, 'data' => $profile], 201);
    }
    public function update(Request $request)
    {
        $profile = HealthProfile::where('user_id', auth()->id())->firstOrFail();
        // Partial edits must leave the complete record valid, including consent.
        $data = Validator::make(array_merge($profile->toArray(), $request->all()), HealthProfile::validationRules())->validate();
        $profile->fill($data);
        $profile->completed_at = $profile->completed_at ?: now();
        $profile->save();
        return response()->json(['success' => true, 'data' => $profile->fresh()]);
    }
}
