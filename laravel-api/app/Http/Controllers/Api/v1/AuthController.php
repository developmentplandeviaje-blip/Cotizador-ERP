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

    /**
     * Get all associated accounts for the authenticated user.
     * Evaluates users with matching normalized name or shared Aliado ID.
     */
    public function getAssociatedAccounts(Request $request)
    {
        $currentUser = $request->user();
        if (!$currentUser) {
            return response()->json(['success' => false, 'accounts' => []], 401);
        }

        $cleanFirst = trim(preg_replace('/\s*\(admin\)\s*/i', '', (string)$currentUser->first_name));
        $cleanLast = trim((string)$currentUser->last_name);

        $query = User::where('status', 1);

        $query->where(function ($q) use ($currentUser, $cleanFirst, $cleanLast) {
            $q->where('id', $currentUser->id);

            if (!empty($cleanFirst) && !empty($cleanLast)) {
                $q->orWhere(function ($sub) use ($cleanFirst, $cleanLast) {
                    $sub->whereRaw("REPLACE(REPLACE(LOWER(TRIM(first_name)), '(admin)', ''), ' ', '') = ?", [
                        str_replace(' ', '', strtolower($cleanFirst))
                    ])
                    ->whereRaw("REPLACE(LOWER(TRIM(last_name)), ' ', '') = ?", [
                        str_replace(' ', '', strtolower($cleanLast))
                    ]);
                });
            }

            if (!empty($currentUser->id_aliado)) {
                $q->orWhere('id_aliado', $currentUser->id_aliado);
            }
        });

        $accounts = $query->orderBy('id', 'asc')->get()->map(function ($u) use ($currentUser) {
            return [
                'id' => $u->id,
                'first_name' => trim((string)$u->first_name),
                'last_name' => trim((string)$u->last_name),
                'email' => $u->email,
                'level' => $u->level,
                'is_current' => $u->id === $currentUser->id,
            ];
        });

        return response()->json([
            'success' => true,
            'current_user_id' => $currentUser->id,
            'total' => $accounts->count(),
            'accounts' => $accounts,
        ]);
    }

    /**
     * Switch session to an associated user account.
     */
    public function switchAccount(Request $request)
    {
        $currentUser = $request->user();
        if (!$currentUser) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $targetId = $request->input('target_user_id');
        if (!$targetId) {
            return response()->json(['message' => 'ID de usuario requerido.'], 422);
        }

        $cleanFirst = trim(preg_replace('/\s*\(admin\)\s*/i', '', (string)$currentUser->first_name));
        $cleanLast = trim((string)$currentUser->last_name);

        $targetUser = User::where('id', $targetId)
            ->where('status', 1)
            ->where(function ($q) use ($currentUser, $cleanFirst, $cleanLast) {
                $q->where('id', $currentUser->id);

                if (!empty($cleanFirst) && !empty($cleanLast)) {
                    $q->orWhere(function ($sub) use ($cleanFirst, $cleanLast) {
                        $sub->whereRaw("REPLACE(REPLACE(LOWER(TRIM(first_name)), '(admin)', ''), ' ', '') = ?", [
                            str_replace(' ', '', strtolower($cleanFirst))
                        ])
                        ->whereRaw("REPLACE(LOWER(TRIM(last_name)), ' ', '') = ?", [
                            str_replace(' ', '', strtolower($cleanLast))
                        ]);
                    });
                }

                if (!empty($currentUser->id_aliado)) {
                    $q->orWhere('id_aliado', $currentUser->id_aliado);
                }
            })
            ->first();

        if (!$targetUser) {
            return response()->json(['message' => 'Cuenta asociada no válida o inaccesible.'], 403);
        }

        // Generate Sanctum token for the target user
        $token = $targetUser->createToken('auth_token')->plainTextToken;

        $branding = null;
        if ($targetUser->level === 'Freelancer') {
            $freelancer = \Illuminate\Support\Facades\DB::table('freelancer')->where('id', $targetUser->id_freelancer)->first();
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
            'success' => true,
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $targetUser->id,
                'first_name' => $targetUser->first_name,
                'last_name' => $targetUser->last_name,
                'email' => $targetUser->email,
                'level' => $targetUser->level,
                'branding' => $branding,
            ]
        ], 200);
    }
}
