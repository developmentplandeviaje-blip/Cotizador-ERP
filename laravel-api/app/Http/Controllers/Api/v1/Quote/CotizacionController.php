<?php

namespace App\Http\Controllers\Api\v1\Quote;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quote\StoreCotizacionRequest;
use App\Http\Requests\Quote\ValidarReferidoRequest;
use App\Services\Quote\CotizacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CotizacionController extends Controller
{
    public function __construct(
        protected CotizacionService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $data = $this->service->listarCotizaciones($request->user());
        return response()->json($data);
    }

    public function catalogos(Request $request): JsonResponse
    {
        $data = $this->service->getCatalogos($request->user());
        return response()->json($data);
    }

    public function validarReferido(ValidarReferidoRequest $request): JsonResponse
    {
        $result = $this->service->validarReferido($request->validated()['codigo']);
        return response()->json($result);
    }

    public function buscarCliente(string $documento): JsonResponse
    {
        $cliente = $this->service->buscarCliente($documento);
        if (!$cliente) {
            return response()->json(['encontrado' => false, 'message' => 'Cliente no encontrado.'], 404);
        }
        return response()->json(['encontrado' => true, 'cliente' => $cliente]);
    }

    public function store(StoreCotizacionRequest $request): JsonResponse
    {
        $venta = $this->service->crearCotizacion($request->user(), $request->all());
        return response()->json([

            'message' => 'Cotización creada exitosamente.',
            'cotizacion' => $venta,
        ], 201);
    }

    public function storeRapida(Request $request): JsonResponse
    {
        $rapida = $this->service->crearCotizacionRapida($request->user(), $request->all());
        return response()->json([
            'message' => 'Cotización rápida guardada exitosamente.',
            'data' => $rapida,
        ], 201);
    }

    public function getConfiguracionCierre(): JsonResponse
    {
        $config = $this->service->getConfiguracionCierre();
        return response()->json($config);
    }

    public function guardarConfiguracionCierre(Request $request): JsonResponse
    {
        $user = $request->user();
        $userLevel = strtolower($user->level ?? '');
        if (!in_array($userLevel, ['admin', 'gerente'])) {
            return response()->json([
                'message' => 'No tiene permisos suficientes para modificar esta configuración. Se requiere nivel Administrador o Gerente.',
            ], 403);
        }

        $validated = $request->validate([
            'activo' => 'required|boolean',
            'hora' => 'required|string',
            'dias' => 'required|in:todos,laborales',
            'forzar_limpieza_ahora' => 'nullable|boolean',
        ]);

        $updated = $this->service->guardarConfiguracionCierre($validated);

        return response()->json([
            'message' => 'Configuración de horario de cierre guardada exitosamente.',
            'data' => $updated,
        ]);
    }
}
