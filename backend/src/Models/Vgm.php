<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
class Vgm extends Model
{
    use HasUuids;
    protected $fillable = [
  
        'invoice_id',
        'invoice_number',
        'IMDG_class',
        'authorized_name',
        'authorized_contact',
        'container_number',
        'container_size',
        'dt_weighing',
        'ie_code',
        'permissible_weight',
        'shipper_name',
        'type',
        'unit_of_measurement',
        'verified_gross_mass',
        'weighbridge_registration',
        'weighing_slip_no',
        'containers_id'
    ];
    
  
    
    public $timestamps = false;
    
    protected $primaryKey = 'id';
    
    protected $casts = [
        
        'containers_id' => 'json'
    ];
    protected $table = 'vgm';
    public function getContainersAttribute()
    {
        if (empty($this->containers_id)) {
            return new Collection();
        }
        
        $ids = is_array($this->containers_id) ? $this->containesr_id : json_decode($this->containers_id, true);
        if (empty($ids)) {
            return new Collection();
        }
        
        return VgmContainer::whereIn('id', $ids)->get();
    }
} 