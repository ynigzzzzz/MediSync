<?php

namespace App\Http\Controllers;

use App\Mail\ContactSupportRequest;
use App\Models\AuditLog;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
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

    public function create(Request $request)
    {
        return Inertia::render('Contact/Index', [
            'inquiryTypes' => self::INQUIRY_TYPES,
            'prefill' => [
                'full_name' => $request->user()->full_name,
                'email' => $request->user()->email,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150'],
            'contact_number' => ['nullable', 'regex:/^[0-9+\-() ]*$/', 'max:30'],
            'inquiry_type' => ['required', Rule::in(array_keys(self::INQUIRY_TYPES))],
            'subject' => ['required', 'string', 'max:200'],
            'message' => ['required', 'string'],
            'attachment' => ['nullable', 'file', 'max:5120'],
        ]);

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('contact', 'public');
        }

        // Create the contact message record
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

        // Try to send email
        try {
            $supportInbox = config('mail.support_inbox') ?? config('mail.from.address');
            
            \Log::info('Attempting to send email to: ' . $supportInbox);
            
            Mail::to($supportInbox)
                ->send(new ContactSupportRequest($contactMessage, self::INQUIRY_TYPES[$data['inquiry_type']]));
                
            \Log::info('Email sent successfully');
            
        } catch (\Exception $e) {
            \Log::error('Mail error: ' . $e->getMessage());
            \Log::error('Mail error trace: ' . $e->getTraceAsString());
            
            // Continue anyway - don't fail the request
        }

        // Record audit log
        AuditLog::record(
            $request->user()->user_id,
            'CONTACT_SUBMIT',
            "Submitted support request: {$data['subject']} ({$data['inquiry_type']})"
        );

        return back()->with('success', 'Your message has been received. The team will get back to you soon.');
    }
}