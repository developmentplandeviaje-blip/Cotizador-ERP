<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\AuthController;

// Public routes
Route::post('/v1/auth/login', [AuthController::class, 'login']);

Route::get('/test', function () {
    return response()->json(['message' => '¡Conexión exitosa desde Laravel!']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/v1/auth/profile', [AuthController::class, 'profile']);
    Route::post('/v1/auth/logout', [AuthController::class, 'logout']);
});
