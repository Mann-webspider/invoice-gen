<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Dropdown;

class DropdownController extends Controller
{
    public function index($type)
    {
        return Dropdown::where('type', $type)->get();
    }

    public function store(Request $request, $type)
    {
        $request->validate([
            'value' => 'required|string|max:255',
            'is_default' => 'boolean'
        ]);

        if ($request->is_default) {
            Dropdown::where('type', $type)->update(['is_default' => false]);
        }

        return Dropdown::create([
            'type' => $type,
            'value' => $request->value,
            'is_default' => $request->is_default ?? false
        ]);
    }

    public function update(Request $request, $id)
    {
        $dropdown = Dropdown::findOrFail($id);

        $request->validate([
            'value' => 'required|string|max:255',
            'is_default' => 'boolean'
        ]);

        if ($request->is_default) {
            Dropdown::where('type', $dropdown->type)->update(['is_default' => false]);
        }

        $dropdown->update([
            'value' => $request->value,
            'is_default' => $request->is_default ?? false
        ]);

        return $dropdown;
    }

    public function destroy($id)
    {
        Dropdown::destroy($id);
        return response()->json(['message' => 'Deleted successfully']);
    }
}
