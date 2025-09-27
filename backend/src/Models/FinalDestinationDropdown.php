<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class FinalDestinationDropdown extends Model
{
    use HasUuids;
    protected $table = 'country_dropdown_options';
    
    protected $fillable = [
        
        'port_of_discharge',
        'final_destination',
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