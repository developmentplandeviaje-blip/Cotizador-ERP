<?php

namespace App\Services\Quote;

use App\Models\Catalog\Aerolinea;
use App\Models\Catalog\Excursion;
use App\Models\Catalog\Hotel;
use App\Models\Catalog\Paquete;
use App\Models\Catalog\Traslado;
use App\Models\Catalog\Ubicacion;
use App\Models\Catalog\Vehiculo;
use App\Models\Quote\CotizacionRapida;
use App\Models\Quote\ExcursionVenta;
use App\Models\Quote\FerryVenta;
use App\Models\Quote\HotelVenta;
use App\Models\Quote\OtroVenta;
use App\Models\Quote\PaqueteVenta;
use App\Models\Quote\PersonaVenta;
use App\Models\Quote\Referido;
use App\Models\Quote\TrasladoVenta;
use App\Models\Quote\VehiculoVenta;
use App\Models\Quote\Venta;
use App\Models\Quote\VueloVenta;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CotizacionService
{
    /**
     * Obtiene los catálogos de productos para el cotizador,
     * aplicando enmascaramiento de costos netos si el usuario es Freelancer (US-03).
     */
    public function getCatalogos(User $user): array
    {
        $isFreelancer = ($user->level === 'Freelancer' || !empty($user->id_freelancer));

        $ubicaciones = Ubicacion::orderBy('ubicacion')->get();
        $hoteles = Hotel::with(['habitaciones.tarifas'])
            ->where('status', true)
            ->orderBy('nombre')
            ->get();
        $aerolineas = Aerolinea::orderBy('nombre')->get();
        $excursiones = Excursion::orderBy('tipo_excursion')->get();
        $paquetes = Paquete::orderBy('paquete')->get();

        $traslados = Traslado::orderBy('ruta_origen')->get();
        $vehiculos = Vehiculo::with('tarifas')->orderBy('marca')->get();


        if ($isFreelancer) {
            $hoteles->each(function ($hotel) {
                if ($hotel->habitaciones) {
                    $hotel->habitaciones->each(function ($hab) {
                        if ($hab->tarifas) {
                            $hab->tarifas->makeHidden([
                                'costo_noche_adulto',
                                'costo_noche_adolescente',
                                'costo_noche_nino',
                            ]);
                        }
                    });
                }
            });

            $excursiones->makeHidden(['costo_adulto', 'costo_nino']);
            $paquetes->makeHidden(['costo_adulto', 'costo_nino']);
            $traslados->makeHidden(['costo_adulto', 'costo_nino', 'costo']);
            $vehiculos->each(function ($vehiculo) {
                if ($vehiculo->tarifas) {
                    $vehiculo->tarifas->makeHidden(['costo']);
                }
            });
        }

        return [
            'ubicaciones' => $ubicaciones,
            'hoteles' => $hoteles,
            'aerolineas' => $aerolineas,
            'excursiones' => $excursiones,
            'paquetes' => $paquetes,
            'traslados' => $traslados,
            'vehiculos' => $vehiculos,
            'is_freelancer' => $isFreelancer,
        ];
    }

    /**
     * Valida código de referido en modo pasivo ($0.00 descuento) según US-01.
     */
    public function validarReferido(string $codigo): array
    {
        $referido = Referido::where('codigo', trim($codigo))->first();

        if (!$referido) {
            throw ValidationException::withMessages([
                'codigo' => ['El código de referido no existe o se encuentra inactivo.'],
            ]);
        }

        return [
            'valido' => true,
            'data' => [
                'id' => $referido->id,
                'codigo' => $referido->codigo,
                'nombre' => $referido->nombre,
            ],
            'descuento_aplicado' => 0.00,
        ];
    }

    /**
     * Busca información de un pasajero por documento para autocompletado (US-04).
     */
    public function buscarCliente(string $documento): ?PersonaVenta
    {
        return PersonaVenta::where('documento', trim($documento))
            ->latest('id')
            ->first();
    }

    /**
     * Guarda una cotización formal atómicamente con todos sus productos asociados.
     */
    public function crearCotizacion(User $user, array $data): Venta
    {
        return DB::transaction(function () use ($user, $data) {
            $maxFicha = Venta::max('numero_ficha') ?? 1000;
            $numeroFicha = $maxFicha + 1;
            $localizador = 'COT-' . strtoupper(Str::random(6));

            $venta = Venta::create([
                'id_user' => $user->id,
                'id_referidos' => $data['id_referidos'] ?? null,
                'numero_ficha' => $numeroFicha,
                'localizador' => $localizador,
                'estado' => 'Cotizacion',
                'tipo_pago' => $data['tipo_pago'] ?? 'Total',
                'checkin' => $data['checkin'] ?? null,
                'checkout' => $data['checkout'] ?? null,
                'fecha_limite_hotel' => $data['fecha_limite_hotel'] ?? now()->addDays(3)->toDateTimeString(),
                'fecha_limite_cliente' => $data['fecha_limite_cliente'] ?? now()->addDays(2)->toDateTimeString(),
                'descuento_porcentaje' => $data['descuento_porcentaje'] ?? null,
                'descuento_monto' => $data['descuento_monto'] ?? 0.00,
                'descuento_referidos_monto' => $data['descuento_referidos_monto'] ?? 0.00,
                'observacion' => $data['observacion'] ?? null,
                'fecha_creacion' => now(),
            ]);

            // Cliente principal
            if (!empty($data['cliente'])) {
                $cliente = $data['cliente'];
                PersonaVenta::create([
                    'id_venta' => $venta->id,
                    'nombres' => $cliente['nombres'] ?? '',
                    'apellidos' => $cliente['apellidos'] ?? '',
                    'tipo_documento' => $cliente['tipo_documento'] ?? 'V',
                    'documento' => $cliente['documento'] ?? '',
                    'edad' => $cliente['edad'] ?? 0,
                    'telefono' => $cliente['telefono'] ?? '',
                    'correo' => $cliente['correo'] ?? '',
                    'principal' => 1,
                ]);
            }

            // Pasajeros adicionales
            if (!empty($data['pasajeros']) && is_array($data['pasajeros'])) {
                foreach ($data['pasajeros'] as $pasajero) {
                    PersonaVenta::create([
                        'id_venta' => $venta->id,
                        'nombres' => $pasajero['nombres'] ?? '',
                        'apellidos' => $pasajero['apellidos'] ?? '',
                        'tipo_documento' => $pasajero['tipo_documento'] ?? 'V',
                        'documento' => $pasajero['documento'] ?? '',
                        'edad' => $pasajero['edad'] ?? 0,
                        'telefono' => $pasajero['telefono'] ?? '',
                        'correo' => $pasajero['correo'] ?? '',
                        'principal' => 0,
                    ]);
                }
            }

            // Guardar Ítems: Hoteles
            if (!empty($data['hoteles']) && is_array($data['hoteles'])) {
                foreach ($data['hoteles'] as $h) {
                    HotelVenta::create([
                        'id_venta' => $venta->id,
                        'id_hotel' => $h['id_hotel'],
                        'id_habitacion' => $h['id_habitacion'] ?? 0,
                        'tipo' => $h['tipo'] ?? 'Habitacion',

                        'noches' => $h['noches'] ?? 1,
                        'adultos' => $h['adultos'] ?? 0,
                        'adolescente' => $h['adolescente'] ?? 0,
                        'ninos' => $h['ninos'] ?? 0,
                        'infantes' => $h['infantes'] ?? 0,
                        'costo_noche_adulto' => $h['costo_noche_adulto'] ?? 0,
                        'costo_noche_adolescente' => $h['costo_noche_adolescente'] ?? 0,
                        'costo_noche_nino' => $h['costo_noche_nino'] ?? 0,
                        'precio_noche_adulto' => $h['precio_noche_adulto'] ?? 0,
                        'precio_noche_adolescente' => $h['precio_noche_adolescente'] ?? 0,
                        'precio_noche_nino' => $h['precio_noche_nino'] ?? 0,
                        'localizador' => $h['localizador'] ?? $localizador,
                        'fecha_checkin' => $h['fecha_checkin'] ?? $venta->checkin,
                        'fecha_checkout' => $h['fecha_checkout'] ?? $venta->checkout,
                        'estado' => 'Pendiente',
                        'fecha_limite' => $h['fecha_limite'] ?? now()->addDays(2)->toDateTimeString(),
                        'precio_noche_adulto_descuento' => $h['precio_noche_adulto_descuento'] ?? 0,

                        'precio_noche_adolescente_descuento' => $h['precio_noche_adolescente_descuento'] ?? 0,
                        'precio_noche_nino_descuento' => $h['precio_noche_nino_descuento'] ?? 0,
                        'total_descuento' => $h['total_descuento'] ?? 0,
                        'ninos_gratis' => $h['ninos_gratis'] ?? 0,
                        'noches_gratis' => $h['noches_gratis'] ?? 0,
                        'promocion' => $h['promocion'] ?? 0,
                    ]);
                }
            }

            // Guardar Ítems: Vuelos
            if (!empty($data['vuelos']) && is_array($data['vuelos'])) {
                foreach ($data['vuelos'] as $v) {
                    VueloVenta::create([
                        'id_venta' => $venta->id,
                        'id_aerolinea' => $v['id_aerolinea'],
                        'itinerario' => $v['itinerario'] ?? '',
                        'localizador' => $v['localizador'] ?? $localizador,
                        'adultos' => $v['adultos'] ?? 0,
                        'ninos' => $v['ninos'] ?? 0,
                        'infantes' => $v['infantes'] ?? 0,
                        'costo_adulto' => $v['costo_adulto'] ?? 0,
                        'costo_nino' => $v['costo_nino'] ?? 0,
                        'costo_infante' => $v['costo_infante'] ?? 0,
                        'precio_adulto' => $v['precio_adulto'] ?? 0,
                        'precio_nino' => $v['precio_nino'] ?? 0,
                        'precio_infante' => $v['precio_infante'] ?? 0,
                        'fecha_vuelo' => $v['fecha_vuelo'] ?? now()->toDateTimeString(),
                        'boleto_internacional' => $v['boleto_internacional'] ?? 0,
                        'comision_internacional' => $v['comision_internacional'] ?? 0,
                    ]);
                }
            }

            // Guardar Ítems: Excursiones
            if (!empty($data['excursiones']) && is_array($data['excursiones'])) {
                foreach ($data['excursiones'] as $e) {
                    ExcursionVenta::create([
                        'id_venta' => $venta->id,
                        'id_excursion' => $e['id_excursion'],
                        'fecha' => $e['fecha'] ?? '',
                        'adultos' => $e['adultos'] ?? 0,
                        'ninos' => $e['ninos'] ?? 0,
                        'infantes' => $e['infantes'] ?? 0,
                        'costo_adulto' => $e['costo_adulto'] ?? 0,
                        'costo_nino' => $e['costo_nino'] ?? 0,
                        'precio_adulto' => $e['precio_adulto'] ?? 0,
                        'precio_nino' => $e['precio_nino'] ?? 0,
                        'total_descuento' => $e['total_descuento'] ?? 0,
                        'estado' => 'Pendiente',
                    ]);
                }
            }

            // Guardar Ítems: Paquetes
            if (!empty($data['paquetes']) && is_array($data['paquetes'])) {
                foreach ($data['paquetes'] as $p) {
                    PaqueteVenta::create([
                        'id_venta' => $venta->id,
                        'id_paquete' => $p['id_paquete'],
                        'fecha' => $p['fecha'] ?? '',
                        'adultos' => $p['adultos'] ?? 0,
                        'ninos' => $p['ninos'] ?? 0,
                        'infantes' => $p['infantes'] ?? 0,
                        'costo_adulto' => $p['costo_adulto'] ?? 0,
                        'costo_nino' => $p['costo_nino'] ?? 0,
                        'precio_adulto' => $p['precio_adulto'] ?? 0,
                        'precio_nino' => $p['precio_nino'] ?? 0,
                        'total_descuento' => $p['total_descuento'] ?? 0,
                    ]);
                }
            }

            // Guardar Ítems: Traslados
            if (!empty($data['traslados']) && is_array($data['traslados'])) {
                foreach ($data['traslados'] as $t) {
                    TrasladoVenta::create([
                        'id_venta' => $venta->id,
                        'id_traslado' => $t['id_traslado'],
                        'id_chofer' => $t['id_chofer'] ?? null,
                        'id_vuelo' => $t['id_vuelo'] ?? null,
                        'fecha_traslado' => $t['fecha_traslado'] ?? now()->toDateTimeString(),
                        'adultos' => $t['adultos'] ?? 0,
                        'ninos' => $t['ninos'] ?? 0,
                        'infantes' => $t['infantes'] ?? 0,
                        'costo_historico' => $t['costo_historico'] ?? 0,
                        'precio_historico' => $t['precio_historico'] ?? 0,
                        'total_descuento' => $t['total_descuento'] ?? 0,
                        'observacion' => $t['observacion'] ?? null,
                    ]);
                }
            }

            // Guardar Ítems: Vehículos
            if (!empty($data['vehiculos']) && is_array($data['vehiculos'])) {
                foreach ($data['vehiculos'] as $veh) {
                    VehiculoVenta::create([
                        'id_venta' => $venta->id,
                        'id_vehiculo' => $veh['id_vehiculo'],
                        'desde' => $veh['desde'] ?? now()->toDateTimeString(),
                        'hasta' => $veh['hasta'] ?? now()->addDays(1)->toDateTimeString(),
                        'dias' => $veh['dias'] ?? 1,
                        'costo' => $veh['costo'] ?? 0,
                        'precio_unitario' => $veh['precio_unitario'] ?? 0,
                        'observacion' => $veh['observacion'] ?? null,
                    ]);
                }
            }

            // Guardar Ítems: Ferries
            if (!empty($data['ferries']) && is_array($data['ferries'])) {
                foreach ($data['ferries'] as $f) {
                    FerryVenta::create([
                        'id_venta' => $venta->id,
                        'ruta' => $f['ruta'] ?? '',
                        'clase' => $f['clase'] ?? '',
                        'adultos' => $f['adultos'] ?? 0,
                        'ninos' => $f['ninos'] ?? 0,
                        'infantes' => $f['infantes'] ?? 0,
                        'vehiculos' => $f['vehiculos'] ?? 0,
                        'itinerario' => $f['itinerario'] ?? '',
                        'costo_adulto' => $f['costo_adulto'] ?? 0,
                        'costo_nino' => $f['costo_nino'] ?? 0,
                        'costo_infante' => $f['costo_infante'] ?? 0,
                        'costo_vehiculo' => $f['costo_vehiculo'] ?? 0,
                        'precio_adulto' => $f['precio_adulto'] ?? 0,
                        'precio_nino' => $f['precio_nino'] ?? 0,
                        'precio_infante' => $f['precio_infante'] ?? 0,
                        'precio_vehiculo' => $f['precio_vehiculo'] ?? 0,
                    ]);
                }
            }

            // Guardar Ítems: Otros
            if (!empty($data['otros']) && is_array($data['otros'])) {
                foreach ($data['otros'] as $o) {
                    OtroVenta::create([
                        'id_venta' => $venta->id,
                        'fecha' => $o['fecha'] ?? '',
                        'descripcion' => $o['descripcion'] ?? '',
                        'adultos' => $o['adultos'] ?? 0,
                        'ninos' => $o['ninos'] ?? 0,
                        'infantes' => $o['infantes'] ?? 0,
                        'costo' => $o['costo'] ?? 0,
                        'precio' => $o['precio'] ?? 0,
                        'estado' => 'Pendiente',
                    ]);
                }
            }

            return $venta->load([
                'user',
                'clientePrincipal',
                'personas',
                'hoteles.hotel',
                'vuelos.aerolinea',
                'excursiones.excursion',
                'paquetes.paquete',
                'traslados.traslado',
                'vehiculos.vehiculo',
                'ferries',
                'otros',
                'referido',
            ]);
        });
    }

    /**
     * Guarda una cotización rápida express en formato serializado.
     */
    public function crearCotizacionRapida(User $user, array $data): CotizacionRapida
    {
        $payload = isset($data['data']) && is_string($data['data'])
            ? $data['data']
            : json_encode($data);

        $rapida = CotizacionRapida::create([
            'id_asesor' => $user->id,
            'fecha' => now(),
            'data' => $payload,
        ]);

        return $rapida->load('asesor');
    }

    /**
     * Lista todas las cotizaciones guardadas (formales y rápidas) normalizadas para el registro de guardado.
     */
    public function listarCotizaciones(User $user): array
    {
        $isAdmin = in_array(strtolower($user->level ?? ''), ['admin', 'administrador', 'lider']);

        $ventasQuery = Venta::with([
            'user',
            'clientePrincipal',
            'personas',
            'hoteles.hotel',
            'vuelos.aerolinea',
            'excursiones.excursion',
            'paquetes.paquete',
            'traslados.traslado',
            'vehiculos.vehiculo',
            'ferries',
            'otros',
            'referido',
        ])
        ->where('estado', 'Cotizacion')
        ->latest('id');

        $rapidasQuery = CotizacionRapida::with('asesor')
            ->latest('id');

        if (!$isAdmin) {
            $ventasQuery->where('id_user', $user->id);
            $rapidasQuery->where('id_asesor', $user->id);
        }

        $ventas = $ventasQuery->get();
        $rapidas = $rapidasQuery->get();

        $lista = [];

        // Mapear ventas (Cotizaciones formales)
        foreach ($ventas as $v) {
            $clienteP = $v->clientePrincipal;
            $nombreCliente = trim(($clienteP?->nombres ?? '') . ' ' . ($clienteP?->apellidos ?? ''));
            if (empty($nombreCliente)) {
                $nombreCliente = 'Sin cliente asignado';
            }

            $totalUSD = 0;
            $items = [];

            foreach ($v->hoteles as $h) {
                $monto = ($h->precio_noche_adulto * max(1, (int)$h->adultos)
                    + $h->precio_noche_adolescente * (int)($h->adolescente ?? 0)
                    + $h->precio_noche_nino * (int)($h->ninos ?? 0)) * max(1, (int)$h->noches);
                $totalUSD += $monto;
                $items[] = [
                    'tipo' => 'hotel',
                    'titulo' => 'Hotel: ' . ($h->hotel?->nombre ?? 'Hotel'),
                    'detalle' => "{$h->noches} noches • Habitación: " . ($h->tipo_habitacion ?? 'Estándar'),
                    'precio' => $monto,
                    'data' => $h,
                ];
            }

            foreach ($v->vuelos as $vu) {
                $monto = ($vu->precio_adulto * max(1, (int)$vu->adultos)
                    + $vu->precio_nino * (int)($vu->ninos ?? 0)
                    + $vu->precio_infante * (int)($vu->infantes ?? 0));
                $totalUSD += $monto;
                $items[] = [
                    'tipo' => 'vuelo',
                    'titulo' => 'Vuelo: ' . ($vu->aerolinea?->nombre ?? 'Aerolínea'),
                    'detalle' => $vu->itinerario ?? 'Ruta aérea',
                    'precio' => $monto,
                    'data' => $vu,
                ];
            }

            foreach ($v->traslados as $t) {
                $monto = (float)($t->precio_historico ?? 0);
                $totalUSD += $monto;
                $items[] = [
                    'tipo' => 'traslado',
                    'titulo' => 'Traslado: ' . ($t->traslado?->ruta_origen ?? '') . ' - ' . ($t->traslado?->ruta_destino ?? ''),
                    'detalle' => 'Fecha: ' . ($t->fecha_traslado ?? 'N/A'),
                    'precio' => $monto,
                    'data' => $t,
                ];
            }

            foreach ($v->excursiones as $e) {
                $monto = ($e->precio_adulto * max(1, (int)$e->adultos)
                    + $e->precio_nino * (int)($e->ninos ?? 0));
                $totalUSD += $monto;
                $items[] = [
                    'tipo' => 'excursion',
                    'titulo' => 'Excursión: ' . ($e->excursion?->tipo_excursion ?? 'Excursión'),
                    'detalle' => 'Fecha: ' . ($e->fecha ?? 'N/A'),
                    'precio' => $monto,
                    'data' => $e,
                ];
            }

            foreach ($v->paquetes as $p) {
                $monto = ($p->precio_adulto * max(1, (int)$p->adultos)
                    + $p->precio_nino * (int)($p->ninos ?? 0));
                $totalUSD += $monto;
                $items[] = [
                    'tipo' => 'paquete',
                    'titulo' => 'Paquete: ' . ($p->paquete?->paquete ?? 'Paquete turístico'),
                    'detalle' => 'Fecha: ' . ($p->fecha ?? 'N/A'),
                    'precio' => $monto,
                    'data' => $p,
                ];
            }

            foreach ($v->vehiculos as $veh) {
                $dias = max(1, (int)($veh->dias ?? 1));
                $monto = (float)($veh->precio_unitario ?? 0) * $dias;
                $totalUSD += $monto;
                $items[] = [
                    'tipo' => 'vehiculo',
                    'titulo' => 'Vehículo: ' . ($veh->vehiculo?->marca ?? '') . ' ' . ($veh->vehiculo?->modelo ?? ''),
                    'detalle' => "{$dias} días",
                    'precio' => $monto,
                    'data' => $veh,
                ];
            }

            foreach ($v->ferries as $f) {
                $monto = ($f->precio_adulto * max(1, (int)$f->adultos)
                    + $f->precio_nino * (int)($f->ninos ?? 0)
                    + $f->precio_vehiculo * (int)($f->vehiculos ?? 0));
                $totalUSD += $monto;
                $items[] = [
                    'tipo' => 'ferry',
                    'titulo' => 'Ferry: ' . ($f->ruta ?? 'Ruta marítima'),
                    'detalle' => 'Itinerario: ' . ($f->itinerario ?? ''),
                    'precio' => $monto,
                    'data' => $f,
                ];
            }

            foreach ($v->otros as $o) {
                $monto = (float)($o->precio ?? 0);
                $totalUSD += $monto;
                $items[] = [
                    'tipo' => 'otro',
                    'titulo' => 'Servicio: ' . ($o->descripcion ?? 'Otro'),
                    'detalle' => 'Fecha: ' . ($o->fecha ?? 'N/A'),
                    'precio' => $monto,
                    'data' => $o,
                ];
            }

            $totalUSD = max(0, $totalUSD - (float)($v->descuento_monto ?? 0));
            $totalPax = $v->personas->count();

            $lista[] = [
                'id' => $v->id,
                'uid' => 'venta_' . $v->id,
                'tipo_registro' => 'formal',
                'tipo_label' => 'Cotización Formal',
                'localizador' => $v->localizador,
                'numero_ficha' => $v->numero_ficha,
                'fecha' => $v->fecha_creacion,
                'asesor' => $v->user?->name ?? 'Asesor',
                'cliente' => [
                    'nombres' => $clienteP?->nombres ?? '',
                    'apellidos' => $clienteP?->apellidos ?? '',
                    'nombre_completo' => $nombreCliente,
                    'tipo_documento' => $clienteP?->tipo_documento ?? 'V',
                    'documento' => $clienteP?->documento ?? '',
                    'telefono' => $clienteP?->telefono ?? '',
                    'correo' => $clienteP?->correo ?? '',
                ],
                'pasajeros' => $v->personas->where('principal', 0)->values(),
                'pax' => [
                    'total' => max(1, $totalPax),
                ],
                'fechas' => [
                    'checkin' => $v->checkin ? date('Y-m-d', strtotime($v->checkin)) : null,
                    'checkout' => $v->checkout ? date('Y-m-d', strtotime($v->checkout)) : null,
                ],
                'items' => $items,
                'total_usd' => $totalUSD,
                'descuento_monto' => (float)$v->descuento_monto,
                'descuento_porcentaje' => $v->descuento_porcentaje,
                'observacion' => $v->observacion,
                'tipo_pago' => $v->tipo_pago,
            ];
        }

        // Mapear cotizaciones rápidas
        foreach ($rapidas as $r) {
            $data = is_array($r->data) ? $r->data : json_decode($r->data, true);
            $clienteRaw = $data['cliente'] ?? 'Cliente Rápido';
            $pax = $data['pax'] ?? ['adultos' => 1, 'ninos' => 0, 'adolescentes' => 0, 'infantes' => 0];
            $totalPax = ($pax['adultos'] ?? 1) + ($pax['adolescentes'] ?? 0) + ($pax['ninos'] ?? 0) + ($pax['infantes'] ?? 0);

            $lista[] = [
                'id' => $r->id,
                'uid' => 'rapida_' . $r->id,
                'tipo_registro' => 'rapida',
                'tipo_label' => 'Cotización Rápida',
                'localizador' => 'RAP-' . str_pad($r->id, 5, '0', STR_PAD_LEFT),
                'numero_ficha' => $r->id,
                'fecha' => $r->fecha,
                'asesor' => $r->asesor?->name ?? 'Asesor',
                'cliente' => [
                    'nombre_completo' => is_string($clienteRaw) ? $clienteRaw : ($clienteRaw['nombres'] ?? 'Cliente Rápido'),
                    'documento' => is_array($clienteRaw) ? ($clienteRaw['documento'] ?? '') : '',
                    'telefono' => is_array($clienteRaw) ? ($clienteRaw['telefono'] ?? '') : '',
                    'correo' => is_array($clienteRaw) ? ($clienteRaw['correo'] ?? '') : '',
                ],
                'pax' => array_merge($pax, ['total' => $totalPax]),
                'fechas' => $data['fechas'] ?? [],
                'items' => $data['items'] ?? [],
                'total_usd' => (float)($data['total_estimado'] ?? 0),
                'descuento_monto' => 0,
                'observacion' => $data['observacion'] ?? null,
                'tipo_pago' => 'Total',
            ];
        }

        // Ordenar por fecha descendente
        usort($lista, function ($a, $b) {
            return strtotime($b['fecha']) <=> strtotime($a['fecha']);
        });

        return $lista;
    }
}
