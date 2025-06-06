<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DropdownOption extends Model
{
    use HasUuids;
    protected $table = 'dropdown_options';
    
    protected $fillable = [
        
        'category',
        'value',
        'is_active',
        
    ];
    public $incrementing = false;
    protected $primaryKey = 'id';

    protected $keyType = 'string';
    
    public $timestamps = true;
    
    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }
} 