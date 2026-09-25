const fs = require('fs');
const file = 'laravel-api/app/Http/Controllers/Api/v1/User/UserAgenciaController.php';
let code = fs.readFileSync(file, 'utf8');

const newMethod = `
    public function assignMetodosPago(Request $request, User $user): JsonResponse
    {
        $this->ensureAuthorized($request, true);
        $this->ensureIsAgencyUser($user);

        $validated = $request->validate([
            'metodos' => 'array',
            'metodos.*' => 'integer|exists:metodos_pago,id'
        ]);

        \\App\\Models\\Finance\\MetodoPagoAsesor::where('id_asesor', $user->id)->delete();

        if (!empty($validated['metodos'])) {
            $insertData = array_map(function ($id_metodo) use ($user) {
                return [
                    'id_metodo' => $id_metodo,
                    'id_asesor' => $user->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }, $validated['metodos']);
            
            \\App\\Models\\Finance\\MetodoPagoAsesor::insert($insertData);
        }

        return response()->json(['message' => 'Métodos de pago asignados correctamente.']);
    }

    public function destroy`;

code = code.replace(/public function destroy/, newMethod);
fs.writeFileSync(file, code, 'utf8');

const routeFile = 'laravel-api/routes/api.php';
let routeCode = fs.readFileSync(routeFile, 'utf8');
routeCode = routeCode.replace(/Route::patch\('\/v1\/users\/agencia\/\{user\}\/toggle-status', \[UserAgenciaController::class, 'toggleStatus'\]\);/, `Route::patch('/v1/users/agencia/{user}/toggle-status', [UserAgenciaController::class, 'toggleStatus']);\n    Route::post('/v1/users/agencia/{user}/metodos-pago', [UserAgenciaController::class, 'assignMetodosPago']);`);
fs.writeFileSync(routeFile, routeCode, 'utf8');

console.log("Controller and Routes updated.");
