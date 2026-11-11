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
        $this->command->info('Cleaning old data (Preserving Admin)...');

        // 1. FIND OR CREATE ADMIN
        $admin = User::firstOrCreate(
            ['email' => 'admin@medisync.test'],
            [
                'full_name' => 'Ynigo Panisa',
                'password_hash' => Hash::make('password123'),
                'role' => 'admin',
                'status' => 'active',
            ]
        );

        // 2. TRUNCATE TABLES FIRST (This removes all foreign key references)
        DB::statement('TRUNCATE TABLE stock_out CASCADE');
        DB::statement('TRUNCATE TABLE stock_in CASCADE');
        DB::statement('TRUNCATE TABLE medicines CASCADE');
        DB::statement('TRUNCATE TABLE suppliers CASCADE');
        DB::statement('TRUNCATE TABLE system_notifications CASCADE');
        DB::statement('TRUNCATE TABLE contact_messages CASCADE');
        DB::statement('TRUNCATE TABLE audit_log CASCADE');

        // 3. NOW SAFELY DELETE OTHER USERS
        User::where('user_id', '!=', $admin->user_id)->delete();

        $this->command->info('Data wiped clean. Generating 1 year of history...');

        // 4. CREATE STAFF ACCOUNTS
        $pharmacist = User::create([
            'full_name' => 'Marinel Delima',
            'email' => 'pharmacist@medisync.test',
            'password_hash' => Hash::make('password123'),
            'role' => 'pharmacist',
            'status' => 'active',
        ]);

        $assistant = User::create([
            'full_name' => 'Arnold Gabutero',
            'email' => 'assistant@medisync.test',
            'password_hash' => Hash::make('password123'),
            'role' => 'assistant',
            'status' => 'active',
        ]);

        User::create(['full_name' => 'Xyza Paz', 'email' => 'xyza@medisync.test', 'password_hash' => Hash::make('password123'), 'role' => 'pharmacist', 'status' => 'active']);
        User::create(['full_name' => 'Dahn Gabutero', 'email' => 'dahn@medisync.test', 'password_hash' => Hash::make('password123'), 'role' => 'assistant', 'status' => 'inactive']);
        User::create(['full_name' => 'Faith Magoncia', 'email' => 'faith@medisync.test', 'password_hash' => Hash::make('password123'), 'role' => 'pharmacist', 'status' => 'active']);

        $allUserIds = User::pluck('user_id')->toArray();

        // 5. CREATE SUPPLIERS
        $supplierNames = [
            'Zuellig Pharma', 'Unilab Inc.', 'MedExpress', 'Pfizer PH', 'GlaxoSmithKline',
            'Novartis', 'Sanofi', 'Roche', 'Merck', 'AstraZeneca',
        ];

        $supplierModels = [];
        foreach ($supplierNames as $name) {
            $supplierModels[] = Supplier::create([
                'name' => $name,
                'contact_person' => 'Rep '.Str::random(5),
                'phone' => '0917'.rand(1000000, 9999999),
                'email' => strtolower(str_replace(' ', '', $name)).'@example.com',
                'address' => rand(1, 100).' Main St, City',
                'status' => rand(1, 10) > 1 ? 'active' : 'inactive',
                'created_at' => Carbon::now()->subDays(rand(300, 365)),
            ]);
        }
        $allSupplierIds = Supplier::pluck('supplier_id')->toArray();

        // 6. CREATE MEDICINES
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
            ['Tranexamic Acid', 'Cyklokapron', 'Bleeding', 'Tablet', '500mg', 25.00],
            ['Methylergometrine', 'Methergine', 'Obstetrics', 'Tablet', '0.125mg', 20.00],
        ];

        $medicineModels = [];
        foreach ($medicinesData as $m) {
            $medicineModels[] = Medicine::create([
                'generic_name' => $m[0],
                'brand_name' => $m[1],
                'category' => $m[2],
                'type' => $m[3],
                'dosage' => $m[4],
                'price' => $m[5],
                'current_stock' => 0,
                'created_at' => Carbon::now()->subDays(rand(300, 365)),
            ]);
        }

        // 7. GENERATE 1 YEAR OF TRANSACTIONS
        $this->command->info('Generating 1 year of Stock-In and Stock-Out records...');

        $now = Carbon::now();

        foreach ($medicineModels as $med) {
            $currentStock = 0;
            $numBatches = rand(12, 24);

            for ($i = 0; $i < $numBatches; $i++) {
                $qty = rand(50, 300);
                $cost = $med->price * (rand(50, 70) / 100);
                $expiry = $now->copy()->addMonths(rand(6, 36));

                if (rand(1, 100) <= 15) {
                    $expiry = $now->copy()->addDays(rand(5, 25));
                }
                if (rand(1, 100) <= 5) {
                    $expiry = $now->copy()->subDays(rand(5, 30));
                }

                $daysAgo = rand(0, 365);
                $recordedAt = $now->copy()->subDays($daysAgo);

                $batch = StockIn::create([
                    'medicine_id' => $med->medicine_id,
                    'quantity' => $qty,
                    'batch_no' => 'BATCH-'.strtoupper(Str::random(8)),
                    'expiry_date' => $expiry,
                    'supplier' => 'Supplier',
                    'supplier_id' => $allSupplierIds[array_rand($allSupplierIds)],
                    'received_by' => $allUserIds[array_rand($allUserIds)],
                    'delivery_date' => $recordedAt,
                    'invoice_no' => 'INV-'.rand(10000, 99999),
                    'cost_price' => $cost,
                    'selling_price' => $med->price,
                    'remaining_quantity' => $qty,
                    'recorded_at' => $recordedAt,
                ]);

                $currentStock += $qty;

                $dispensePercentage = rand(60, 90) / 100;
                $targetDispense = floor($qty * $dispensePercentage);
                $totalDispensed = 0;
                $numDispenses = rand(5, 15);

                for ($j = 0; $j < $numDispenses; $j++) {
                    if ($totalDispensed >= $targetDispense) {
                        break;
                    }

                    $dispenseQty = rand(1, 15);
                    if ($totalDispensed + $dispenseQty > $targetDispense) {
                        $dispenseQty = $targetDispense - $totalDispensed;
                    }

                    $maxDaysAfterReceive = min(180, $daysAgo);
                    $dispensedAt = $recordedAt->copy()->addDays(rand(0, max(1, $maxDaysAfterReceive)));

                    if ($dispensedAt->isFuture()) {
                        $dispensedAt = $now->copy()->subHours(rand(1, 24));
                    }

                    StockOut::create([
                        'medicine_id' => $med->medicine_id,
                        'quantity' => $dispenseQty,
                        'dosage' => $med->dosage,
                        'price' => $med->price,
                        'patient_name' => 'Patient '.strtoupper(Str::random(6)),
                        'prescription_no' => 'RX-'.rand(10000, 99999),
                        'dispensed_by' => $allUserIds[array_rand($allUserIds)],
                        'dispensed_at' => $dispensedAt,
                        'stock_in_id' => $batch->stock_in_id,
                    ]);

                    $batch->decrement('remaining_quantity', $dispenseQty);
                    $totalDispensed += $dispenseQty;
                    $currentStock -= $dispenseQty;
                }
            }

            $med->update(['current_stock' => $currentStock]);
        }

        $this->command->info('Seeding complete! System now has 1 year of transaction history.');
    }
}
