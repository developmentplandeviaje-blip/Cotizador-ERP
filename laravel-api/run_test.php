<?php
require __DIR__."/vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$data = ["habitaciones" => [["habitacion" => "Test Room", "tarifas" => [["desde" => "2026-10-01", "hasta" => "2026-10-10"]]]]];
$hotel = App\Models\Catalog\Hotel::first();
app("App\Services\Catalog\HotelService")->updateHotel($hotel, $data);
echo "Done";

