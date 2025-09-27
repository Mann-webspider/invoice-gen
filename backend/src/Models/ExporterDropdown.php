<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ExporterDropdown extends Model
{
    use HasUuids;
    protected $fillable = [
        
        'company_name',
        'company_address',
        'email',
        'tax_id',
        'ie_code',
        'pan_number',
        'gstin_number',
        'state_code',
        'authorized_name',
        'authorized_designation',
        'contact_number',
        "company_prefix",
        'last_invoice_number',
        'invoice_year'
    ];
    public $incrementing = false;
    protected $primaryKey = 'id';
    protected $table = "exporters_dropdown";
    protected $keyType = 'string';
    public $timestamps = false;
} 