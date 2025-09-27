<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ShippingDetail extends Model
{
    use HasUuids;
    protected $fillable = [
        'place_of_receipt',
        'port_of_loading',
        'port_of_discharge',
        'pre_carriage',
        'shipping_number',
        'country_of_origin',
        'origin_details',
        'country_of_final_destination',
        'terms_of_delivery',
        'payment',
        'shipping_method',
        'vessel_flight_no',
        'final_destination'
    ];

    public $incrementing = false;
    protected $primaryKey = 'id';

    protected $keyType = 'string';
    public $timestamps = false;
} 