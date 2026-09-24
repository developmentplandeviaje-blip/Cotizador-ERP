<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['first_name', 'last_name', 'email', 'password', 'id_freelancer', 'level', 'status'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'user';
    protected $primaryKey = 'id';
    public $timestamps = false;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => 'boolean',
            'password' => 'hashed',
        ];
    }

    /**
     * Commission configurations for this user.
     */
    public function comisiones(): HasMany
    {
        return $this->hasMany(UserComisionConfig::class, 'id_user', 'id');
    }

    /**
     * Scope for internal Agency users (excluding Freelancers).
     */
    public function scopeAgencia(Builder $query): Builder
    {
        return $query->where('level', '!=', 'Freelancer')
                     ->whereNull('id_freelancer');
    }

    /**
     * Returns associative array of commissions keyed by service type.
     */
    public function getComisionesMap(): array
    {
        $defaultServices = [
            'hotel' => 0.0,
            'ferry' => 0.0,
            'vuelo' => 0.0,
            'excursion' => 0.0,
            'vehiculo' => 0.0,
            'traslado' => 0.0,
            'paquete' => 0.0,
            'otro' => 0.0,
        ];

        if ($this->relationLoaded('comisiones')) {
            foreach ($this->comisiones as $comision) {
                if (array_key_exists($comision->tipo_servicio, $defaultServices)) {
                    $defaultServices[$comision->tipo_servicio] = (float) $comision->porcentaje_comision;
                }
            }
        } else {
            $configs = $this->comisiones()->get();
            foreach ($configs as $comision) {
                if (array_key_exists($comision->tipo_servicio, $defaultServices)) {
                    $defaultServices[$comision->tipo_servicio] = (float) $comision->porcentaje_comision;
                }
            }
        }

        return $defaultServices;
    }

    /**
     * Referential check: counts associated sales.
     */
    public function ventasCount(): int
    {
        return DB::table('ventas')->where('id_user', $this->id)->count();
    }

    /**
     * Referential check: counts associated quick quotes.
     */
    public function cotizacionesCount(): int
    {
        return DB::table('cotizaciones_rapidas')->where('id_asesor', $this->id)->count();
    }

    /**
     * Referential check: counts associated payment methods.
     */
    public function metodosPagoCount(): int
    {
        return DB::table('metodo_pago_asesor')->where('id_asesor', $this->id)->count();
    }
}
