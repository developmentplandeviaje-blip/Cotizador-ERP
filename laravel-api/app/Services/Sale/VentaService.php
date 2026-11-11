<?php

namespace App\Services\Sale;

use App\Models\Finance\MetodoPago;
use App\Models\Finance\PagoVenta;
use App\Models\Finance\PagoVentaDetalle;
use App\Models\Quote\Venta;
use App\Models\Quote\PersonaVenta;
use App\Models\Quote\HotelVenta;
use App\Models\Quote\VueloVenta;
use App\Models\Quote\ExcursionVenta;
use App\Models\Quote\PaqueteVenta;
use App\Models\Quote\TrasladoVenta;
use App\Models\Quote\VehiculoVenta;
use App\Models\Quote\FerryVenta;
use App\Models\Quote\OtroVenta;
use App\Models\Catalog\Hotel;
use App\Models\User;
use App\Services\Catalog\PricingEngine;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class VentaService
{
    public function __construct(private readonly PricingEngine $pricingEngine) {}

    /**
     * Lista ventas según el alcance (agencia, freelancer, aliados) con cálculo financiero y RBAC.
     */
    public function listarVentas(string $scope, User $currentUser, array $filters = []): array
    {
        $isAdminOrLeader = in_array(strtolower($currentUser->level ?? ''), ['admin', 'administrador', 'lider']);

        $query = Venta::with([
            'user.aliado',
            'user.freelancer',
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
            'pagos.metodoPago',
            'pagos.detalles',
        ])->latest('id');

        // Filtrado por alcance de negocio (Agencia, Freelancer, Aliados)
        if ($scope === 'agencia') {
            $query->whereHas('user', function ($q) {
                $q->where('level', '!=', 'Freelancer')
                  ->whereNull('id_freelancer')
                  ->whereNull('id_aliado');
            });

            // Restricción de asesor individual
            if (!$isAdminOrLeader) {
                $query->where('id_user', $currentUser->id);
            }
        } elseif ($scope === 'freelancer') {
            $query->whereHas('user', function ($q) {
                $q->where(function ($sub) {
                    $sub->where('level', 'Freelancer')
                        ->orWhereNotNull('id_freelancer');
                });
            });

            if (!$isAdminOrLeader) {
                $query->where('id_user', $currentUser->id);
            }
        } elseif ($scope === 'aliados') {
            $query->whereHas('user', function ($q) {
                $q->whereNotNull('id_aliado');
            });

            if (!$isAdminOrLeader) {
                if ($currentUser->id_aliado) {
                    // Ver ventas de su misma empresa aliada
                    $query->whereHas('user', function ($q) use ($currentUser) {
                        $q->where('id_aliado', $currentUser->id_aliado);
                    });
                } else {
                    $query->where('id_user', $currentUser->id);
                }
            }
        }

        // Filtro por Estado si se especifica
        if (!empty($filters['estado'])) {
            $query->where('estado', $filters['estado']);
        }

        // Filtro por Aliado específico (para consolidación)
        if (!empty($filters['id_aliado'])) {
            $query->whereHas('user', function ($q) use ($filters) {
                $q->where('id_aliado', $filters['id_aliado']);
            });
        }

        $ventas = $query->get();

        $isFreelancerUser = strtolower($currentUser->level ?? '') === 'freelancer' || !empty($currentUser->id_freelancer);

        $lista = [];
        $totalVentasUSD = 0;
        $totalPagadoUSD = 0;
        $totalSaldoUSD = 0;
        $aliadosResumen = [];

        foreach ($ventas as $v) {
            $calculos = $this->calcularTotalesVenta($v, $isFreelancerUser);
            $totalUSD = $calculos['total_usd'];
            $totalPagado = $calculos['total_pagado'];
            $saldoPendiente = $calculos['saldo_pendiente'];

            $isConfirmada = in_array(strtolower($v->estado ?? ''), ['confirmada', 'venta', 'confirmado']);

            // Métrica Total Facturado USD: suma ÚNICAMENTE ventas confirmadas
            if ($isConfirmada) {
                $totalVentasUSD += $totalUSD;
                $totalSaldoUSD += $saldoPendiente;
            }
            $totalPagadoUSD += $totalPagado;

            $clienteP = $v->clientePrincipal;
            $nombreCliente = trim(($clienteP?->nombres ?? '') . ' ' . ($clienteP?->apellidos ?? ''));
            if (empty($nombreCliente)) {
                $nombreCliente = 'Cliente General';
            }

            $aliadoData = null;
            if ($v->user?->aliado) {
                $al = $v->user->aliado;
                $aliadoData = [
                    'id' => $al->id,
                    'razon_social' => $al->razon_social,
                    'rif' => $al->rif,
                    'contacto_principal' => $al->contacto_principal,
                    'telefono' => $al->telefono,
                    'correo' => $al->correo,
                ];

                if (!isset($aliadosResumen[$al->id])) {
                    $aliadosResumen[$al->id] = [
                        'id' => $al->id,
                        'razon_social' => $al->razon_social,
                        'rif' => $al->rif,
                        'total_ventas_usd' => 0,
                        'total_pagado_usd' => 0,
                        'total_saldo_usd' => 0,
                        'cantidad_ventas' => 0,
                    ];
                }
                if ($isConfirmada) {
                    $aliadosResumen[$al->id]['total_ventas_usd'] += $totalUSD;
                    $aliadosResumen[$al->id]['total_saldo_usd'] += $saldoPendiente;
                }
                $aliadosResumen[$al->id]['total_pagado_usd'] += $totalPagado;
                $aliadosResumen[$al->id]['cantidad_ventas']++;
            }

            $freelancerData = null;
            if ($v->user?->freelancer) {
                $fl = $v->user->freelancer;
                $freelancerData = [
                    'id' => $fl->id,
                    'nombre' => $fl->nombre,
                    'rif' => $fl->rif,
                    'correo' => $fl->correo,
                ];
            }

            // Determinar estado de cobranza
            $estadoPago = 'Sin pagos';
            if ($totalPagado > 0) {
                $estadoPago = $saldoPendiente <= 0.01 ? 'Pagado' : 'Abonado';
            }

            $lista[] = [
                'id' => $v->id,
                'numero_ficha' => $v->numero_ficha,
                'estado' => $v->estado,
                'tipo_pago' => $v->tipo_pago,
                'fecha_creacion' => $v->fecha_creacion,
                'fecha_confirmacion' => $v->fecha_confirmacion,
                'checkin' => $v->checkin ? $v->checkin->format('Y-m-d') : null,
                'checkout' => $v->checkout ? $v->checkout->format('Y-m-d') : null,
                'cliente' => [
                    'nombre_completo' => $nombreCliente,
                    'tipo_documento' => $clienteP?->tipo_documento ?? 'V',
                    'documento' => $clienteP?->documento ?? '',
                    'telefono' => $clienteP?->telefono ?? '',
                    'correo' => $clienteP?->correo ?? '',
                ],
                'asesor' => [
                    'id' => $v->user?->id,
                    'name' => trim(($v->user?->first_name ?? '') . ' ' . ($v->user?->last_name ?? '')) ?: ($v->user?->name ?? 'Asesor'),
                    'email' => $v->user?->email,
                    'level' => $v->user?->level,
                ],
                'aliado' => $aliadoData,
                'freelancer' => $freelancerData,
                'pax_total' => max(1, $v->personas->count()),
                'total_usd' => $totalUSD,
                'total_pagado' => $totalPagado,
                'saldo_pendiente' => $saldoPendiente,
                'estado_pago' => $estadoPago,
                'descuento_monto' => (float)$v->descuento_monto,
                'observacion' => $v->observacion,
                'items' => $calculos['items'],
                'pagos' => $v->pagos->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'numero_transaccion' => $p->numero_transaccion,
                        'tipo_pago' => $p->tipo_pago,
                        'moneda_pago' => $p->moneda_pago,
                        'monto_original' => (float)$p->monto_original,
                        'tasa_cambio' => (float)$p->tasa_cambio,
                        'monto_usd' => (float)$p->monto_usd,
                        'comision_bancaria' => (float)$p->comision_bancaria,
                        'quien_envia' => $p->quien_envia,
                        'metodo' => $p->metodoPago?->nombre ?? 'N/A',
                        'fecha_pago' => $p->fecha_pago ? $p->fecha_pago->format('Y-m-d H:i') : null,
                    ];
                }),
            ];
        }

        return [
            'scope' => $scope,
            'ventas' => $lista,
            'stats' => [
                'total_ventas_usd' => round($totalVentasUSD, 2),
                'total_pagado_usd' => round($totalPagadoUSD, 2),
                'total_saldo_pendiente_usd' => round($totalSaldoUSD, 2),
                'cantidad_ventas' => count($lista),
                'empresas_aliadas_count' => count($aliadosResumen),
                'aliados_resumen' => array_values($aliadosResumen),
            ],
        ];
    }

    /**
     * Calcula los totales financieros y desglosa los ítems contratados de una venta.
     */
    protected function calcularTotalesVenta(Venta $v, bool $hideCosts = false): array
    {
        $totalUSD = 0;
        $items = [];

        foreach ($v->hoteles as $h) {
            $hotelData = $this->pricingEngine->normalizeHotelAdolescentPassengers(
                $h->toArray(),
                $h->hotel?->edad_adolescentes,
                $hideCosts
            );
            $monto = ($hotelData['precio_noche_adulto'] * max(1, (int)$hotelData['adultos'])
                + $hotelData['precio_noche_adolescente'] * (int)($hotelData['adolescente'] ?? 0)
                + $hotelData['precio_noche_nino'] * (int)($hotelData['ninos'] ?? 0)) * max(1, (int)$hotelData['noches']);
            $totalUSD += $monto;
            $items[] = [
                'uid' => 'hotel_' . $h->id,
                'id' => $h->id,
                'tipo' => 'hotel',
                'titulo' => 'Hotel: ' . ($h->hotel?->nombre ?? 'Hotel'),
                'detalle' => "{$hotelData['noches']} noches • Hab: " . ($h->tipo_habitacion ?? 'Estándar'),
                'precio' => $monto,
                'costo' => $hideCosts ? null : (
                    (float)($hotelData['costo_noche_adulto'] ?? 0) * max(1, (int)$hotelData['adultos'])
                    + (float)($hotelData['costo_noche_adolescente'] ?? 0) * (int)($hotelData['adolescente'] ?? 0)
                    + (float)($hotelData['costo_noche_nino'] ?? 0) * (int)($hotelData['ninos'] ?? 0)
                ) * max(1, (int)$hotelData['noches']),
                'data' => array_merge($hotelData, [
                    'id' => $h->id,
                    'id_ubicacion' => $h->hotel?->id_ubicacion,
                    'tipo_habitacion' => $h->tipo_habitacion,
                    'fecha_checkin' => $h->fecha_checkin ? substr($h->fecha_checkin, 0, 10) : null,
                    'fecha_checkout' => $h->fecha_checkout ? substr($h->fecha_checkout, 0, 10) : null,
                ])
            ];
        }

        foreach ($v->vuelos as $vu) {
            $monto = ($vu->precio_adulto * max(1, (int)$vu->adultos)
                + $vu->precio_nino * (int)($vu->ninos ?? 0)
                + $vu->precio_infante * (int)($vu->infantes ?? 0));
            $totalUSD += $monto;
            $items[] = [
                'uid' => 'vuelo_' . $vu->id,
                'id' => $vu->id,
                'tipo' => 'vuelo',
                'titulo' => 'Vuelo: ' . ($vu->aerolinea?->nombre ?? 'Aerolínea'),
                'detalle' => 'Salida: ' . ($vu->fecha_vuelo ?? 'N/A') . ' • Retorno: ' . ($vu->fecha_retorno ?? 'N/A') . ' • ' . ($vu->itinerario ?? 'Ruta aérea'),
                'precio' => $monto,
                'costo' => $hideCosts ? null : ((float)($vu->costo_adulto ?? 0) * max(1, (int)$vu->adultos)),
                'data' => [
                    'id' => $vu->id,
                    'id_aerolinea' => $vu->id_aerolinea,
                    'itinerario' => $vu->itinerario,
                    'fecha_vuelo' => $vu->fecha_vuelo ? substr($vu->fecha_vuelo, 0, 10) : null,
                    'fecha_retorno' => $vu->fecha_retorno ? substr($vu->fecha_retorno, 0, 10) : null,
                    'adultos' => (int)$vu->adultos,
                    'ninos' => (int)($vu->ninos ?? 0),
                    'infantes' => (int)($vu->infantes ?? 0),
                    'precio_adulto' => (float)$vu->precio_adulto,
                    'precio_nino' => (float)($vu->precio_nino ?? 0),
                    'precio_infante' => (float)($vu->precio_infante ?? 0),
                    'costo_adulto' => (float)($vu->costo_adulto ?? 0),
                    'costo_nino' => (float)($vu->costo_nino ?? 0),
                    'costo_infante' => (float)($vu->costo_infante ?? 0),
                ]
            ];
        }

        foreach ($v->traslados as $t) {
            $monto = (float)($t->precio_historico ?? 0);
            $totalUSD += $monto;
            $items[] = [
                'uid' => 'traslado_' . $t->id,
                'id' => $t->id,
                'tipo' => 'traslado',
                'titulo' => 'Traslado: ' . ($t->traslado?->ruta_origen ?? '') . ' - ' . ($t->traslado?->ruta_destino ?? ''),
                'detalle' => 'Salida: ' . ($t->fecha_traslado ?? 'N/A') . ' • Retorno: ' . ($t->fecha_retorno ?? 'N/A'),
                'precio' => $monto,
                'costo' => $hideCosts ? null : (float)($t->costo_historico ?? 0),
                'data' => [
                    'id' => $t->id,
                    'id_traslado' => $t->id_traslado,
                    'fecha_traslado' => $t->fecha_traslado ? substr($t->fecha_traslado, 0, 10) : null,
                    'fecha_retorno' => $t->fecha_retorno ? substr($t->fecha_retorno, 0, 10) : null,
                    'adultos' => (int)($t->adultos ?? 1),
                    'ninos' => (int)($t->ninos ?? 0),
                    'infantes' => (int)($t->infantes ?? 0),
                    'precio' => (float)$t->precio_historico,
                    'costo' => (float)($t->costo_historico ?? 0),
                    'tipo_asignacion' => 'todos',
                ]
            ];
        }

        foreach ($v->excursiones as $e) {
            $monto = ($e->precio_adulto * max(1, (int)$e->adultos) + $e->precio_nino * (int)($e->ninos ?? 0));
            $totalUSD += $monto;
            $items[] = [
                'uid' => 'excursion_' . $e->id,
                'id' => $e->id,
                'tipo' => 'excursion',
                'titulo' => 'Excursión: ' . ($e->excursion?->tipo_excursion ?? 'Excursión'),
                'detalle' => 'Fecha: ' . ($e->fecha ?? 'N/A'),
                'precio' => $monto,
                'costo' => $hideCosts ? null : (float)($e->costo_adulto ?? 0),
                'data' => [
                    'id' => $e->id,
                    'id_excursion' => $e->id_excursion,
                    'fecha' => $e->fecha ? substr($e->fecha, 0, 10) : null,
                    'adultos' => (int)$e->adultos,
                    'ninos' => (int)($e->ninos ?? 0),
                    'infantes' => (int)($e->infantes ?? 0),
                    'precio_adulto' => (float)$e->precio_adulto,
                    'precio_nino' => (float)($e->precio_nino ?? 0),
                    'costo_adulto' => (float)($e->costo_adulto ?? 0),
                    'costo_nino' => (float)($e->costo_nino ?? 0),
                ]
            ];
        }

        foreach ($v->paquetes as $p) {
            $monto = ($p->precio_adulto * max(1, (int)$p->adultos) + $p->precio_nino * (int)($p->ninos ?? 0));
            $totalUSD += $monto;
            $items[] = [
                'uid' => 'paquete_' . $p->id,
                'id' => $p->id,
                'tipo' => 'paquete',
                'titulo' => 'Paquete: ' . ($p->paquete?->paquete ?? 'Paquete'),
                'detalle' => 'Fecha: ' . ($p->fecha ?? 'N/A'),
                'precio' => $monto,
                'costo' => $hideCosts ? null : (float)($p->costo_adulto ?? 0),
                'data' => [
                    'id' => $p->id,
                    'id_paquete' => $p->id_paquete,
                    'fecha' => $p->fecha ? substr($p->fecha, 0, 10) : null,
                    'adultos' => (int)$p->adultos,
                    'ninos' => (int)($p->ninos ?? 0),
                    'infantes' => (int)($p->infantes ?? 0),
                    'precio_adulto' => (float)$p->precio_adulto,
                    'precio_nino' => (float)($p->precio_nino ?? 0),
                    'costo_adulto' => (float)($p->costo_adulto ?? 0),
                    'costo_nino' => (float)($p->costo_nino ?? 0),
                ]
            ];
        }

        foreach ($v->vehiculos as $veh) {
            $monto = ((float)$veh->precio_diario * max(1, (int)$veh->dias) + (float)($veh->deposito_garantia ?? 0));
            $totalUSD += $monto;
            $items[] = [
                'uid' => 'vehiculo_' . $veh->id,
                'id' => $veh->id,
                'tipo' => 'vehiculo',
                'titulo' => 'Vehículo: ' . ($veh->vehiculo?->marca ?? '') . ' ' . ($veh->vehiculo?->modelo ?? ''),
                'detalle' => "{$veh->dias} días de alquiler",
                'precio' => $monto,
                'costo' => $hideCosts ? null : (float)($veh->costo_diario ?? 0),
                'data' => [
                    'id' => $veh->id,
                    'id_vehiculo' => $veh->id_vehiculo,
                    'dias' => (int)$veh->dias,
                    'precio_unitario' => (float)$veh->precio_diario,
                    'costo' => (float)($veh->costo_diario ?? 0),
                    'deposito_garantia' => (float)($veh->deposito_garantia ?? 0),
                ]
            ];
        }

        foreach ($v->ferries as $f) {
            $monto = ($f->precio_adulto * max(1, (int)$f->adultos)
                + $f->precio_nino * (int)($f->ninos ?? 0)
                + $f->precio_vehiculo * (int)($f->vehiculos ?? 0));
            $totalUSD += $monto;
            $items[] = [
                'uid' => 'ferry_' . $f->id,
                'id' => $f->id,
                'tipo' => 'ferry',
                'titulo' => 'Ferry: ' . ($f->ruta ?? 'Ruta marítima'),
                'detalle' => 'Salida: ' . ($f->fecha_salida ?? 'N/A') . ' • Retorno: ' . ($f->fecha_retorno ?? 'N/A') . ' • Itinerario: ' . ($f->itinerario ?? ''),
                'precio' => $monto,
                'costo' => $hideCosts ? null : 0,
                'data' => [
                    'id' => $f->id,
                    'ruta' => $f->ruta,
                    'clase' => 'Turista',
                    'itinerario' => $f->itinerario,
                    'fecha_salida' => $f->fecha_salida ? substr($f->fecha_salida, 0, 10) : null,
                    'fecha_retorno' => $f->fecha_retorno ? substr($f->fecha_retorno, 0, 10) : null,
                    'adultos' => (int)$f->adultos,
                    'ninos' => (int)($f->ninos ?? 0),
                    'infantes' => (int)($f->infantes ?? 0),
                    'vehiculos' => (int)($f->vehiculos ?? 0),
                    'precio_adulto' => (float)$f->precio_adulto,
                    'precio_nino' => (float)($f->precio_nino ?? 0),
                    'precio_infante' => (float)($f->precio_infante ?? 0),
                    'precio_vehiculo' => (float)($f->precio_vehiculo ?? 0),
                ]
            ];
        }

        foreach ($v->otros as $o) {
            $monto = (float)($o->precio ?? 0);
            $totalUSD += $monto;
            $items[] = [
                'uid' => 'otro_' . $o->id,
                'id' => $o->id,
                'tipo' => 'otro',
                'titulo' => 'Servicio: ' . ($o->descripcion ?? 'Otro'),
                'detalle' => 'Fecha: ' . ($o->fecha ?? 'N/A'),
                'precio' => $monto,
                'costo' => $hideCosts ? null : (float)($o->costo ?? 0),
                'data' => [
                    'id' => $o->id,
                    'descripcion' => $o->descripcion,
                    'fecha' => $o->fecha ? substr($o->fecha, 0, 10) : null,
                    'precio' => (float)$o->precio,
                    'costo' => (float)($o->costo ?? 0),
                ]
            ];
        }

        $totalUSD = max(0, $totalUSD - (float)($v->descuento_monto ?? 0));

        $totalPagado = (float)$v->pagos->sum('monto_usd');
        $saldoPendiente = max(0, $totalUSD - $totalPagado);

        return [
            'total_usd' => round($totalUSD, 2),
            'total_pagado' => round($totalPagado, 2),
            'saldo_pendiente' => round($saldoPendiente, 2),
            'items' => $items,
        ];
    }

    /**
     * Confirma una venta / cotización formal.
     */
    public function confirmarVenta(int $id, User $user): Venta
    {
        return DB::transaction(function () use ($id, $user) {
            $venta = Venta::findOrFail($id);

            // Verificar pertenencia si no es admin
            $isAdminOrLeader = in_array(strtolower($user->level ?? ''), ['admin', 'administrador', 'lider']);
            if (!$isAdminOrLeader && $venta->id_user !== $user->id) {
                abort(403, 'No tiene autorización para confirmar esta venta.');
            }

            $venta->estado = 'Confirmada';
            $venta->fecha_confirmacion = now();
            $venta->save();

            return $venta;
        });
    }

    /**
     * Registra un pago/abono multi-moneda con transacción atómica (US-05).
     */
    public function registrarPago(int $id, array $data, User $user): PagoVenta
    {
        return DB::transaction(function () use ($id, $data, $user) {
            $venta = Venta::with(['pagos', 'hoteles', 'vuelos', 'traslados', 'excursiones', 'paquetes', 'vehiculos'])->findOrFail($id);

            // Validar pertenencia si no es admin
            $isAdminOrLeader = in_array(strtolower($user->level ?? ''), ['admin', 'administrador', 'lider']);
            if (!$isAdminOrLeader && $venta->id_user !== $user->id) {
                abort(403, 'No tiene autorización para registrar pagos en esta venta.');
            }

            $montoOriginal = (float)($data['monto_original'] ?? 0);
            if ($montoOriginal <= 0) {
                throw new InvalidArgumentException('El monto del abono debe ser mayor a cero.');
            }

            $monedaPago = strtoupper(trim($data['moneda_pago'] ?? 'USD'));
            $tasaCambio = (float)($data['tasa_cambio'] ?? 1.0);
            if ($tasaCambio <= 0) {
                $tasaCambio = 1.0;
            }

            // Conversión atómica a USD
            if ($monedaPago === 'USD') {
                $montoUSD = $montoOriginal;
                $tasaCambio = 1.0000;
            } else {
                $montoUSD = round($montoOriginal / $tasaCambio, 2);
            }

            // Comisión bancaria/digital si aplica (ej. 3.00% para métodos digitales)
            $comisionBancaria = 0.00;
            $metodo = MetodoPago::find($data['id_metodo'] ?? null);
            if ($metodo && strtolower($metodo->tipo ?? '') === 'digital') {
                $comisionBancaria = round($montoUSD * 0.03, 2);
            }

            // Persistir PagoVenta
            $pago = PagoVenta::create([
                'id_venta' => $venta->id,
                'id_metodo' => $data['id_metodo'],
                'numero_transaccion' => $data['numero_transaccion'] ?? ('TRX-' . strtoupper(substr(uniqid(), -6))),
                'tipo_pago' => $data['tipo_pago'] ?? 'abono_cuota',
                'moneda_pago' => $monedaPago,
                'monto_original' => $montoOriginal,
                'tasa_cambio' => $tasaCambio,
                'monto_usd' => $montoUSD,
                'comision_bancaria' => $comisionBancaria,
                'quien_envia' => $data['quien_envia'] ?? 'Cliente',
                'observacion' => $data['observacion'] ?? null,
                'fecha_pago' => now(),
            ]);

            // Determinar servicio destino para desglose en pago_venta_detalle
            $tipoServicio = 'otro';
            if ($venta->hoteles->count() > 0) $tipoServicio = 'hotel';
            elseif ($venta->vuelos->count() > 0) $tipoServicio = 'vuelo';
            elseif ($venta->paquetes->count() > 0) $tipoServicio = 'paquete';
            elseif ($venta->excursiones->count() > 0) $tipoServicio = 'excursion';
            elseif ($venta->traslados->count() > 0) $tipoServicio = 'traslado';
            elseif ($venta->vehiculos->count() > 0) $tipoServicio = 'vehiculo';

            PagoVentaDetalle::create([
                'id_pago' => $pago->id,
                'tipo_servicio' => $tipoServicio,
                'monto_asignado_usd' => $montoUSD,
            ]);

            // Si la venta estaba en estado 'Cotizacion', se confirma automáticamente al recibir un abono
            if ($venta->estado === 'Cotizacion') {
                $venta->estado = 'Confirmada';
                $venta->fecha_confirmacion = now();
                $venta->save();
            }

            return $pago->load(['metodoPago', 'detalles']);
        });
    }

    /**
     * Corrige un pago/abono ya registrado (monto, método, moneda, referencia, etc.)
     * recalculando su equivalente en USD, comisión y desglose.
     */
    public function actualizarPago(int $idVenta, int $idPago, array $data, User $user): PagoVenta
    {
        return DB::transaction(function () use ($idVenta, $idPago, $data, $user) {
            $venta = Venta::findOrFail($idVenta);

            $isAdminOrLeader = in_array(strtolower($user->level ?? ''), ['admin', 'administrador', 'lider']);
            if (!$isAdminOrLeader && $venta->id_user !== $user->id) {
                abort(403, 'No tiene autorización para modificar pagos de esta venta.');
            }

            $pago = PagoVenta::where('id', $idPago)->where('id_venta', $venta->id)->firstOrFail();

            $montoOriginal = (float)($data['monto_original'] ?? $pago->monto_original);
            if ($montoOriginal <= 0) {
                throw new InvalidArgumentException('El monto del abono debe ser mayor a cero.');
            }

            $monedaPago = strtoupper(trim($data['moneda_pago'] ?? $pago->moneda_pago ?? 'USD'));
            $tasaCambio = (float)($data['tasa_cambio'] ?? $pago->tasa_cambio ?? 1.0);
            if ($tasaCambio <= 0) {
                $tasaCambio = 1.0;
            }

            if ($monedaPago === 'USD') {
                $montoUSD = $montoOriginal;
                $tasaCambio = 1.0000;
            } else {
                $montoUSD = round($montoOriginal / $tasaCambio, 2);
            }

            $idMetodo = $data['id_metodo'] ?? $pago->id_metodo;
            $comisionBancaria = 0.00;
            $metodo = MetodoPago::find($idMetodo);
            if ($metodo && strtolower($metodo->tipo ?? '') === 'digital') {
                $comisionBancaria = round($montoUSD * 0.03, 2);
            }

            $pago->update([
                'id_metodo' => $idMetodo,
                'numero_transaccion' => $data['numero_transaccion'] ?? $pago->numero_transaccion,
                'tipo_pago' => $data['tipo_pago'] ?? $pago->tipo_pago,
                'moneda_pago' => $monedaPago,
                'monto_original' => $montoOriginal,
                'tasa_cambio' => $tasaCambio,
                'monto_usd' => $montoUSD,
                'comision_bancaria' => $comisionBancaria,
                'quien_envia' => $data['quien_envia'] ?? $pago->quien_envia,
                'observacion' => array_key_exists('observacion', $data) ? $data['observacion'] : $pago->observacion,
            ]);

            PagoVentaDetalle::where('id_pago', $pago->id)->update(['monto_asignado_usd' => $montoUSD]);

            return $pago->fresh(['metodoPago', 'detalles']);
        });
    }

    /**
     * Elimina un pago/abono registrado y sus detalles asociados.
     */
    public function eliminarPago(int $idVenta, int $idPago, User $user): bool
    {
        return DB::transaction(function () use ($idVenta, $idPago, $user) {
            $venta = Venta::findOrFail($idVenta);

            $isAdminOrLeader = in_array(strtolower($user->level ?? ''), ['admin', 'administrador', 'lider']);
            if (!$isAdminOrLeader && $venta->id_user !== $user->id) {
                abort(403, 'No tiene autorización para eliminar pagos de esta venta.');
            }

            $pago = PagoVenta::where('id', $idPago)->where('id_venta', $venta->id)->firstOrFail();

            // Eliminar detalles asignados al pago
            PagoVentaDetalle::where('id_pago', $pago->id)->delete();

            // Eliminar el pago
            $pago->delete();

            return true;
        });
    }

    /**
     * Obtiene el detalle completo de una venta.
     */
    public function getDetalleVenta(int $id, User $user): array
    {
        $venta = Venta::with([
            'user.aliado',
            'user.freelancer',
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
            'pagos.metodoPago',
            'pagos.detalles',
        ])->findOrFail($id);

        $isAdminOrLeader = in_array(strtolower($user->level ?? ''), ['admin', 'administrador', 'lider']);
        if (!$isAdminOrLeader && $venta->id_user !== $user->id) {
            abort(403, 'No tiene autorización para visualizar esta venta.');
        }

        $isFreelancer = strtolower($user->level ?? '') === 'freelancer' || !empty($user->id_freelancer);
        $calculos = $this->calcularTotalesVenta($venta, $isFreelancer);

        return [
            'venta' => $venta,
            'totales' => $calculos,
        ];
    }

    /**
     * Actualiza una venta o cotización aplicando reglas condicionales según su estado:
     * - Si estado === 'Cotizacion': Permite modificar pasajeros, fechas, observaciones y reemplazar productos,
     *   o cambiar su estado a 'Confirmada'.
     * - Si estado === 'Confirmada': Bloquea cualquier modificación/adición/eliminación de productos (servicios fijos),
     *   pero permite modificar y agregar pasajeros.
     */
    public function updateVenta(int $id, array $data, User $user): array
    {
        return DB::transaction(function () use ($id, $data, $user) {
            $venta = Venta::findOrFail($id);

            $isAdminOrLeader = in_array(strtolower($user->level ?? ''), ['admin', 'administrador', 'lider']);
            if (!$isAdminOrLeader && $venta->id_user !== $user->id) {
                abort(403, 'No tiene autorización para modificar este registro.');
            }

            $isFreelancer = strtolower($user->level ?? '') === 'freelancer' || !empty($user->id_freelancer);
            $isCotizacion = strtolower($venta->estado ?? '') === 'cotizacion';

            // 1. Actualización de datos generales
            if (isset($data['observacion'])) {
                $venta->observacion = $data['observacion'];
            }

            if ($isCotizacion) {
                if (isset($data['checkin'])) $venta->checkin = $data['checkin'];
                if (isset($data['checkout'])) $venta->checkout = $data['checkout'];
                if (isset($data['descuento_porcentaje'])) $venta->descuento_porcentaje = $data['descuento_porcentaje'];
                if (isset($data['descuento_monto'])) $venta->descuento_monto = $data['descuento_monto'];

                // Si se solicita confirmar la venta formalmente
                if (!empty($data['cambiar_a_confirmada']) || (isset($data['estado']) && strtolower($data['estado']) === 'confirmada')) {
                    $venta->estado = 'Confirmada';
                    $venta->fecha_confirmacion = now();
                }
            }
            $venta->save();

            // 2. Gestión de Pasajeros (Permitida tanto en Cotización como en Venta Confirmada)
            if (isset($data['cliente']) || isset($data['pasajeros'])) {
                PersonaVenta::where('id_venta', $venta->id)->delete();

                if (!empty($data['cliente'])) {
                    $cliente = $data['cliente'];
                    PersonaVenta::create([
                        'id_venta' => $venta->id,
                        'nombres' => $cliente['nombres'] ?? '',
                        'apellidos' => $cliente['apellidos'] ?? '',
                        'tipo_documento' => $cliente['tipo_documento'] ?? 'V',
                        'documento' => $cliente['documento'] ?? '',
                        'edad' => (int)($cliente['edad'] ?? 0),
                        'telefono' => $cliente['telefono'] ?? '',
                        'correo' => $cliente['correo'] ?? '',
                        'principal' => 1,
                    ]);
                }

                if (!empty($data['pasajeros']) && is_array($data['pasajeros'])) {
                    foreach ($data['pasajeros'] as $pasajero) {
                        PersonaVenta::create([
                            'id_venta' => $venta->id,
                            'nombres' => $pasajero['nombres'] ?? '',
                            'apellidos' => $pasajero['apellidos'] ?? '',
                            'tipo_documento' => $pasajero['tipo_documento'] ?? 'V',
                            'documento' => $pasajero['documento'] ?? '',
                            'edad' => (int)($pasajero['edad'] ?? 0),
                            'telefono' => $pasajero['telefono'] ?? '',
                            'correo' => $pasajero['correo'] ?? '',
                            'principal' => 0,
                        ]);
                    }
                }
            }

            // 3. Gestión de Productos: Estrictamente bloqueada en "Venta Confirmada", habilitada en "Cotización"
            if ($isCotizacion && isset($data['items_replace']) && $data['items_replace'] === true) {
                HotelVenta::where('id_venta', $venta->id)->delete();
                VueloVenta::where('id_venta', $venta->id)->delete();
                ExcursionVenta::where('id_venta', $venta->id)->delete();
                PaqueteVenta::where('id_venta', $venta->id)->delete();
                TrasladoVenta::where('id_venta', $venta->id)->delete();
                VehiculoVenta::where('id_venta', $venta->id)->delete();
                FerryVenta::where('id_venta', $venta->id)->delete();
                OtroVenta::where('id_venta', $venta->id)->delete();

                $localizador = $venta->numero_ficha;

                if (!empty($data['hoteles']) && is_array($data['hoteles'])) {
                    foreach ($data['hoteles'] as $h) {
                        $hotel = Hotel::find($h['id_hotel']);
                        $hotelData = $this->pricingEngine->normalizeHotelAdolescentPassengers(
                            $h,
                            $hotel?->edad_adolescentes,
                            $isFreelancer
                        );
                        HotelVenta::create([
                            'id_venta' => $venta->id,
                            'id_hotel' => $hotelData['id_hotel'],
                            'id_habitacion' => $hotelData['id_habitacion'] ?? 0,
                            'tipo' => $hotelData['tipo'] ?? 'Habitacion',
                            'noches' => $hotelData['noches'] ?? 1,
                            'adultos' => $hotelData['adultos'] ?? 0,
                            'adolescente' => $hotelData['adolescente'] ?? 0,
                            'ninos' => $hotelData['ninos'] ?? 0,
                            'infantes' => $hotelData['infantes'] ?? 0,
                            'costo_noche_adulto' => $hotelData['costo_noche_adulto'] ?? 0,
                            'costo_noche_adolescente' => $hotelData['costo_noche_adolescente'] ?? 0,
                            'costo_noche_nino' => $hotelData['costo_noche_nino'] ?? 0,
                            'precio_noche_adulto' => $hotelData['precio_noche_adulto'] ?? 0,
                            'precio_noche_adolescente' => $hotelData['precio_noche_adolescente'] ?? 0,
                            'precio_noche_nino' => $hotelData['precio_noche_nino'] ?? 0,
                            'localizador' => $hotelData['localizador'] ?? $localizador,
                            'fecha_checkin' => $hotelData['fecha_checkin'] ?? $venta->checkin,
                            'fecha_checkout' => $hotelData['fecha_checkout'] ?? $venta->checkout,
                            'estado' => 'Pendiente',
                            'fecha_limite' => $hotelData['fecha_limite'] ?? now()->addDays(2)->toDateTimeString(),
                        ]);
                    }
                }

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
                            'fecha_retorno' => $v['fecha_retorno'] ?? null,
                        ]);
                    }
                }

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
                            'estado' => 'Pendiente',
                        ]);
                    }
                }

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
                        ]);
                    }
                }

                if (!empty($data['traslados']) && is_array($data['traslados'])) {
                    foreach ($data['traslados'] as $t) {
                        TrasladoVenta::create([
                            'id_venta' => $venta->id,
                            'id_traslado' => $t['id_traslado'],
                            'fecha_traslado' => $t['fecha_traslado'] ?? now()->toDateTimeString(),
                            'fecha_retorno' => $t['fecha_retorno'] ?? null,
                            'adultos' => $t['adultos'] ?? 0,
                            'ninos' => $t['ninos'] ?? 0,
                            'infantes' => $t['infantes'] ?? 0,
                            'costo_historico' => $t['costo_historico'] ?? 0,
                            'precio_historico' => $t['precio_historico'] ?? 0,
                        ]);
                    }
                }

                if (!empty($data['vehiculos']) && is_array($data['vehiculos'])) {
                    foreach ($data['vehiculos'] as $veh) {
                        VehiculoVenta::create([
                            'id_venta' => $venta->id,
                            'id_vehiculo' => $veh['id_vehiculo'],
                            'dias' => $veh['dias'] ?? 1,
                            'precio_diario' => $veh['precio_diario'] ?? 0,
                            'costo_diario' => $veh['costo_diario'] ?? 0,
                            'deposito_garantia' => $veh['deposito_garantia'] ?? 0,
                        ]);
                    }
                }

                if (!empty($data['ferries']) && is_array($data['ferries'])) {
                    foreach ($data['ferries'] as $f) {
                        FerryVenta::create([
                            'id_venta' => $venta->id,
                            'ruta' => $f['ruta'] ?? '',
                            'itinerario' => $f['itinerario'] ?? '',
                            'fecha_salida' => $f['fecha_salida'] ?? null,
                            'fecha_retorno' => $f['fecha_retorno'] ?? null,
                            'adultos' => $f['adultos'] ?? 0,
                            'ninos' => $f['ninos'] ?? 0,
                            'vehiculos' => $f['vehiculos'] ?? 0,
                            'precio_adulto' => $f['precio_adulto'] ?? 0,
                            'precio_nino' => $f['precio_nino'] ?? 0,
                            'precio_vehiculo' => $f['precio_vehiculo'] ?? 0,
                        ]);
                    }
                }

                if (!empty($data['otros']) && is_array($data['otros'])) {
                    foreach ($data['otros'] as $o) {
                        OtroVenta::create([
                            'id_venta' => $venta->id,
                            'descripcion' => $o['descripcion'] ?? '',
                            'precio' => $o['precio'] ?? 0,
                            'costo' => $o['costo'] ?? 0,
                            'fecha' => $o['fecha'] ?? now()->toDateTimeString(),
                        ]);
                    }
                }
            }

            return $this->getDetalleVenta($venta->id, $user);
        });
    }
}
