<?php

namespace App\Http\Controllers\Api\v1\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\StoreMetodoPagoRequest;
use App\Http\Requests\Finance\UpdateMetodoPagoRequest;
use App\Http\Resources\Finance\MetodoPagoResource;
use App\Models\Finance\MetodoPago;
use App\Models\Finance\MetodoPagoLogo;
use App\Services\Finance\MetodoPagoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Throwable;

class MetodoPagoController extends Controller
{
    public function __construct(
        protected MetodoPagoService $metodoPagoService
    ) {}

    public function logos(): JsonResponse
    {
        $logos = MetodoPagoLogo::query()
            ->orderBy('nombre')
            ->get()
            ->map(fn (MetodoPagoLogo $logo) => $this->formatLogo($logo));

        return response()->json(['data' => $logos]);
    }

    public function storeLogo(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $request->merge(['nombre' => trim((string) $request->input('nombre'))]);
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:100', 'unique:metodo_pago_logo,nombre'],
            'imagen' => ['required', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
        ], [
            'nombre.required' => 'El nombre del logo es obligatorio.',
            'nombre.unique' => 'Ya existe un logo con ese nombre.',
            'imagen.required' => 'Debe seleccionar una imagen para el logo.',
            'imagen.image' => 'El archivo seleccionado debe ser una imagen válida.',
            'imagen.mimes' => 'La imagen debe estar en formato PNG, JPG o WEBP.',
            'imagen.max' => 'La imagen no puede superar los 2 MB.',
        ]);

        $path = $validated['imagen']->store('metodo-pago-logos', 'public');
        if ($path === false) {
            throw new \RuntimeException('No se pudo almacenar la imagen del logo.');
        }

        try {
            $logo = MetodoPagoLogo::create([
                'nombre' => trim($validated['nombre']),
                'ruta' => $path,
            ]);
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($path);
            throw $exception;
        }

        return response()->json(['data' => $this->formatLogo($logo)], 201);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = (int) $request->input('per_page', 15);
        $metodos = $this->metodoPagoService->getMetodosPago($request->all(), $perPage);
        return MetodoPagoResource::collection($metodos);
    }

    public function store(StoreMetodoPagoRequest $request): JsonResponse
    {
        $metodo = $this->metodoPagoService->createMetodoPago($request->validated());
        return (new MetodoPagoResource($metodo))->response()->setStatusCode(201);
    }

    public function show(MetodoPago $metodoPago): MetodoPagoResource
    {
        return new MetodoPagoResource($metodoPago->load(['banco', 'digital', 'asesores.user']));
    }

    public function update(UpdateMetodoPagoRequest $request, MetodoPago $metodoPago): MetodoPagoResource
    {
        $updated = $this->metodoPagoService->updateMetodoPago($metodoPago, $request->validated());
        return new MetodoPagoResource($updated);
    }

    public function toggleStatus(Request $request, MetodoPago $metodoPago): MetodoPagoResource
    {
        $this->ensureAdmin($request);
        $toggled = $this->metodoPagoService->toggleStatus($metodoPago);
        return new MetodoPagoResource($toggled);
    }

    public function destroy(Request $request, MetodoPago $metodoPago): JsonResponse
    {
        $this->ensureAdmin($request);
        $this->metodoPagoService->deleteMetodoPago($metodoPago);
        return response()->json(['message' => 'Método de pago eliminado correctamente.']);
    }

    public function assignAsesores(Request $request, MetodoPago $metodoPago): MetodoPagoResource
    {
        $this->ensureAdmin($request);
        $validated = $request->validate([
            'asesores' => ['required', 'array'],
            'asesores.*' => ['integer', 'exists:user,id'],
        ]);
        $this->metodoPagoService->assignAsesores($metodoPago->id, $validated['asesores']);
        return new MetodoPagoResource($metodoPago->fresh(['banco', 'digital', 'asesores.user']));
    }

    private function ensureAdmin(Request $request): void
    {
        $user = $request->user();
        if (!$user || !in_array($user->level, ['Admin', 'Administrador', 'Sub Gerente'], true)) {
            abort(403, 'Acceso restringido a administradores.');
        }
    }

    private function formatLogo(MetodoPagoLogo $logo): array
    {
        return [
            'value' => $logo->ruta,
            'label' => $logo->nombre,
            'url' => url(Storage::disk('public')->url($logo->ruta)),
        ];
    }
}
