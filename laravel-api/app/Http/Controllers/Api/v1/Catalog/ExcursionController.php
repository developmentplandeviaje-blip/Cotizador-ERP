<?php

namespace App\Http\Controllers\Api\v1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreExcursionRequest;
use App\Http\Requests\Catalog\UpdateExcursionRequest;
use App\Http\Resources\Catalog\ExcursionResource;
use App\Models\Catalog\Excursion;
use App\Services\Catalog\ExcursionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class ExcursionController extends Controller
{
    public function __construct(
        private readonly ExcursionService $excursionService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->only(['search', 'id_ubicacion', 'sort_by', 'sort_dir']);
        $perPage = $request->has('per_page') ? (int) $request->get('per_page') : 10;

        if ($request->boolean('all') || $perPage === 0) {
            $perPage = 0;
        }

        $excursiones = $this->excursionService->getExcursiones($filters, $perPage);

        return ExcursionResource::collection($excursiones);
    }

    public function store(StoreExcursionRequest $request): JsonResponse
    {
        $excursion = $this->excursionService->createExcursion($request->validated());

        return (new ExcursionResource($excursion))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Excursion $excursion): ExcursionResource
    {
        $excursion->load('ubicacion');

        return new ExcursionResource($excursion);
    }

    public function update(UpdateExcursionRequest $request, Excursion $excursion): ExcursionResource
    {
        $updated = $this->excursionService->updateExcursion($excursion, $request->validated());

        return new ExcursionResource($updated);
    }

    public function destroy(Excursion $excursion): JsonResponse
    {
        try {
            $this->excursionService->deleteExcursion($excursion);

            return response()->json([
                'message' => 'Excursión eliminada exitosamente.',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la excursión: ' . $e->getMessage(),
            ], 500);
        }
    }
}
