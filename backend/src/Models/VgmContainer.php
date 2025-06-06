<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class VgmContainer extends Model
{
    use HasUuids;
    protected $fillable = [
     
        'booking_no',
        'container_no',
        'tare_weight',
        'gross_weight',
        'total_vgm'
    ];
    
   
    
    public $timestamps = false;
    
    protected $primaryKey = 'id';
    
    protected $table = 'vgm_container';
} 