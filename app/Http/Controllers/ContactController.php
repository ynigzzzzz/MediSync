<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactRequest;
use App\Mail\ContactSupportRequest;
use App\Models\AuditLog;
use App\Models\ContactMessage;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class ContactController extends Controller
{
    public const INQUIRY_TYPES = [
        'bug' => '🐛 Report a Bug / Issue',
        'feature' => '✨ Request a Feature',
        'tech' => '❓ Technical Support',
        'inventory' => '📊 Inventory Data Discrepancy',
        'feedback' => '💡 Feedback / Suggestion',
        'account' => '🔒 Account Access Issue',
        'general' => '📝 General Inquiry',
    ];

    public function create()
    {
        return Inertia::render('Contact/Index', [
            'inquiryTypes' => self::INQUIRY_TYPES,
            'prefill' => [
                'full_name' => request()->user()->full_name,
                'email' => request()->user()->email,
            ],
        ]);
    }

    public function store(StoreContactRequest $request)
    {
        $data = $request->validated();

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('contact', 'public');
        }

        $contactMessage = ContactMessage::create([
            'user_id' => $request->user()->user_id,
            'full_name' => $data['full_name'],
            'email' => $data['email'],
            'contact_number' => $data['contact_number'] ?? null,
            'inquiry_type' => $data['inquiry_type'],
            'subject' => $data['subject'],
            'message' => $data['message'],
            'attachment_path' => $attachmentPath,
        ]);

        try {
            $supportInbox = config('mail.support_inbox') ?? config('mail.from.address');
            Mail::to($supportInbox)->send(
                new ContactSupportRequest($contactMessage, self::INQUIRY_TYPES[$data['inquiry_type']]),
            );
        } catch (\Exception $e) {
            report($e);
        }

        AuditLog::record(
            $request->user()->user_id,
            'CONTACT_SUBMIT',
            "Submitted support request: {$data['subject']} ({$data['inquiry_type']})",
        );

        return back()->with('success', 'Your message has been received. The team will get back to you soon.');
    }
}
