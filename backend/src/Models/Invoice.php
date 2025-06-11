<?php

namespace Shelby\OpenSwoole\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasUuids;
    protected $fillable = [

        "invoice_number",
        'invoice_date',
        "integrated_tax",
        "payment_term",
        "product_type",
        "currancy_type",
        "currancy_rate",
        "exporter_id",
        "buyer_id",
        "product_id",
        "supplier_ids",
        "shipping_id",
        "package_id",
        "annexure_id",
        "vgm_id"
    ];
    public $incrementing = false;
    protected $primaryKey = 'id';

    protected $keyType = 'string';
    public $timestamps = true;
    protected $table = 'invoice';

    public function exporter()
    {
        return $this->belongsTo(ExporterDetails::class, 'exporter_id');
    }

    public function buyer()
    {
        return $this->belongsTo(BuyerDetails::class, 'buyer_id');
    }

    public function productDetails()
    {
        return $this->belongsTo(ProductDetails::class, 'product_id');
    }

    public function suppliers()
    {
        return $this->belongsTo(SupplierDetails::class, 'supplier_ids');
    }
 public function getSuppliersAttribute()
{
    if (empty($this->supplier_ids) || !is_string($this->supplier_ids)) {
        return collect(); // return empty collection
    }

    $ids = json_decode($this->supplier_ids, true);

    if (!is_array($ids)) {
        return collect(); // fallback in case JSON is invalid
    }

    return SupplierDetails::whereIn('id', $ids)->get();
}


    public function shipping()
    {
        return $this->belongsTo(ShippingDetail::class, 'shipping_id');
    }

    public function package()
    {
        return $this->belongsTo(PackageInformation::class, 'package_id');
    }

    public function productLists()
    {
        return $this->belongsTo(ProductLists::class, 'product_id');
    }

    public function annexure()
    {
        return $this->belongsTo(Annexure::class, 'annexure_id');
    }
    public function vgm()
    {
        return $this->belongsTo(Vgm::class, 'vgm_id');
    }
    public function container()
    {
        return $this->belongsTo(VgmContainer::class, 'containers_id');
    }
}