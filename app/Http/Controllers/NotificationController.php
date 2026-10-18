<?php

namespace App\Http\Controllers;

use App\Models\SystemNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /** Mark one notification read, then go to the page it points at. */
    public function read(Request $request, SystemNotification $notification)
    {
        abort_unless($notification->user_id === $request->user()->user_id, 403);

        if (is_null($notification->read_at)) {
            $notification->update(['read_at' => now()]);
        }

        return $notification->link ? redirect($notification->link) : back();
    }

    public function readAll(Request $request)
    {
        SystemNotification::where('user_id', $request->user()->user_id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return back();
    }
}
