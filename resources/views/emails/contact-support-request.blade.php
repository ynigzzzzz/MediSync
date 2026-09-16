<!DOCTYPE html>
<html>
<head>
<style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2C3E50; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #764248 0%, #FFB7CE 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 25px; border: 1px solid #DFE2CF; border-top: none; border-radius: 0 0 10px 10px; }
    .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #FFB7CE; border-radius: 5px; }
    .label { font-weight: bold; color: #764248; }
    .footer { text-align: center; padding: 15px; font-size: 12px; color: #999; border-top: 1px solid #DFE2CF; margin-top: 20px; }
</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>📬 New Support Request</h2>
            <p>MediSync Pharmacy Inventory System</p>
        </div>
        <div class="content">
            <div class="info-box">
                <p><span class="label">Type:</span> {{ $inquiryLabel }}</p>
                <p><span class="label">From:</span> {{ $contactMessage->full_name }} ({{ $contactMessage->email }})</p>
                @if($contactMessage->contact_number)
                    <p><span class="label">Contact number:</span> {{ $contactMessage->contact_number }}</p>
                @endif
                <p><span class="label">Subject:</span> {{ $contactMessage->subject }}</p>
            </div>
            <div class="info-box">
                <p><span class="label">Message:</span></p>
                <p>{{ $contactMessage->message }}</p>
            </div>
            @if($contactMessage->attachment_path)
                <p>An attachment is included with this email.</p>
            @endif
        </div>
        <div class="footer">
            Sent automatically from the MediSync Contact form. Reply directly to this email to respond to {{ $contactMessage->full_name }}.
        </div>
    </div>
</body>
</html>
