<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    use HasUuids;
    protected $fillable = ['name', 'email', 'password','role'];
    
    protected $hidden = ['password'];
    
    public $timestamps = true;
    
    protected $primaryKey = 'id';
    
    protected $table = 'users';
} 