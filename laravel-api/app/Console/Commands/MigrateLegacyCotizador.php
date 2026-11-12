<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MigrateLegacyCotizador extends Command
{
    protected $signature = 'migrate:legacy-cotizador {--fresh : Vacía las tablas de negocio del ERP antes de migrar}';
    protected $description = 'Migra los datos históricos de plandv-cotizador hacia plandv-erp';

    protected $src;
    protected $dst;

    public function handle()
    {
        $this->src = DB::connection('cotizador_legacy');
        $this->dst = DB::connection('mysql'); // plandv-erp

        // Desactivar logs de consultas para no saturar RAM con 300MB
        $this->src->disableQueryLog();
        $this->dst->disableQueryLog();

        if ($this->option('fresh')) {
            if (!$this->confirm('Esto eliminará TODOS los datos actuales de negocio en plandv-erp. ¿Continuar?')) {
                return 0;
            }
            $this->truncateErpTables();
        }

        $this->dst->statement('SET FOREIGN_KEY_CHECKS=0;');

        try {
            $this->migrateCatalogosBase();
            $this->migrateUsuariosYAgencias();
            $this->migrateInventarioYTarifas();
            $this->migrateMetodosPago();
            $this->migrateVentasYDetalles();
            $this->migratePagosYGastos();

            $this->info('¡Migración completada exitosamente!');
        } catch (\Throwable $e) {
            $this->error('Error durante la migración: ' . $e->getMessage());
            $this->error($e->getTraceAsString());
            return 1;
        } finally {
            $this->dst->statement('SET FOREIGN_KEY_CHECKS=1;');
        }

        return 0;
    }

    protected function truncateErpTables(): void
    {
        $this->warn('Vaciando tablas de negocio en plandv-erp...');
        $this->dst->statement('SET FOREIGN_KEY_CHECKS=0;');

        $tables = [
            'pago_venta_detalle', 'pago_venta', 'comisiones_venta',
            'hotel_venta', 'vuelo_venta', 'excursion_venta', 'paquete_venta',
            'traslado_venta', 'vehiculo_venta', 'ferry_venta', 'otro_venta',
            'persona_venta', 'ventas', 'cotizaciones_rapidas',
            'tarifa_habitacion', 'habitacion_hotel', 'hotel_regla_comercial', 'hotel',
            'vehiculo_tarifa', 'vehiculo', 'vehiculo_agencia',
            'excursion', 'paquete', 'traslado', 'aerolinea', 'ubicacion',
            'metodo_pago_asesor', 'metodo_pago_banco', 'metodo_pago_digital', 'metodo_pago',
            'user_comision_config', 'login_logs', 'token_device', 'personal_access_tokens',
            'user', 'freelancer', 'referidos', 'gastos', 'callback_kommo', 'site_settings'
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                $this->dst->table($table)->truncate();
            }
        }

        $this->dst->statement('SET FOREIGN_KEY_CHECKS=1;');
    }

    protected function migrateCatalogosBase(): void
    {
        $this->info('1/6 Migrando ubicaciones, aerolíneas y referidos...');

        // Ubicación[cite: 1, 2]
        foreach ($this->src->table('ubicacion')->cursor() as $row) {
            $this->dst->table('ubicacion')->insert([
                'id' => $row->id,
                'ubicacion' => $this->utf8($row->ubicacion),
                'date_creation' => $this->validDate($row->date_creation, now()),
            ]);
        }

        // Aerolínea[cite: 1, 2]
        foreach ($this->src->table('aerolinea')->cursor() as $row) {
            $this->dst->table('aerolinea')->insert([
                'id' => $row->id,
                'nombre' => $this->utf8($row->nombre),
                'date_creation' => $this->validDate($row->date_creation, now()),
                'tipo' => 'nacional',
            ]);
        }

        // Referidos (extraídos de embajador_codigo en ventas antiguas)[cite: 1, 2]
        $embajadores = $this->src->table('ventas')
            ->select('embajador_codigo', 'embajador_id_externo', 'embajador_nombre')
            ->whereNotNull('embajador_codigo')
            ->where('embajador_codigo', '!=', '')
            ->distinct()
            ->get();

        foreach ($embajadores as $emb) {
            $this->dst->table('referidos')->insertOrIgnore([
                'codigo' => trim($emb->embajador_codigo),
                'id_externo' => $emb->embajador_id_externo,
                'nombre' => $this->utf8($emb->embajador_nombre ?: $emb->embajador_codigo),
                'fecha_registro' => now(),
            ]);
        }

        // Site Settings[cite: 1, 2]
        foreach ($this->src->table('site_settings')->cursor() as $row) {
            $this->dst->table('site_settings')->insert([
                'id' => $row->id,
                'name' => $row->name,
                'value' => $this->utf8($row->value),
            ]);
        }
    }

    protected function migrateUsuariosYAgencias(): void
    {
        $this->info('2/6 Migrando usuarios, agencias freelancer y comisiones...');

        $freelancerMap = []; // rif/nombre -> id_freelancer
        $usedEmails = [];    // control de correos duplicados en legacy

        foreach ($this->src->table('user')->cursor() as $u) {
            $idFreelancer = null;

            // Si tiene datos de agencia asociados, creamos/reutilizamos el registro en freelancer
            if (!empty(trim((string) $u->nombre_agencia))) {
                $key = !empty(trim((string) $u->rif)) ? trim((string) $u->rif) : 'AG-' . $u->id;

                if (!isset($freelancerMap[$key])) {
                    $idFreelancer = $this->dst->table('freelancer')->insertGetId([
                        'nombre' => $this->utf8($u->nombre_agencia),
                        'rif' => $key,
                        'correo' => $u->correo_agencia ?: $u->email,
                        'telefono_1' => $u->telefono_1 ?: 'N/A',
                        'telefono_2' => $u->telefono_2 ?: null,
                        'direccion' => $this->utf8($u->direccion ?: 'Venezuela'),
                        'color_primario' => $u->color_agencia ?: '#1e3a8a',
                        'logo_url' => $u->logo_agencia ?: '',
                        'hoja_membrete_config' => $this->utf8($u->hoja_agencia ?: '{}'),
                        'notify_link' => $u->notify_link ?: null,
                        'date_creation' => $this->validDate($u->date_creation, now()),
                    ]);
                    $freelancerMap[$key] = $idFreelancer;
                } else {
                    $idFreelancer = $freelancerMap[$key];
                }
            }

            // Resolver correos vacíos o duplicados en la BD legacy
            $rawEmail = mb_strtolower(trim((string) $u->email));
            if ($rawEmail === '') {
                $email = "sin_correo_{$u->id}@plandeviaje.local";
            } elseif (isset($usedEmails[$rawEmail])) {
                if (str_contains($rawEmail, '@')) {
                    [$localPart, $domain] = explode('@', $rawEmail, 2);
                    $email = "{$localPart}+dup{$u->id}@{$domain}";
                } else {
                    $email = "{$rawEmail}_dup{$u->id}";
                }
            } else {
                $email = $rawEmail;
            }
            $usedEmails[$email] = true;

            $this->dst->table('user')->insert([
                'id' => $u->id,
                'id_freelancer' => $idFreelancer,
                'id_aliado' => null,
                'first_name' => $this->utf8($u->first_name),
                'last_name' => $this->utf8($u->last_name),
                'email' => $email,
                'password' => $u->password,
                'level' => $this->utf8($u->level),
                'status' => (int) $u->status,
                'date_creation' => $this->validDate($u->date_creation, now()),
            ]);

            // Normalizar columnas de comisiones hacia user_comision_config
            $servicios = [
                'hotel' => $u->comision_hotel,
                'ferry' => $u->comision_ferry,
                'vuelo' => $u->comision_vuelo,
                'excursion' => $u->comision_excursion,
                'vehiculo' => $u->comision_vehiculo,
                'traslado' => $u->comision_traslado,
                'paquete' => $u->comision_paquete,
                'otro' => $u->comision_otro,
            ];

            foreach ($servicios as $tipo => $porcentaje) {
                $this->dst->table('user_comision_config')->insert([
                    'id_user' => $u->id,
                    'tipo_servicio' => $tipo,
                    'porcentaje_comision' => (float) $porcentaje,
                ]);
            }
        }
    }

    protected function migrateInventarioYTarifas(): void
    {
        $this->info('3/6 Migrando hoteles, habitaciones, tarifas, excursiones, paquetes, traslados y vehículos...');

        // Hoteles[cite: 1, 2]
        foreach ($this->src->table('hotel')->cursor() as $h) {
            $this->dst->table('hotel')->insert([
                'id' => $h->id,
                'id_ubicacion' => $h->id_ubicacion,
                'nombre' => $this->utf8($h->nombre),
                'tipo' => $this->utf8($h->tipo),
                'edad_adolescentes' => '0 - 0 Años', // Nuevo campo obligatorio en ERP[cite: 2]
                'edad_ninos' => $this->utf8($h->edad_ninos ?: '5 - 11 Años'),
                'edad_infantes' => $this->utf8($h->edad_infantes ?: '0 - 4 Años'),
                'nota' => $this->utf8($h->nota),
                'fechas_sin_disponibilidad' => '[]',
                'status' => (int) $h->status,
                'date_creation' => $this->validDate($h->date_creation, now()),
            ]);
        }

        // Habitaciones[cite: 1, 2]
        foreach ($this->src->table('habitacion_hotel')->cursor() as $hab) {
            $this->dst->table('habitacion_hotel')->insert([
                'id' => $hab->id,
                'id_hotel' => $hab->id_hotel,
                'habitacion' => $this->utf8($hab->habitacion),
                'cantidad_personas' => (int) $hab->cantidad_personas,
                'minimo_noches' => max(1, (int) $hab->minimo_noches),
                'posicion' => (int) $hab->posicion,
                'por_defecto' => (int) $hab->por_defecto,
                'nota' => $this->utf8($hab->nota),
            ]);
        }

        // Tarifas de Habitación (añadiendo columnas de adolescente en 0)[cite: 1, 2]
        foreach ($this->src->table('tarifa_habitacion')->cursor() as $t) {
            $this->dst->table('tarifa_habitacion')->insert([
                'id' => $t->id,
                'id_habitacion' => $t->id_habitacion,
                'desde' => $this->validDate($t->desde, now()),
                'hasta' => $this->validDate($t->hasta, now()),
                'desde_venta' => $this->validDate($t->desde_venta, $this->validDate($t->desde, now())),
                'hasta_venta' => $this->validDate($t->hasta_venta, $this->validDate($t->hasta, now())),
                'costo_noche_adulto' => $t->costo_noche_adulto,
                'precio_noche_adulto' => $t->precio_noche_adulto,
                'porcentaje_adulto' => $t->porcentaje_adulto,
                'costo_noche_adolescente' => 0.00,
                'precio_noche_adolescente' => 0.00,
                'porcentaje_adolescente' => 0.00,
                'costo_noche_nino' => $t->costo_noche_nino,
                'precio_noche_nino' => $t->precio_noche_nino,
                'porcentaje_nino' => $t->porcentaje_nino,
                'ninos_gratis' => (int) $t->ninos_gratis,
                'noches_gratis' => (int) $t->noches_gratis,
                'promocion' => (int) $t->promocion,
                'suplemento' => (int) $t->suplemento,
                'moneda' => $t->moneda ?: 'USD',
                'fecha_actualizacion' => $this->validDate($t->fecha_actualizacion, now()),
            ]);
        }

        // Excursiones (aplica_descuento_embajador -> aplica_descuento_referidos)[cite: 1, 2]
        foreach ($this->src->table('excursion')->cursor() as $ex) {
            $this->dst->table('excursion')->insert([
                'id' => $ex->id,
                'id_ubicacion' => $ex->id_ubicacion,
                'tipo_excursion' => $this->utf8($ex->tipo_excursion),
                'costo_adulto' => $ex->costo_adulto,
                'costo_nino' => $ex->costo_nino,
                'precio_adulto' => $ex->precio_adulto,
                'precio_nino' => $ex->precio_nino,
                'porcentaje_adulto' => $ex->porcentaje_adulto,
                'porcentaje_nino' => $ex->porcentaje_nino,
                'aplica_descuento_referidos' => (int) ($ex->aplica_descuento_embajador ?? 1),
                'tasa_portuaria_status' => 0,
                'tasa_portuaria_monto' => null,
                'date_creation' => $this->validDate($ex->date_creation, now()),
                'fecha_actualizacion' => $this->validDate($ex->fecha_actualizacion, now()),
            ]);
        }

        // Paquetes[cite: 1, 2]
        foreach ($this->src->table('paquete')->cursor() as $pq) {
            $this->dst->table('paquete')->insert([
                'id' => $pq->id,
                'id_ubicacion' => $pq->id_ubicacion,
                'paquete' => $this->utf8($pq->paquete),
                'costo_adulto' => $pq->costo_adulto,
                'costo_nino' => $pq->costo_nino,
                'precio_adulto' => $pq->precio_adulto,
                'precio_nino' => $pq->precio_nino,
                'porcentaje_adulto' => null,
                'porcentaje_nino' => null,
                'aplica_descuento_referidos' => 0,
                'date_creation' => $this->validDate($pq->date_creation, now()),
                'fecha_actualizacion' => $this->validDate($pq->fecha_actualizacion, now()),
            ]);
        }

        // Traslados (traslado -> ruta_origen, total -> precio_publico)[cite: 1, 2]
        foreach ($this->src->table('traslado')->cursor() as $tr) {
            $this->dst->table('traslado')->insert([
                'id' => $tr->id,
                'id_ubicacion' => $tr->id_ubicacion,
                'ruta_origen' => $this->utf8($tr->traslado),
                'ruta_destino' => null,
                'costo' => $tr->costo,
                'precio_publico' => $tr->total,
                'tipo_servicio' => ((int) $tr->tipo === 2) ? 'Ida y Vuelta' : 'Solo Ida',
            ]);
        }

        // Vehículos: Agencias, Flota y Tarifas[cite: 1, 2]
        foreach ($this->src->table('vehiculo_agencia')->cursor() as $va) {
            $this->dst->table('vehiculo_agencia')->insert([
                'id' => $va->id,
                'id_ubicacion' => $va->id_ubicacion,
                'agencia' => $this->utf8($va->agencia),
                'nota' => $this->utf8($va->nota),
                'date_creation' => $this->validDate($va->date_creation, now()),
            ]);
        }

        foreach ($this->src->table('vehiculo')->cursor() as $v) {
            $this->dst->table('vehiculo')->insert([
                'id' => $v->id,
                'id_vehiculo_agencia' => $v->id_vehiculo_agencia,
                'marca' => $this->utf8($v->marca),
                'vehiculo' => $this->utf8($v->vehiculo),
                'ano' => $v->ano,
                'tipo_vehiculo' => $this->utf8($v->tipo_vehiculo),
                'tipo_transmision' => $this->utf8($v->tipo_transmision),
                'nota' => $this->utf8($v->nota),
            ]);
        }

        foreach ($this->src->table('vehiculo_tarifa')->cursor() as $vt) {
            $this->dst->table('vehiculo_tarifa')->insert([
                'id' => $vt->id,
                'id_vehiculo' => $vt->id_vehiculo,
                'desde' => $this->validDate($vt->desde, now()),
                'hasta' => $this->validDate($vt->hasta, now()),
                'desde_venta' => $this->validDate($vt->desde_venta, $this->validDate($vt->desde, now())),
                'hasta_venta' => $this->validDate($vt->hasta_venta, $this->validDate($vt->hasta, now())),
                'costo' => $vt->costo,
                'precio' => $vt->precio,
                'porcentaje' => $vt->porcentaje,
                'promocion' => (int) $vt->promocion,
                'fecha_actualizacion' => $this->validDate($vt->fecha_actualizacion, now()),
            ]);
        }
    }

    protected function migrateMetodosPago(): void
    {
        $this->info('4/6 Migrando métodos de pago normalizados...');

        foreach ($this->src->table('metodo_pago')->cursor() as $mp) {
            $tipoRaw = strtolower(trim((string) $mp->tipo));
            if (str_contains($tipoRaw, 'banco') || !empty(trim((string) $mp->numero_cuenta))) {
                $tipo = 'banco';
            } elseif (str_contains($tipoRaw, 'efectivo')) {
                $tipo = 'efectivo';
            } else {
                $tipo = 'digital';
            }

            $this->dst->table('metodo_pago')->insert([
                'id' => $mp->id,
                'nombre' => mb_substr($this->utf8($mp->nombre), 0, 100),
                'nombre_publico' => mb_substr($this->utf8($mp->nombre_publico ?: $mp->nombre), 0, 200),
                'tipo' => $tipo,
                'logo' => $mp->logo ?: null,
                'status' => (int) $mp->status,
            ]);

            if ($tipo === 'banco') {
                // Quitar guiones/espacios para que los 20 dígitos quepan en varchar(20)[cite: 2]
                $numCuenta = preg_replace('/[^0-9A-Za-z]/', '', (string) $mp->numero_cuenta);
                $docLimpio = preg_replace('/[^0-9A-Za-z\-]/', '', (string) $mp->documento);

                $tipoDocRaw = mb_strtolower(trim((string) $mp->tipo_documento));
                $tipoDoc = match (true) {
                    str_contains($tipoDocRaw, 'rif') || str_starts_with($tipoDocRaw, 'j') => 'J',
                    str_contains($tipoDocRaw, 'pas') || str_starts_with($tipoDocRaw, 'p') => 'P',
                    str_starts_with($tipoDocRaw, 'e') => 'E',
                    default => 'V',
                };

                $this->dst->table('metodo_pago_banco')->insert([
                    'id_metodo' => $mp->id,
                    'titular' => mb_substr($this->utf8($mp->titular ?: $mp->nombre), 0, 200),
                    'tipo_documento' => $tipoDoc,
                    'documento' => mb_substr($docLimpio ?: '000000000', 0, 20),
                    'numero_cuenta' => $numCuenta ? mb_substr($numCuenta, 0, 20) : null,
                    'tipo_cuenta' => $mp->tipo_cuenta ? mb_substr($this->utf8($mp->tipo_cuenta), 0, 50) : null,
                    'pago_movil_telefono' => $mp->pago_movil ? mb_substr(trim((string) $mp->pago_movil), 0, 50) : null,
                ]);
            } elseif ($tipo === 'digital') {
                $this->dst->table('metodo_pago_digital')->insert([
                    'id_metodo' => $mp->id,
                    'correo_cuenta' => mb_substr($mp->correo ?: 'pagos@plandeviaje.com', 0, 200),
                    'tipo_comision' => str_contains(strtolower((string) $mp->tipo_comision), 'fij') ? 'fijo' : 'porcentaje',
                    'comision_valor' => (float) $mp->comision,
                    'codigo_postal' => $mp->codigo_postal ? mb_substr(trim((string) $mp->codigo_postal), 0, 20) : null,
                    'direccion_facturacion' => $mp->direccion ? mb_substr($this->utf8($mp->direccion), 0, 255) : null,
                ]);
            }
        }

        foreach ($this->src->table('metodo_pago_asesor')->cursor() as $mpa) {
            $this->dst->table('metodo_pago_asesor')->insert([
                'id' => $mpa->id,
                'id_metodo' => $mpa->id_metodo,
                'id_asesor' => $mpa->id_asesor,
                'asesor' => mb_substr($this->utf8($mpa->asesor), 0, 200),
            ]);
        }
    }

    protected function migrateVentasYDetalles(): void
    {
        $this->info('5/6 Migrando ventas y servicios asociados (esto puede tardar unos minutos)...');

        // Mapas en memoria para resolver textos legacy a IDs requeridos por Foreign Keys[cite: 1, 2]
        $referidosMap = $this->dst->table('referidos')->pluck('id', 'codigo')->toArray();
        $habitacionMap = $this->dst->table('habitacion_hotel')->get()
            ->mapWithKeys(fn($r) => [$r->id_hotel . '|' . mb_strtolower(trim($r->habitacion)) => $r->id])
            ->toArray();
        $habitacionDefaultMap = $this->dst->table('habitacion_hotel')
            ->orderByDesc('por_defecto')
            ->pluck('id', 'id_hotel')
            ->toArray();
        $excursionMap = $this->dst->table('excursion')->get()
            ->mapWithKeys(fn($r) => [mb_strtolower(trim($r->tipo_excursion)) => $r->id])
            ->toArray();
        $paqueteMap = $this->dst->table('paquete')->get()
            ->mapWithKeys(fn($r) => [mb_strtolower(trim($r->paquete)) => $r->id])
            ->toArray();
        $trasladoMap = $this->dst->table('traslado')->get()
            ->mapWithKeys(fn($r) => [mb_strtolower(trim($r->ruta_origen)) => $r->id])
            ->toArray();
        $vehiculoMap = $this->dst->table('vehiculo')->get()
            ->mapWithKeys(fn($r) => [mb_strtolower(trim($r->vehiculo)) => $r->id])
            ->toArray();

        $defaultExcursionId = $this->dst->table('excursion')->value('id');
        $defaultPaqueteId = $this->dst->table('paquete')->value('id');
        $defaultTrasladoId = $this->dst->table('traslado')->value('id');
        $defaultVehiculoId = $this->dst->table('vehiculo')->value('id');

        // 5.1 Ventas cabecera[cite: 1, 2]
        foreach ($this->src->table('ventas')->cursor() as $v) {
            $idReferido = $referidosMap[trim((string) $v->embajador_codigo)] ?? null;
            $obs = $this->utf8($v->observacion ?? '');

            if ((int) $v->cuotas === 1 || (float) $v->total_credito > 0) {
                $obs .= " | Financiamiento legacy: Inicial {$v->monto_inicial}, {$v->cantidad_cuotas} cuotas, Crédito {$v->total_credito}";
            }

            $this->dst->table('ventas')->insert([
                'id' => $v->id,
                'id_user' => $v->id_user,
                'id_referidos' => $idReferido,
                'numero_ficha' => (string) $v->numero_ficha,
                'localizador' => $this->utf8($v->localizador ?: (string) $v->numero_ficha),
                'estado' => $this->utf8($v->estado ?: 'Cotizacion'),
                'tipo_pago' => $this->utf8($v->tipo_pago ?: 'Total'),
                'checkin' => $this->validDate($v->checkin, now()),
                'checkout' => $this->validDate($v->checkout, now()),
                'fecha_limite_hotel' => $this->validDate($v->fecha_limite_hotel, '1970-01-01 04:00:01'),
                'fecha_limite_cliente' => $this->validDate($v->fecha_limite_cliente, '1970-01-01 04:00:01'),
                'descuento_porcentaje' => $v->descuento_tipo ?: null,
                'descuento_monto' => (float) $v->descuento_monto,
                'descuento_referidos_monto' => (float) ($v->descuento_embajador_monto ?? 0),
                'observacion' => trim($obs) ?: null,
                'fecha_creacion' => $this->validDate($v->fecha_creacion, now()),
                'fecha_confirmacion' => $this->validDate($v->fecha_confirmacion, null),
            ]);
        }

        // 5.2 Pasajeros (persona_venta)[cite: 1, 2]
        foreach ($this->src->table('persona_venta')->cursor() as $p) {
            $ced = preg_replace('/[^A-Za-z0-9]/', '', (string) $this->utf8($p->cedula));
            $tipoDoc = 'V';
            $numDoc = $ced;
            if (preg_match('/^([VEJP])(\d+)$/i', $ced, $m)) {
                $tipoDoc = strtoupper($m[1]);
                $numDoc = $m[2];
            }

            $this->dst->table('persona_venta')->insert([
                'id' => $p->id,
                'id_venta' => $p->id_venta,
                'nombres' => mb_substr(trim((string) $this->utf8($p->nombres)), 0, 30),
                'apellidos' => mb_substr(trim((string) $this->utf8($p->apellidos)), 0, 30),
                'tipo_documento' => mb_substr($tipoDoc, 0, 30),
                'documento' => mb_substr($numDoc, 0, 20),
                'edad' => (int) $p->edad,
                'telefono' => mb_substr(trim((string) $this->utf8($p->celular ?? '')), 0, 20),
                'correo' => mb_substr(trim((string) $this->utf8($p->correo ?? '')), 0, 70),
                'principal' => (int) $p->principal,
            ]);
        }

        // 5.3 Hotel Venta (resuelve texto 'habitacion' -> 'id_habitacion')[cite: 1, 2]
        foreach ($this->src->table('hotel_venta')->cursor() as $hv) {
            $key = $hv->id_hotel . '|' . mb_strtolower(trim($hv->habitacion));
            $idHabitacion = $habitacionMap[$key] ?? ($habitacionDefaultMap[$hv->id_hotel] ?? null);

            if (!$idHabitacion) {
                continue; // Evita fallo si la venta apunta a un hotel eliminado
            }

            $this->dst->table('hotel_venta')->insert([
                'id' => $hv->id,
                'id_venta' => $hv->id_venta,
                'id_hotel' => $hv->id_hotel,
                'id_habitacion' => $idHabitacion,
                'tipo' => $this->utf8($hv->tipo ?: 'Habitacion'),
                'noches' => (int) $hv->noches,
                'adultos' => (int) $hv->adultos,
                'adolescente' => 0,
                'ninos' => (int) $hv->ninos,
                'infantes' => (int) $hv->infantes,
                'costo_noche_adulto' => $hv->costo_noche_adulto,
                'costo_noche_adolescente' => 0.00,
                'costo_noche_nino' => $hv->costo_noche_nino,
                'precio_noche_adolescente' => 0.00,
                'precio_noche_adulto' => $hv->precio_noche_adulto,
                'precio_noche_nino' => $hv->precio_noche_nino,
                'localizador' => $this->utf8($hv->localizador),
                'fecha_checkin' => $this->validDate($hv->fecha_checkin, now()),
                'fecha_checkout' => $this->validDate($hv->fecha_checkout, now()),
                'estado' => $this->utf8($hv->estado ?: 'Pendiente'),
                'fecha_limite' => $this->validDate($hv->fecha_limite, now()),
                'precio_noche_adulto_descuento' => $hv->precio_noche_adulto_descuento,
                'precio_noche_adolescente_descuento' => 0.00,
                'precio_noche_nino_descuento' => $hv->precio_noche_nino_descuento,
                'total_descuento' => $hv->total_descuento,
                'ninos_gratis' => (int) $hv->ninos_gratis,
                'noches_gratis' => (int) $hv->noches_gratis,
                'promocion' => (int) $hv->promocion,
            ]);
        }

        // 5.4 Vuelo Venta[cite: 1, 2]
        foreach ($this->src->table('vuelo_venta')->cursor() as $vv) {
            $this->dst->table('vuelo_venta')->insert([
                'id' => $vv->id,
                'id_venta' => $vv->id_venta,
                'id_aerolinea' => $vv->id_aerolinea,
                'itinerario' => $this->utf8($vv->itinerario),
                'localizador' => $this->utf8($vv->localizador),
                'adultos' => (int) $vv->adultos,
                'ninos' => (int) $vv->ninos,
                'infantes' => (int) $vv->infantes,
                'costo_adulto' => $vv->costo_adulto,
                'costo_nino' => $vv->costo_nino,
                'costo_infante' => $vv->costo_infante,
                'precio_adulto' => $vv->precio_adulto,
                'precio_nino' => $vv->precio_nino,
                'precio_infante' => $vv->precio_infante,
                'fecha_vuelo' => $this->validDate($vv->fecha_vuelo, now()),
                'boleto_internacional' => (int) $vv->boleto_internacional,
                'comision_internacional' => $vv->comision_internacional,
                'fecha_retorno' => null,
            ]);
        }

        // 5.5 Excursión Venta[cite: 1, 2]
        foreach ($this->src->table('excursion_venta')->cursor() as $ev) {
            $idExc = $excursionMap[mb_strtolower(trim($ev->tipo_excursion))] ?? $defaultExcursionId;
            if (!$idExc) continue;

            $this->dst->table('excursion_venta')->insert([
                'id' => $ev->id,
                'id_venta' => $ev->id_venta,
                'id_excursion' => $idExc,
                'fecha' => $ev->fecha ?: '',
                'adultos' => (int) $ev->adultos,
                'ninos' => (int) $ev->ninos,
                'infantes' => (int) $ev->infantes,
                'costo_adulto' => $ev->costo_adulto,
                'costo_nino' => $ev->costo_nino,
                'precio_adulto' => $ev->precio_adulto,
                'precio_nino' => $ev->precio_nino,
                'total_descuento' => $ev->total_descuento ?? 0,
                'estado' => $this->utf8($ev->estado ?: 'Pendiente'),
            ]);
        }

        // 5.6 Paquete Venta[cite: 1, 2]
        foreach ($this->src->table('paquete_venta')->cursor() as $pv) {
            $idPaq = $paqueteMap[mb_strtolower(trim($pv->paquete))] ?? $defaultPaqueteId;
            if (!$idPaq) continue;

            $this->dst->table('paquete_venta')->insert([
                'id' => $pv->id,
                'id_venta' => $pv->id_venta,
                'id_paquete' => $idPaq,
                'fecha' => $pv->fecha ?: '',
                'adultos' => (int) $pv->adultos,
                'ninos' => (int) $pv->ninos,
                'infantes' => (int) $pv->infantes,
                'costo_adulto' => $pv->costo_adulto,
                'costo_nino' => $pv->costo_nino,
                'precio_adulto' => $pv->precio_adulto,
                'precio_nino' => $pv->precio_nino,
                'total_descuento' => $pv->total_descuento ?? 0,
            ]);
        }

        // 5.7 Traslado Venta[cite: 1, 2]
        foreach ($this->src->table('traslado_venta')->cursor() as $tv) {
            $idTras = $trasladoMap[mb_strtolower(trim($tv->traslado))] ?? $defaultTrasladoId;
            if (!$idTras) continue;

            $obs = trim($this->utf8($tv->observacion . " | Ruta: {$tv->desde} -> {$tv->hasta} | Chofer: {$tv->chofer_nombre} ({$tv->chofer_placa})"));

            $this->dst->table('traslado_venta')->insert([
                'id' => $tv->id,
                'id_venta' => $tv->id_venta,
                'id_traslado' => $idTras,
                'id_chofer' => null,
                'id_vuelo' => $tv->id_vuelo ?: null,
                'fecha_traslado' => $this->validDate($tv->fecha_traslado, now()),
                'adultos' => (int) $tv->adultos,
                'ninos' => (int) $tv->ninos,
                'infantes' => (int) $tv->infantes,
                'costo_historico' => $tv->costo,
                'precio_historico' => $tv->precio_adulto ?: $tv->total,
                'total_descuento' => $tv->total_descuento ?? 0,
                'observacion' => $obs,
                'fecha_retorno' => null,
            ]);
        }

        // 5.8 Vehículo Venta[cite: 1, 2]
        foreach ($this->src->table('vehiculo_venta')->cursor() as $vehv) {
            $idVeh = $vehiculoMap[mb_strtolower(trim($vehv->modelo))] ?? $defaultVehiculoId;
            if (!$idVeh) continue;

            $dias = max(1, (int) $vehv->dias);
            $this->dst->table('vehiculo_venta')->insert([
                'id' => $vehv->id,
                'id_venta' => $vehv->id_venta,
                'id_vehiculo' => $idVeh,
                'desde' => $this->validDate($vehv->desde, now()),
                'hasta' => $this->validDate($vehv->hasta, now()),
                'dias' => $dias,
                'costo' => $vehv->costo,
                'precio_unitario' => round((float) $vehv->total / $dias, 2),
                'observacion' => $this->utf8($vehv->observacion),
            ]);
        }

        // 5.9 Ferry y Otros[cite: 1, 2]
        foreach ($this->src->table('ferry_venta')->cursor() as $fv) {
            $this->dst->table('ferry_venta')->insert([
                'id' => $fv->id,
                'id_venta' => $fv->id_venta,
                'ruta' => $this->utf8($fv->ruta),
                'clase' => $this->utf8($fv->clase),
                'adultos' => (int) $fv->adultos,
                'ninos' => (int) $fv->ninos,
                'infantes' => (int) $fv->infantes,
                'vehiculos' => (int) $fv->vehiculos,
                'itinerario' => $this->utf8($fv->itinerario),
                'costo_adulto' => $fv->costo_adulto,
                'costo_nino' => $fv->costo_nino,
                'costo_infante' => $fv->costo_infante,
                'costo_vehiculo' => $fv->costo_vehiculo,
                'precio_adulto' => $fv->precio_adulto,
                'precio_nino' => $fv->precio_nino,
                'precio_infante' => $fv->precio_infante,
                'precio_vehiculo' => $fv->precio_vehiculo,
            ]);
        }

        foreach ($this->src->table('otro_venta')->cursor() as $ov) {
            $this->dst->table('otro_venta')->insert([
                'id' => $ov->id,
                'id_venta' => $ov->id_venta,
                'fecha' => $ov->fecha ?: '',
                'descripcion' => $this->utf8($ov->descripcion),
                'adultos' => (int) $ov->adultos,
                'ninos' => (int) $ov->ninos,
                'infantes' => (int) $ov->infantes,
                'costo' => $ov->costo,
                'precio' => $ov->total,
                'estado' => $this->utf8($ov->estado ?: 'Pendiente'),
            ]);
        }
    }

    protected function migratePagosYGastos(): void
    {
        $this->info('6/6 Migrando pagos, gastos y cotizaciones rápidas...');

        $metodoMap = $this->dst->table('metodo_pago')->get()
            ->mapWithKeys(fn($r) => [mb_strtolower(trim($r->nombre)) => $r->id])
            ->toArray();
        $defaultMetodoId = $this->dst->table('metodo_pago')->value('id');

        foreach ($this->src->table('pago_venta')->cursor() as $pv) {
            $idMetodo = $metodoMap[mb_strtolower(trim((string) $pv->metodo_pago))] ?? $defaultMetodoId;
            if (!$idMetodo) continue;

            $moneda = mb_substr(strtoupper(trim((string) ($pv->moneda ?: 'USD'))), 0, 10);
            $montoOrig = match ($moneda) {
                'VES', 'BS' => (float) ($pv->total_ves ?: $pv->total),
                'COP' => (float) ($pv->total_cop ?: $pv->total),
                default => (float) $pv->total,
            };

            $numTrans = trim((string) $this->utf8($pv->numero_transaccion ?: 'N/A'));
            $obs = trim((string) $this->utf8($pv->observacion ?? ''));

            // Si en legacy escribieron una nota larga en numero_transaccion, la respaldamos en observacion
            if (mb_strlen($numTrans) > 100) {
                $obs = trim("Ref. original: {$numTrans}" . ($obs !== '' ? " | {$obs}" : ''));
                $numTrans = mb_substr($numTrans, 0, 97) . '...';
            }

            $this->dst->table('pago_venta')->insert([
                'id' => (int) $pv->id,
                'id_venta' => $pv->id_venta,
                'id_metodo' => $idMetodo,
                'numero_transaccion' => $numTrans ?: 'N/A',
                'tipo_pago' => 'pago_total',
                'moneda_pago' => $moneda,
                'monto_original' => $montoOrig,
                'tasa_cambio' => max(0.0001, (float) $pv->tasa),
                'monto_usd' => (float) $pv->total,
                'comision_bancaria' => (float) $pv->comision_bancaria,
                'quien_envia' => mb_substr(trim((string) $this->utf8($pv->quien_envia ?: 'Cliente')), 0, 200),
                'observacion' => $obs !== '' ? $obs : null,
                'id_credito' => $pv->id_credito ?: null,
                'fecha_pago' => $this->validDate($pv->fecha, now()),
            ]);

            $this->dst->table('pago_venta_detalle')->insert([
                'id_pago' => (int) $pv->id,
                'tipo_servicio' => 'hotel',
                'monto_asignado_usd' => (float) $pv->total,
            ]);
        }

        foreach ($this->src->table('gastos')->cursor() as $g) {
            $this->dst->table('gastos')->insert([
                'id' => $g->id,
                'gasto' => mb_substr((string) $this->utf8($g->gasto), 0, 200),
                'agencia' => mb_substr((string) $this->utf8($g->agencia), 0, 100),
                'total' => $g->total,
                'total_moneda' => $g->total_moneda,
                'tasa' => $g->tasa,
                'moneda' => mb_substr($g->moneda ?: 'USD', 0, 10),
                'imagen_recibo' => mb_substr($g->imagen_recibo ?: '', 0, 200),
                'fecha_gasto' => $this->validDate($g->fecha_gasto, now()),
            ]);
        }

        foreach ($this->src->table('cotizaciones_rapidas')->cursor() as $cr) {
            $this->dst->table('cotizaciones_rapidas')->insert([
                'id' => $cr->id,
                'id_asesor' => $cr->id_asesor,
                'fecha' => $this->validDate($cr->fecha, now()),
                'data' => $this->utf8($cr->data),
            ]);
        }
    }

    protected function utf8(?string $text): ?string
    {
        if ($text === null) return null;
        return mb_check_encoding($text, 'UTF-8') ? $text : mb_convert_encoding($text, 'UTF-8', 'ISO-8859-1');
    }

    protected function validDate($date, $fallback)
    {
        if (empty($date) || str_starts_with((string) $date, '0000-00-00')) {
            return $fallback;
        }
        return $date;
    }
}