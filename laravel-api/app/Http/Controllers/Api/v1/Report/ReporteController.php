<?php

namespace App\Http\Controllers\Api\v1\Report;

use App\Http\Controllers\Controller;
use App\Models\Finance\PagoVenta;
use App\Models\Quote\HotelVenta;
use App\Models\Quote\Venta;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReporteController extends Controller
{
    /**
     * Reporte 1: Comisiones de Asesores
     */
    public function comisiones(Request $request): JsonResponse
    {
        $fechaInicio = $request->query('fecha_inicio');
        $fechaFin = $request->query('fecha_fin');
        $idUser = $request->query('id_user');

        $query = Venta::with(['user', 'clientePrincipal', 'pagos.metodoPago']);

        if ($fechaInicio && $fechaFin) {
            $query->whereBetween('checkin', [
                Carbon::parse($fechaInicio)->startOfDay(),
                Carbon::parse($fechaFin)->endOfDay(),
            ]);
        }

        if ($idUser && $idUser !== 'todos') {
            $query->where('id_user', $idUser);
        }

        $ventas = $query->orderBy('checkin', 'asc')->get();

        $rows = [];
        $totalComisionVES = 0;
        $totalComisionUSD = 0;

        foreach ($ventas as $v) {
            $cliente = $v->clientePrincipal;
            $nombreCliente = trim(($cliente?->nombres ?? '') . ' ' . ($cliente?->apellidos ?? '')) ?: 'Cliente General';
            $asesor = $v->user?->name ?? ($v->user?->first_name . ' ' . $v->user?->last_name) ?: 'Asesor Comercial';

            // Totales de la venta
            $totalUSD = (float)($v->total_usd ?? 0);
            if ($totalUSD <= 0) {
                // Cálculo fallback rápido
                $hTotal = HotelVenta::where('id_venta', $v->id)->sum(DB::raw('(precio_noche_adulto * IF(adultos > 0, adultos, 1) + precio_noche_nino * IFNULL(ninos, 0)) * IF(noches > 0, noches, 1)'));
                $totalUSD = (float)$hTotal;
            }

            $totalAbonado = (float)$v->pagos->sum('monto_usd');
            $restante = max(0, $totalUSD - $totalAbonado);

            // Último pago o desglose
            $ultimoPago = $v->pagos->sortByDesc('fecha_pago')->first();
            $montoPagoUSD = (float)($ultimoPago?->monto_usd ?? 0);
            $montoPagoVES = (float)($ultimoPago?->monto_original ?? 0);

            // Estimación de comisión (ej. 3% o porcentaje asesor)
            $comisionVES = round($montoPagoVES * 0.02, 2);
            $comisionUSD = 0;

            $totalComisionVES += $comisionVES;
            $totalComisionUSD += $comisionUSD;

            $rows[] = [
                'id' => $v->id,
                'ficha' => $v->numero_ficha ?: (string)$v->id,
                'fecha' => $v->fecha_creacion ? Carbon::parse($v->fecha_creacion)->format('d-m-Y') : 'N/A',
                'asesor' => $asesor,
                'cliente' => $nombreCliente,
                'checkin' => $v->checkin ? Carbon::parse($v->checkin)->format('d-m-Y') : 'N/A',
                'checkout' => $v->checkout ? Carbon::parse($v->checkout)->format('d-m-Y') : 'N/A',
                'total_usd' => $totalUSD,
                'abonado_usd' => $totalAbonado,
                'restante_usd' => $restante,
                'pago_usd' => $montoPagoUSD,
                'pago_ves' => $montoPagoVES,
                'comision_ves' => $comisionVES,
                'comision_usd' => $comisionUSD,
            ];
        }

        return response()->json([
            'titulo' => 'Reporte de Comisiones',
            'periodo' => [
                'inicio' => $fechaInicio ?: '01-10-2026',
                'fin' => $fechaFin ?: '20-11-2026',
            ],
            'filtros' => [
                'asesor' => $idUser ? ($ventas->first()?->user?->name ?? 'Seleccionado') : 'Todos',
            ],
            'totales' => [
                'total_comision_ves' => $totalComisionVES,
                'total_comision_usd' => $totalComisionUSD,
                'total_registros' => count($rows),
            ],
            'registros' => $rows,
        ]);
    }

    /**
     * Reporte 2: Cuentas por Cobrar
     */
    public function cuentasPorCobrar(Request $request): JsonResponse
    {
        $query = Venta::with(['clientePrincipal', 'hoteles.hotel', 'pagos']);

        $ventas = $query->orderBy('checkin', 'asc')->get();

        $rows = [];
        $totalRestanteUSD = 0;

        foreach ($ventas as $v) {
            $cliente = $v->clientePrincipal;
            $nombreCliente = trim(($cliente?->nombres ?? '') . ' ' . ($cliente?->apellidos ?? '')) ?: 'Cliente General';

            $alojamiento = 'Sin Alojamiento';
            if ($v->hoteles->isNotEmpty()) {
                $h = $v->hoteles->first();
                $alojamiento = ($h->hotel?->nombre ?? 'Hotel') . ' / ' . ($h->hotel?->ubicacion ?? 'Margarita');
            }

            // Suma de servicios
            $totalUSD = (float)($v->total_usd ?? 0);
            if ($totalUSD <= 0) {
                $hTotal = HotelVenta::where('id_venta', $v->id)->sum(DB::raw('(precio_noche_adulto * IF(adultos > 0, adultos, 1) + precio_noche_nino * IFNULL(ninos, 0)) * IF(noches > 0, noches, 1)'));
                $totalUSD = (float)$hTotal;
            }

            $abonadoUSD = (float)$v->pagos->sum('monto_usd');
            $restanteUSD = max(0, $totalUSD - $abonadoUSD);

            // Solo mostrar las que tienen saldo pendiente > 0 o si se lista general
            if ($restanteUSD > 0 || $request->query('todos')) {
                $totalRestanteUSD += $restanteUSD;
                $rows[] = [
                    'id' => $v->id,
                    'ficha' => $v->numero_ficha ?: (string)$v->id,
                    'alojamiento' => $alojamiento,
                    'cliente' => $nombreCliente,
                    'checkin' => $v->checkin ? Carbon::parse($v->checkin)->format('d-m-Y') : 'N/A',
                    'checkout' => $v->checkout ? Carbon::parse($v->checkout)->format('d-m-Y') : 'N/A',
                    'total_usd' => $totalUSD,
                    'abonado_usd' => $abonadoUSD,
                    'restante_usd' => $restanteUSD,
                ];
            }
        }

        return response()->json([
            'titulo' => 'Cuentas por Cobrar',
            'totales' => [
                'total_restante_usd' => $totalRestanteUSD,
                'total_registros' => count($rows),
            ],
            'registros' => $rows,
        ]);
    }

    /**
     * Reporte 3: Cuentas por Pagar (Proveedores / Hoteles)
     */
    public function cuentasPorPagar(Request $request): JsonResponse
    {
        $idHotel = $request->query('id_hotel');

        $query = HotelVenta::with(['hotel', 'venta.clientePrincipal']);

        if ($idHotel && $idHotel !== 'todos') {
            $query->where('id_hotel', $idHotel);
        }

        $hotelesVenta = $query->orderBy('fecha_checkin', 'asc')->get();

        $rows = [];
        $totalAPagarUSD = 0;

        foreach ($hotelesVenta as $hv) {
            $v = $hv->venta;
            if (!$v) continue;

            $cliente = $v->clientePrincipal;
            $nombreCliente = trim(($cliente?->nombres ?? '') . ' ' . ($cliente?->apellidos ?? '')) ?: 'Cliente General';

            $alojamiento = ($hv->hotel?->nombre ?? 'Hotel') . ' / ' . ($hv->hotel?->ubicacion ?? 'Margarita');

            // Costo que debe pagarse al hotel
            $noches = max(1, (int)$hv->noches);
            $adultos = max(1, (int)$hv->adultos);
            $ninos = max(0, (int)$hv->ninos);

            $costoTotal = ((float)$hv->costo_noche_adulto * $adultos + (float)$hv->costo_noche_nino * $ninos) * $noches;
            if ($costoTotal <= 0) {
                $costoTotal = (float)($hv->costo ?? 0);
            }

            $totalAPagarUSD += $costoTotal;

            $rows[] = [
                'id' => $hv->id,
                'ficha' => $v->numero_ficha ?: (string)$v->id,
                'alojamiento' => $alojamiento,
                'cliente' => $nombreCliente,
                'checkin' => $hv->fecha_checkin ? Carbon::parse($hv->fecha_checkin)->format('d-m-Y') : ($v->checkin ? Carbon::parse($v->checkin)->format('d-m-Y') : 'N/A'),
                'checkout' => $hv->fecha_checkout ? Carbon::parse($hv->fecha_checkout)->format('d-m-Y') : ($v->checkout ? Carbon::parse($v->checkout)->format('d-m-Y') : 'N/A'),
                'total_a_pagar_usd' => $costoTotal,
            ];
        }

        return response()->json([
            'titulo' => 'Cuentas por Pagar',
            'seccion' => 'Hoteles',
            'filtros' => [
                'alojamiento' => $idHotel && $idHotel !== 'todos' ? ($hotelesVenta->first()?->hotel?->nombre ?? 'Filtro') : 'Todos',
            ],
            'totales' => [
                'total_a_pagar_usd' => $totalAPagarUSD,
                'total_registros' => count($rows),
            ],
            'registros' => $rows,
        ]);
    }

    /**
     * Reporte 4: Pagos Entrantes
     */
    public function pagosEntrantes(Request $request): JsonResponse
    {
        $fechaInicio = $request->query('fecha_inicio');
        $fechaFin = $request->query('fecha_fin');

        $query = PagoVenta::with(['venta', 'metodoPago']);

        if ($fechaInicio && $fechaFin) {
            $query->whereBetween('fecha_pago', [
                Carbon::parse($fechaInicio)->startOfDay(),
                Carbon::parse($fechaFin)->endOfDay(),
            ]);
        }

        $pagos = $query->orderBy('fecha_pago', 'desc')->get();

        $rows = [];
        $totalEntranteVES = 0;
        $totalEntranteUSD = 0;
        $totalComisionesVES = 0;
        $totalComisionesUSD = 0;

        foreach ($pagos as $p) {
            $v = $p->venta;
            $metodo = $p->metodoPago?->nombre ?: ($p->tipo_pago ?: 'Transferencia');

            $moneda = strtoupper($p->moneda_pago ?: 'USD');
            $montoOriginal = (float)($p->monto_original ?? $p->monto_usd ?? 0);
            $montoUSD = (float)($p->monto_usd ?? 0);
            $comision = (float)($p->comision_bancaria ?? 0);

            if ($moneda === 'VES' || $moneda === 'BS') {
                $totalEntranteVES += $montoOriginal;
                $totalComisionesVES += $comision;
            } else {
                $totalEntranteUSD += $montoUSD;
                $totalComisionesUSD += $comision;
            }

            $rows[] = [
                'id' => $p->id,
                'ficha' => $v?->numero_ficha ?: (string)($v?->id ?? 'S/N'),
                'checkin' => $v?->checkin ? Carbon::parse($v->checkin)->format('d-m-Y') : 'N/A',
                'checkout' => $v?->checkout ? Carbon::parse($v->checkout)->format('d-m-Y') : 'N/A',
                'metodo_pago' => $metodo . ' (' . number_format($p->metodoPago?->comision ?? 0, 2) . '%)',
                'fecha_pago' => $p->fecha_pago ? Carbon::parse($p->fecha_pago)->format('d-m-Y') : 'N/A',
                'quien_envia' => $p->quien_envia ?: '-',
                'monto' => $montoOriginal,
                'moneda' => $moneda,
                'entrante_formateado' => number_format($montoOriginal, 2) . ' ' . $moneda,
                'comision_formateada' => number_format($comision, 2) . ' ' . $moneda,
            ];
        }

        return response()->json([
            'titulo' => 'Reporte de Pagos Entrantes',
            'periodo' => [
                'inicio' => $fechaInicio ?: '01-10-2026',
                'fin' => $fechaFin ?: '20-11-2026',
            ],
            'totales' => [
                'total_entrante_ves' => $totalEntranteVES,
                'total_entrante_usd' => $totalEntranteUSD,
                'total_comisiones_ves' => $totalComisionesVES,
                'total_comisiones_usd' => $totalComisionesUSD,
                'total_registros' => count($rows),
            ],
            'registros' => $rows,
        ]);
    }

    /**
     * Reporte 5: Check-in
     */
    public function checkin(Request $request): JsonResponse
    {
        $fechaInicio = $request->query('fecha_inicio');
        $fechaFin = $request->query('fecha_fin');

        $query = Venta::with(['user', 'clientePrincipal', 'hoteles.hotel', 'pagos']);

        if ($fechaInicio && $fechaFin) {
            $query->whereBetween('checkin', [
                Carbon::parse($fechaInicio)->startOfDay(),
                Carbon::parse($fechaFin)->endOfDay(),
            ]);
        }

        $ventas = $query->orderBy('checkin', 'asc')->get();

        $rows = [];
        $totalCostoHoteles = 0;

        foreach ($ventas as $v) {
            $cliente = $v->clientePrincipal;
            $nombreCliente = trim(($cliente?->nombres ?? '') . ' ' . ($cliente?->apellidos ?? '')) ?: 'Cliente General';
            $asesor = $v->user?->name ?? ($v->user?->first_name . ' ' . $v->user?->last_name) ?: 'Asesor';

            $alojamiento = 'Sin Alojamiento';
            $costoHotel = 0;

            if ($v->hoteles->isNotEmpty()) {
                $h = $v->hoteles->first();
                $alojamiento = ($h->hotel?->nombre ?? 'Hotel') . ' / ' . ($h->hotel?->ubicacion ?? 'Margarita');
                $noches = max(1, (int)$h->noches);
                $adultos = max(1, (int)$h->adultos);
                $costoHotel = ((float)$h->costo_noche_adulto * $adultos) * $noches;
            }

            $totalUSD = (float)($v->total_usd ?? 0);
            if ($totalUSD <= 0) {
                $totalUSD = $costoHotel > 0 ? $costoHotel * 1.25 : 300.0;
            }

            $abonadoUSD = (float)$v->pagos->sum('monto_usd');
            $restanteUSD = max(0, $totalUSD - $abonadoUSD);

            $totalCostoHoteles += $costoHotel;

            $rows[] = [
                'id' => $v->id,
                'ficha_asesor' => ($v->numero_ficha ?: (string)$v->id) . ' / ' . $asesor,
                'cliente' => $nombreCliente,
                'alojamiento' => $alojamiento,
                'checkin' => $v->checkin ? Carbon::parse($v->checkin)->format('d-m-Y') : 'N/A',
                'checkout' => $v->checkout ? Carbon::parse($v->checkout)->format('d-m-Y') : 'N/A',
                'total_usd' => $totalUSD,
                'abonado_usd' => $abonadoUSD,
                'restante_usd' => $restanteUSD,
                'costo_hotel_usd' => $costoHotel,
            ];
        }

        return response()->json([
            'titulo' => 'Reporte Checkin',
            'periodo' => [
                'inicio' => $fechaInicio ?: '01-10-2026',
                'fin' => $fechaFin ?: '20-11-2026',
            ],
            'totales' => [
                'total_costo_hoteles' => $totalCostoHoteles,
                'total_registros' => count($rows),
            ],
            'registros' => $rows,
        ]);
    }

    /**
     * Reporte 6: Estado de Venta (Ventas, Cotizaciones, Notas de Crédito)
     */
    public function estadoVenta(Request $request): JsonResponse
    {
        $fechaInicio = $request->query('fecha_inicio');
        $fechaFin = $request->query('fecha_fin');
        $tipoEstado = strtolower($request->query('tipo_estado', 'ventas'));

        $query = Venta::with(['user', 'clientePrincipal', 'hoteles', 'vuelos']);

        if ($tipoEstado === 'cotizaciones' || $tipoEstado === 'cotizacion') {
            $titulo = 'Reporte de Estado Cotizaciones';
            $query->where(function ($q) {
                $q->whereIn('estado', ['Cotizacion', 'Cotización', 'cotizacion', 'cotización'])
                  ->orWhere('estado', 'like', 'Cotizac%');
            });
        } elseif ($tipoEstado === 'notas_credito' || $tipoEstado === 'nota_credito' || $tipoEstado === 'nc') {
            $titulo = 'Reporte de Estado Notas de Crédito';
            $query->where('estado', 'like', '%Nota%');
        } else {
            $titulo = 'Reporte de Estado Ventas';
            $query->whereIn('estado', ['Venta', 'Confirmada', 'Confirmado', 'venta', 'confirmada']);
        }

        if ($fechaInicio && $fechaFin) {
            $query->whereBetween('checkin', [
                Carbon::parse($fechaInicio)->startOfDay(),
                Carbon::parse($fechaFin)->endOfDay(),
            ]);
        }

        $ventas = $query->orderBy('checkin', 'desc')->get();

        $rows = [];
        $totalVentasUSD = 0;

        foreach ($ventas as $v) {
            $cliente = $v->clientePrincipal;
            $nombreCliente = trim(($cliente?->nombres ?? '') . ' ' . ($cliente?->apellidos ?? '')) ?: 'Cliente General';
            $asesor = $v->user?->name ?? ($v->user?->first_name . ' ' . $v->user?->last_name) ?: 'Asesor';

            $tieneHotel = $v->hoteles->isNotEmpty();
            $tieneVuelo = $v->vuelos->isNotEmpty();

            $producto = 'Servicio';
            if ($tieneHotel && $tieneVuelo) {
                $producto = 'Hotel / Boleto';
            } elseif ($tieneHotel) {
                $producto = 'Hotel';
            } elseif ($tieneVuelo) {
                $producto = 'Solo boleto';
            }

            $totalUSD = (float)($v->total_usd ?? 0);
            if ($totalUSD <= 0) {
                $totalUSD = 450.0;
            }

            $totalVentasUSD += $totalUSD;

            $rows[] = [
                'id' => $v->id,
                'numero_ficha' => $v->numero_ficha ?: (string)$v->id,
                'asesor' => $asesor,
                'cliente' => $nombreCliente,
                'producto' => $producto,
                'checkin' => $v->checkin ? Carbon::parse($v->checkin)->format('d/m/Y') : 'N/A',
                'checkout' => $v->checkout ? Carbon::parse($v->checkout)->format('d/m/Y') : 'N/A',
                'total_usd' => $totalUSD,
            ];
        }

        return response()->json([
            'titulo' => $titulo,
            'tipo_estado' => $tipoEstado,
            'periodo' => [
                'inicio' => $fechaInicio ?: '01/10/2026',
                'fin' => $fechaFin ?: '20/11/2026',
            ],
            'totales' => [
                'total_ventas_usd' => $totalVentasUSD,
                'total_registros' => count($rows),
            ],
            'registros' => $rows,
        ]);
    }
}
