<?php

namespace App\Http\Controllers\Api\v1\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Meses en español con abreviación de 3 letras.
     */
    private const MESES_ES = [
        1 => 'Ene', 2 => 'Feb', 3 => 'Mar', 4 => 'Abr',
        5 => 'May', 6 => 'Jun', 7 => 'Jul', 8 => 'Ago',
        9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Dic'
    ];

    /**
     * Obtiene el Top 3 de vendedores (Asesores y Líderes) por abonos en USD
     * durante la semana anterior (ciclo de Viernes a Jueves).
     */
    public function topVentas(Request $request): JsonResponse
    {
        $now = Carbon::now();

        // Si se proveen fechas específicas por query params
        if ($request->filled('fecha_inicio') && $request->filled('fecha_fin')) {
            $startDate = Carbon::parse($request->input('fecha_inicio'))->startOfDay();
            $endDate = Carbon::parse($request->input('fecha_fin'))->endOfDay();
        } else {
            // Semana solicitada por defecto: 13 al 20 de noviembre de 2026
            if ($now->year == 2026 && $now->month == 11) {
                $startDate = Carbon::create(2026, 11, 13)->startOfDay();
                $endDate = Carbon::create(2026, 11, 20)->endOfDay();
            } else {
                // Para otros periodos: ciclo semanal cerrado de viernes a jueves
                if ($now->isFriday()) {
                    $currentCycleStart = $now->copy()->startOfDay();
                } else {
                    $currentCycleStart = $now->copy()->previous(Carbon::FRIDAY)->startOfDay();
                }
                $startDate = $currentCycleStart->copy()->subWeek()->startOfDay();
                $endDate = $currentCycleStart->copy()->subDay()->endOfDay();
            }
        }

        // Consultar los 3 primeros vendedores con mayor cantidad de USD abonados
        // Regla: Si es EUR se suma 1:1 como USD. Si es USD se toma monto_original. Si es otra moneda, monto_usd.
        // Líderes también cuentan como asesores.
        $topSellers = DB::table('pago_venta as p')
            ->join('ventas as v', 'p.id_venta', '=', 'v.id')
            ->join('user as u', 'v.id_user', '=', 'u.id')
            ->whereBetween('p.fecha_pago', [$startDate, $endDate])
            ->where(function ($q) {
                $q->whereRaw("LOWER(u.level) LIKE '%asesor%'")
                  ->orWhereRaw("LOWER(u.level) LIKE '%lider%'")
                  ->orWhereRaw("LOWER(u.level) LIKE '%líder%'");
            })
            ->select([
                'u.id as user_id',
                DB::raw("CONCAT(TRIM(u.first_name), ' ', TRIM(u.last_name)) as name"),
                'u.level',
                DB::raw("ROUND(SUM(
                    CASE 
                        WHEN p.moneda_pago = 'EUR' THEN COALESCE(p.monto_original, p.monto_usd, 0)
                        WHEN p.moneda_pago = 'USD' THEN COALESCE(p.monto_original, p.monto_usd, 0)
                        ELSE COALESCE(p.monto_usd, 0)
                    END
                ), 2) as total_usd")
            ])
            ->groupBy('u.id', 'u.first_name', 'u.last_name', 'u.level')
            ->orderByDesc('total_usd')
            ->limit(3)
            ->get();

        $maxTotal = (float) ($topSellers->first()?->total_usd ?? 0);

        $items = $topSellers->map(function ($seller) use ($maxTotal) {
            $total = (float) $seller->total_usd;
            // Proporción con respecto al máximo (tope 95% para estética visual)
            $percentage = $maxTotal > 0 ? (int) round(($total / $maxTotal) * 95) : 0;
            if ($total > 0 && $percentage < 15) {
                $percentage = 15;
            }

            return [
                'user_id' => $seller->user_id,
                'name' => $seller->name,
                'level' => $seller->level,
                'total' => $total,
                'amount' => 'USD ' . number_format(round($total), 0, '', ''),
                'percentage' => $percentage,
            ];
        });

        // Formato de fechas para el DateFilterPill: DD • Mes (ej. "28 • Ago | 04 • Sep")
        $startDay = sprintf('%02d', $startDate->day);
        $startMonth = self::MESES_ES[$startDate->month] ?? $startDate->format('M');
        $startLabel = "{$startDay} • {$startMonth}";

        $endDay = sprintf('%02d', $endDate->day);
        $endMonth = self::MESES_ES[$endDate->month] ?? $endDate->format('M');
        $endLabel = "{$endDay} • {$endMonth}";

        $rangoFecha = "{$startLabel} | {$endLabel}";

        // Identificar contexto del usuario autenticado
        $currentUser = $request->user();
        $userLevel = strtolower(trim($currentUser?->level ?? ''));
        $isFreelancer = $userLevel === 'freelancer' || !empty($currentUser?->id_freelancer);
        $isAliado = $userLevel === 'aliado' || !empty($currentUser?->id_aliado);

        // Roles oficiales de la agencia:
        // Asesores, líderes, operativo, tarifas, contabilidad y administración
        $rolesAgencia = [
            'asesor', 'lider', 'líder', 'operativo', 'tarifas', 
            'contabilidad', 'administracion', 'administración'
        ];

        // Estadísticas de Clientes (Frecuentes vs Nuevos)
        // Se evalúa la concurrencia de nombres de clientes/pasajeros (pax) en el sistema:
        // - Frecuentes: Clientes cuyo nombre completo tiene más de una concurrencia histórica (total_ocurrencias > 1)
        // - Nuevos: Clientes cuyo nombre completo solo se ha registrado una vez (total_ocurrencias = 1)
        // - Si la sesión es de un freelancer o aliado, muestra sus clientes propios
        $clientesQuery = "
            SELECT 
                COUNT(DISTINCT CASE WHEN h.total_ocurrencias > 1 THEN h.nombre_key END) as frecuentes,
                COUNT(DISTINCT CASE WHEN h.total_ocurrencias = 1 THEN h.nombre_key END) as nuevos,
                COUNT(DISTINCT h.nombre_key) as total
            FROM persona_venta p
            JOIN ventas v ON p.id_venta = v.id
            LEFT JOIN user u ON v.id_user = u.id
            JOIN (
                SELECT 
                    CONCAT(TRIM(LOWER(nombres)), ' ', TRIM(LOWER(apellidos))) as nombre_key,
                    COUNT(*) as total_ocurrencias
                FROM persona_venta
                WHERE nombres IS NOT NULL AND TRIM(nombres) != ''
                GROUP BY CONCAT(TRIM(LOWER(nombres)), ' ', TRIM(LOWER(apellidos)))
            ) h ON CONCAT(TRIM(LOWER(p.nombres)), ' ', TRIM(LOWER(p.apellidos))) = h.nombre_key
            WHERE v.fecha_creacion BETWEEN ? AND ?
        ";

        $clientesParams = [$startDate, $endDate];

        if ($isFreelancer && $currentUser) {
            $clientesQuery .= " AND v.id_user = ? ";
            $clientesParams[] = $currentUser->id;
        } elseif ($isAliado && $currentUser) {
            if (!empty($currentUser->id_aliado)) {
                $clientesQuery .= " AND (u.id_aliado = ? OR v.id_user = ?) ";
                $clientesParams[] = $currentUser->id_aliado;
                $clientesParams[] = $currentUser->id;
            } else {
                $clientesQuery .= " AND v.id_user = ? ";
                $clientesParams[] = $currentUser->id;
            }
        }

        $clientesStats = DB::selectOne($clientesQuery, $clientesParams);
        $clientesFrecuentes = (int) ($clientesStats->frecuentes ?? 0);
        $clientesNuevos = (int) ($clientesStats->nuevos ?? 0);

        // Estadísticas de Ventas (Confirmadas vs Anuladas) para el periodo semanal:
        // - Confirmadas: Fichas que cambiaron a estado de venta (confirmadas)
        // - Anuladas: Fichas canceladas o eliminadas generadas por usuarios de la agencia (asesores, líderes, operativo, tarifas, contabilidad y administración),
        //             quedadas en cotización o nota de crédito (excluyendo administradores).
        // - Si la sesión es de un freelancer o aliado, muestra exclusivamente las fichas propias
        $ventasQuery = DB::table('ventas as v')
            ->leftJoin('user as u', 'v.id_user', '=', 'u.id')
            ->whereBetween('v.fecha_creacion', [$startDate, $endDate]);

        if ($isFreelancer && $currentUser) {
            // Sesión Freelancer: muestra sus propias fichas
            $ventasStats = (clone $ventasQuery)
                ->where('v.id_user', $currentUser->id)
                ->selectRaw("
                    COUNT(CASE WHEN LOWER(v.estado) = 'venta' THEN 1 END) as confirmadas,
                    COUNT(CASE WHEN LOWER(v.estado) != 'venta' THEN 1 END) as anuladas
                ")
                ->first();
        } elseif ($isAliado && $currentUser) {
            // Sesión Aliado: muestra las propias de su alianza/usuario
            $ventasStats = (clone $ventasQuery)
                ->where(function ($q) use ($currentUser) {
                    if (!empty($currentUser->id_aliado)) {
                        $q->where('u.id_aliado', $currentUser->id_aliado)
                          ->orWhere('v.id_user', $currentUser->id);
                    } else {
                        $q->where('v.id_user', $currentUser->id);
                    }
                })
                ->selectRaw("
                    COUNT(CASE WHEN LOWER(v.estado) = 'venta' THEN 1 END) as confirmadas,
                    COUNT(CASE WHEN LOWER(v.estado) != 'venta' THEN 1 END) as anuladas
                ")
                ->first();
        } else {
            // Sesión de Agencia (Administrador, Lider, Asesor, Operativo, Tarifas, Contabilidad, Administración)
            // Anuladas: Fichas canceladas, eliminadas o en cotización/nota de crédito generadas por usuarios de la agencia
            $rolesIn = "'" . implode("','", $rolesAgencia) . "'";
            $ventasStats = (clone $ventasQuery)
                ->selectRaw("
                    COUNT(CASE 
                        WHEN LOWER(v.estado) = 'venta' THEN 1 
                    END) as confirmadas,
                    COUNT(CASE 
                        WHEN LOWER(v.estado) != 'venta' 
                         AND (
                             LOWER(COALESCE(u.level, '')) IN ({$rolesIn})
                             OR (u.id_freelancer IS NULL AND u.id_aliado IS NULL AND LOWER(COALESCE(u.level, '')) NOT IN ('admin', 'administrador'))
                         )
                        THEN 1 
                    END) as anuladas
                ")
                ->first();
        }

        $ventasConfirmadas = (int) ($ventasStats->confirmadas ?? 0);
        $ventasAnuladas = (int) ($ventasStats->anuladas ?? 0);

        // ==========================================
        // SPEED: Totales abonados (Anual, Mensual, Semanal) y Metas
        // Metas: Anual = 540,000 USD | Mensual = 45,000 USD | Semanal = 10,000 USD
        // ==========================================
        $yearStart = $startDate->copy()->startOfYear();
        $yearEnd = $startDate->copy()->endOfYear();

        $monthStart = $startDate->copy()->startOfMonth();
        $monthEnd = $startDate->copy()->endOfMonth();

        $weekStart = $startDate->copy()->startOfDay();
        $weekEnd = $endDate->copy()->endOfDay();

        $outerStart = $yearStart->copy()->min($weekStart)->toDateTimeString();
        $outerEnd = $yearEnd->copy()->max($weekEnd)->toDateTimeString();

        $speedUserCondition = "";
        $speedParams = [
            $yearStart->toDateTimeString(), $yearEnd->toDateTimeString(),
            $monthStart->toDateTimeString(), $monthEnd->toDateTimeString(),
            $weekStart->toDateTimeString(), $weekEnd->toDateTimeString(),
            $outerStart, $outerEnd
        ];

        if ($isFreelancer && $currentUser) {
            $speedUserCondition = " AND v.id_user = ? ";
            $speedParams[] = $currentUser->id;
        } elseif ($isAliado && $currentUser) {
            if (!empty($currentUser->id_aliado)) {
                $speedUserCondition = " AND (u.id_aliado = ? OR v.id_user = ?) ";
                $speedParams[] = $currentUser->id_aliado;
                $speedParams[] = $currentUser->id;
            } else {
                $speedUserCondition = " AND v.id_user = ? ";
                $speedParams[] = $currentUser->id;
            }
        }

        $speedStats = DB::selectOne("
            SELECT 
                ROUND(SUM(CASE 
                    WHEN p.fecha_pago BETWEEN ? AND ? THEN 
                        CASE 
                            WHEN p.moneda_pago = 'EUR' THEN COALESCE(p.monto_original, p.monto_usd, 0)
                            WHEN p.moneda_pago = 'USD' THEN COALESCE(p.monto_original, p.monto_usd, 0)
                            ELSE COALESCE(p.monto_usd, 0)
                        END
                    ELSE 0 
                END), 2) as total_anual,
                ROUND(SUM(CASE 
                    WHEN p.fecha_pago BETWEEN ? AND ? THEN 
                        CASE 
                            WHEN p.moneda_pago = 'EUR' THEN COALESCE(p.monto_original, p.monto_usd, 0)
                            WHEN p.moneda_pago = 'USD' THEN COALESCE(p.monto_original, p.monto_usd, 0)
                            ELSE COALESCE(p.monto_usd, 0)
                        END
                    ELSE 0 
                END), 2) as total_mensual,
                ROUND(SUM(CASE 
                    WHEN p.fecha_pago BETWEEN ? AND ? THEN 
                        CASE 
                            WHEN p.moneda_pago = 'EUR' THEN COALESCE(p.monto_original, p.monto_usd, 0)
                            WHEN p.moneda_pago = 'USD' THEN COALESCE(p.monto_original, p.monto_usd, 0)
                            ELSE COALESCE(p.monto_usd, 0)
                        END
                    ELSE 0 
                END), 2) as total_semanal
            FROM pago_venta p
            JOIN ventas v ON p.id_venta = v.id
            LEFT JOIN user u ON v.id_user = u.id
            WHERE p.fecha_pago BETWEEN ? AND ?
            {$speedUserCondition}
        ", $speedParams);

        $totalAnual = (float) ($speedStats->total_anual ?? 0);
        $totalMensual = (float) ($speedStats->total_mensual ?? 0);
        $totalSemanal = (float) ($speedStats->total_semanal ?? 0);

        $metaAnual = 540000.0;
        $metaMensual = 45000.0;
        $metaSemanal = 10000.0;

        $speedData = [
            'anual' => [
                'titulo' => 'SPEED ANUAL',
                'meta' => $metaAnual,
                'total' => $totalAnual,
                'formatted_meta' => number_format($metaAnual, 2, '.', ','),
                'formatted_total' => number_format($totalAnual, 2, '.', ','),
                'porcentaje' => $metaAnual > 0 ? min(100, round(($totalAnual / $metaAnual) * 100, 1)) : 0,
            ],
            'mensual' => [
                'titulo' => 'SPEED MENSUAL',
                'meta' => $metaMensual,
                'total' => $totalMensual,
                'formatted_meta' => number_format($metaMensual, 2, '.', ','),
                'formatted_total' => number_format($totalMensual, 2, '.', ','),
                'porcentaje' => $metaMensual > 0 ? min(100, round(($totalMensual / $metaMensual) * 100, 1)) : 0,
            ],
            'semanal' => [
                'titulo' => 'SPEED SEMANAL',
                'meta' => $metaSemanal,
                'total' => $totalSemanal,
                'formatted_meta' => number_format($metaSemanal, 2, '.', ','),
                'formatted_total' => number_format($totalSemanal, 2, '.', ','),
                'porcentaje' => $metaSemanal > 0 ? min(100, round(($totalSemanal / $metaSemanal) * 100, 1)) : 0,
            ],
        ];

        // ==========================================
        // ESTADÍSTICAS TRIMESTRAL (Flujo Ventas vs Cotizaciones de 3 meses)
        // ==========================================
        $mesesNombres = [
            1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
            5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
            9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'
        ];

        $mCurrent = $startDate->copy()->startOfMonth();
        $mPrev1 = $startDate->copy()->subMonth(1)->startOfMonth();
        $mPrev2 = $startDate->copy()->subMonth(2)->startOfMonth();

        $monthWindows = [
            [
                'index' => 0,
                'name' => $mesesNombres[(int)$mPrev2->month] ?? $mPrev2->format('F'),
                'start' => $mPrev2->copy()->startOfMonth()->toDateTimeString(),
                'end' => $mPrev2->copy()->endOfMonth()->toDateTimeString(),
            ],
            [
                'index' => 1,
                'name' => $mesesNombres[(int)$mPrev1->month] ?? $mPrev1->format('F'),
                'start' => $mPrev1->copy()->startOfMonth()->toDateTimeString(),
                'end' => $mPrev1->copy()->endOfMonth()->toDateTimeString(),
            ],
            [
                'index' => 2,
                'name' => $mesesNombres[(int)$mCurrent->month] ?? $mCurrent->format('F'),
                'start' => $mCurrent->copy()->startOfMonth()->toDateTimeString(),
                'end' => $mCurrent->copy()->endOfMonth()->toDateTimeString(),
            ],
        ];

        $trimestralStart = $monthWindows[0]['start'];
        $trimestralEnd = $monthWindows[2]['end'];

        $trimestralUserCondition = "";
        $trimestralParams = [
            $monthWindows[0]['start'], $monthWindows[0]['end'],
            $monthWindows[0]['start'], $monthWindows[0]['end'],

            $monthWindows[1]['start'], $monthWindows[1]['end'],
            $monthWindows[1]['start'], $monthWindows[1]['end'],

            $monthWindows[2]['start'], $monthWindows[2]['end'],
            $monthWindows[2]['start'], $monthWindows[2]['end'],

            $trimestralStart, $trimestralEnd
        ];

        if ($isFreelancer && $currentUser) {
            $trimestralUserCondition = " AND v.id_user = ? ";
            $trimestralParams[] = $currentUser->id;
        } elseif ($isAliado && $currentUser) {
            if (!empty($currentUser->id_aliado)) {
                $trimestralUserCondition = " AND (u.id_aliado = ? OR v.id_user = ?) ";
                $trimestralParams[] = $currentUser->id_aliado;
                $trimestralParams[] = $currentUser->id;
            } else {
                $trimestralUserCondition = " AND v.id_user = ? ";
                $trimestralParams[] = $currentUser->id;
            }
        }

        $trimestralRow = DB::selectOne("
            SELECT 
                COUNT(CASE WHEN v.fecha_creacion BETWEEN ? AND ? AND LOWER(v.estado) = 'venta' THEN 1 END) as ventas_m2,
                COUNT(CASE WHEN v.fecha_creacion BETWEEN ? AND ? THEN 1 END) as cotiz_m2,

                COUNT(CASE WHEN v.fecha_creacion BETWEEN ? AND ? AND LOWER(v.estado) = 'venta' THEN 1 END) as ventas_m1,
                COUNT(CASE WHEN v.fecha_creacion BETWEEN ? AND ? THEN 1 END) as cotiz_m1,

                COUNT(CASE WHEN v.fecha_creacion BETWEEN ? AND ? AND LOWER(v.estado) = 'venta' THEN 1 END) as ventas_m0,
                COUNT(CASE WHEN v.fecha_creacion BETWEEN ? AND ? THEN 1 END) as cotiz_m0
            FROM ventas v
            LEFT JOIN user u ON v.id_user = u.id
            WHERE v.fecha_creacion BETWEEN ? AND ?
            {$trimestralUserCondition}
        ", $trimestralParams);

        $vM2 = (int) ($trimestralRow->ventas_m2 ?? 0);
        $cM2 = (int) ($trimestralRow->cotiz_m2 ?? 0);

        $vM1 = (int) ($trimestralRow->ventas_m1 ?? 0);
        $cM1 = (int) ($trimestralRow->cotiz_m1 ?? 0);

        $vM0 = (int) ($trimestralRow->ventas_m0 ?? 0);
        $cM0 = (int) ($trimestralRow->cotiz_m0 ?? 0);

        // Variabilidad respecto al mes anterior (M0 vs M1)
        $varVentasNum = $vM1 > 0 ? round((($vM0 - $vM1) / $vM1) * 100, 2) : 0.0;
        $varCotizNum = $cM1 > 0 ? round((($cM0 - $cM1) / $cM1) * 100, 2) : 0.0;

        $formatVar = function($num) {
            $sign = $num > 0 ? '+' : ($num < 0 ? '-' : '');
            return $sign . number_format(abs($num), 2, ',', '.') . '%';
        };

        $trimestralData = [
            'meses' => [
                [
                    'mes' => $monthWindows[0]['name'],
                    'ventas' => $vM2,
                    'cotizaciones' => $cM2,
                ],
                [
                    'mes' => $monthWindows[1]['name'],
                    'ventas' => $vM1,
                    'cotizaciones' => $cM1,
                ],
                [
                    'mes' => $monthWindows[2]['name'],
                    'ventas' => $vM0,
                    'cotizaciones' => $cM0,
                ],
            ],
            'ventas' => [
                'rendimiento' => "{$vM0} VENTAS",
                'variabilidad' => $formatVar($varVentasNum),
                'variabilidad_num' => $varVentasNum,
                'actual' => $vM0,
                'anterior' => $vM1,
            ],
            'cotizaciones' => [
                'rendimiento' => "{$cM0} COTIZACIONES",
                'variabilidad' => $formatVar($varCotizNum),
                'variabilidad_num' => $varCotizNum,
                'actual' => $cM0,
                'anterior' => $cM1,
            ],
        ];

        // ==========================================
        // FICHAS RECIENTES (Las 18 primeras fichas para el Activity Feed)
        // ==========================================
        $fichasQuery = DB::table('ventas as v')
            ->leftJoin('persona_venta as pv', function($join) {
                $join->on('v.id', '=', 'pv.id_venta')
                     ->where('pv.principal', '=', 1);
            })
            ->leftJoin('user as u', 'v.id_user', '=', 'u.id')
            ->select(
                'v.id',
                'v.numero_ficha',
                'v.estado',
                'v.fecha_creacion',
                'v.descuento_monto',
                DB::raw("TRIM(CONCAT_WS(' ', pv.nombres, pv.apellidos)) as cliente_nombre"),
                'u.level as user_level',
                'u.id_aliado as user_id_aliado',
                'u.id_freelancer as user_id_freelancer'
            );

        if ($isFreelancer && $currentUser) {
            $fichasQuery->where('v.id_user', $currentUser->id);
        } elseif ($isAliado && $currentUser) {
            if (!empty($currentUser->id_aliado)) {
                $fichasQuery->where(function($q) use ($currentUser) {
                    $q->where('u.id_aliado', $currentUser->id_aliado)
                      ->orWhere('v.id_user', $currentUser->id);
                });
            } else {
                $fichasQuery->where('v.id_user', $currentUser->id);
            }
        } else {
            // Agencia: Restricción de asesor individual si no puede ver todas
            if (!$canViewAll && $currentUser) {
                $fichasQuery->where('v.id_user', $currentUser->id);
            }
        }

        $fichasRows = $fichasQuery->orderByDesc('v.fecha_creacion')
            ->orderByDesc('v.id')
            ->limit(18)
            ->get();

        $fichasIds = $fichasRows->pluck('id')->toArray();

        $hotelesTotales = [];
        $vuelosTotales = [];
        $trasladosTotales = [];
        $excursionesTotales = [];
        $paquetesTotales = [];
        $vehiculosTotales = [];
        $ferriesTotales = [];
        $otrosTotales = [];

        if (!empty($fichasIds)) {
            $hotelesTotales = DB::table('hotel_venta')
                ->whereIn('id_venta', $fichasIds)
                ->select('id_venta', DB::raw('SUM((precio_noche_adulto * IF(adultos > 0, adultos, 1) + precio_noche_adolescente * IFNULL(adolescente, 0) + precio_noche_nino * IFNULL(ninos, 0)) * IF(noches > 0, noches, 1)) as total'))
                ->groupBy('id_venta')
                ->pluck('total', 'id_venta');

            $vuelosTotales = DB::table('vuelo_venta')
                ->whereIn('id_venta', $fichasIds)
                ->select('id_venta', DB::raw('SUM(precio_adulto * IF(adultos > 0, adultos, 1) + precio_nino * IFNULL(ninos, 0) + precio_infante * IFNULL(infantes, 0)) as total'))
                ->groupBy('id_venta')
                ->pluck('total', 'id_venta');

            $trasladosTotales = DB::table('traslado_venta')
                ->whereIn('id_venta', $fichasIds)
                ->select('id_venta', DB::raw('SUM(precio_historico) as total'))
                ->groupBy('id_venta')
                ->pluck('total', 'id_venta');

            $excursionesTotales = DB::table('excursion_venta')
                ->whereIn('id_venta', $fichasIds)
                ->select('id_venta', DB::raw('SUM(precio_adulto * IF(adultos > 0, adultos, 1) + precio_nino * IFNULL(ninos, 0)) as total'))
                ->groupBy('id_venta')
                ->pluck('total', 'id_venta');

            $paquetesTotales = DB::table('paquete_venta')
                ->whereIn('id_venta', $fichasIds)
                ->select('id_venta', DB::raw('SUM(precio_adulto * IF(adultos > 0, adultos, 1) + precio_nino * IFNULL(ninos, 0)) as total'))
                ->groupBy('id_venta')
                ->pluck('total', 'id_venta');

            $vehiculosTotales = DB::table('vehiculo_venta')
                ->whereIn('id_venta', $fichasIds)
                ->select('id_venta', DB::raw('SUM(precio_unitario * IF(dias > 0, dias, 1)) as total'))
                ->groupBy('id_venta')
                ->pluck('total', 'id_venta');

            $ferriesTotales = DB::table('ferry_venta')
                ->whereIn('id_venta', $fichasIds)
                ->select('id_venta', DB::raw('SUM(precio_adulto * IF(adultos > 0, adultos, 1) + precio_nino * IFNULL(ninos, 0) + precio_vehiculo * IFNULL(vehiculos, 0)) as total'))
                ->groupBy('id_venta')
                ->pluck('total', 'id_venta');

            $otrosTotales = DB::table('otro_venta')
                ->whereIn('id_venta', $fichasIds)
                ->select('id_venta', DB::raw('SUM(precio) as total'))
                ->groupBy('id_venta')
                ->pluck('total', 'id_venta');
        }

        $fichasRecientes = [];
        foreach ($fichasRows as $f) {
            $fId = $f->id;
            $rawTotal = (float)($hotelesTotales[$fId] ?? 0)
                + (float)($vuelosTotales[$fId] ?? 0)
                + (float)($trasladosTotales[$fId] ?? 0)
                + (float)($excursionesTotales[$fId] ?? 0)
                + (float)($paquetesTotales[$fId] ?? 0)
                + (float)($vehiculosTotales[$fId] ?? 0)
                + (float)($ferriesTotales[$fId] ?? 0)
                + (float)($otrosTotales[$fId] ?? 0);

            $totalUSD = max(0, $rawTotal - (float)($f->descuento_monto ?? 0));

            $estRaw = strtolower(trim((string)$f->estado));
            $color = 'green';
            $tipo = 'venta';
            $estadoDisplay = 'Venta';

            if (str_contains($estRaw, 'nota') || str_contains($estRaw, 'credito') || str_contains($estRaw, 'crédito')) {
                $color = 'red';
                $tipo = 'nota_credito';
                $estadoDisplay = 'Nota de Crédito';
            } elseif (str_contains($estRaw, 'cotiz')) {
                $color = 'orange';
                $tipo = 'cotizacion';
                $estadoDisplay = 'Cotización';
            } else {
                $color = 'green';
                $tipo = 'venta';
                $estadoDisplay = 'Venta';
            }

            $scope = 'agencia';
            if (strtolower((string)$f->user_level) === 'freelancer' || !empty($f->user_id_freelancer)) {
                $scope = 'freelancer';
            } elseif (!empty($f->user_id_aliado)) {
                $scope = 'aliados';
            }

            $cliente = !empty($f->cliente_nombre) ? $f->cliente_nombre : 'Cliente General';
            $fecha = !empty($f->fecha_creacion) ? \Carbon\Carbon::parse($f->fecha_creacion)->format('d/m/Y') : '';

            $fichasRecientes[] = [
                'id' => $f->id,
                'numero_ficha' => $f->numero_ficha,
                'cliente' => $cliente,
                'fecha' => $fecha,
                'total' => round($totalUSD, 2),
                'amount' => round($totalUSD) . ' USD',
                'estado' => $estadoDisplay,
                'color' => $color,
                'tipo' => $tipo,
                'scope' => $scope,
            ];
        }

        return response()->json([
            'success' => true,
            'rango_fecha' => $rangoFecha,
            'start_label' => $startLabel,
            'end_label' => $endLabel,
            'fecha_inicio' => $startDate->toDateString(),
            'fecha_fin' => $endDate->toDateString(),
            'top_ventas' => $items,
            'clientes' => [
                'frecuentes' => $clientesFrecuentes,
                'nuevos' => $clientesNuevos,
                'total' => $clientesFrecuentes + $clientesNuevos,
            ],
            'ventas_kpi' => [
                'confirmadas' => $ventasConfirmadas,
                'anuladas' => $ventasAnuladas,
                'total' => $ventasConfirmadas + $ventasAnuladas,
            ],
            'speed' => $speedData,
            'trimestral' => $trimestralData,
            'fichas_recientes' => $fichasRecientes,
        ]);
    }
}
