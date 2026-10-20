<?php

namespace Database\Seeders;

use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Models\Supplier;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET CONSTRAINTS ALL DEFERRED');

        // 1. Create the main accounts (Kept original credentials)
        $admin = User::firstOrCreate(
            ['email' => 'admin@medisync.test'],
            ['full_name' => 'Ynigo Panisa', 'password_hash' => Hash::make('password123'), 'role' => 'admin', 'status' => 'active']
        );
        $pharmacist = User::firstOrCreate(
            ['email' => 'pharmacist@medisync.test'],
            ['full_name' => 'Marinel Delima', 'password_hash' => Hash::make('password123'), 'role' => 'pharmacist', 'status' => 'active']
        );
        $assistant = User::firstOrCreate(
            ['email' => 'assistant@medisync.test'],
            ['full_name' => 'Arnold Gabutero', 'password_hash' => Hash::make('password123'), 'role' => 'assistant', 'status' => 'active']
        );

        $users = [$admin->user_id, $pharmacist->user_id, $assistant->user_id];

        $this->command->info('Generating 150 Users...');
        // Generate 150 staff users for the User Management table
        $userData = [];
        for ($i = 1; $i <= 150; $i++) {
            $userData[] = [
                'full_name' => 'Staff ' . Str::random(5) . ' ' . $i,
                'email' => "staff{$i}@medisync.test",
                'password_hash' => Hash::make('password123'),
                'role' => rand(1, 20) === 1 ? 'admin' : (rand(1, 2) === 1 ? 'pharmacist' : 'assistant'),
                'status' => rand(1, 10) === 1 ? 'inactive' : 'active',
                'created_at' => Carbon::now()->subDays(rand(1, 365)),
            ];
        }
        
        foreach (array_chunk($userData, 50) as $chunk) {
            User::insert($chunk);
        }
        
        $allUserIds = User::pluck('user_id')->toArray();

        $this->command->info('Generating 30 Suppliers...');
        $supplierBases = ['Zuellig', 'Unilab', 'MedExpress', 'Pfizer', 'GSK', 'Novartis', 'Sanofi', 'Roche', 'Merck', 'AstraZeneca'];
        $supplierData = [];
        foreach ($supplierBases as $base) {
            for ($i = 1; $i <= 3; $i++) {
                $name = $base . ' Dist. ' . $i;
                $supplierData[] = [
                    'name' => $name,
                    'contact_person' => 'Rep ' . Str::random(4),
                    'phone' => '0917' . rand(1000000, 9999999),
                    'email' => strtolower(str_replace(' ', '', $name)) . '@example.com',
                    'address' => rand(1, 500) . ' Main St, City',
                    'status' => rand(1, 10) > 2 ? 'active' : 'inactive',
                    'created_at' => Carbon::now()->subDays(rand(1, 365)),
                ];
            }
        }
        foreach (array_chunk($supplierData, 100) as $chunk) {
            Supplier::insert($chunk);
        }
        $allSupplierIds = Supplier::pluck('supplier_id')->toArray();

        $this->command->info('Generating 150 Medicines...');
        $categories = ['Antibiotics', 'Vitamins', 'Painkillers', 'Allergies', 'Hypertension', 'Diabetes', 'Asthma', 'Cough', 'Stomach Pain', 'Anti-inflammatory'];
        $types = ['Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Ointment', 'Drops'];
        $dosages = ['100mg', '250mg', '500mg', '1000mg', '5mg', '10mg', '20mg', '50mg', '2mg/5ml', '1%', '2%', '5%'];
        
        $medicineData = [];
        for ($i = 0; $i < 150; $i++) {
            $medicineData[] = [
                'generic_name' => 'Generic ' . strtoupper(Str::random(6)),
                'brand_name' => 'Brand ' . strtoupper(Str::random(5)) . ' ' . $i,
                'category' => $categories[array_rand($categories)],
                'type' => $types[array_rand($types)],
                'dosage' => $dosages[array_rand($dosages)],
                'price' => rand(10, 1500) + (rand(0, 99) / 100),
                'current_stock' => 0,
                'created_at' => Carbon::now(),
            ];
        }
        foreach (array_chunk($medicineData, 50) as $chunk) {
            Medicine::insert($chunk);
        }
        $allMedicines = Medicine::all();

        $this->command->info('Generating Receiving and Dispensing records...');

        $now = Carbon::now();
        $stockInData = [];
        $stockOutData = [];

        foreach ($allMedicines as $index => $med) {
            $currentStock = 0;
            $numBatches = rand(20, 40); // 20 to 40 batches per medicine
            
            for ($i = 0; $i < $numBatches; $i++) {
                $qty = rand(50, 500);
                $cost = $med->price * (rand(50, 80) / 100);
                $expiry = $now->copy()->addMonths(rand(6, 36));
                
                if (rand(1, 100) <= 15) $expiry = $now->copy()->addDays(rand(1, 29)); 
                if (rand(1, 100) <= 5) $expiry = $now->copy()->subDays(rand(1, 30)); 

                $recordedAt = $now->copy()->subDays(rand(0, 365));

                $stockInData[] = [
                    'medicine_id' => $med->medicine_id,
                    'quantity' => $qty,
                    'batch_no' => 'BATCH-' . strtoupper(Str::random(8)),
                    'expiry_date' => $expiry,
                    'supplier' => 'Supplier Name',
                    'supplier_id' => $allSupplierIds[array_rand($allSupplierIds)],
                    'received_by' => $allUserIds[array_rand($allUserIds)],
                    'delivery_date' => $recordedAt,
                    'invoice_no' => 'INV-' . rand(100000, 999999),
                    'cost_price' => $cost,
                    'selling_price' => $med->price,
                    'remaining_quantity' => $qty,
                    'recorded_at' => $recordedAt,
                ];

                $currentStock += $qty;
            }

            $dispensePercentage = rand(70, 95) / 100;
            $targetDispense = floor($currentStock * $dispensePercentage);
            $totalDispensed = 0;
            $numDispenses = rand(30, 80); // 30 to 80 transactions per medicine

            for ($j = 0; $j < $numDispenses; $j++) {
                if ($totalDispensed >= $targetDispense) break;

                $dispenseQty = rand(1, 10);
                if ($totalDispensed + $dispenseQty > $targetDispense) {
                    $dispenseQty = $targetDispense - $totalDispensed;
                }

                $dispensedAt = $now->copy()->subDays(rand(0, 180));

                $stockOutData[] = [
                    'medicine_id' => $med->medicine_id,
                    'quantity' => $dispenseQty,
                    'dosage' => $med->dosage,
                    'price' => $med->price,
                    'patient_name' => 'Patient ' . strtoupper(Str::random(8)),
                    'prescription_no' => 'RX-' . rand(100000, 999999),
                    'dispensed_by' => $allUserIds[array_rand($allUserIds)],
                    'dispensed_at' => $dispensedAt,
                ];

                $totalDispensed += $dispenseQty;
            }
            
            $med->update(['current_stock' => $currentStock - $totalDispensed]);

            if (count($stockInData) >= 1000) {
                StockIn::insert($stockInData);
                $stockInData = []; 
            }
            if (count($stockOutData) >= 1000) {
                StockOut::insert($stockOutData);
                $stockOutData = []; 
            }

            if (($index + 1) % 50 === 0) {
                $this->command->info("Processed " . ($index + 1) . " / 150 medicines...");
            }
        }

        if (count($stockInData) > 0) StockIn::insert($stockInData);
        if (count($stockOutData) > 0) StockOut::insert($stockOutData);

        $this->command->info('Seeding complete! Data generated successfully.');
    }
}