<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ContainerInformation extends Model
{
    use HasUuids;
    protected $fillable = [
        'container_number',
        'line_seal_number',
        'rfid_number',
        'design_no',
        'quantity_box',
        
        'net_weight',
        'gross_weight'
        
    ];
    public $incrementing = false;
    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $timestamps = false;
} 