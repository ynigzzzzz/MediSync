<?php

namespace App\Http\Middleware;

use App\Services\NotificationService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SyncStockAlerts
{
    /**
     * Page loads (GET): re-sync BEFORE the page is built, at most every 30s
     * (expiry dates change with the calendar, not just with edits), so the
     * bell on that very page is already up to date.
     *
     * Writes (POST/PUT/PATCH/DELETE): re-sync AFTER the action has run, so
     * the redirect back already shows any new notification.
     *
     * Wrapped in try/catch: a notification problem must never break the
     * action the user was actually doing.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethodSafe()) {
            $this->run(fn () => NotificationService::syncThrottled());
            return $next($request);
        }

        $response = $next($request);
        $this->run(fn () => NotificationService::syncStockAlerts());

        return $response;
    }

    private function run(callable $fn): void
    {
        try {
            $fn();
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
