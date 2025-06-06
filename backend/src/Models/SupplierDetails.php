<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SupplierDetails extends Model
{
    use HasUuids;
    protected $fillable = [
        'supplier_name',
        'supplier_address',
        'gstin_number',
        'tax_invoice_no',
        'date',
    ];
    public $incrementing = false;
    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $timestamps = false;
} 