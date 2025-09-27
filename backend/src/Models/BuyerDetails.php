<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BuyerDetails extends Model
{
    use HasUuids;
    protected $fillable = [
        "order_number",
        "order_date",
        "po_number",
        "consignee",
        "notify_party",
    ];

    public $incrementing = false;
    protected $primaryKey = 'id';

    protected $keyType = 'string';
    public $timestamps = false;
   
} 