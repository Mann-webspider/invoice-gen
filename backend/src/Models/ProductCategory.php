<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ProductCategory extends Model
{
    use HasUuids;
    protected $fillable = [
        "description",
        "hsn_code"
        
    ];
    public $incrementing = false;
    protected $primaryKey = 'id';
    
    protected $keyType = 'string';
    protected $table = 'product_category';

    public $timestamps = false;
} 