<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
class ProductLists extends Model
{
    use HasUuids;
    protected $fillable = [
        'category_id',
        'product_name',
        'size',
        'quantity',
        'unit',
        'sqm',
        'total_sqm',
        'price',
        'total_price',
        'net_weight',
        'gross_weight'
        
    ];
    public $incrementing = false;
    protected $primaryKey = 'id';
   
    protected $keyType = 'string';

    public $timestamps = false;

    public function category()
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }
} 