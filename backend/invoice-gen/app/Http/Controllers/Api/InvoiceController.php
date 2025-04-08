<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InvoiceController extends Controller
{
    public function index()
    {
        return Invoice::with('items')
            ->where('created_by', Auth::id())
            ->latest()
            ->get();
    }

    public function store(Request $request)
    {
        $invoice = Invoice::create([
            'invoice_number' => $request->invoice_number,
            'customer_name' => $request->customer_name,
            'date' => $request->date,
            'total_amount' => $request->total_amount,
            'created_by' => Auth::id(),
        ]);

        foreach ($request->items as $item) {
            $invoice->items()->create($item);
        }

        return response()->json($invoice->load('items'), 201);
    }

    public function show(Invoice $invoice)
    {
        return $invoice->load('items');
    }

    public function update(Request $request, Invoice $invoice)
    {
        $invoice->update($request->only(['invoice_number', 'customer_name', 'date', 'total_amount']));
        $invoice->items()->delete();
        foreach ($request->items as $item) {
            $invoice->items()->create($item);
        }
        return response()->json($invoice->load('items'));
    }

    public function destroy(Invoice $invoice)
    {
        $invoice->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
