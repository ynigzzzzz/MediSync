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
        // 1. Create Users (The exact original credentials)
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

        // 2. Create 10 Suppliers
        $suppliers = [
            'Zuellig Pharma', 'Unilab Inc.', 'MedExpress', 'Pfizer PH', 'GlaxoSmithKline',
            'Novartis', 'Sanofi', 'Roche', 'Merck', 'AstraZeneca'
        ];
        
        $supplierModels = [];
        foreach ($suppliers as $s) {
            $supplierModels[] = Supplier::firstOrCreate(
                ['name' => $s], 
                [
                    'contact_person' => 'Contact for ' . $s,
                    'phone' => '0917' . rand(1000000, 9999999),
                    'email' => strtolower(str_replace(' ', '', $s)) . '@example.com',
                    'address' => rand(1, 100) . ' Main St, City',
                    'status' => rand(1, 10) > 1 ? 'active' : 'inactive'
                ]
            );
        }

        // 3. Create 50 Medicines (Real Names)
        $medicinesData = [
            // Painkillers / Fever
            ['Paracetamol', 'Biogesic', 'Fever', 'Tablet', '500mg', 5.00],
            ['Mefenamic Acid', 'Ponstan', 'Painkillers', 'Capsule', '250mg', 8.50],
            ['Ibuprofen', 'Advil', 'Painkillers', 'Tablet', '200mg', 7.00],
            ['Aspirin', 'Bayer', 'Painkillers', 'Tablet', '80mg', 4.00],
            ['Tramadol', 'Ultram', 'Painkillers', 'Capsule', '50mg', 25.00],
            // Antibiotics
            ['Amoxicillin', 'Amoxil', 'Antibiotics', 'Capsule', '500mg', 15.00],
            ['Azithromycin', 'Zithromax', 'Antibiotics', 'Tablet', '500mg', 45.00],
            ['Ciprofloxacin', 'Cipro', 'Antibiotics', 'Tablet', '500mg', 20.00],
            ['Cefuroxime', 'Zinnat', 'Antibiotics', 'Tablet', '500mg', 35.00],
            ['Clindamycin', 'Cleocin', 'Antibiotics', 'Capsule', '300mg', 28.00],
            // Allergies
            ['Cetirizine', 'Zyrtec', 'Allergies', 'Tablet', '10mg', 12.00],
            ['Loratadine', 'Claritin', 'Allergies', 'Tablet', '10mg', 15.00],
            ['Diphenhydramine', 'Benadryl', 'Allergies', 'Syrup', '12.5mg/5ml', 120.00],
            ['Fexofenadine', 'Allegra', 'Allergies', 'Tablet', '120mg', 25.00],
            ['Montelukast', 'Singulair', 'Allergies', 'Tablet', '10mg', 40.00],
            // Vitamins
            ['Ascorbic Acid', 'Cecon', 'Vitamins', 'Tablet', '500mg', 6.00],
            ['Multivitamins', 'Centrum', 'Vitamins', 'Tablet', '1 tab', 12.00],
            ['Vitamin B Complex', 'Neurobion', 'Vitamins', 'Tablet', '1 tab', 10.00],
            ['Vitamin D3', 'Caltrate', 'Vitamins', 'Tablet', '1000IU', 15.00],
            ['Ferrous Sulfate', 'Feosol', 'Vitamins', 'Tablet', '325mg', 8.00],
            // Hypertension / Heart
            ['Losartan', 'Cozaar', 'Hypertension', 'Tablet', '50mg', 18.00],
            ['Amlodipine', 'Norvasc', 'Hypertension', 'Tablet', '5mg', 14.00],
            ['Metoprolol', 'Betaloc', 'Hypertension', 'Tablet', '50mg', 16.00],
            ['Valsartan', 'Diovan', 'Hypertension', 'Tablet', '80mg', 22.00],
            ['Atorvastatin', 'Lipitor', 'Cholesterol', 'Tablet', '20mg', 30.00],
            // Diabetes
            ['Metformin', 'Glucophage', 'Diabetes', 'Tablet', '500mg', 10.00],
            ['Glibenclamide', 'Daonil', 'Diabetes', 'Tablet', '5mg', 9.00],
            ['Sitagliptin', 'Januvia', 'Diabetes', 'Tablet', '100mg', 55.00],
            // Asthma / Respiratory
            ['Salbutamol', 'Ventolin', 'Asthma', 'Syrup', '2mg/5ml', 150.00],
            ['Montelukast', 'Singulair', 'Asthma', 'Tablet', '10mg', 40.00],
            ['Budesonide', 'Pulmicort', 'Asthma', 'Inhaler', '200mcg', 450.00],
            ['Ambroxol', 'Mucosolvan', 'Cough', 'Syrup', '30mg/5ml', 110.00],
            ['Lagundi', 'Ascof', 'Cough', 'Syrup', '600mg/5ml', 95.00],
            ['Carbocisteine', 'Solmux', 'Cough', 'Capsule', '500mg', 12.00],
            // Gastro
            ['Omeprazole', 'Losec', 'Stomach Pain', 'Capsule', '20mg', 18.00],
            ['Aluminum Hydroxide', 'Maalox', 'Stomach Pain', 'Suspension', '200mg/5ml', 85.00],
            ['Loperamide', 'Diatabs', 'Diarrhea', 'Capsule', '2mg', 6.00],
            ['Domperidone', 'Motilium', 'Stomach Pain', 'Tablet', '10mg', 15.00],
            ['Bismuth Subsalicylate', 'Pepto-Bismol', 'Stomach Pain', 'Suspension', '262mg/15ml', 130.00],
            // Others
            ['Prednisone', 'Deltasone', 'Anti-inflammatory', 'Tablet', '10mg', 8.00],
            ['Dexamethasone', 'Decadron', 'Anti-inflammatory', 'Tablet', '4mg', 7.00],
            ['Tranexamic Acid', 'Cyklokapron', 'Bleeding', 'Tablet', '500mg', 25.00],
            ['Methylergometrine', 'Methergine', 'Obstetrics', 'Tablet', '0.125mg', 20.00],
            ['Clotrimazole', 'Canesten', 'Antifungal', 'Ointment', '1%', 160.00],
            ['Mupirocin', 'Bactroban', 'Antibiotic', 'Ointment', '2%', 250.00],
            ['Hydrocortisone', 'Cortaid', 'Anti-inflammatory', 'Cream', '1%', 140.00],
            ['Ketoconazole', 'Nizoral', 'Antifungal', 'Cream', '2%', 180.00],
            ['Acyclovir', 'Zovirax', 'Antiviral', 'Tablet', '400mg', 35.00],
            ['Oseltamivir', 'Tamiflu', 'Antiviral', 'Capsule', '75mg', 120.00],
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
                ]
            );
        }

        // 4. Generate Historical Data (Last 60 Days)
        $now = Carbon::now();

        foreach ($medicineModels as $med) {
            $numBatches = rand(2, 5);
            $totalStock = 0;

            for ($i = 0; $i < $numBatches; $i++) {
                $qty = rand(50, 300);
                $cost = $med->price * 0.6;
                $expiry = $now->copy()->addMonths(rand(3, 24));
                
                // Expiring alerts
                if (rand(1, 10) === 1) {
                    $expiry = $now->copy()->addDays(rand(5, 25)); 
                }

                $recordedAt = $now->copy()->subDays(rand(0, 60));
                
                $supplier = $supplierModels[array_rand($supplierModels)];

                StockIn::create([
                    'medicine_id' => $med->medicine_id,
                    'quantity' => $qty,
                    'batch_no' => 'BATCH-' . strtoupper(Str::random(8)),
                    'expiry_date' => $expiry,
                    'supplier' => $supplier->name,
                    'supplier_id' => $supplier->supplier_id,
                    'received_by' => $users[array_rand($users)],
                    'delivery_date' => $recordedAt,
                    'invoice_no' => 'INV-' . rand(10000, 99999),
                    'cost_price' => $cost,
                    'selling_price' => $med->price,
                    'remaining_quantity' => $qty,
                    'recorded_at' => $recordedAt,
                ]);

                $totalStock += $qty;
            }

            $med->update(['current_stock' => $totalStock]);

            $dispenseCount = rand(10, 40); 
            
            for ($j = 0; $j < $dispenseCount; $j++) {
                if ($totalStock <= 0) break;

                $dispenseQty = rand(1, 10);
                if ($totalStock < $dispenseQty) {
                    $dispenseQty = $totalStock;
                }

                $dispensedAt = $now->copy()->subDays(rand(0, 30));

                StockOut::create([
                    'medicine_id' => $med->medicine_id,
                    'quantity' => $dispenseQty,
                    'dosage' => $med->dosage,
                    'price' => $med->price,
                    'patient_name' => 'Patient ' . Str::random(5),
                    'prescription_no' => 'RX-' . rand(10000, 99999),
                    'dispensed_by' => $users[array_rand($users)],
                    'dispensed_at' => $dispensedAt,
                ]);

                $totalStock -= $dispenseQty;
            }

            $med->update(['current_stock' => $totalStock]);
        }
    }
}