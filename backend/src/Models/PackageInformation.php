<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PackageInformation extends Model
{
    use HasUuids;
    protected $fillable = [
        'number_of_package',
        'total_gross_weight',
        'total_net_weight',
        'gst_circular',
        'app_ref_number',
        'total_sqm',
        'taxable_value',
        'gst_amount',
        'lut_date',
        'total_amount',
        'amount_in_words'
        
    ];
    public $incrementing = false;
    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $timestamps = false;
} 