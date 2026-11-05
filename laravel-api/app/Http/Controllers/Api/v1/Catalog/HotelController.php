<?php

namespace App\Http\Controllers\Api\v1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreHotelRequest;
use App\Http\Requests\Catalog\UpdateHotelRequest;
use App\Http\Resources\Catalog\HotelResource;
use App\Models\Catalog\Hotel;
use App\Models\Catalog\HotelTipo;
use App\Services\Catalog\HotelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class HotelController extends Controller
{
    private const DEFAULT_HOTEL_TYPES = [
        'Todo Incluido',
        'Pensión Completa',
        'Media Pensión',
        'Solo Desayuno',
    ];

    public function __construct(
        protected HotelService $hotelService
    ) {}

    public function tipos(): JsonResponse
    {
        $tipos = HotelTipo::query()
            ->orderBy('nombre')
            ->get()
            ->map(fn (HotelTipo $tipo) => [
                'id' => $tipo->id,
                'nombre' => $tipo->nombre,
                'eliminable' => !in_array($tipo->nombre, self::DEFAULT_HOTEL_TYPES, true),
            ]);

        Hotel::query()
            ->select('tipo')
            ->distinct()
            ->orderBy('tipo')
            ->pluck('tipo')
            ->map(fn (string $tipo) => trim($tipo))
            ->filter()
            ->each(function (string $tipo) use ($tipos): void {
                if (!$tipos->contains(fn (array $catalogType) => mb_strtolower($catalogType['nombre']) === mb_strtolower($tipo))) {
                    $tipos->push([
                        'id' => null,
                        'nombre' => $tipo,
                        'eliminable' => false,
                    ]);
                }
            });

        return response()->json(['data' => $tipos]);
    }

    public function storeTipo(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $request->merge(['nombre' => trim((string) $request->input('nombre'))]);

        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:300',
                Rule::unique('hotel_tipo', 'nombre'),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (Hotel::query()->whereRaw('LOWER(TRIM(tipo)) = ?', [mb_strtolower(trim($value))])->exists()) {
                        $fail('Este tipo de hotel ya existe.');
                    }
                },
            ],
        ], [
            'nombre.required' => 'El nombre del tipo de hotel es obligatorio.',
            'nombre.unique' => 'Este tipo de hotel ya existe.',
        ]);

        $tipo = HotelTipo::create(['nombre' => $validated['nombre']]);

        return response()->json([
            'data' => [
                'id' => $tipo->id,
                'nombre' => $tipo->nombre,
                'eliminable' => true,
            ],
        ], 201);
    }

    public function destroyTipo(Request $request, HotelTipo $hotelTipo): JsonResponse
    {
        $this->ensureAdmin($request);

        if (in_array($hotelTipo->nombre, self::DEFAULT_HOTEL_TYPES, true)) {
            return response()->json(['message' => 'Los tipos de hotel predeterminados no se pueden eliminar.'], 422);
        }

        if (Hotel::query()->where('tipo', $hotelTipo->nombre)->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar este tipo porque está asignado a uno o más hoteles.',
            ], 409);
        }

        $hotelTipo->delete();

        return response()->json(['message' => 'Tipo de hotel eliminado correctamente.']);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->only(['search', 'id_ubicacion', 'status', 'sort_by', 'sort_dir']);
        $perPage = (int) $request->get('per_page', 10);
        $hotels = $this->hotelService->getHotels($filters, $perPage);

        return HotelResource::collection($hotels);
    }

    public function store(StoreHotelRequest $request): JsonResponse
    {
        $hotel = $this->hotelService->createHotel($request->validated());

        return (new HotelResource($hotel))
            ->response()
            ->setStatusCode(201);
    }

    public function show(int $id): HotelResource
    {
        $hotel = $this->hotelService->getHotelById($id);

        return new HotelResource($hotel);
    }

    public function update(UpdateHotelRequest $request, Hotel $hotel): HotelResource
    {
        $updated = $this->hotelService->updateHotel($hotel, $request->validated());

        return new HotelResource($updated);
    }

    public function toggleStatus(Hotel $hotel): HotelResource
    {
        $updated = $this->hotelService->toggleStatus($hotel);

        return new HotelResource($updated);
    }

    public function destroy(Hotel $hotel): JsonResponse
    {
        try {
            $this->hotelService->deleteHotel($hotel);
            return response()->json(['message' => 'Hotel eliminado exitosamente.']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function descuentoMasivo(\Illuminate\Http\Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tipo_descuento' => 'required|in:contado,divisas',
            'porcentaje' => 'required|numeric|min:0|max:100',
            'ubicacion_id' => 'required',
        ]);

        try {
            $count = $this->hotelService->aplicarDescuentoMasivo(
                $validated['tipo_descuento'],
                $validated['porcentaje'],
                $validated['ubicacion_id']
            );

            return response()->json([
                'message' => "Se han actualizado $count hoteles exitosamente."
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error aplicando el descuento masivo', 'error' => $e->getMessage()], 500);
        }
    }

    private function ensureAdmin(Request $request): void
    {
        $user = $request->user();
        if (!$user || !in_array($user->level, ['Admin', 'Administrador', 'Sub Gerente'], true)) {
            abort(403, 'Acceso restringido a administradores.');
        }
    }
}
