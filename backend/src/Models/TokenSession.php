<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TokenSession extends Model
{
    use HasUuids;
    protected $fillable = ['user_id', 'token'];
    
    protected $hidden = ['password'];
    
    public $timestamps = true;
    
    protected $primaryKey = 'id';
    
    protected $table = 'token_sessions';
} 