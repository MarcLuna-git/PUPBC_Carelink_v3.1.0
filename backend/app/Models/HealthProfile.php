<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class HealthProfile extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (!$model->getKey()) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'user_id',
        'emergency_name', 'emergency_relationship', 'emergency_phone',
        'medical_history', 'allergy_details', 'other_medical_history', 'medications',
        'hospitalized', 'hospitalization_date', 'hospitalization_diagnosis',
        'surgery', 'surgery_date', 'surgery_diagnosis',
        'had_covid', 'covid_date', 'covid_diagnosis',
        'occupation', 'marital_status',
        'tobacco_use', 'tobacco_amount', 'tobacco_duration',
        'alcohol_use', 'other_substance_use',
        'has_disability', 'disability_details',
        'last_menstrual_period', 'has_children', 'number_of_children',
        'age_first_pregnancy', 'gravidity', 'term', 'premature',
        'abortion', 'living_children',
        'family_history',
        'consent_signature', 'agree_privacy', 'agree_terms', 'consent_date',
        'completed_at',
    ];

    protected $casts = [
        'medical_history' => \App\Casts\NormalizedArray::class,
        'family_history' => \App\Casts\NormalizedArray::class,
        'hospitalized' => 'boolean',
        'surgery' => 'boolean',
        'had_covid' => 'boolean',
        'has_disability' => 'boolean',
        'has_children' => 'boolean',
        'gravidity' => 'boolean',
        'term' => 'boolean',
        'premature' => 'boolean',
        'abortion' => 'boolean',
        'living_children' => 'boolean',
        'agree_privacy' => 'boolean',
        'agree_terms' => 'boolean',
        'hospitalization_date' => 'date',
        'surgery_date' => 'date',
        'covid_date' => 'date',
        'last_menstrual_period' => 'date',
        'consent_date' => 'date',
        'completed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function validationRules(): array
    {
        $rules = [
            'emergency_name' => 'required|string|max:100',
            'emergency_relationship' => 'required|string|max:100',
            'emergency_phone' => ['required', 'string', 'regex:/^09[0-9]{9}$/'],
            'consent_signature' => 'required|string|max:191',
            'consent_date' => 'required|date|before_or_equal:today',
            'agree_privacy' => 'required|accepted',
            'agree_terms' => 'required|accepted',
            'medical_history' => 'nullable|array',
            'medical_history.*' => 'string|max:255',
            'family_history' => 'nullable|array',
            'family_history.*' => 'string|max:255',
            'number_of_children' => 'nullable|integer|min:0|max:30',
            'age_first_pregnancy' => 'nullable|integer|min:1|max:100',
        ];
        foreach (['hospitalized','surgery','had_covid','has_disability','has_children','gravidity','term','premature','abortion','living_children'] as $field) $rules[$field] = 'sometimes|boolean';
        foreach (['hospitalization_date','surgery_date','covid_date','last_menstrual_period'] as $field) $rules[$field] = 'nullable|date|before_or_equal:today';
        foreach (['allergy_details','other_medical_history','hospitalization_diagnosis','surgery_diagnosis','covid_diagnosis','occupation','marital_status','tobacco_use','tobacco_amount','tobacco_duration','alcohol_use'] as $field) $rules[$field] = 'nullable|string|max:191';
        foreach (['medications','other_substance_use','disability_details'] as $field) $rules[$field] = 'nullable|string|max:2000';
        return $rules;
    }

    public function isComplete(): bool
    {
        return \Illuminate\Support\Facades\Validator::make($this->toArray(), static::validationRules())->passes();
    }
}
