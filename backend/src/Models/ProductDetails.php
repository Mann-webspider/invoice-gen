<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class ProductDetails extends Model
{
    use HasUuids;
    protected $fillable = [
        'marks',
        'nos',
        'frieght',
        'insurance',
        'total_pallet_count',
        'total_price',
        'product_ids',
        'container_ids',
    ];
    public $incrementing = false;
    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $timestamps = false;

    protected $casts = [
        'product_ids' => 'json',
        'container_ids' => 'json'
    ];

    public function getProductsAttribute()
    {
        if (empty($this->product_ids)) {
            return new Collection();
        }
        
        $ids = is_array($this->product_ids) ? $this->product_ids : json_decode($this->product_ids, true);
        if (empty($ids)) {
            return new Collection();
        }
        
        return ProductLists::whereIn('id', $ids)->get();
    }

    public function getContainersAttribute()
    {
        if (empty($this->container_ids)) {
            return new Collection();
        }
        
        $ids = is_array($this->container_ids) ? $this->container_ids : json_decode($this->container_ids, true);
        if (empty($ids)) {
            return new Collection();
        }
        
        return ContainerInformation::whereIn('id', $ids)->get();
    }
} 