<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::define(
            'print-transaction-history',
            fn (User $user): bool => in_array($user->role, ['admin', 'pharmacist'], true),
        );

        Gate::define(
            'export-transaction-history',
            fn (User $user): bool => in_array($user->role, ['admin', 'pharmacist'], true),
        );

        Vite::prefetch(concurrency: 3);
    }
}
