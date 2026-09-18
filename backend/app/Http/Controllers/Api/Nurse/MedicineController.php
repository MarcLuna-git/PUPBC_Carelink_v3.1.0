<?php

namespace App\Http\Controllers\Api\Nurse;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use Illuminate\Http\Request;

class MedicineController extends Controller
{
    public function index(Request $request)
    {
        $query = Medicine::query();

        // Search
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('generic_name', 'like', "%{$request->search}%")
                  ->orWhere('category', 'like', "%{$request->search}%");
            });
        }

        // Filter by category
        if ($request->category) {
            $query->where('category', $request->category);
        }

        // Filter low stock
        if ($request->low_stock) {
            $query->lowStock();
        }

        // Filter expiring soon
        if ($request->expiring_soon) {
            $query->expiringSoon();
        }

        $medicines = $query->orderBy('name')->paginate(20);

        // Add computed fields
        $medicines->getCollection()->transform(function ($medicine) {
            $medicine->is_low_stock = $medicine->quantity <= $medicine->minimum_stock;
            $medicine->is_expiring_soon = $medicine->expiry_date && $medicine->expiry_date <= now()->addMonths(3);
            $medicine->is_expired = $medicine->expiry_date && $medicine->expiry_date < now();
            $medicine->status = $medicine->is_expired ? 'expired' : ($medicine->is_low_stock ? 'low_stock' : ($medicine->is_expiring_soon ? 'expiring_soon' : 'ok'));
            return $medicine;
        });

        return response()->json([
            'success' => true,
            'data' => $medicines
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:100',
            'quantity' => 'required|integer|min:0',
            'minimum_stock' => 'nullable|integer|min:0',
            'unit' => 'nullable|string|max:50',
            'dosage' => 'nullable|string|max:100',
            'expiry_date' => 'nullable|date',
            'description' => 'nullable|string',
        ]);

        $medicine = Medicine::create([
            ...$request->all(),
            'added_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Medicine added successfully.',
            'data' => $medicine
        ], 201);
    }

    public function show($id)
    {
        $medicine = Medicine::findOrFail($id);
        return response()->json(['success' => true, 'data' => $medicine]);
    }

    public function update(Request $request, $id)
    {
        $medicine = Medicine::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:100',
            'quantity' => 'sometimes|integer|min:0',
            'minimum_stock' => 'nullable|integer|min:0',
            'unit' => 'nullable|string|max:50',
            'dosage' => 'nullable|string|max:100',
            'expiry_date' => 'nullable|date',
            'description' => 'nullable|string',
        ]);

        $medicine->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Medicine updated successfully.',
            'data' => $medicine->fresh()
        ]);
    }

    public function addStock(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $medicine = Medicine::findOrFail($id);
        $medicine->increment('quantity', $request->quantity);

        return response()->json([
            'success' => true,
            'message' => "Added {$request->quantity} units. New stock: {$medicine->quantity}.",
            'data' => $medicine->fresh()
        ]);
    }

    public function reduceStock(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $medicine = Medicine::findOrFail($id);

        if ($medicine->quantity < $request->quantity) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient stock.'
            ], 400);
        }

        $medicine->decrement('quantity', $request->quantity);

        return response()->json([
            'success' => true,
            'message' => "Removed {$request->quantity} units. Remaining stock: {$medicine->quantity}.",
            'data' => $medicine->fresh()
        ]);
    }

    public function destroy($id)
    {
        $medicine = Medicine::findOrFail($id);
        $medicine->delete();

        return response()->json([
            'success' => true,
            'message' => 'Medicine deleted successfully.'
        ]);
    }

    public function stats()
    {
        $total = Medicine::count();
        $lowStock = Medicine::lowStock()->count();
        $expiringSoon = Medicine::expiringSoon()->count();
        $expired = Medicine::expired()->count();
        $totalQuantity = Medicine::sum('quantity');

        return response()->json([
            'success' => true,
            'data' => [
                'total_medicines' => $total,
                'low_stock' => $lowStock,
                'expiring_soon' => $expiringSoon,
                'expired' => $expired,
                'total_quantity' => $totalQuantity,
            ]
        ]);
    }

    public function categories()
    {
        $categories = Medicine::whereNotNull('category')
            ->distinct()
            ->pluck('category');

        return response()->json(['success' => true, 'data' => $categories]);
    }
}