<?php

namespace App\Http\Controllers\Api\v1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreHotelRequest;
use App\Http\Requests\Catalog\UpdateHotelRequest;
use App\Http\Resources\Catalog\HotelResource;
use App\Models\Catalog\Hotel;
use App\Services\Catalog\HotelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HotelController extends Controller
{
    public function __construct(
        protected HotelService $hotelService
    ) {}

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
}
