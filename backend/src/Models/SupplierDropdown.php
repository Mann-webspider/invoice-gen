<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SupplierDropdown extends Model
{
    use HasUuids;
    protected $fillable = [
        'name',
        'gstin_number',
        "address",
        "permission"
    ];
    public $incrementing = false;
    protected $primaryKey = 'id';
    protected $table = 'suppliers_dropdown';
    protected $keyType = 'string';

    public $timestamps = false;
} 