<?php
require __DIR__."/vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$hotels = App\Models\Catalog\Hotel::all(["id", "nombre"])->toArray();
echo json_encode($hotels);

