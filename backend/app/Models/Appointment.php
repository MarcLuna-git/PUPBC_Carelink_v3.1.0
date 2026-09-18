<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Appointment extends Model
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
            if (!$model->reference_number) {
                $model->reference_number = 'APT-' . strtoupper(Str::random(6));
            }
        });
    }

    protected $fillable = [
        'user_id', 'service', 'appointment_date', 'time_slot',
        'concern', 'status', 'reference_number',
        'approved_by', 'approved_at', 'rejection_reason',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'approved_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}