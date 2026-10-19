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
}
