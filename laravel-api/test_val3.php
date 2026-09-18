<?php
require __DIR__."/vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$request = new Illuminate\Http\Request();
$request->merge(["habitaciones" => [["habitacion" => "Sencilla", "tarifas" => [["desde" => "2026-09-01"]]]]]);
$validator = validator($request->all(), (new App\Http\Requests\Catalog\UpdateHotelRequest())->rules());
var_dump($validator->validated());

