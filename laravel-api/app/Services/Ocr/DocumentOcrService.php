<?php

namespace App\Services\Ocr;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class DocumentOcrService
{
    /**
     * Process an in-memory document image and extract identity data.
     * Memory-only: The file is never stored in persistent storage or DB.
     *
     * @param UploadedFile|string $file
     * @return array
     */
    public function scanDocument(UploadedFile|string $file): array
    {
        if ($file instanceof UploadedFile) {
            $mimeType = $file->getMimeType() ?: 'image/jpeg';
            $base64 = base64_encode($file->get());
        } elseif (is_string($file)) {
            // Assume base64 string or data URL
            if (str_starts_with($file, 'data:')) {
                [$meta, $rawBase64] = explode(',', $file, 2);
                preg_match('/data:(.*?);base64/', $meta, $matches);
                $mimeType = $matches[1] ?? 'image/jpeg';
                $base64 = $rawBase64;
            } else {
                $mimeType = 'image/jpeg';
                $base64 = $file;
            }
        } else {
            throw new RuntimeException('Formato de imagen inválido.');
        }

        $driver = config('services.ocr.driver', 'gemini');
        $geminiKey = config('services.ocr.gemini.api_key');
        $openAiKey = config('services.ocr.openai.api_key');

        // Automatic fallback if selected driver key is missing
        if ($driver === 'gemini' && empty($geminiKey) && !empty($openAiKey)) {
            $driver = 'openai';
        } elseif ($driver === 'openai' && empty($openAiKey) && !empty($geminiKey)) {
            $driver = 'gemini';
        }

        if ($driver === 'openai') {
            return $this->scanWithOpenAI($base64, $mimeType, $openAiKey);
        }

        return $this->scanWithGemini($base64, $mimeType, $geminiKey);
    }

