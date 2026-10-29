<?php

namespace App\Http\Controllers\Api\v1\Ocr;

use App\Http\Controllers\Controller;
use App\Services\Ocr\DocumentOcrService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class DocumentOcrController extends Controller
{
    public function __construct(
        protected DocumentOcrService $ocrService
    ) {}

    /**
     * Scan an identity document in memory and return structured data.
     * No images are stored on disk.
     */
    public function scan(Request $request): JsonResponse
    {
        // Prevent XAMPP's default 30-second max_execution_time from killing PHP and stripping CORS headers
        @set_time_limit(90);

        $request->validate([
            'image' => 'nullable|file|mimes:jpeg,png,jpg,webp|max:10240', // Max 10MB in backend (frontend compresses to < 1MB)
            'image_base64' => 'nullable|string',
        ]);

        if (!$request->hasFile('image') && !$request->filled('image_base64')) {
            throw ValidationException::withMessages([
                'image' => ['Debe proporcionar una imagen para el escaneo.'],
            ]);
        }

        try {
            $input = $request->hasFile('image')
                ? $request->file('image')
                : $request->input('image_base64');

            $result = $this->ocrService->scanDocument($input);

            if (!$result['es_valido']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['mensaje'] ?? 'No se pudo reconocer un documento de identidad válido en la imagen.',
                    'data' => $result,
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'Documento analizado exitosamente.',
                'data' => $result,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Error inesperado durante el procesamiento del documento.',
            ], 500);
        }
    }
}
