<?php
require __DIR__."/vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$req = App\Http\Requests\Catalog\UpdateHotelRequest::create("/api", "PUT", ["habitaciones" => [["habitacion" => "Sencilla"]]]);
$req->setContainer($app);
$v = validator($req->all(), (new App\Http\Requests\Catalog\UpdateHotelRequest())->rules());
echo json_encode($v->validated());

