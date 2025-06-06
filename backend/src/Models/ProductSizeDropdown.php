<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ProductSizeDropdown extends Model
{
    use HasUuids;
    protected $fillable = [
        "size",
        "sqm"
        
    ];
    public $incrementing = false;
    protected $primaryKey = 'id';
    
    protected $keyType = 'string';
    protected $table = 'product_size_dropdown';

    public $timestamps = false;
} 