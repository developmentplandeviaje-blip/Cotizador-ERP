<?php
require __DIR__."/vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$hotel = App\Models\Catalog\Hotel::find(3);
$hotel->habitaciones()->delete();
$room = $hotel->habitaciones()->create(["id" => 30, "habitacion" => "Doble", "cantidad_personas" => 2, "minimo_noches" => 1, "posicion" => 1, "por_defecto" => true]);

$request = Illuminate\Http\Request::create("/api/v1/catalog/hoteles/{$hotel->id}", "PUT", [
    "habitaciones" => [
        [
            "id" => $room->id,
            "habitacion" => "Doble",
            "cantidad_personas" => 2,
            "minimo_noches" => 1,
            "posicion" => 1,
            "por_defecto" => true,
            "tarifas" => []
        ],
        [
            "habitacion" => "Sencilla",
            "cantidad_personas" => 2,
            "minimo_noches" => 1,
            "posicion" => 2,
            "por_defecto" => false,
            "tarifas" => [
                [
                    "desde" => "2026-09-22",
                    "hasta" => "2026-11-05",
                    "desde_venta" => "2026-09-22",
                    "hasta_venta" => "2026-11-05",
                    "precio_noche_adulto" => 30,
                    "precio_noche_adolescente" => 25,
                    "precio_noche_nino" => 20,
                    "costo_noche_adulto" => 25,
                    "costo_noche_adolescente" => 20,
                    "costo_noche_nino" => 15,
                    "moneda" => "USD"
                ]
            ]
        ]
    ]
]);

$controller = $app->make(App\Http\Controllers\Api\v1\Catalog\HotelController::class);
$formRequest = App\Http\Requests\Catalog\UpdateHotelRequest::createFrom($request);
$formRequest->setContainer($app);
$formRequest->validateResolved();

$response = $controller->update($formRequest, $hotel);
echo $response->getContent();

