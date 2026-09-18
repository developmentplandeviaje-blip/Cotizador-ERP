<?php
require __DIR__."/vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$validator = validator(["habitaciones" => [["habitacion" => "Sencilla", "tarifas" => [["desde" => "2026-09-01"]]]]], ["habitaciones" => "nullable|array"]);
echo json_encode($validator->validated());

