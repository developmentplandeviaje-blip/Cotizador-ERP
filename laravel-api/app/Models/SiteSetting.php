<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $table = 'site_settings';
    public $timestamps = false;
    protected $fillable = [
        'name',
        'value',
    ];

    /**
     * Helper to get a setting value with a default fallback.
     */
    public static function get(string $name, $default = null)
    {
        $setting = static::where('name', $name)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Helper to set a setting value.
     */
    public static function set(string $name, $value): static
    {
        return static::updateOrCreate(
            ['name' => $name],
            ['value' => is_scalar($value) ? (string) $value : json_encode($value)]
        );
    }
}
