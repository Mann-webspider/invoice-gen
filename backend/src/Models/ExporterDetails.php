<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ExporterDetails extends Model
{
    use HasUuids;
    protected $fillable = [
        'id',
        'company_name',
        'company_address',
        'contact_number',
        'authorized_name',
        'authorized_designation',
        'email',
        'tax_id',
        'ie_code',
        'pan_number',
        'gstin_number',
        'state_code'
    ];
    public $incrementing = false;
    protected $primaryKey = 'id';

    protected $keyType = 'string';
    public $timestamps = false;
} 