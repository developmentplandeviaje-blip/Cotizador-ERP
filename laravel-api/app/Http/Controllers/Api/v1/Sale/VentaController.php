<?php

namespace App\Http\Controllers\Api\v1\Sale;

use App\Http\Controllers\Controller;
use App\Services\Sale\VentaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VentaController extends Controller
{
    public function __construct(
        protected VentaService $service
    ) {
        @ini_set('memory_limit', '512M');
        @set_time_limit(120);
    }

    public function indexAgencia(Request $request): JsonResponse
    {
        $data = $this->service->listarVentas('agencia', $request->user(), $request->all());
        return response()->json($data);
    }

    public function indexFreelancer(Request $request): JsonResponse
    {
        $data = $this->service->listarVentas('freelancer', $request->user(), $request->all());
        return response()->json($data);
    }

    public function indexAliados(Request $request): JsonResponse
    {
        $data = $this->service->listarVentas('aliados', $request->user(), $request->all());
        return response()->json($data);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $data = $this->service->getDetalleVenta($id, $request->user());
        return response()->json($data);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $data = $this->service->updateVenta($id, $request->all(), $request->user());
        return response()->json([
            'message' => 'Registro actualizado exitosamente.',
            'data' => $data,
        ]);
    }

    public function obtenerCodigoDiario(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdminOrLeader = in_array(strtolower($user->level ?? ''), ['admin', 'administrador', 'lider']);
        if (!$isAdminOrLeader) {
            abort(403, 'Solo los usuarios administradores o líderes pueden consultar el código de autorización.');
        }

        $info = $this->service->obtenerCodigoDiario();
        return response()->json($info);
    }

    public function confirmar(Request $request, int $id): JsonResponse
    {
        $venta = $this->service->confirmarVenta($id, $request->user());
        return response()->json([
            'message' => 'Venta confirmada exitosamente.',
            'venta' => $venta,
        ]);
    }

    public function desbloquearEdicion(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'codigo' => 'required|string',
        ]);

        $result = $this->service->desbloquearEdicion($id, $validated['codigo'], $request->user());
        return response()->json($result);
    }

    public function registrarPago(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'id_metodo' => 'required|integer',
            'monto_original' => 'required|numeric|min:0.01',
            'moneda_pago' => 'nullable|string|in:USD,VES,EUR',
            'tasa_cambio' => 'nullable|numeric|min:0.0001',
            'tipo_pago' => 'nullable|string|in:pago_inicial,abono_cuota,pago_total',
            'numero_transaccion' => 'nullable|string|max:100',
            'quien_envia' => 'nullable|string|max:150',
            'observacion' => 'nullable|string|max:500',
        ]);

        $pago = $this->service->registrarPago($id, $validated, $request->user());
        return response()->json([
            'message' => 'Pago registrado exitosamente.',
            'pago' => $pago,
        ], 201);
    }

    public function actualizarPago(Request $request, int $id, int $pagoId): JsonResponse
    {
        $validated = $request->validate([
            'id_metodo' => 'nullable|integer',
            'monto_original' => 'required|numeric|min:0.01',
            'moneda_pago' => 'nullable|string|in:USD,VES,EUR',
            'tasa_cambio' => 'nullable|numeric|min:0.0001',
            'tipo_pago' => 'nullable|string|in:pago_inicial,abono_cuota,pago_total',
            'numero_transaccion' => 'nullable|string|max:100',
            'quien_envia' => 'nullable|string|max:150',
            'observacion' => 'nullable|string|max:500',
        ]);

        $pago = $this->service->actualizarPago($id, $pagoId, $validated, $request->user());
        return response()->json([
            'message' => 'Pago actualizado exitosamente.',
            'pago' => $pago,
        ]);
    }

    public function eliminarPago(Request $request, int $id, int $pagoId): JsonResponse
    {
        $this->service->eliminarPago($id, $pagoId, $request->user());
        return response()->json([
            'message' => 'Pago eliminado exitosamente.',
        ]);
    }
}
