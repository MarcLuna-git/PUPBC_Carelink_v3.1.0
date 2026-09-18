<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

// Read historical double-encoded JSON without rewriting or discarding records.
class NormalizedArray implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes)
    {
        for ($i = 0; $i < 3 && is_string($value); $i++) {
            $value = json_decode($value, true);
        }
        return is_array($value) ? $value : [];
    }

    public function set($model, string $key, $value, array $attributes)
    {
        return $value === null ? null : json_encode($value);
    }
}
