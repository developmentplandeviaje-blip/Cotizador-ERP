<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['id_user', 'email', 'ip', 'data', 'method', 'status', 'date'])]
class LoginLog extends Model
{
    use HasFactory;

    protected $table = 'login_logs';
    protected $primaryKey = 'id';
    public $timestamps = false;
}
