<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForcePasswordChange
{
    public function handle(Request $request, Closure $next): Response
    {
        // If the user is logged in and needs to change their password
        if ($request->user() && $request->user()->must_change_password) {
            // Allow them to access the profile page and logout routes
            if (! $request->routeIs('profile.edit') &&
                ! $request->routeIs('profile.update') &&
                ! $request->routeIs('password.update') &&
                ! $request->routeIs('logout')) {

                return redirect()->route('profile.edit')->with('warning', 'Please change your temporary password before continuing.');
            }
        }

        return $next($request);
    }
}
