<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class EmailVerification extends Model
{
    use HasFactory;

    /**
     * Indicates that the IDs are non-incrementing.
     */
    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * Boot function for UUID generation.
     */
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (!$model->getKey()) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'otp',
        'email',
        'expires_at',
        'is_used',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'expires_at' => 'datetime',
        'is_used' => 'boolean',
    ];

    /**
     * Get the user that owns the verification.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the OTP is still valid.
     *
     * @return bool
     */
    public function isValid()
    {
        return !$this->is_used && $this->expires_at->isFuture();
    }
}