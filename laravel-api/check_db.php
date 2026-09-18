<?php
require __DIR__."/vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$rooms = App\Models\Catalog\Hotel::find(2)->habitaciones()->with("tarifas")->get();
echo json_encode($rooms->toArray());

