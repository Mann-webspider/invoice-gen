<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Draft extends Model
{
    use HasUuids;
    protected $fillable = [
        
        "data",
        "last_page",
        "is_submitted",
    ];
    
    
    
    public $timestamps = true;
    
    protected $primaryKey = 'id';
    
    protected $table = 'form_drafts';
} 