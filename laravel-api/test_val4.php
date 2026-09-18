<?php
require __DIR__."/vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$request = Illuminate\Http\Request::create("/api/v1", "PUT", [], [], [], ["CONTENT_TYPE" => "application/json"], json_encode(["habitaciones" => [["habitacion" => "Sencilla", "tarifas" => []]]]));
$request->setContainer($app);
$validator = validator($request->all(), (new App\Http\Requests\Catalog\UpdateHotelRequest())->rules());
echo json_encode($validator->validated());

