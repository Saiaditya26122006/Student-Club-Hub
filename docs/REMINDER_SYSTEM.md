# Multi-Channel Reminder System

## Overview

The Student Club-Hub reminder system automatically sends reminders to participants when they register for events, and at scheduled times before events (24 hours and 1 hour before). Reminders can be sent via Email, WhatsApp, and SMS.

## Features

### Automatic Reminders
- **On Registration**: Immediate reminder sent via all enabled channels
- **24 Hours Before**: Automatic reminder 24 hours before event
- **1 Hour Before**: Final reminder 1 hour before event

### Multi-Channel Support
- **Email**: HTML emails with event details and QR code
- **WhatsApp**: Formatted messages via Twilio WhatsApp API
- **SMS**: Short text messages via Twilio SMS API

## Setup Instructions

### 1. Email Configuration (Already Configured)
Email reminders use the existing SMTP configuration:
- `MAIL_SERVER`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_USE_TLS`

### 2. WhatsApp & SMS Configuration (Twilio)

#### Install Twilio Library
```bash
pip install twilio
```

#### Environment Variables
Add to your `.env` file:
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  # Twilio sandbox number
TWILIO_SMS_FROM=+1234567890  # Your Twilio phone number
```

#### Get Twilio Credentials
1. Sign up at https://www.twilio.com
2. Get your Account SID and Auth Token from the dashboard
3. For WhatsApp: Use the sandbox number or get a WhatsApp Business API number
4. For SMS: Purchase a phone number from Twilio

### 3. Database Migration

The User model has been updated with reminder preferences:
- `phone_number`: User's phone number for WhatsApp/SMS
- `reminder_email_enabled`: Enable/disable email reminders (default: True)
- `reminder_whatsapp_enabled`: Enable/disable WhatsApp reminders (default: False)
- `reminder_sms_enabled`: Enable/disable SMS reminders (default: False)

Run database migration:
```python
# The schema will auto-update, but you can manually add columns if needed
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN reminder_email_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN reminder_whatsapp_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN reminder_sms_enabled BOOLEAN DEFAULT FALSE;
```

## API Endpoints

### Send Reminders (Leader Only)
**POST** `/api/events/<event_id>/send-reminders`

Send reminders to all registered participants for an event.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "channels": ["email", "whatsapp", "sms"],  // Optional, defaults to ["email"]
  "reminder_type": "manual",  // Optional: "manual", "registration", "24h", "1h"
  "message": "Custom reminder message"  // Optional
}
```

**Response:**
```json
{
  "message": "Reminders sent",
  "results": {
    "total": 10,
    "sent": {
      "email": 8,
      "whatsapp": 5,
      "sms": 3
    },
    "failed": {
      "email": 2,
      "whatsapp": 5,
      "sms": 7
    }
  }
}
```

### Manage Reminder Preferences
**GET** `/api/reminder-preferences`

Get current user's reminder preferences.

**Response:**
```json
{
  "phone_number": "+1234567890",
  "reminder_email_enabled": true,
  "reminder_whatsapp_enabled": false,
  "reminder_sms_enabled": false
}
```

**PUT** `/api/reminder-preferences`

Update reminder preferences.

**Request Body:**
```json
{
  "phone_number": "+1234567890",  // Optional
  "reminder_email_enabled": true,  // Optional
  "reminder_whatsapp_enabled": true,  // Optional
  "reminder_sms_enabled": false  // Optional
}
```

## How It Works

### Automatic Reminders on Registration

When a participant registers for an event:
1. Immediate reminder is sent via all enabled channels
2. Scheduled reminders are created for 24h and 1h before the event
3. Reminders respect user preferences (only send via enabled channels)

### Scheduled Reminders

The system uses the `EventReminder` model to track scheduled reminders. A background task system (like APScheduler or Celery) should be set up to:
1. Check for reminders due to be sent
2. Send reminders via appropriate channels
3. Mark reminders as sent

### Example: Setting Up Scheduled Task

```python
from apscheduler.schedulers.background import BackgroundScheduler

def send_due_reminders():
    """Send reminders that are due."""
    now = datetime.utcnow()
    due_reminders = EventReminder.query.filter(
        EventReminder.reminder_time <= now,
        EventReminder.sent == False
    ).all()
    
    for reminder in due_reminders:
        user = User.query.get(reminder.user_id)
        event = Event.query.get(reminder.event_id)
        
        if user and event:
            # Determine reminder type based on time
            event_datetime = datetime.combine(event.date, event.time)
            time_diff = event_datetime - now
            
            if time_diff <= timedelta(hours=1):
                reminder_type = "1h"
            elif time_diff <= timedelta(hours=24):
                reminder_type = "24h"
            else:
                reminder_type = "registration"
            
            send_event_reminders(user, event, reminder_type)
            reminder.sent = True
            db.session.commit()

# Schedule to run every minute
scheduler = BackgroundScheduler()
scheduler.add_job(send_due_reminders, 'interval', minutes=1)
scheduler.start()
```

## User Experience

### For Participants
1. Register for an event → Receive immediate reminder
2. Configure preferences in profile settings
3. Receive automatic reminders 24h and 1h before events

### For Leaders
1. Send manual reminders to all registered participants
2. Choose which channels to use (email, WhatsApp, SMS)
3. View reminder statistics

## Testing

### Test Email Reminders
Email reminders work immediately if SMTP is configured.

### Test WhatsApp Reminders
1. Add your phone number to user profile
2. Enable WhatsApp reminders in preferences
3. Register for an event
4. Check WhatsApp for message

### Test SMS Reminders
1. Add your phone number to user profile
2. Enable SMS reminders in preferences
3. Register for an event
4. Check SMS inbox

## Troubleshooting

### Email Not Sending
- Check SMTP configuration in `.env`
- Verify `MAIL_SERVER`, `MAIL_USERNAME`, `MAIL_PASSWORD`
- Check server logs for errors

### WhatsApp Not Working
- Verify Twilio credentials
- Check phone number format (should include country code)
- Ensure Twilio WhatsApp sandbox is set up
- Check Twilio console for message status

### SMS Not Working
- Verify Twilio credentials and phone number
- Check phone number format
- Ensure sufficient Twilio credits
- Check Twilio console for delivery status

## Future Enhancements

- [ ] Push notifications for mobile app
- [ ] In-app notification center
- [ ] Customizable reminder templates
- [ ] Reminder analytics dashboard
- [ ] Bulk reminder scheduling
- [ ] Reminder preferences per event

