<?php

namespace Shelby\OpenSwoole\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ArnDeclaration extends Model
{   
    
    protected $fillable = [
        'id',
        "arn",
        "gst_circular",
    ];
    public $incrementing = false;
    protected $primaryKey = 'id';

    protected $table = 'arn_dropdown';
    public $timestamps = false;
} 