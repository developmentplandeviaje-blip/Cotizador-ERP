<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\AuthController;
use App\Http\Controllers\Api\v1\Catalog\HotelController;
use App\Http\Controllers\Api\v1\Catalog\HabitacionController;
use App\Http\Controllers\Api\v1\Catalog\TarifaController;
use App\Http\Controllers\Api\v1\Catalog\UbicacionController;
use App\Http\Controllers\Api\v1\Catalog\ExcursionController;
use App\Http\Controllers\Api\v1\Catalog\PaqueteController;
use App\Http\Controllers\Api\v1\Catalog\VehiculoController;
use App\Http\Controllers\Api\v1\Catalog\VehiculoAgenciaController;
use App\Http\Controllers\Api\v1\Catalog\VehiculoTarifaController;
use App\Http\Controllers\Api\v1\Catalog\TrasladoController;
use App\Http\Controllers\Api\v1\Catalog\AerolineaController;
use App\Http\Controllers\Api\v1\User\UserAgenciaController;
use App\Http\Controllers\Api\v1\Finance\MetodoPagoController;

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
    Route::apiResource('/v1/catalog/ubicaciones', UbicacionController::class)->parameters([
        'ubicaciones' => 'ubicacion'
    ]);

    // Catalog: Excursiones
    Route::apiResource('/v1/catalog/excursiones', ExcursionController::class)->parameters([
        'excursiones' => 'excursion'
    ]);

    // Catalog: Paquetes
    Route::apiResource('/v1/catalog/paquetes', PaqueteController::class)->parameters([
        'paquetes' => 'paquete'
    ]);

    // Catalog: Vehículos & Agencias
    Route::apiResource('/v1/catalog/vehiculos', VehiculoController::class)->parameters([
        'vehiculos' => 'vehiculo'
    ]);
    Route::apiResource('/v1/catalog/vehiculo-agencias', VehiculoAgenciaController::class)->parameters([
        'vehiculo-agencias' => 'agencia'
    ]);
    Route::get('/v1/catalog/vehiculos/{vehiculo}/tarifas', [VehiculoTarifaController::class, 'index']);
    Route::post('/v1/catalog/vehiculos/{vehiculo}/tarifas', [VehiculoTarifaController::class, 'store']);
    Route::delete('/v1/catalog/tarifas-vehiculo/{tarifa}', [VehiculoTarifaController::class, 'destroy']);

    // Catalog: Traslados
    Route::apiResource('/v1/catalog/traslados', TrasladoController::class)->parameters([
        'traslados' => 'traslado'
    ]);

    // Catalog: Aerolíneas
    Route::apiResource('/v1/catalog/aerolineas', AerolineaController::class)->parameters([
        'aerolineas' => 'aerolinea'
    ]);

    // Catalog: Hoteles
    Route::apiResource('/v1/catalog/hoteles', HotelController::class)->parameters([
        'hoteles' => 'hotel'
    ]);
    Route::post('/v1/catalog/hoteles/descuento-masivo', [HotelController::class, 'descuentoMasivo']);
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

    // Users: Agencia
    Route::apiResource('/v1/users/agencia', UserAgenciaController::class)->parameters([
        'agencia' => 'user'
    ]);
    Route::patch('/v1/users/agencia/{user}/toggle-status', [UserAgenciaController::class, 'toggleStatus']);
    Route::post('/v1/users/agencia/{user}/metodos-pago', [UserAgenciaController::class, 'assignMetodosPago']);

    // Finance: Métodos de Pago
    Route::apiResource('/v1/finance/metodos-pago', MetodoPagoController::class)->parameters([
        'metodos-pago' => 'metodoPago'
    ]);
    Route::patch('/v1/finance/metodos-pago/{metodoPago}/toggle-status', [MetodoPagoController::class, 'toggleStatus']);
    Route::post('/v1/finance/metodos-pago/{metodoPago}/asesores', [MetodoPagoController::class, 'assignAsesores']);
});
