<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\AuthController;
use App\Http\Controllers\Api\v1\Catalog\HotelController;
use App\Http\Controllers\Api\v1\Catalog\HabitacionController;
use App\Http\Controllers\Api\v1\Catalog\TarifaController;
use App\Http\Controllers\Api\v1\Catalog\UbicacionController;

// Public routes
Route::post('/v1/auth/login', [AuthController::class, 'login']);

Route::get('/test', function () {
    return response()->json(['message' => '¡Conexión exitosa desde Laravel!']);
});

// Protected routes (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    // Auth profile & logout
    Route::get('/v1/auth/profile', [AuthController::class, 'profile']);
    Route::post('/v1/auth/logout', [AuthController::class, 'logout']);

    // Catalog: Ubicaciones
    Route::get('/v1/catalog/ubicaciones', [UbicacionController::class, 'index']);

    // Catalog: Hoteles
    Route::apiResource('/v1/catalog/hoteles', HotelController::class);
    Route::patch('/v1/catalog/hoteles/{hotel}/toggle-status', [HotelController::class, 'toggleStatus']);

    // Catalog: Habitaciones
    Route::get('/v1/catalog/hoteles/{hotel}/habitaciones', [HabitacionController::class, 'index']);
    Route::post('/v1/catalog/habitaciones', [HabitacionController::class, 'store']);
    Route::get('/v1/catalog/habitaciones/{habitacion}', [HabitacionController::class, 'show']);
    Route::delete('/v1/catalog/habitaciones/{habitacion}', [HabitacionController::class, 'destroy']);

    // Catalog: Tarifas
    Route::get('/v1/catalog/habitaciones/{habitacion}/tarifas', [TarifaController::class, 'index']);
    Route::post('/v1/catalog/tarifas', [TarifaController::class, 'store']);
    Route::get('/v1/catalog/tarifas/{tarifa}', [TarifaController::class, 'show']);
    Route::delete('/v1/catalog/tarifas/{tarifa}', [TarifaController::class, 'destroy']);
});
