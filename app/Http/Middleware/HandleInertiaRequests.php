<?php

namespace App\Http\Middleware;

use App\Models\SystemNotification;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'user_id' => $request->user()->user_id,
                    'full_name' => $request->user()->full_name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                    'profile_image' => $request->user()->profile_image,
                ] : null,
            ],
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'message' => fn () => $request->session()->get('message'),
            ],
            'notifications' => fn () => $request->user() ? [
                'unread' => SystemNotification::where('user_id', $request->user()->user_id)
                    ->whereNull('read_at')
                    ->count(),
                'items' => SystemNotification::where('user_id', $request->user()->user_id)
                    ->orderByDesc('created_at')
                    ->orderByDesc('notification_id')
                    ->limit(10)
                    ->get(['notification_id', 'type', 'title', 'message', 'link', 'read_at', 'created_at']),
            ] : null,
        ];
    }
}
