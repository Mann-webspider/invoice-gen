<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Annexure extends Model
{
    use HasUuids;
    protected $fillable = [
        
        
        'invoice_number',
        'invoice_date',
        'range',
        'division',
        'commissionerate',
        'exam_date',
        'net_weight',
        'gross_weight',
        'total_packages',
        'officer_designation1',
        'officer_designation2',
        'lut_date',
        'location_code',
        'sample_seal_no',
        'question9a',
        'question9b',
        'question9c',
        'non_containerized',
        'containerized',
        'manufacturer_name',
        'manufacturer_address',
        'manufacturer_gstin_no',
        'manufacturer_permission'
    ];
    
    
    
    public $timestamps = false;
    
    protected $primaryKey = 'id';
    
    protected $table = 'annexure';
} 