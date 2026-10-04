<?php

namespace App\Console\Commands;

use App\Models\Medicine;
use App\Models\MedicineBatch;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Console\Command;

class NotifyExpiringMedicines extends Command
{
    protected $signature = 'medicines:notify-expiring';
    protected $description = 'Notify nurses about medicine expiring within three months';

    public function handle(): int
    {
        $today = today();
        $through = today()->addMonths(3);
        $items = collect();

        $medicines = Medicine::expiringSoon()
            ->where('quantity', '>', 0)
            ->whereDate('expiry_date', '>=', $today)
            ->whereDoesntHave('batches')
            ->get();
        foreach ($medicines as $medicine) {
            $items->push([
                'medicine_id' => $medicine->id,
                'batch_id' => null,
                'name' => $medicine->name,
                'expiry_date' => $medicine->expiry_date->toDateString(),
            ]);
        }

        $batches = MedicineBatch::with('medicine')
            ->where('quantity', '>', 0)
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '>=', $today)
            ->whereDate('expiry_date', '<=', $through)
            ->get();
        foreach ($batches as $batch) {
            $items->push([
                'medicine_id' => $batch->medicine_id,
                'batch_id' => $batch->id,
                'name' => $batch->medicine->name,
                'expiry_date' => $batch->expiry_date->toDateString(),
            ]);
        }

        $created = 0;
        foreach (User::where('role', 'nurse')->get(['id']) as $nurse) {
            $notified = Notification::where('user_id', $nurse->id)
                ->where('type', 'medicine_expiring_soon')
                ->get(['data'])
                ->mapWithKeys(function ($notification) {
                    $data = $notification->data ?? [];
                    return [($data['medicine_id'] ?? '') . ':' . ($data['medicine_batch_id'] ?? '') => true];
                });

            foreach ($items as $item) {
                $key = $item['medicine_id'] . ':' . ($item['batch_id'] ?? '');
                if ($notified->has($key)) {
                    continue;
                }
                Notification::create([
                    'user_id' => $nurse->id,
                    'type' => 'medicine_expiring_soon',
                    'title' => 'Medicine Expiring Soon',
                    'message' => $item['name'] . ' expires on ' . $item['expiry_date'] . '.',
                    'data' => [
                        'medicine_id' => $item['medicine_id'],
                        'medicine_batch_id' => $item['batch_id'],
                        'expiry_date' => $item['expiry_date'],
                    ],
                ]);
                $notified->put($key, true);
                $created++;
            }
        }

        $this->info("Created {$created} expiring-medicine notification(s).");
        return self::SUCCESS;
    }
}
