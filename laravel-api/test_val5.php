<?php
require __DIR__."/vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$request = Illuminate\Http\Request::create("/api", "POST", ["habitaciones" => [["habitacion" => "Sencilla"]]]);
$rules = ["habitaciones" => "array"];
$v = validator($request->all(), $rules);
var_dump($v->validated());

