<?php

namespace Database\Seeders;

use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Models\Supplier;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Users
        $admin = User::firstOrCreate(
            ['email' => 'admin@medisync.test'],
            ['full_name' => 'Ynigo Panisa', 'password_hash' => Hash::make('password123'), 'role' => 'admin', 'status' => 'active']
        );

        $pharmacist = User::firstOrCreate(
            ['email' => 'pharmacist@medisync.test'],
            ['full_name' => 'Marinel Delima', 'password_hash' => Hash::make('password789'), 'role' => 'pharmacist', 'status' => 'active']
        );

        $assistant = User::firstOrCreate(
            ['email' => 'assistant@medisync.test'],
            ['full_name' => 'Arnold Gabutero', 'password_hash' => Hash::make('password456'), 'role' => 'assistant', 'status' => 'active']
        );

        for ($i = 1; $i <= 12; $i++) {
            User::firstOrCreate(
                ['email' => "staff{$i}@medisync.test"],
                [
                    'full_name' => 'Staff Member '.$i,
                    'password_hash' => Hash::make('password123'),
                    'role' => rand(1, 5) === 1 ? 'admin' : (rand(1, 2) === 1 ? 'pharmacist' : 'assistant'),
                    'status' => rand(1, 10) === 1 ? 'inactive' : 'active',
                    'created_at' => Carbon::now()->subDays(rand(1, 365)),
                ]
            );
        }

        $allUserIds = User::pluck('user_id')->toArray();

        // 2. Create 10 Suppliers
        $supplierBases = ['Zuellig', 'Unilab', 'MedExpress', 'Pfizer', 'GSK'];
        foreach ($supplierBases as $base) {
            for ($i = 1; $i <= 2; $i++) {
                $name = $base.' Dist. '.$i;
                Supplier::firstOrCreate(
                    ['name' => $name],
                    [
                        'contact_person' => 'Rep '.Str::random(4),
                        'phone' => '0917'.rand(1000000, 9999999),
                        'email' => strtolower(str_replace(' ', '', $name)).'@example.com',
                        'address' => rand(1, 500).' Main St, City',
                        'status' => 'active',
                        'created_at' => Carbon::now()->subDays(rand(1, 365)),
                    ]
                );
            }
        }
        $allSupplierIds = Supplier::pluck('supplier_id')->toArray();

        // 3. Create 30 Medicines
        $medicinesData = [
            ['Paracetamol', 'Biogesic', 'Fever', 'Tablet', '500mg', 5.00],
            ['Mefenamic Acid', 'Ponstan', 'Painkillers', 'Capsule', '250mg', 8.50],
            ['Ibuprofen', 'Advil', 'Painkillers', 'Tablet', '200mg', 7.00],
            ['Amoxicillin', 'Amoxil', 'Antibiotics', 'Capsule', '500mg', 15.00],
            ['Azithromycin', 'Zithromax', 'Antibiotics', 'Tablet', '500mg', 45.00],
            ['Cetirizine', 'Zyrtec', 'Allergies', 'Tablet', '10mg', 12.00],
            ['Loratadine', 'Claritin', 'Allergies', 'Tablet', '10mg', 15.00],
            ['Ascorbic Acid', 'Cecon', 'Vitamins', 'Tablet', '500mg', 6.00],
            ['Multivitamins', 'Centrum', 'Vitamins', 'Tablet', '1 tab', 12.00],
            ['Losartan', 'Cozaar', 'Hypertension', 'Tablet', '50mg', 18.00],
            ['Amlodipine', 'Norvasc', 'Hypertension', 'Tablet', '5mg', 14.00],
            ['Metformin', 'Glucophage', 'Diabetes', 'Tablet', '500mg', 10.00],
            ['Salbutamol', 'Ventolin', 'Asthma', 'Syrup', '2mg/5ml', 150.00],
            ['Ambroxol', 'Mucosolvan', 'Cough', 'Syrup', '30mg/5ml', 110.00],
            ['Lagundi', 'Ascof', 'Cough', 'Syrup', '600mg/5ml', 95.00],
            ['Omeprazole', 'Losec', 'Stomach Pain', 'Capsule', '20mg', 18.00],
            ['Loperamide', 'Diatabs', 'Diarrhea', 'Capsule', '2mg', 6.00],
            ['Domperidone', 'Motilium', 'Stomach Pain', 'Tablet', '10mg', 15.00],
            ['Prednisone', 'Deltasone', 'Anti-inflammatory', 'Tablet', '10mg', 8.00],
            ['Dexamethasone', 'Decadron', 'Anti-inflammatory', 'Tablet', '4mg', 7.00],
            ['Clotrimazole', 'Canesten', 'Antifungal', 'Ointment', '1%', 160.00],
            ['Mupirocin', 'Bactroban', 'Antibiotic', 'Ointment', '2%', 250.00],
            ['Hydrocortisone', 'Cortaid', 'Anti-inflammatory', 'Cream', '1%', 140.00],
            ['Ketoconazole', 'Nizoral', 'Antifungal', 'Cream', '2%', 180.00],
            ['Acyclovir', 'Zovirax', 'Antiviral', 'Tablet', '400mg', 35.00],
            ['Oseltamivir', 'Tamiflu', 'Antiviral', 'Capsule', '75mg', 120.00],
            ['Tramadol', 'Ultram', 'Painkillers', 'Capsule', '50mg', 25.00],
            ['Ciprofloxacin', 'Cipro', 'Antibiotics', 'Tablet', '500mg', 20.00],
            ['Montelukast', 'Singulair', 'Allergies', 'Tablet', '10mg', 40.00],
            ['Budesonide', 'Pulmicort', 'Asthma', 'Inhaler', '200mcg', 450.00],
        ];

        $medicineModels = [];
        foreach ($medicinesData as $m) {
            $medicineModels[] = Medicine::firstOrCreate(
                ['generic_name' => $m[0], 'brand_name' => $m[1]],
                [
                    'category' => $m[2],
                    'type' => $m[3],
                    'dosage' => $m[4],
                    'price' => $m[5],
                    'current_stock' => 0,
                    'created_at' => Carbon::now(),
                ]
            );
        }

        // 4. Generate Balanced Historical Data
        $now = Carbon::now();

        foreach ($medicineModels as $med) {
            $numBatches = rand(2, 3);
            $totalStock = 0;
            $batchIds = [];

            for ($i = 0; $i < $numBatches; $i++) {
                $qty = rand(30, 80);
                $cost = $med->price * 0.6;
                $expiry = $now->copy()->addMonths(rand(3, 24));

                if (rand(1, 10) <= 2) {
                    $expiry = $now->copy()->addDays(rand(5, 25));
                }

                $recordedAt = $now->copy()->subDays(rand(0, 60));

                $batch = StockIn::create([
                    'medicine_id' => $med->medicine_id,
                    'quantity' => $qty,
                    'batch_no' => 'BATCH-'.strtoupper(Str::random(8)),
                    'expiry_date' => $expiry,
                    'supplier' => 'Supplier Name',
                    'supplier_id' => $allSupplierIds[array_rand($allSupplierIds)],
                    'received_by' => $allUserIds[array_rand($allUserIds)],
                    'delivery_date' => $recordedAt,
                    'invoice_no' => 'INV-'.rand(10000, 99999),
                    'cost_price' => $cost,
                    'selling_price' => $med->price,
                    'remaining_quantity' => $qty,
                    'recorded_at' => $recordedAt,
                ]);

                $batchIds[] = $batch->stock_in_id;
                $totalStock += $qty;
            }

            $med->update(['current_stock' => $totalStock]);

            $dispensePercentage = rand(60, 85) / 100;
            $targetDispense = floor($totalStock * $dispensePercentage);
            $totalDispensed = 0;
            $dispenseCount = rand(15, 30);

            for ($j = 0; $j < $dispenseCount; $j++) {
                if ($totalDispensed >= $targetDispense) {
                    break;
                }

                $dispenseQty = rand(1, 5);
                if ($totalDispensed + $dispenseQty > $targetDispense) {
                    $dispenseQty = $targetDispense - $totalDispensed;
                }

                $dispensedAt = $now->copy()->subDays(rand(0, 60));

                StockOut::create([
                    'medicine_id' => $med->medicine_id,
                    'quantity' => $dispenseQty,
                    'dosage' => $med->dosage,
                    'price' => $med->price,
                    'patient_name' => 'Patient '.Str::random(5),
                    'prescription_no' => 'RX-'.rand(10000, 99999),
                    'dispensed_by' => $allUserIds[array_rand($allUserIds)],
                    'dispensed_at' => $dispensedAt,
                    'stock_in_id' => $batchIds[array_rand($batchIds)],
                ]);

                $totalDispensed += $dispenseQty;
            }

            $med->update(['current_stock' => $totalStock - $totalDispensed]);
        }
    }
}
