<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use App\Models\LoginLog;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    /**
     * Authenticate user and issue API Token.
     */
    public function login(LoginRequest $request)
    {
        $credentials = $request->validated();
        $email = $credentials['email'];
        $password = $credentials['password'];

        $user = User::where('email', $email)->first();

        $ip = $request->ip() ?? '127.0.0.1';
        $data = json_encode([
            'user_agent' => $request->userAgent(),
            'payload' => [
                'email' => $email,
            ]
        ]);

        if (!$user) {
            Log::warning("Intento de inicio de sesión fallido para email inexistente: {$email} desde la IP {$ip}");
            return response()->json([
                'message' => 'Credenciales incorrectas o usuario no encontrado.'
            ], 422);
        }

        // Check password
        if (!Hash::check($password, $user->password)) {
            LoginLog::create([
                'id_user' => $user->id,
                'email' => $email,
                'ip' => $ip,
                'data' => $data,
                'method' => 'POST',
                'status' => 'failed',
                'date' => now(),
            ]);

            return response()->json([
                'message' => 'Credenciales incorrectas o usuario no encontrado.'
            ], 422);
        }

        // Check user active status
        if (!$user->status) {
            LoginLog::create([
                'id_user' => $user->id,
                'email' => $email,
                'ip' => $ip,
                'data' => $data,
                'method' => 'POST',
                'status' => 'blocked',
                'date' => now(),
            ]);

            return response()->json([
                'message' => 'Cuenta inhabilitada. Contacte al administrador.'
            ], 403);
        }

        // Login successful
        LoginLog::create([
            'id_user' => $user->id,
            'email' => $email,
            'ip' => $ip,
            'data' => $data,
            'method' => 'POST',
            'status' => 'success',
            'date' => now(),
        ]);

        // Generate Sanctum token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Fetch freelancer branding details if freelancer
        $branding = null;
        if ($user->level === 'Freelancer') {
            $freelancer = \Illuminate\Support\Facades\DB::table('freelancer')->where('id', $user->id_freelancer)->first();
            if ($freelancer) {
                $branding = [
                    'rif' => $freelancer->rif,
                    'color_primario' => $freelancer->color_primario,
                    'logo_url' => $freelancer->logo_url,
                    'hoja_membrete_config' => json_decode($freelancer->hoja_membrete_config, true),
                ];
            }
        }

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'level' => $user->level,
                'branding' => $branding,
            ]
        ], 200);
    }

    /**
     * Get authenticated user profile.
     */
    public function profile(Request $request)
    {
        $user = $request->user();

        $branding = null;
        if ($user->level === 'Freelancer') {
            $freelancer = \Illuminate\Support\Facades\DB::table('freelancer')->where('id', $user->id_freelancer)->first();
            if ($freelancer) {
                $branding = [
                    'rif' => $freelancer->rif,
                    'color_primario' => $freelancer->color_primario,
                    'logo_url' => $freelancer->logo_url,
                    'hoja_membrete_config' => json_decode($freelancer->hoja_membrete_config, true),
                ];
            }
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'level' => $user->level,
                'branding' => $branding,
            ]
        ], 200);
    }

    /**
     * Terminate the session (revoke token).
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada exitosamente.'
        ], 200);
    }
}
