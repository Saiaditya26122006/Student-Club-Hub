# ClubHub Features Documentation

## Overview

ClubHub is a comprehensive event management system designed for college clubs. It provides two distinct user experiences: one for club leaders and one for participants.

---

## User Roles

### 1. Participant
Regular users who can browse and RSVP for events.

### 2. Leader
Club administrators who can create, manage, and track events.

---

## Participant Features

### 🎫 Event Discovery

**Browse Events**
- View all upcoming events in a card-based layout
- See event details: title, description, date, time, location
- Events are sorted chronologically

**Event Information**
- Club name and category
- Event date and time
- Location details
- Event description

### ✅ RSVP Management

**Register for Events**
- One-click RSVP for any event
- Instant confirmation
- Automatic QR code generation
- Email notification with QR code (if configured)

**View Registrations**
- Dedicated "Your Dashboard" tab
- See all events you've RSVP'd for
- Quick access to QR codes
- Event details at a glance

**Cancel RSVP**
- "Undo RSVP" button for each registered event
- Instant cancellation
- Removed from participant list

### 📱 QR Code Features

**QR Code Generation**
- Unique QR code for each registration
- Contains registration ID, event ID, participant details
- Automatically generated on RSVP

**QR Code Access**
- View QR code directly in dashboard
- Download QR code as PNG
- QR code sent via email (if configured)

**QR Code Usage**
- Present at event check-in
- Scan for attendance tracking
- Unique identifier for each participant

### 🔍 Event Filtering (Planned)
- Filter by club category
- Search by event name
- Filter by date range

---

## Leader Features

### 📊 Analytics Dashboard

**Overview Cards**
- Total events created
- Total registrations across all events
- Quick statistics at a glance

**Event Performance Chart**
- Bar chart showing views vs registrations
- Compare engagement across events
- Identify popular events

**Event Metrics**
- View count for each event
- Registration count
- Conversion rate (viewed but not registered)

### 🎯 Event Management

**Create Events**
- User-friendly event creation form
- Required fields:
  - Club selection
  - Event title
  - Date and time
  - Location
- Optional fields:
  - Description
- Validation for all inputs

**Edit Events** ⭐ NEW
- Edit button on each event card
- Modify any event detail:
  - Title
  - Description
  - Date and time
  - Location
  - Club association
- **Restriction:** Can edit anytime before the event day
- Pre-populated form with existing data
- Instant updates

**Delete Events**
- Delete button on each event card
- Confirmation dialog before deletion
- **Restriction:** Can only delete events 7+ days before scheduled date
- Removes all associated registrations
- Permanent action

### 👥 Participant Management

**View Registrations**
- "View details" button for each event
- See complete list of registered participants
- Participant information:
  - Name
  - Email
  - Registration timestamp
- Sorted by registration time (newest first)

**Export Data** (Planned)
- Download participant list as CSV
- Export QR codes in bulk

### 📈 Event Insights

**Engagement Tracking**
- View count: How many people viewed the event
- Registration count: How many RSVPed
- Viewed but not registered: Potential interest

**Performance Metrics**
- Conversion rate visualization
- Compare events side-by-side
- Identify trends

---

## System Features

### 🔐 Authentication & Security

**User Registration**
- Email-based registration
- Password hashing with bcrypt
- Role selection (Participant/Leader)
- Email validation

**Login System**
- JWT-based authentication
- Secure token storage
- Auto-login on page refresh
- Session management

**Protected Routes**
- Frontend route protection
- Backend API protection
- Role-based access control
- Automatic redirect to login

### 📧 Email Notifications

**RSVP Confirmation Email**
- Sent automatically on RSVP
- Contains event details
- QR code attachment
- Professional formatting

**Email Configuration**
- SMTP support
- Gmail integration
- Customizable sender
- TLS encryption

### 🎨 User Interface

**Modern Design**
- Tailwind CSS styling
- Responsive layout (mobile, tablet, desktop)
- Smooth animations
- Hover effects

**Navigation**
- Clean navbar with role-based menu
- Easy navigation between pages
- Logout functionality
- Active route highlighting

**Loading States**
- Spinner animations
- Loading messages
- Disabled buttons during actions
- Smooth transitions

### 📱 Responsive Design

**Mobile Optimized**
- Touch-friendly buttons
- Readable text sizes
- Optimized layouts
- Swipe gestures (planned)

**Tablet Support**
- Grid layouts adjust automatically
- Optimal spacing
- Touch targets

**Desktop Experience**
- Multi-column layouts
- Hover interactions
- Keyboard shortcuts (planned)

---

## Technical Features

### 🔄 Real-time Updates

**Optimistic UI Updates**
- Instant feedback on actions
- Local state updates before server confirmation
- Fallback on error

**Auto-refresh**
- Dashboard refreshes on navigation
- Event list updates after actions
- Participant list updates

### 🗄️ Data Management

**Database**
- PostgreSQL support
- SQLite for development
- Automatic schema creation
- Data validation

**File Storage**
- QR codes stored on server
- Organized directory structure
- Automatic cleanup (planned)

### 🚀 Performance

**Optimizations**
- Lazy loading (planned)
- Image optimization
- Code splitting (planned)
- Caching strategies (planned)

---

## Upcoming Features

### 🔜 Planned Enhancements

**For Participants:**
- [ ] Event search functionality
- [ ] Category filtering
- [ ] Calendar view
- [ ] Event reminders
- [ ] Share events on social media

**For Leaders:**
- [ ] Bulk event creation
- [ ] Event templates
- [ ] Attendance tracking via QR scan
- [ ] Export analytics reports
- [ ] Email blast to participants

**System-wide:**
- [ ] Push notifications
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Event comments/discussions
- [ ] Photo galleries

---

## Feature Comparison

| Feature | Participant | Leader |
|---------|------------|--------|
| Browse Events | ✅ | ✅ |
| RSVP for Events | ✅ | ✅ |
| View QR Codes | ✅ | ✅ |
| Create Events | ❌ | ✅ |
| Edit Events | ❌ | ✅ |
| Delete Events | ❌ | ✅ |
| View Analytics | ❌ | ✅ |
| See Participant Lists | ❌ | ✅ |
| Track Event Views | ❌ | ✅ |

---

## Business Rules

### Event Editing/Deletion
- **Edit:** Events can be edited anytime **before the event day**
- **Delete:** Events can only be deleted **7 or more days** before the scheduled date
- This prevents last-minute changes that could confuse participants
- Buttons are disabled and grayed out when actions are not allowed

### RSVP Rules
- Users can RSVP for multiple events
- One RSVP per user per event
- Can cancel and re-RSVP
- QR code remains the same for re-RSVPs

### Data Retention
- Cancelled RSVPs are marked as cancelled (soft delete)
- Event deletion removes all associated data
- QR codes are retained for audit purposes

---

## Support & Feedback

For feature requests or bug reports, please create an issue in the repository.