    /**
     * Extract identity info using Google Gemini Flash.
     */
    protected function scanWithGemini(string $base64, string $mimeType, ?string $apiKey): array
    {
        if (empty($apiKey)) {
            throw new RuntimeException('La API Key de Gemini (GEMINI_API_KEY) no está configurada en el servidor.');
        }

        $model = config('services.ocr.gemini.model', 'gemini-3.8-flash');
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

        $systemPrompt = $this->buildSystemPrompt();

        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $systemPrompt],
                        [
                            'inline_data' => [
                                'mime_type' => $mimeType,
                                'data' => $base64,
                            ],
                        ],
                    ],
                ],
            ],
            'generationConfig' => [
                'response_mime_type' => 'application/json',
                'temperature' => 0.1,
            ],
        ];

        $response = $this->createHttpClient()->post($url, $payload);

        if (!$response->successful()) {
            $errBody = $response->json();
            $detail = $errBody['error']['message'] ?? ('HTTP ' . $response->status());
            Log::error('OCR Gemini API Error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new RuntimeException("Error al comunicarse con Gemini ({$response->status()}): {$detail}");
        }

        $json = $response->json();
        $rawText = $json['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
        
        return $this->parseAndNormalizeResponse($rawText, 'gemini');
    }

    /**
     * Extract identity info using OpenAI GPT-4o-mini.
     */
    protected function scanWithOpenAI(string $base64, string $mimeType, ?string $apiKey): array
    {
        if (empty($apiKey)) {
            throw new RuntimeException('La API Key de OpenAI (OPENAI_API_KEY) no está configurada en el servidor.');
        }

        $model = config('services.ocr.openai.model', 'gpt-4o-mini');
        $url = 'https://api.openai.com/v1/chat/completions';

        $systemPrompt = $this->buildSystemPrompt();

        $payload = [
            'model' => $model,
            'temperature' => 0.1,
            'response_format' => ['type' => 'json_object'],
            'messages' => [
                [
                    'role' => 'system',
                    'content' => $systemPrompt,
                ],
                [
                    'role' => 'user',
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => 'Extrae los datos de este documento de identidad y responde ÚNICAMENTE con el objeto JSON según el esquema indicado.',
                        ],
                        [
                            'type' => 'image_url',
                            'image_url' => [
                                'url' => "data:{$mimeType};base64,{$base64}",
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->createHttpClient($apiKey)->post($url, $payload);

        if (!$response->successful()) {
            $errBody = $response->json();
            $detail = $errBody['error']['message'] ?? ('HTTP ' . $response->status());
            Log::error('OCR OpenAI API Error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new RuntimeException("Error al comunicarse con OpenAI ({$response->status()}): {$detail}");
        }

        $json = $response->json();
        $rawText = $json['choices'][0]['message']['content'] ?? '{}';

        return $this->parseAndNormalizeResponse($rawText, 'openai');
    }

    /**
     * Create an HTTP client instance configured with timeout and local SSL verification settings.
     */
    protected function createHttpClient(?string $token = null)
    {
        $client = Http::timeout(30);

        if ($token) {
            $client = $client->withToken($token);
        }

        // On local environments (such as Windows / XAMPP where cacert.pem is often not configured in php.ini)
        // or when explicitly disabled in config, bypass cURL SSL certificate verification.
        $sslVerify = config('services.ocr.ssl_verify', false);
        if (!$sslVerify) {
            $client = $client->withoutVerifying();
        }

        return $client;
    }

    /**
     * System instructions defining document types and output structure.
     */
    protected function buildSystemPrompt(): string
    {
        return <<<PROMPT
Eres un analizador OCR experto especializado en documentos de identidad y viaje para una agencia de viajes y sistema ERP.
Tu tarea es analizar la imagen del documento provisto (Cédula de Identidad Venezolana, Cédula de Extranjero residente, RIF o Pasaporte) y extraer los datos en formato JSON estrictamente estructurado.

REGLAS DE CLASIFICACIÓN DE "tipo_documento":
1. "V" (Venezolano / Nacional):
   - Cédula de identidad de Venezuela donde la nacionalidad sea venezolana ("VENEZOLANA", "REPÚBLICA BOLIVARIANA DE VENEZUELA" con prefijo V- o V antes del número).
2. "E" (Extranjero residente):
   - Cédula de identidad emitida en Venezuela a extranjeros residentes (indica "EXTRANJERO" o prefijo E- antes del número).
3. "J" (Jurídico / RIF de Empresa):
   - Comprobante de RIF emitido por el SENIAT que inicia con "J-" o corresponde a una empresa, compañía anónima, C.A., S.A., SRL.
4. "G" (Gubernamental):
   - Comprobante de RIF del SENIAT que inicia con "G-" (organismos del Estado).
5. "P" (Pasaporte):
   - Pasaporte internacional de cualquier país. Identificado por la palabra "PASAPORTE / PASSPORT" o por la zona de lectura mecánica (MRZ) al pie de la página con caracteres OCR que inician con "P<".

REGLAS DE EXTRACCIÓN DE CAMPOS:
- "documento":
  * Para cédulas (V, E) o RIFs (J, G): Retornar ÚNICAMENTE los números, sin letras, guiones, puntos ni espacios (ej: si dice "V-18.456.789", retornar "18456789").
  * Para pasaportes (P): Retornar el número de pasaporte limpio alfanumérico (ej: "098765432" o "A12345678").
- "nombres": Nombres de pila de la persona en MAYÚSCULAS limpias (ej: "JUAN ALBERTO").
- "apellidos": Apellidos de la persona en MAYÚSCULAS limpias (ej: "PEREZ ROJAS").
- "fecha_nacimiento": Fecha de nacimiento en formato exacto "YYYY-MM-DD" si aparece en el documento. Si no aparece o es ilegible, null.
- "sexo": "M" para masculino, "F" para femenino, o null si no se distingue.
- "nacionalidad": Nombre del país o gentilicio (ej: "VENEZUELA", "COLOMBIA", "ESPAÑA") o null.
- "es_valido": true si la imagen corresponde a un documento de identidad legible; false si la imagen es ilegible, no es un documento, o no se reconocen los datos.
- "mensaje": Breve mensaje descriptivo en español (ej: "Cédula venezolana detectada con éxito").

FORMATO DE SALIDA (JSON ÚNICAMENTE):
{
  "es_valido": true,
  "tipo_documento": "V" | "E" | "J" | "G" | "P",
  "documento": "18456789",
  "nombres": "JUAN ALBERTO",
  "apellidos": "PEREZ ROJAS",
  "fecha_nacimiento": "1990-05-14",
  "sexo": "M",
  "nacionalidad": "VENEZUELA",
  "mensaje": "Cédula venezolana detectada"
}
PROMPT;
    }

    /**
     * Parse raw LLM output and normalize fields.
     */
    protected function parseAndNormalizeResponse(string $rawText, string $driverUsed): array
    {
        // Strip markdown code fences if present (```json ... ```)
        $clean = preg_replace('/^```(?:json)?\s*/i', '', trim($rawText));
        $clean = preg_replace('/```$/', '', trim($clean));

        $data = json_decode($clean, true);

        if (!is_array($data)) {
            Log::warning('OCR raw response was not valid JSON', ['raw' => $rawText]);
            return [
                'es_valido' => false,
                'mensaje' => 'No se pudo interpretar el resultado de la imagen.',
                'tipo_documento' => 'V',
                'documento' => '',
                'nombres' => '',
                'apellidos' => '',
                'fecha_nacimiento' => null,
                'sexo' => null,
                'driver' => $driverUsed,
            ];
        }

        // Clean documento
        $tipoDoc = strtoupper(trim((string)($data['tipo_documento'] ?? 'V')));
        if (!in_array($tipoDoc, ['V', 'E', 'J', 'G', 'P'])) {
            $tipoDoc = 'V';
        }

        $documento = trim((string)($data['documento'] ?? ''));
        if ($tipoDoc !== 'P') {
            // Remove any prefix like V-, E-, dots, spaces
            $documento = preg_replace('/[^0-9]/', '', $documento);
        } else {
            // Keep alphanumeric for passport
            $documento = preg_replace('/[^A-Za-z0-9]/', '', $documento);
        }

        // Validate fecha_nacimiento
        $fechaNac = $data['fecha_nacimiento'] ?? null;
        if ($fechaNac && !preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$fechaNac)) {
            $fechaNac = null;
        }

        return [
            'es_valido' => (bool)($data['es_valido'] ?? (!empty($documento) || !empty($data['nombres']))),
            'tipo_documento' => $tipoDoc,
            'documento' => $documento,
            'nombres' => trim((string)($data['nombres'] ?? '')),
            'apellidos' => trim((string)($data['apellidos'] ?? '')),
            'fecha_nacimiento' => $fechaNac,
            'sexo' => in_array(strtoupper((string)($data['sexo'] ?? '')), ['M', 'F']) ? strtoupper($data['sexo']) : null,
            'nacionalidad' => $data['nacionalidad'] ?? null,
            'mensaje' => $data['mensaje'] ?? 'Documento procesado correctamente.',
            'driver' => $driverUsed,
        ];
    }
}
