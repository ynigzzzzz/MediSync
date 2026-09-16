<?php

namespace App\Mail;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactSupportRequest extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ContactMessage $contactMessage,
        public string $inquiryLabel,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[MediSync Support] {$this->inquiryLabel}: {$this->contactMessage->subject}",
            // ⚠️ Make sure replyTo is correctly formatted
            replyTo: [
                $this->contactMessage->email => $this->contactMessage->full_name
            ],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.contact-support-request',
            with: ['inquiryLabel' => $this->inquiryLabel],
        );
    }

    public function attachments(): array
    {
        if (!$this->contactMessage->attachment_path) {
            return [];
        }

        return [
            \Illuminate\Mail\Mailables\Attachment::fromStorageDisk('public', $this->contactMessage->attachment_path),
        ];
    }
}
