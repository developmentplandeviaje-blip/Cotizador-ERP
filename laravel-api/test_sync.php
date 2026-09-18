<?php
require __DIR__."/vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$hotel = App\Models\Catalog\Hotel::find(3);
$data = [
    "habitaciones" => [
        [
            "habitacion" => "Sencilla",
            "tarifas" => [
                [
                    "desde" => "2026-09-22",
                    "hasta" => "2026-11-05",
                    "precio_noche_adulto" => 30
                ]
            ]
        ]
    ]
];
app("App\Services\Catalog\HotelService")->updateHotel($hotel, $data);
echo json_encode($hotel->fresh(["habitaciones.tarifas"])->toArray());

