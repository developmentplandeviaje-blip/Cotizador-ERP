<?php
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$hotel = App\Models\Catalog\Hotel::latest("id")->first();
try {
    app(App\Services\Catalog\HotelService::class)->deleteHotel($hotel);
    echo "Deleted hotel " . $hotel->id;
} catch (Exception $e) {
    echo "Failed to delete: " . $e->getMessage();
}

