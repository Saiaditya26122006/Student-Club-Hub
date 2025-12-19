"""
Student Club-Hub API - Complete Single-File Application

This is a consolidated version of all backend Python code for hackathon submission.
All models, routes, utilities, and configuration are in this single file.
"""

# ============================================================================
# SECTION 1: IMPORTS
# ============================================================================

import os
import re
import json
import qrcode
import smtplib
import traceback
from datetime import datetime, timedelta, date
from functools import wraps
from email.message import EmailMessage
from werkzeug.utils import secure_filename
import urllib.parse

from flask import Flask, Blueprint, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity, get_jwt
from sqlalchemy import ForeignKey, text, func, case, extract, or_, and_, inspect
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


# ============================================================================
# SECTION 2: CONFIGURATION
# ============================================================================

# Base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Static file directories
QR_CODES_DIR = os.path.join(BASE_DIR, "static", "qr_codes")
POSTERS_DIR = os.path.join(BASE_DIR, "static", "event_posters")
PROFILE_IMAGES_DIR = os.path.join(BASE_DIR, "static", "profile_images")

# Create directories if they don't exist
os.makedirs(QR_CODES_DIR, exist_ok=True)
os.makedirs(POSTERS_DIR, exist_ok=True)
os.makedirs(PROFILE_IMAGES_DIR, exist_ok=True)

# Database configuration
DB_PASSWORD = urllib.parse.quote_plus(os.getenv("DB_PASSWORD", "Saiaditya@2006"))
DB_USER = os.getenv("DB_USER", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "clubhub_db")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# Flask configuration
class Config:
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "clubhub_secret_key_123")
    JWT_ACCESS_TOKEN_EXPIRES = False

# Email configuration
MAIL_SERVER = os.getenv("MAIL_SERVER")
MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM", MAIL_USERNAME)
MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() == "true"

# Google Gemini AI configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Allowed file extensions
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


# ============================================================================
# SECTION 3: DATABASE MODELS
# ============================================================================

db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model):
    """User model representing participants, leaders, and university staff."""
    __tablename__ = "users"
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=True)  # Nullable for OAuth users
    role = db.Column(db.String(20), nullable=False)
    profile_image = db.Column(db.String(500), nullable=True)
    bio = db.Column(db.String(500), nullable=True)
    # OAuth fields
    provider = db.Column(db.String(50), nullable=True)  # 'google', 'facebook', 'linkedin', or None
    provider_id = db.Column(db.String(200), nullable=True)  # OAuth provider's user ID
    # Reminder preferences - TEMPORARILY COMMENTED OUT until columns are added to database
    # Uncomment these after running the SQL migration script
    # phone_number = db.Column(db.String(20), nullable=True)  # For WhatsApp/SMS
    # reminder_email_enabled = db.Column(db.Boolean, default=True, nullable=False)
    # reminder_whatsapp_enabled = db.Column(db.Boolean, default=False, nullable=False)
    # reminder_sms_enabled = db.Column(db.Boolean, default=False, nullable=False)
    
    # Temporary properties that return defaults until columns exist
    @property
    def phone_number(self):
        return getattr(self, '_phone_number', None)
    
    @phone_number.setter
    def phone_number(self, value):
        try:
            setattr(self, '_phone_number', value)
        except:
            pass
    
    @property
    def reminder_email_enabled(self):
        return getattr(self, '_reminder_email_enabled', True)
    
    @reminder_email_enabled.setter
    def reminder_email_enabled(self, value):
        try:
            setattr(self, '_reminder_email_enabled', value)
        except:
            pass
    
    @property
    def reminder_whatsapp_enabled(self):
        return getattr(self, '_reminder_whatsapp_enabled', False)
    
    @reminder_whatsapp_enabled.setter
    def reminder_whatsapp_enabled(self, value):
        try:
            setattr(self, '_reminder_whatsapp_enabled', value)
        except:
            pass
    
    @property
    def reminder_sms_enabled(self):
        return getattr(self, '_reminder_sms_enabled', False)
    
    @reminder_sms_enabled.setter
    def reminder_sms_enabled(self, value):
        try:
            setattr(self, '_reminder_sms_enabled', value)
        except:
            pass

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "profile_image": self.profile_image,
            "bio": self.bio
        }


class Club(db.Model):
    """Club model representing student organizations."""
    __tablename__ = "clubs"
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(300))
    category = db.Column(db.String(50))
    leader_id = db.Column(db.Integer, ForeignKey("users.id"), nullable=True)
    
    events = db.relationship("Event", backref="club", lazy=True, cascade="all, delete-orphan")
    leader = db.relationship("User", foreign_keys=[leader_id], backref="led_clubs")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "leader_id": self.leader_id
        }


class Event(db.Model):
    """Event model representing club events."""
    __tablename__ = "events"
    
    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, ForeignKey("clubs.id"), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(300))
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    location = db.Column(db.String(200), nullable=False)
    poster_image = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    registrations = db.relationship(
        "Registration",
        backref="event",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "club_id": self.club_id,
            "title": self.title,
            "description": self.description,
            "date": str(self.date),
            "time": str(self.time),
            "location": self.location,
            "poster_image": self.poster_image,
            "created_at": str(self.created_at)
        }


class Registration(db.Model):
    """Registration model for event participants."""
    __tablename__ = "registrations"
    
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, ForeignKey("events.id"), nullable=False)
    participant_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    qr_code_path = db.Column(db.String(300))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    cancelled = db.Column(db.Boolean, default=False, nullable=False)
    checked_in = db.Column(db.Boolean, default=False, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "event_id": self.event_id,
            "participant_name": self.participant_name,
            "email": self.email,
            "qr_code_path": self.qr_code_path,
            "timestamp": str(self.timestamp),
            "cancelled": self.cancelled,
            "checked_in": self.checked_in
        }


class EventInsight(db.Model):
    """Event insights model for tracking event views."""
    __tablename__ = "event_insights"
    
    event_id = db.Column(db.Integer, ForeignKey("events.id"), primary_key=True)
    views = db.Column(db.Integer, default=0, nullable=False)
    
    event = db.relationship(
        "Event",
        backref=db.backref("insight", uselist=False, cascade="all, delete-orphan")
    )


class ClubRequest(db.Model):
    """Club request model for club proposals."""
    __tablename__ = "club_requests"
    
    id = db.Column(db.Integer, primary_key=True)
    proposer_id = db.Column(db.Integer, ForeignKey("users.id"), nullable=False)
    
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50))
    mission = db.Column(db.Text)
    target_audience = db.Column(db.Text)
    activities_plan = db.Column(db.Text)
    
    status = db.Column(db.String(20), default="pending")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    decided_at = db.Column(db.DateTime, nullable=True)
    decision_message = db.Column(db.Text, nullable=True)
    visible_from = db.Column(db.DateTime, nullable=True)
    
    leader_email = db.Column(db.String(120), nullable=True)
    leader_password = db.Column(db.String(120), nullable=True)
    
    proposer = db.relationship(
        "User",
        backref=db.backref("club_requests", passive_deletes=False),
        foreign_keys=[proposer_id]
    )


class Friend(db.Model):
    """Friend connections between users."""
    __tablename__ = "friends"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, ForeignKey("users.id"), nullable=False)
    friend_id = db.Column(db.Integer, ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(20), default="pending")  # pending, accepted, blocked
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship("User", foreign_keys=[user_id], backref="friendships")
    friend = db.relationship("User", foreign_keys=[friend_id])


class ParticipantStats(db.Model):
    """Participant statistics and gamification."""
    __tablename__ = "participant_stats"
    
    user_id = db.Column(db.Integer, ForeignKey("users.id"), primary_key=True)
    points = db.Column(db.Integer, default=0, nullable=False)
    events_attended = db.Column(db.Integer, default=0, nullable=False)
    events_registered = db.Column(db.Integer, default=0, nullable=False)
    current_streak = db.Column(db.Integer, default=0, nullable=False)
    longest_streak = db.Column(db.Integer, default=0, nullable=False)
    last_event_date = db.Column(db.Date, nullable=True)
    favorite_category = db.Column(db.String(50), nullable=True)
    total_check_ins = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship("User", backref=db.backref("stats", uselist=False))


class Badge(db.Model):
    """Badge achievements for participants."""
    __tablename__ = "badges"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, ForeignKey("users.id"), nullable=False)
    badge_type = db.Column(db.String(50), nullable=False)  # first_event, streak_7, streak_30, etc.
    badge_name = db.Column(db.String(100), nullable=False)
    badge_description = db.Column(db.String(200), nullable=True)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship("User", backref="badges")


class EventCollection(db.Model):
    """User-created event collections/lists."""
    __tablename__ = "event_collections"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(300), nullable=True)
    color = db.Column(db.String(20), default="#3b82f6")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship("User", backref="event_collections")
    events = db.relationship("Event", secondary="collection_events", backref="collections")


class CollectionEvent(db.Model):
    """Association table for events in collections."""
    __tablename__ = "collection_events"
    
    collection_id = db.Column(db.Integer, ForeignKey("event_collections.id"), primary_key=True)
    event_id = db.Column(db.Integer, ForeignKey("events.id"), primary_key=True)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)


class EventReview(db.Model):
    """Reviews and ratings for events."""
    __tablename__ = "event_reviews"
    
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, ForeignKey("events.id"), nullable=False)
    user_id = db.Column(db.Integer, ForeignKey("users.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    review_text = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    event = db.relationship("Event", backref="reviews")
    user = db.relationship("User", backref="reviews")


class EventReminder(db.Model):
    """Event reminders for participants."""
    __tablename__ = "event_reminders"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, ForeignKey("users.id"), nullable=False)
    event_id = db.Column(db.Integer, ForeignKey("events.id"), nullable=False)
    reminder_time = db.Column(db.DateTime, nullable=False)
    reminder_type = db.Column(db.String(20), default="email")  # email, push, sms
    sent = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship("User", backref="reminders")
    event = db.relationship("Event", backref="reminders")


class UniversityCalendarEvent(db.Model):
    """University calendar events imported by users."""
    __tablename__ = "university_calendar_events"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_datetime = db.Column(db.DateTime, nullable=False)
    end_datetime = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(200), nullable=True)
    calendar_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship("User", backref="university_calendar_events")


class UniversityOfficialCalendar(db.Model):
    """Official university calendar uploaded by university admin."""
    __tablename__ = "university_official_calendar"
    
    id = db.Column(db.Integer, primary_key=True)
    university_id = db.Column(db.Integer, ForeignKey("users.id"), nullable=False)
    calendar_name = db.Column(db.String(200), nullable=False)
    calendar_url = db.Column(db.String(500), nullable=True)  # For iCal URL sync
    uploaded_file_path = db.Column(db.String(500), nullable=True)  # For file upload
    last_synced = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    university = db.relationship("User", backref="official_calendars")
    events = db.relationship("UniversityOfficialCalendarEvent", backref="calendar", lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "calendar_name": self.calendar_name,
            "calendar_url": self.calendar_url,
            "last_synced": str(self.last_synced),
            "created_at": str(self.created_at),
            "events_count": len(self.events) if self.events else 0
        }


class UniversityOfficialCalendarEvent(db.Model):
    """Events from the official university calendar."""
    __tablename__ = "university_official_calendar_events"
    
    id = db.Column(db.Integer, primary_key=True)
    calendar_id = db.Column(db.Integer, ForeignKey("university_official_calendar.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_datetime = db.Column(db.DateTime, nullable=False)
    end_datetime = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "start_datetime": str(self.start_datetime),
            "end_datetime": str(self.end_datetime),
            "location": self.location,
            "date": str(self.start_datetime.date()),
            "time": str(self.start_datetime.time())
        }


class ClubCalendarPermission(db.Model):
    """Tracks which clubs have permission to view university calendar."""
    __tablename__ = "club_calendar_permissions"
    
    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, ForeignKey("clubs.id"), nullable=False)
    calendar_id = db.Column(db.Integer, ForeignKey("university_official_calendar.id"), nullable=False)
    granted_at = db.Column(db.DateTime, default=datetime.utcnow)
    granted_by = db.Column(db.Integer, ForeignKey("users.id"), nullable=False)
    
    club = db.relationship("Club", backref="calendar_permissions")
    calendar = db.relationship("UniversityOfficialCalendar", backref="club_permissions")
    granter = db.relationship("User", foreign_keys=[granted_by])
    
    __table_args__ = (db.UniqueConstraint('club_id', 'calendar_id', name='_club_calendar_uc'),)
    
    def to_dict(self):
        return {
            "id": self.id,
            "club_id": self.club_id,
            "club_name": self.club.name if self.club else None,
            "calendar_id": self.calendar_id,
            "granted_at": str(self.granted_at)
        }


# ============================================================================
# SECTION 4: UTILITY FUNCTIONS
# ============================================================================

def sanitize_filename(s: str) -> str:
    """Sanitize a string to be used as a filename."""
    s = s.lower()
    s = re.sub(r"[@\s<>:\"/\\|?*]+", "_", s)
    s = re.sub(r"[^a-z0-9_.-]", "", s)
    return s[:180]


def get_current_user_context():
    """Get the current user context from JWT token."""
    identity = get_jwt_identity()
    claims = get_jwt()
    if identity is None:
        return None
    return {
        "id": int(identity),
        "email": claims.get("email"),
        "role": claims.get("role"),
        "name": claims.get("name")
    }


def university_required(fn):
    """Decorator to require university role."""
    @wraps(fn)
    @jwt_required()
    def decorator(*args, **kwargs):
        current_user = get_current_user_context()
        if not current_user or current_user.get("role") != "university":
            return jsonify({"error": "University role required"}), 403
        return fn(*args, **kwargs)
    return decorator


def leader_required(fn):
    """Decorator to require leader role."""
    @wraps(fn)
    @jwt_required()
    def decorator(*args, **kwargs):
        current_user = get_current_user_context()
        if not current_user or current_user.get("role") != "leader":
            return jsonify({"error": "Leader role required"}), 403
        return fn(*args, **kwargs)
    return decorator


def leader_owns_club(leader_id, club_id):
    """Check if a leader owns a specific club."""
    club = Club.query.get(club_id)
    if not club:
        return False
    return club.leader_id == leader_id


def leader_owns_event(leader_id, event_id):
    """Check if a leader owns the club that an event belongs to."""
    event = Event.query.get(event_id)
    if not event:
        return False
    return leader_owns_club(leader_id, event.club_id)


def send_registration_email(participant_email, participant_name, event, qr_path):
    """Send registration confirmation email with QR code."""
    if not MAIL_SERVER or not MAIL_FROM:
        return False

    try:
        msg = EmailMessage()
        msg["Subject"] = f"Your QR Code for {event.title}"
        msg["From"] = MAIL_FROM
        msg["To"] = participant_email

        greeting_name = participant_name or "Participant"
        msg.set_content(
            f"Hello {greeting_name},\n\n"
            f"You are confirmed for the event \"{event.title}\" scheduled on "
            f"{event.date} at {event.time} in {event.location}.\n\n"
            f"Your QR code is attached. Please present it during check-in.\n\n"
            "Regards,\nStudent Club-Hub Team"
        )

        if qr_path and os.path.exists(qr_path):
            with open(qr_path, "rb") as qr_file:
                msg.add_attachment(
                    qr_file.read(),
                    maintype="image",
                    subtype="png",
                    filename=os.path.basename(qr_path)
                )

        with smtplib.SMTP(MAIL_SERVER, MAIL_PORT) as server:
            server.ehlo()
            if MAIL_USE_TLS:
                server.starttls()
                server.ehlo()
            if MAIL_USERNAME and MAIL_PASSWORD:
                server.login(MAIL_USERNAME, MAIL_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as email_error:
        print(f"Email sending failed: {email_error}")
        return False


# ============================================================================
# REMINDER SERVICE FUNCTIONS
# ============================================================================

def send_email_reminder(user_email, user_name, event, reminder_type="registration"):
    """Send email reminder for an event."""
    try:
        if not MAIL_SERVER or not MAIL_FROM:
            print("Email not configured, skipping reminder email")
            return False
        
        msg = EmailMessage()
        
        if reminder_type == "registration":
            msg["Subject"] = f"Reminder: {event.title} - You're Registered!"
        elif reminder_type == "24h":
            msg["Subject"] = f"Reminder: {event.title} is Tomorrow!"
        elif reminder_type == "1h":
            msg["Subject"] = f"Reminder: {event.title} starts in 1 hour!"
        else:
            msg["Subject"] = f"Reminder: {event.title}"
        
        msg["From"] = MAIL_FROM
        msg["To"] = user_email
        
        # Get registration for QR code
        registration = Registration.query.filter_by(
            event_id=event.id, email=user_email, cancelled=False
        ).first()
        
        qr_attachment = None
        if registration and registration.qr_code_path and os.path.exists(registration.qr_code_path):
            with open(registration.qr_code_path, "rb") as f:
                qr_attachment = f.read()
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #0ea5e9;">📅 Event Reminder</h2>
                <p>Hi {user_name},</p>
                <p>This is a friendly reminder about <strong>{event.title}</strong>!</p>
                <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Event Details:</h3>
                    <p><strong>Date:</strong> {event.date}</p>
                    <p><strong>Time:</strong> {event.time}</p>
                    <p><strong>Location:</strong> {event.location}</p>
                    {f'<p><strong>Description:</strong> {event.description}</p>' if event.description else ''}
                </div>
                {"<p>Don't forget to bring your QR code for check-in!</p>" if qr_attachment else ""}
                <p>We look forward to seeing you there!</p>
                <p style="color: #666; font-size: 12px;">This is an automated reminder from Student Club-Hub.</p>
            </div>
        </body>
        </html>
        """
        msg.set_content(html_body, subtype="html")
        
        if qr_attachment:
            msg.add_attachment(qr_attachment, maintype="image", subtype="png", filename="qr_code.png")
        
        with smtplib.SMTP(MAIL_SERVER, MAIL_PORT) as server:
            server.ehlo()
            if MAIL_USE_TLS:
                server.starttls()
                server.ehlo()
            if MAIL_USERNAME and MAIL_PASSWORD:
                server.login(MAIL_USERNAME, MAIL_PASSWORD)
            server.send_message(msg)
        print(f"✅ Reminder email sent to {user_email}")
        return True
    except Exception as e:
        print(f"❌ Email reminder failed: {e}")
        return False


def send_whatsapp_reminder(phone_number, user_name, event, reminder_type="registration"):
    """Send WhatsApp reminder using Twilio WhatsApp API."""
    try:
        # Check if Twilio is configured
        twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        twilio_whatsapp_from = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")
        
        if not twilio_account_sid or not twilio_auth_token:
            print("Twilio not configured, skipping WhatsApp reminder")
            return False
        
        try:
            from twilio.rest import Client
        except ImportError:
            print("Twilio library not installed. Install with: pip install twilio")
            return False
        
        client = Client(twilio_account_sid, twilio_auth_token)
        
        # Format phone number (add country code if not present)
        if not phone_number.startswith("+"):
            phone_number = f"+91{phone_number}"  # Default to India, adjust as needed
        
        whatsapp_to = f"whatsapp:{phone_number}"
        
        # Create message
        if reminder_type == "registration":
            message_body = f"🎉 Hi {user_name}! You're registered for *{event.title}*\n\n"
        elif reminder_type == "24h":
            message_body = f"⏰ Reminder: *{event.title}* is tomorrow!\n\n"
        elif reminder_type == "1h":
            message_body = f"🚀 *{event.title}* starts in 1 hour!\n\n"
        else:
            message_body = f"📅 Reminder: *{event.title}*\n\n"
        
        message_body += f"📅 Date: {event.date}\n"
        message_body += f"⏰ Time: {event.time}\n"
        message_body += f"📍 Location: {event.location}\n"
        if event.description:
            message_body += f"\n{event.description[:100]}...\n"
        message_body += "\nSee you there! 🎊"
        
        message = client.messages.create(
            body=message_body,
            from_=twilio_whatsapp_from,
            to=whatsapp_to
        )
        
        print(f"✅ WhatsApp reminder sent to {phone_number} (SID: {message.sid})")
        return True
    except Exception as e:
        print(f"❌ WhatsApp reminder failed: {e}")
        return False


def send_sms_reminder(phone_number, user_name, event, reminder_type="registration"):
    """Send SMS reminder using Twilio SMS API."""
    try:
        twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        twilio_sms_from = os.getenv("TWILIO_SMS_FROM")
        
        if not twilio_account_sid or not twilio_auth_token or not twilio_sms_from:
            print("Twilio not configured, skipping SMS reminder")
            return False
        
        try:
            from twilio.rest import Client
        except ImportError:
            print("Twilio library not installed. Install with: pip install twilio")
            return False
        
        client = Client(twilio_account_sid, twilio_auth_token)
        
        # Format phone number
        if not phone_number.startswith("+"):
            phone_number = f"+91{phone_number}"
        
        # Create short message
        if reminder_type == "registration":
            message_body = f"Student Club-Hub: You're registered for {event.title} on {event.date} at {event.time}. Location: {event.location}"
        elif reminder_type == "24h":
            message_body = f"Reminder: {event.title} is tomorrow at {event.time}. Location: {event.location}"
        elif reminder_type == "1h":
            message_body = f"Reminder: {event.title} starts in 1 hour at {event.location}!"
        else:
            message_body = f"Reminder: {event.title} on {event.date} at {event.time}. Location: {event.location}"
        
        message = client.messages.create(
            body=message_body,
            from_=twilio_sms_from,
            to=phone_number
        )
        
        print(f"✅ SMS reminder sent to {phone_number} (SID: {message.sid})")
        return True
    except Exception as e:
        print(f"❌ SMS reminder failed: {e}")
        return False


def send_event_reminders(user, event, reminder_type="registration", channels=None):
    """Send reminders through enabled channels for a user."""
    if channels is None:
        channels = []
        if user.reminder_email_enabled:
            channels.append("email")
        if user.reminder_whatsapp_enabled and user.phone_number:
            channels.append("whatsapp")
        if user.reminder_sms_enabled and user.phone_number:
            channels.append("sms")
    
    results = {"email": False, "whatsapp": False, "sms": False}
    
    if "email" in channels and user.reminder_email_enabled:
        results["email"] = send_email_reminder(
            user.email, user.name or user.email.split("@")[0], event, reminder_type
        )
    
    if "whatsapp" in channels and user.reminder_whatsapp_enabled and user.phone_number:
        results["whatsapp"] = send_whatsapp_reminder(
            user.phone_number, user.name or user.email.split("@")[0], event, reminder_type
        )
    
    if "sms" in channels and user.reminder_sms_enabled and user.phone_number:
        results["sms"] = send_sms_reminder(
            user.phone_number, user.name or user.email.split("@")[0], event, reminder_type
        )
    
    return results


def create_automatic_reminders(user_id, event_id):
    """Create automatic reminders for a user's event registration."""
    try:
        user = User.query.get(user_id)
        event = Event.query.get(event_id)
        
        if not user or not event:
            return
        
        event_datetime = datetime.combine(event.date, event.time)
        
        # Create reminder for 24 hours before
        reminder_24h = EventReminder(
            user_id=user_id,
            event_id=event_id,
            reminder_time=event_datetime - timedelta(hours=24),
            reminder_type="email"
        )
        db.session.add(reminder_24h)
        
        # Create reminder for 1 hour before
        reminder_1h = EventReminder(
            user_id=user_id,
            event_id=event_id,
            reminder_time=event_datetime - timedelta(hours=1),
            reminder_type="email"
        )
        db.session.add(reminder_1h)
        
        db.session.commit()
        print(f"✅ Automatic reminders created for user {user_id}, event {event_id}")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Failed to create automatic reminders: {e}")


def ensure_schema():
    """Ensure database schema is up to date with required columns."""
    try:
        # Use PostgreSQL-compatible syntax
        try:

            db.session.execute(
                text("ALTER TABLE registrations ADD COLUMN cancelled BOOLEAN NOT NULL DEFAULT FALSE")
        )
        except Exception:
            pass  # Column might already exist
        
        try:

        
            db.session.execute(
                text("ALTER TABLE registrations ADD COLUMN checked_in BOOLEAN NOT NULL DEFAULT FALSE")
        )
        except Exception:
            pass  # Column might already exist
        
        try:

        
            db.session.execute(
                text("ALTER TABLE clubs ADD COLUMN leader_id INTEGER REFERENCES users(id)")
            )
        except Exception:
            pass
        
        try:

        
            db.session.execute(
                text("ALTER TABLE club_requests ADD COLUMN leader_email VARCHAR(120)")
            )
        except Exception:
            pass
        try:

            db.session.execute(
                text("ALTER TABLE club_requests ADD COLUMN leader_password VARCHAR(120)")
            )
        except Exception:
            pass
        
        try:

        
            db.session.execute(
                text("ALTER TABLE events ADD COLUMN IF NOT EXISTS poster_image VARCHAR(500)")
            )
        except Exception:
            pass
        
        try:
            result = db.session.execute(
                text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='profile_image'")
            ).fetchone()
            if not result:
                db.session.execute(
                    text("ALTER TABLE users ADD COLUMN profile_image VARCHAR(500)")
                )
        except Exception:
            pass
        
        try:
            result = db.session.execute(
                text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='bio'")
            ).fetchone()
            if not result:
                db.session.execute(
                    text("ALTER TABLE users ADD COLUMN bio VARCHAR(500)")
                )
        except Exception:
            pass
        
        # Add OAuth columns - MUST run before any User queries
        try:
            result = db.session.execute(
                text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='provider'")
            ).fetchone()
            if not result:
                print("Adding OAuth columns: provider, provider_id...")
                db.session.execute(
                    text("ALTER TABLE users ADD COLUMN provider VARCHAR(50)")
                )
                db.session.execute(
                    text("ALTER TABLE users ADD COLUMN provider_id VARCHAR(200)")
                )
                db.session.commit()
                print("✅ Added OAuth columns")
        except Exception as e:
            print(f"Error adding OAuth columns: {e}")
            db.session.rollback()
        
        # Make password nullable for OAuth users
        try:
            result = db.session.execute(
                text("SELECT is_nullable FROM information_schema.columns WHERE table_name='users' AND column_name='password'")
            ).fetchone()
            if result and result[0] == 'NO':
                print("Making password column nullable for OAuth users...")
                db.session.execute(
                    text("ALTER TABLE users ALTER COLUMN password DROP NOT NULL")
                )
                db.session.commit()
                print("✅ Made password column nullable")
        except Exception as e:
            print(f"Error making password nullable: {e}")
            db.session.rollback()
        
        # Add reminder preference columns - MUST run before any User queries
        columns_to_add = [
            ("phone_number", "VARCHAR(20)", None),
            ("reminder_email_enabled", "BOOLEAN NOT NULL DEFAULT TRUE", True),
            ("reminder_whatsapp_enabled", "BOOLEAN NOT NULL DEFAULT FALSE", False),
            ("reminder_sms_enabled", "BOOLEAN NOT NULL DEFAULT FALSE", False)
        ]
        
        for col_name, col_def, default_val in columns_to_add:
            try:
                result = db.session.execute(
                    text(f"SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='{col_name}'")
                ).fetchone()
                if not result:
                    print(f"Adding column: {col_name}...")
                    db.session.execute(
                        text(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
                    )
                    db.session.commit()
                    print(f"✅ Added {col_name} column")
                    
                    # Update existing rows with default value if needed
                    if default_val is not None:
                        try:

                            db.session.execute(
                                text(f"UPDATE users SET {col_name} = {str(default_val).upper()} WHERE {col_name} IS NULL")
                            )
                            db.session.commit()
                        except:
                            pass
                else:
                    print(f"✓ {col_name} column already exists")
            except Exception as e:
                db.session.rollback()
                print(f"⚠️ Error adding {col_name} column: {e}")
                # Try to continue with other columns
        
        print("✅ Database schema check completed")
    except Exception as schema_err:
        db.session.rollback()
        print(f"Schema check failed: {schema_err}")


def get_event_analytics(email=None, leader_id=None, club_ids=None):
    """Get comprehensive event analytics data for AI processing."""
    try:
        event_filter = None
        filter_club_ids = None
        if club_ids:
            event_filter = Event.club_id.in_(club_ids)
            filter_club_ids = club_ids
        elif leader_id:
            leader_clubs = Club.query.filter_by(leader_id=leader_id).all()
            club_ids = [club.id for club in leader_clubs]
            if club_ids:
                event_filter = Event.club_id.in_(club_ids)
                filter_club_ids = club_ids
        
        if filter_club_ids:
            total_events = Event.query.filter(event_filter).count()
        else:
            total_events = Event.query.count()
        
        reg_query = db.session.query(func.count(Registration.id)).join(Event, Registration.event_id == Event.id)
        if filter_club_ids:
            reg_query = reg_query.filter(event_filter)
        if email:
            reg_query = reg_query.filter(Registration.email == email)
        reg_query = reg_query.filter(Registration.cancelled == False)
        total_registrations = reg_query.scalar() or 0
        
        popular_clubs_query = (
            db.session.query(Club.name, func.count(Registration.id).label("reg_count"))
            .join(Event, Club.id == Event.club_id)
            .join(Registration, Registration.event_id == Event.id)
            .filter(Registration.cancelled == False)
        )
        if filter_club_ids:
            popular_clubs_query = popular_clubs_query.filter(event_filter)
        if email:
            popular_clubs_query = popular_clubs_query.filter(Registration.email == email)
        popular_clubs_query = popular_clubs_query.group_by(Club.name).order_by(func.count(Registration.id).desc()).limit(10)
        popular_clubs = [{"name": name, "registrations": count} for name, count in popular_clubs_query.all()]
        
        date_query = (
            db.session.query(Event.date, func.count(Registration.id).label("count"))
            .join(Registration, Registration.event_id == Event.id)
            .filter(Registration.cancelled == False)
        )
        if filter_club_ids:
            date_query = date_query.filter(event_filter)
        if email:
            date_query = date_query.filter(Registration.email == email)
        date_query = date_query.group_by(Event.date).order_by(Event.date.desc()).limit(30)
        registrations_by_date = [{"date": str(date), "count": count} for date, count in date_query.all()]
    except Exception as e:
        print(f"Error in get_event_analytics: {str(e)}")
        raise
    
    participant_history = None
    if email:
        past_regs = (
            Registration.query
            .filter_by(email=email, cancelled=False)
            .join(Event, Registration.event_id == Event.id)
            .join(Club, Event.club_id == Club.id)
            .order_by(Registration.timestamp.desc())
            .limit(20)
            .all()
        )
        participant_history = []
        for reg in past_regs:
            event = reg.event
            club = event.club if event else None
            participant_history.append({
                "event_id": reg.event_id,
                "event_title": event.title if event else "Unknown",
                "event_date": str(event.date) if event else None,
                "club_name": club.name if club else "Unknown",
                "club_category": club.category if club else "General",
                "registered_at": str(reg.timestamp),
                "checked_in": reg.checked_in
            })
    
    avg_regs_per_event = total_registrations / total_events if total_events > 0 else 0
    
    return {
        "total_events": total_events,
        "total_registrations": total_registrations,
        "average_registrations_per_event": round(avg_regs_per_event, 2),
        "popular_clubs": popular_clubs,
        "registrations_by_date": registrations_by_date,
        "participant_history": participant_history
    }


def get_attendance_stats(event_id=None, leader_id=None):
    """Get attendance statistics for events."""
    query = db.session.query(
        Event.id,
        Event.title,
        func.count(Registration.id).label("total_registrations"),
        func.sum(case((Registration.checked_in == True, 1), else_=0)).label("checked_in_count"),
        func.sum(case((Registration.cancelled == True, 1), else_=0)).label("cancelled_count")
    ).join(Registration, Registration.event_id == Event.id, isouter=True)
    
    if event_id:
        query = query.filter(Event.id == event_id)
    elif leader_id:
        leader_clubs = Club.query.filter_by(leader_id=leader_id).all()
        club_ids = [club.id for club in leader_clubs]
        if club_ids:
            query = query.filter(Event.club_id.in_(club_ids))
    
    query = query.group_by(Event.id, Event.title)
    
    if event_id:
        result = query.first()
        if not result:
            return {
                "event_id": event_id,
                "total_registrations": 0,
                "checked_in_count": 0,
                "cancelled_count": 0,
                "no_show_count": 0,
                "attendance_rate": 0,
                "no_show_rate": 0
            }
        
        total_reg = result.total_registrations or 0
        checked_in = result.checked_in_count or 0
        cancelled = result.cancelled_count or 0
        no_show = total_reg - checked_in - cancelled
        
        return {
            "event_id": result.id,
            "event_title": result.title,
            "total_registrations": total_reg,
            "checked_in_count": checked_in,
            "cancelled_count": cancelled,
            "no_show_count": no_show,
            "attendance_rate": round((checked_in / total_reg * 100) if total_reg > 0 else 0, 2),
            "no_show_rate": round((no_show / total_reg * 100) if total_reg > 0 else 0, 2)
        }
    else:
        results = query.all()
        stats = []
        for row in results:
            total_reg = row.total_registrations or 0
            checked_in = row.checked_in_count or 0
            cancelled = row.cancelled_count or 0
            no_show = total_reg - checked_in - cancelled
            
            stats.append({
                "event_id": row.id,
                "event_title": row.title,
                "total_registrations": total_reg,
                "checked_in_count": checked_in,
                "cancelled_count": cancelled,
                "no_show_count": no_show,
                "attendance_rate": round((checked_in / total_reg * 100) if total_reg > 0 else 0, 2),
                "no_show_rate": round((no_show / total_reg * 100) if total_reg > 0 else 0, 2)
            })
        
        return {"events": stats, "total_events": len(stats)}


def build_leader_insight_prompt(analytics_data):
    """Build a formatted prompt for AI leader insights generation."""
    prompt = f"""You are a business intelligence AI that generates performance insights for university event organizers and club leaders.

Given this analytics data for a club leader managing their events:
{json.dumps(analytics_data, indent=2)}

Analyze this data from an ORGANIZER'S PERSPECTIVE and provide:
1. A brief summary (2-3 sentences) of overall event management performance
2. 3-5 key insights (actionable business observations about trends, patterns, or performance anomalies)
3. 3-5 specific recommendations for improving event organization, engagement, and attendance

Format your response as a JSON object with these exact keys:
{{
  "summary": "Brief summary text",
  "key_insights": ["Insight 1", "Insight 2", ...],
  "recommendations": ["Recommendation 1", "Recommendation 2", ...]
}}

Be specific, data-driven, and actionable. Use numbers from the data when relevant.
Focus on ORGANIZER concerns:
- Event performance trends and which events/clubs are most successful
- Registration patterns and conversion rates
- Attendance rates and no-show analysis
- Popular clubs/categories under your management
- Best days/times for scheduling events
- Growth opportunities to increase engagement
- Areas needing attention (low attendance, poor conversion, etc.)
- Strategies to improve event turnout
- Club management best practices

Think like a business analyst helping an event organizer optimize their operations."""
    
    return prompt


def build_participant_prompt(profile_data, events_data):
    """Build a formatted prompt for AI participant event recommendations."""
    categories = profile_data.get('attended_categories', [])
    most_preferred = profile_data.get('most_preferred_category', 'General')
    preferred_day = profile_data.get('preferred_day_of_week', 'Any day')
    category_freq = profile_data.get('category_frequency', {})
    
    analysis_summary = f"""
Participant Analysis:
- Total Events Attended: {profile_data.get('past_registrations_count', 0)}
- Most Preferred Category: {most_preferred} (attended {category_freq.get(most_preferred, 0)} times)
- Preferred Day: {preferred_day}
- All Categories Attended: {', '.join(categories) if categories else 'Various'}
- Clubs Engaged With: {len(profile_data.get('attended_clubs', []))} different clubs
"""
    
    prompt = f"""You are an event recommendation AI for university students.

{analysis_summary}

Available Upcoming Events:
{json.dumps(events_data, indent=2)}

Based on the participant's detailed history of {profile_data.get('past_registrations_count', 0)} event registrations, analyze their preferences and recommend exactly 3 events they are most likely to enjoy.

Key Analysis Points:
1. Most Preferred Category: {most_preferred} - They've attended this category {category_freq.get(most_preferred, 0)} times
2. Preferred Day: {preferred_day} - They tend to attend events on this day
3. Category Preferences: {json.dumps(category_freq, indent=2)}
4. Past Registration History: {len(profile_data.get('registration_history', []))} recent events

For each recommendation, provide:
- event_id: The ID of the recommended event
- explanation: A short, friendly explanation (1-2 sentences) why this event matches their interests, referencing specific patterns from their history

Format your response as a JSON array with exactly 3 objects:
[
  {{
    "event_id": <number>,
    "explanation": "Why this event is recommended based on their {most_preferred} interest and {preferred_day} preference..."
  }},
  ...
]

Recommendation Strategy:
- Prioritize events in their most preferred category ({most_preferred})
- Consider events on their preferred day ({preferred_day})
- Look for events similar to ones they've attended before
- Consider trending/popular events
- Match event themes to their interests

Be specific and reference their past interests, preferred category, and day preferences when relevant."""
    
    return prompt


# ============================================================================
# SECTION 5: ROUTE BLUEPRINTS - GENERAL
# ============================================================================

general_bp = Blueprint("general", __name__)

@general_bp.route("/")
def home():
    """API home endpoint."""
    return jsonify({
        "message": "Welcome to Student Club-Hub API!",
        "version": "4.1",
        "endpoints": {
            "auth": ["/api/register", "/api/login"],
            "clubs": "/api/clubs",
            "events": "/api/events",
            "registrations": "/api/registrations",
            "leader_dashboard": ["/api/leader/events", "/api/leader/registrations/<event_id>"],
            "participant": ["/api/participant/events", "/api/participant/registrations/<email>"],
            "db_test": "/db-test"
        }
    }), 200


@general_bp.route("/db-test")
def db_test():
    """Test database connection."""
    try:

        db.session.execute(text("SELECT 1"))
        return jsonify({"message": "Database connected successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================================
# SECTION 6: ROUTE BLUEPRINTS - AUTHENTICATION
# ============================================================================

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register_user():
    """Register a new user."""
    try:
        data = request.get_json(force=True)
        if not data.get("name") or not data.get("email") or not data.get("password"):
            return jsonify({"error": "name, email and password are required"}), 400

        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"error": "Email already registered"}), 409

        hashed_pw = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
        user = User(
            name=data["name"],
            email=data["email"],
            password=hashed_pw,
            role=data.get("role", "participant")
        )
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": "User registered successfully!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@auth_bp.route("/login", methods=["POST"])
def login_user():
    """Login user and return JWT token."""
    try:
        data = request.get_json(force=True)
        user = User.query.filter_by(email=data.get("email")).first()
        
        if not user:
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Check if user exists and has password (not OAuth-only user)
        if user.password:
            if bcrypt.check_password_hash(user.password, data.get("password")):
                token = create_access_token(
                    identity=str(user.id),
                    expires_delta=timedelta(days=30),
                    additional_claims={
                        "email": user.email,
                        "role": user.role,
                        "name": user.name
                    }
                )
                return jsonify({
                    "token": token,
                    "role": user.role,
                    "user": {"id": user.id, "name": user.name, "email": user.email}
                }), 200
        else:
            # OAuth-only user trying to login with password
            return jsonify({"error": "This account was created with social login. Please use social login to sign in."}), 401
        
        return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route("/oauth/<provider>", methods=["POST"])
def oauth_login(provider):
    """Handle OAuth login/registration for Google, Facebook, or LinkedIn."""
    try:
        data = request.get_json(force=True)
        
        # Validate required fields
        if not data.get("access_token") or not data.get("email"):
            return jsonify({"error": "Access token and email are required"}), 400
        
        access_token = data["access_token"]
        email = data["email"]
        name = data.get("name", "")
        profile_image = data.get("profile_image")
        provider_id = data.get("provider_id", "")
        
        # Validate provider
        if provider not in ["google", "facebook", "linkedin"]:
            return jsonify({"error": "Invalid OAuth provider"}), 400
        
        # Verify token and get user info from provider
        user_info = None
        if provider == "google":
            user_info = verify_google_token(access_token)
        elif provider == "facebook":
            user_info = verify_facebook_token(access_token)
        elif provider == "linkedin":
            user_info = verify_linkedin_token(access_token)
        
        if not user_info:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        # Check if user already exists
        user = User.query.filter_by(email=email).first()
        
        if user:
            # Existing user - check if OAuth provider matches
            if user.provider != provider:
                return jsonify({
                    "error": f"This email is already registered with {user.provider or 'email/password'}. Please use that method to sign in."
                }), 409
            
            # Update provider_id if needed
            if not user.provider_id:
                user.provider_id = provider_id
                db.session.commit()
        else:
            # New user - create account
            # OAuth users can only be participants (leaders and universities get assigned credentials)
            role = "participant"
            
            user = User(
                name=name or user_info.get("name", email.split("@")[0]),
                email=email,
                password=None,  # OAuth users don't have passwords
                role=role,
                provider=provider,
                provider_id=provider_id or user_info.get("id", ""),
                profile_image=profile_image or user_info.get("picture")
            )
            db.session.add(user)
            db.session.commit()
        
        # Generate JWT token
        token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(days=30),
            additional_claims={
                "email": user.email,
                "role": user.role,
                "name": user.name
            }
        )
        
        return jsonify({
            "token": token,
            "role": user.role,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "profile_image": user.profile_image
            },
            "message": "Login successful" if user.provider else "Registration successful"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


def verify_google_token(access_token):
    """Verify Google OAuth token and return user info."""
    try:
        import requests
        response = requests.get(
            f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}",
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            return {
                "id": data.get("id"),
                "email": data.get("email"),
                "name": data.get("name"),
                "picture": data.get("picture")
            }
        return None
    except Exception as e:
        print(f"Google token verification error: {e}")
        return None


def verify_facebook_token(access_token):
    """Verify Facebook OAuth token and return user info."""
    try:
        import requests
        response = requests.get(
            f"https://graph.facebook.com/me?fields=id,name,email,picture&access_token={access_token}",
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            picture_url = None
            if data.get("picture") and data["picture"].get("data"):
                picture_url = data["picture"]["data"].get("url")
            return {
                "id": data.get("id"),
                "email": data.get("email"),
                "name": data.get("name"),
                "picture": picture_url
            }
        return None
    except Exception as e:
        print(f"Facebook token verification error: {e}")
        return None


def verify_linkedin_token(access_token):
    """Verify LinkedIn OAuth token and return user info."""
    try:
        import requests
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(
            "https://api.linkedin.com/v2/userinfo",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            return {
                "id": data.get("sub"),
                "email": data.get("email"),
                "name": data.get("name"),
                "picture": data.get("picture")
            }
        return None
    except Exception as e:
        print(f"LinkedIn token verification error: {e}")
        return None


# ============================================================================
# SECTION 7: ROUTE BLUEPRINTS - CLUBS
# ============================================================================

clubs_bp = Blueprint("clubs", __name__)

@clubs_bp.route("/clubs", methods=["POST"])
@jwt_required()
def create_club():
    """Create a new club (leader only)."""
    current_user = get_current_user_context()
    if not current_user or current_user.get("role") != "leader":
        return jsonify({"error": "Access denied"}), 403
    try:
        data = request.get_json(force=True)
        new_club = Club(
            name=data["name"],
            description=data.get("description", ""),
            category=data.get("category", "")
        )
        db.session.add(new_club)
        db.session.commit()
        return jsonify({"message": "Club created successfully!", "club": new_club.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@clubs_bp.route("/clubs", methods=["GET"])
@jwt_required(optional=True)
def get_clubs():
    """Get clubs list."""
    current_user = get_current_user_context()
    
    if current_user and current_user.get("role") == "leader":
        leader_id = current_user.get("id")
        clubs = Club.query.filter_by(leader_id=leader_id).all()
    else:
        clubs = Club.query.all()
    
    return jsonify([club.to_dict() for club in clubs]), 200


# ============================================================================
# SECTION 8: ROUTE BLUEPRINTS - EVENTS
# ============================================================================

events_bp = Blueprint("events", __name__)

def _generate_qr_for_registration(registration, event, participant_name, participant_email):
    """Generate QR code for a registration."""
    qr_data = f"REG:{registration.id}|EVT:{event.id}|NAME:{participant_name}|EMAIL:{participant_email}"
    qr_img = qrcode.make(qr_data)
    safe_email = sanitize_filename(participant_email)
    filename = f"registration_{registration.id}_{safe_email}.png"
    qr_path = os.path.join(QR_CODES_DIR, filename)
    qr_img.save(qr_path)
    registration.qr_code_path = qr_path
    return qr_path


@events_bp.route("/events/upload-poster", methods=["POST"])
@jwt_required()
def upload_event_poster():
    """Upload event poster image."""
    current_user = get_current_user_context()
    if not current_user or current_user.get("role") != "leader":
        return jsonify({"error": "Access denied"}), 403
    
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    
    if not (file.filename and "." in file.filename and 
            file.filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS):
        return jsonify({"error": "Invalid file type. Allowed: PNG, JPG, JPEG, GIF, WEBP"}), 400
    
    try:
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        original_filename = secure_filename(file.filename)
        filename = f"{timestamp}_{original_filename}"
        filepath = os.path.join(POSTERS_DIR, filename)
        file.save(filepath)
        image_url = f"/api/posters/{filename}"
        return jsonify({"message": "Poster uploaded successfully", "url": image_url}), 200
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500


@events_bp.route("/posters/<filename>", methods=["GET"])
def get_poster_image(filename):
    """Serve event poster images."""
    try:
        safe_filename = secure_filename(filename)
        filepath = os.path.join(POSTERS_DIR, safe_filename)
        
        if not os.path.exists(filepath):
            return jsonify({"error": "Image not found"}), 404
        
        ext = safe_filename.rsplit(".", 1)[1].lower() if "." in safe_filename else ""
        mime_types = {
            "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
            "gif": "image/gif", "webp": "image/webp"
        }
        mimetype = mime_types.get(ext, "image/jpeg")
        return send_file(filepath, mimetype=mimetype)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@events_bp.route("/events", methods=["POST"])
@jwt_required()
def create_event():
    """Create a new event."""
    current_user = get_current_user_context()
    if not current_user or current_user.get("role") != "leader":
        return jsonify({"error": "Access denied"}), 403
    
    try:
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form
            club_id = int(data.get("club_id"))
            poster_image = data.get("poster_image") or None
        else:
            data = request.get_json() or {}
            if not data:
                data = request.get_json(force=True) or {}
            club_id = data.get("club_id")
            poster_image = data.get("poster_image")
            if poster_image == "":
                poster_image = None
        
        if not club_id:
            return jsonify({"error": "club_id is required"}), 400
        if not data.get("title"):
            return jsonify({"error": "title is required"}), 400
        if not data.get("date"):
            return jsonify({"error": "date is required"}), 400
        if not data.get("time"):
            return jsonify({"error": "time is required"}), 400
        if not data.get("location"):
            return jsonify({"error": "location is required"}), 400
        
        if not leader_owns_club(current_user.get("id"), club_id):
            return jsonify({"error": "You can only create events for your own clubs."}), 403
        
        event = Event(
            club_id=int(club_id),
            title=str(data["title"]).strip(),
            description=str(data.get("description", "")).strip(),
            date=datetime.strptime(str(data["date"]), "%Y-%m-%d").date(),
            time=datetime.strptime(str(data["time"]), "%H:%M").time(),
            location=str(data["location"]).strip(),
            poster_image=poster_image
        )
        db.session.add(event)
        db.session.commit()
        return jsonify({"message": "Event created successfully!", "event": event.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@events_bp.route("/events", methods=["GET"])
def get_events():
    """Get all events."""
    events = Event.query.order_by(Event.date.asc(), Event.time.asc()).all()
    return jsonify([event.to_dict() for event in events]), 200


@events_bp.route("/events/<int:event_id>", methods=["GET"])
def get_event(event_id):
    """Get a specific event by ID."""
    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404
    return jsonify(event.to_dict()), 200


@events_bp.route("/events/<int:event_id>", methods=["DELETE"])
@jwt_required()
def delete_event(event_id):
    """Delete an event (leader only, 7 days in advance)."""
    current_user = get_current_user_context()
    if not current_user or current_user.get("role") != "leader":
        return jsonify({"error": "Access denied"}), 403

    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    if not leader_owns_event(current_user.get("id"), event_id):
        return jsonify({"error": "You can only delete events from your own clubs."}), 403

    days_until_event = (event.date - datetime.utcnow().date()).days
    if days_until_event < 7:
        return jsonify({"error": "Events can only be deleted at least 7 days in advance."}), 400

    try:
        db.session.delete(event)
        db.session.commit()
        return jsonify({"message": "Event deleted successfully."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@events_bp.route("/events/<int:event_id>", methods=["PUT"])
@jwt_required()
def update_event(event_id):
    """Update an event (leader only)."""
    current_user = get_current_user_context()
    if not current_user or current_user.get("role") != "leader":
        return jsonify({"error": "Access denied"}), 403

    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    if not leader_owns_event(current_user.get("id"), event_id):
        return jsonify({"error": "You can only edit events from your own clubs."}), 403

    days_until_event = (event.date - datetime.utcnow().date()).days
    if days_until_event < 1:
        return jsonify({"error": "Events can only be edited until the day before they start."}), 400

    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form
    else:
        data = request.get_json() or {}
        if not data:
            data = request.get_json(force=True) or {}
    
    try:
        if "club_id" in data and data["club_id"]:
            new_club_id = int(data["club_id"])
            if not leader_owns_club(current_user.get("id"), new_club_id):
                return jsonify({"error": "You can only assign events to your own clubs."}), 403
            event.club_id = new_club_id
        if "title" in data and data["title"]:
            event.title = str(data["title"]).strip()
        if "description" in data:
            event.description = str(data["description"]).strip()
        if "location" in data and data["location"]:
            event.location = str(data["location"]).strip()
        if "poster_image" in data:
            poster_value = data["poster_image"]
            if poster_value and str(poster_value).strip():
                event.poster_image = str(poster_value).strip()
            else:
                event.poster_image = None
        if "date" in data and data["date"]:
            new_date = datetime.strptime(str(data["date"]), "%Y-%m-%d").date()
            if (new_date - datetime.utcnow().date()).days < 1:
                return jsonify({"error": "New date must be at least one day ahead."}), 400
            event.date = new_date
        if "time" in data and data["time"]:
            event.time = datetime.strptime(str(data["time"]), "%H:%M").time()

        db.session.commit()
        return jsonify({"message": "Event updated successfully.", "event": event.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@events_bp.route("/events/track-views", methods=["POST"])
def track_event_views():
    """Track event views for analytics."""
    try:
        data = request.get_json(force=True)
        event_ids = data.get("event_ids", [])
        if not isinstance(event_ids, list) or not event_ids:
            return jsonify({"error": "event_ids must be a non-empty list"}), 400

        unique_ids = set()
        for raw_id in event_ids:
            try:
                unique_ids.add(int(raw_id))
            except (TypeError, ValueError):
                continue

        if not unique_ids:
            return jsonify({"error": "No valid event ids provided"}), 400

        for event_id in unique_ids:
            event = Event.query.get(event_id)
            if not event:
                continue
            insight = EventInsight.query.get(event_id)
            if not insight:
                insight = EventInsight(event_id=event_id, views=0)
                db.session.add(insight)
            insight.views += 1

        db.session.commit()
        return jsonify({"message": "Views tracked"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@events_bp.route("/participant/events", methods=["GET"])
def participant_events():
    """Get events for participants with filtering options."""
    category = request.args.get("category")
    date_str = request.args.get("date")
    q = request.args.get("q")

    query = Event.query.join(Club)
    if category:
        query = query.filter(Club.category.ilike(f"%{category}%"))
    if date_str:
        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
            query = query.filter(Event.date >= date_obj)
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400
    if q:
        keyword = f"%{q}%"
        query = query.filter(or_(Event.title.ilike(keyword), Event.description.ilike(keyword)))

    events = query.order_by(Event.date.asc(), Event.time.asc()).all()
    return jsonify([e.to_dict() for e in events]), 200


# ============================================================================
# SECTION 9: ROUTE BLUEPRINTS - REGISTRATIONS
# ============================================================================

registrations_bp = Blueprint("registrations", __name__)

@registrations_bp.route("/events/<int:event_id>/register", methods=["POST"])
@jwt_required()
def register_for_event_authenticated(event_id):
    """Register for an event (authenticated user)."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Invalid token"}), 401

    user = User.query.get(current_user.get("id"))
    if not user:
        return jsonify({"error": "User not found"}), 404

    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    try:
        registration = Registration.query.filter_by(event_id=event_id, email=user.email).first()
        created = False
        if registration and registration.cancelled:
            registration.participant_name = user.name or user.email.split("@")[0]
            registration.cancelled = False
        elif not registration:
            registration = Registration(
                event_id=event_id,
                participant_name=user.name or user.email.split("@")[0],
                email=user.email
            )
            db.session.add(registration)
            db.session.flush()
            created = True
        else:
            return jsonify({"error": "Already registered for this event"}), 400

        qr_generated = False
        if not registration.qr_code_path or not os.path.exists(registration.qr_code_path):
            _generate_qr_for_registration(
                registration, event, registration.participant_name, registration.email
            )
            qr_generated = True

        # Award points for registration
        if created:
            award_points_and_badges(user.id, "register", 10)

        if created or qr_generated:
            db.session.commit()

        qr_url = f"/api/registrations/{registration.id}/qr"
        send_registration_email(
            registration.email, registration.participant_name, event, registration.qr_code_path
        )
        
        # Send automatic reminders on registration
        if created:
            # Send immediate reminder via all enabled channels
            user = User.query.filter_by(email=registration.email).first()
            if user:
                send_event_reminders(user, event, reminder_type="registration")
                # Create scheduled reminders (24h and 1h before)
                create_automatic_reminders(user.id, event.id)

        message = "RSVP confirmed!" if created else "RSVP reactivated and QR resent."
        return jsonify({
            "message": message,
            "event": event.to_dict(),
            "registration": registration.to_dict(),
            "qr_code": qr_url,
            "qr_code_url": qr_url
        }), 201 if created else 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@registrations_bp.route("/events/<int:event_id>/rsvp", methods=["DELETE"])
@jwt_required()
def cancel_rsvp(event_id):
    """Cancel RSVP for an event."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Invalid token"}), 401

    registration = Registration.query.filter_by(
        event_id=event_id, email=current_user.get("email")
    ).first()

    if not registration or registration.cancelled:
        return jsonify({"error": "RSVP not found"}), 404

    try:
        registration.cancelled = True
        db.session.commit()
        return jsonify({"message": "RSVP cancelled.", "event_id": event_id}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@registrations_bp.route("/registrations", methods=["POST"])
def register_for_event():
    """Register for an event (unauthenticated)."""
    try:
        data = request.get_json(force=True)
        event = Event.query.get(data.get("event_id"))
        if not event:
            return jsonify({"error": "Event not found"}), 404

        registration = Registration.query.filter_by(
            event_id=data["event_id"], email=data["email"]
        ).first()

        created = False
        if registration and registration.cancelled:
            registration.participant_name = data["participant_name"]
            registration.cancelled = False
        elif not registration:
            registration = Registration(
                event_id=data["event_id"],
                participant_name=data["participant_name"],
                email=data["email"]
            )
            db.session.add(registration)
            db.session.flush()
            created = True
        else:
            return jsonify({"error": "Already registered for this event"}), 400

        qr_generated = False
        if not registration.qr_code_path or not os.path.exists(registration.qr_code_path):
            _generate_qr_for_registration(
                registration, event, registration.participant_name, registration.email
            )
            qr_generated = True

        # Award points for registration
        if created:
            user = User.query.filter_by(email=registration.email).first()
            if user:
                award_points_and_badges(user.id, "register", 10)

        if created or qr_generated:
            db.session.commit()

        send_registration_email(
            registration.email, registration.participant_name, event, registration.qr_code_path
        )

        message = "RSVP confirmed!" if created else "RSVP reactivated and QR resent."
        return jsonify({
            "message": message,
            "registration": registration.to_dict()
        }), 201 if created else 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@registrations_bp.route("/registrations", methods=["GET"])
def get_registrations():
    """Get all active registrations."""
    registrations = Registration.query.filter_by(cancelled=False).all()
    return jsonify([r.to_dict() for r in registrations]), 200


@registrations_bp.route("/registrations/<int:reg_id>/qr", methods=["GET"])
def get_qr_code(reg_id):
    """Get QR code for a registration."""
    registration = Registration.query.get(reg_id)
    if not registration:
        return jsonify({"error": "QR code not found"}), 404

    if not registration.qr_code_path or not os.path.exists(registration.qr_code_path):
        event = registration.event or Event.query.get(registration.event_id)
        if not event:
            return jsonify({"error": "QR code file missing"}), 404
        _generate_qr_for_registration(
            registration, event, registration.participant_name, registration.email
        )
        db.session.commit()

    return send_file(registration.qr_code_path, mimetype="image/png")


@registrations_bp.route("/participant/registrations/<string:email>", methods=["GET"])
def get_participant_registrations(email):
    """Get all registrations for a participant by email."""
    regs = Registration.query.filter_by(email=email, cancelled=False).all()
    return jsonify([r.to_dict() for r in regs]), 200


@registrations_bp.route("/participant/registrations/<string:email>/qrs", methods=["GET"])
def get_participant_qrs(email):
    """Get all QR codes for a participant by email."""
    regs = Registration.query.filter_by(email=email).all()
    qrs = []
    for r in regs:
        qrs.append({
            "registration_id": r.id,
            "event_id": r.event_id,
            "qr_code_url": f"{request.host_url}api/registrations/{r.id}/qr"
        })
    return jsonify(qrs), 200


# ============================================================================
# SECTION 10: ROUTE BLUEPRINTS - ANALYTICS
# ============================================================================

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/overview", methods=["GET"])
def analytics_overview():
    """Get overview analytics."""
    return jsonify({
        "total_clubs": Club.query.count(),
        "total_events": Event.query.count(),
        "total_registrations": Registration.query.filter_by(cancelled=False).count()
    }), 200


@analytics_bp.route("/popular-clubs", methods=["GET"])
def popular_clubs():
    """Get popular clubs by registration count."""
    results = (
        db.session.query(Club.name, func.count(Registration.id))
        .join(Event, Club.id == Event.club_id)
        .join(Registration, Registration.event_id == Event.id)
        .filter(Registration.cancelled == False)
        .group_by(Club.name)
        .order_by(func.count(Registration.id).desc())
        .all()
    )
    return jsonify([{"club_name": name, "registrations": count} for name, count in results]), 200


@analytics_bp.route("/active-days", methods=["GET"])
def active_days():
    """Get active days with registration counts."""
    results = (
        db.session.query(Event.date, func.count(Registration.id))
        .join(Registration, Registration.event_id == Event.id)
        .filter(Registration.cancelled == False)
        .group_by(Event.date)
        .order_by(Event.date.asc())
        .all()
    )
    return jsonify([{"date": str(date), "registrations": count} for date, count in results]), 200


@analytics_bp.route("/event-wise-attendance", methods=["GET"])
def event_wise_attendance():
    """Get event-wise attendance statistics."""
    results = (
        db.session.query(
            Event.id,
            Event.title,
            Event.date,
            Club.name.label("club_name"),
            Club.category.label("club_category"),
            func.count(Registration.id).label("total_registrations"),
            func.sum(case((Registration.checked_in == True, 1), else_=0)).label("checked_in_count"),
            func.sum(case((Registration.cancelled == True, 1), else_=0)).label("cancelled_count")
        )
        .join(Club, Event.club_id == Club.id)
        .outerjoin(Registration, Registration.event_id == Event.id)
        .group_by(Event.id, Event.title, Event.date, Club.name, Club.category)
        .order_by(Event.date.desc())
        .all()
    )
    
    attendance_data = []
    for row in results:
        total_reg = row.total_registrations or 0
        checked_in = row.checked_in_count or 0
        cancelled = row.cancelled_count or 0
        attendance_rate = (checked_in / total_reg * 100) if total_reg > 0 else 0
        
        attendance_data.append({
            "event_id": row.id,
            "event_title": row.title,
            "event_date": str(row.date),
            "club_name": row.club_name,
            "club_category": row.club_category,
            "total_registrations": total_reg,
            "checked_in_count": checked_in,
            "cancelled_count": cancelled,
            "attendance_rate": round(attendance_rate, 2),
            "no_show_rate": round(((total_reg - checked_in - cancelled) / total_reg * 100) if total_reg > 0 else 0, 2)
        })
    
    return jsonify(attendance_data), 200


# ============================================================================
# SECTION 11: ROUTE BLUEPRINTS - LEADER DASHBOARD
# ============================================================================

leader_bp = Blueprint("leader", __name__)

@leader_bp.route("/events", methods=["GET"])
@jwt_required()
def leader_events():
    """Get all events for the authenticated leader with analytics."""
    current_user = get_current_user_context()
    if not current_user or current_user.get("role") != "leader":
        return jsonify({"error": "Access denied"}), 403

    leader_id = current_user.get("id")
    leader_clubs = Club.query.filter_by(leader_id=leader_id).all()
    leader_club_ids = [club.id for club in leader_clubs]
    
    if not leader_club_ids:
        return jsonify([]), 200

    events = (
        db.session.query(
            Event,
            func.coalesce(
                func.sum(case((Registration.cancelled == False, 1), else_=0)),
                0
            ).label("registration_count"),
            func.coalesce(EventInsight.views, 0).label("view_count")
        )
        .outerjoin(Registration, Registration.event_id == Event.id)
        .outerjoin(EventInsight, EventInsight.event_id == Event.id)
        .filter(Event.club_id.in_(leader_club_ids))
        .group_by(Event.id, EventInsight.views)
        .order_by(Event.date.asc(), Event.time.asc())
        .all()
    )

    payload = []
    for event, reg_count, view_count in events:
        event_data = event.to_dict()
        event_data["registration_count"] = reg_count
        event_data["club_name"] = event.club.name if event.club else None
        event_data["view_count"] = view_count
        payload.append(event_data)

    return jsonify(payload), 200


@leader_bp.route("/registrations/<int:event_id>", methods=["GET"])
@jwt_required()
def leader_event_registrations(event_id):
    """Get registrations for a specific event (leader only)."""
    current_user = get_current_user_context()
    if not current_user or current_user.get("role") != "leader":
        return jsonify({"error": "Access denied"}), 403

    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    if not leader_owns_event(current_user.get("id"), event_id):
        return jsonify({"error": "You can only view registrations for events from your own clubs."}), 403

    registrations = (
        Registration.query.filter_by(event_id=event_id, cancelled=False)
        .order_by(Registration.timestamp.desc())
        .all()
    )

    registration_data = []
    for reg in registrations:
        reg_dict = reg.to_dict()
        participant = User.query.filter_by(email=reg.email, role="participant").first()
        if participant:
            reg_dict["participant_profile_image"] = participant.profile_image
            reg_dict["participant_name"] = participant.name
            reg_dict["participant_bio"] = participant.bio
        registration_data.append(reg_dict)

    return jsonify({
        "event": event.to_dict(),
        "registrations": registration_data
    }), 200


@leader_bp.route("/calendar", methods=["GET"])
@jwt_required()
def get_leader_calendar():
    """Get calendar events for leader including university calendar if club has permission."""
    current_user = get_current_user_context()
    if not current_user or current_user.get("role") != "leader":
        return jsonify({"error": "Leader access required"}), 403
    
    user = User.query.get(current_user.get("id"))
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    
    # Get leader's club
    club = Club.query.filter_by(leader_id=user.id).first()
    if not club:
        return jsonify({"error": "No club found for this leader"}), 404
    
    # Get club events
    query = Event.query.filter_by(club_id=club.id)
    if start_date:
        query = query.filter(Event.date >= datetime.strptime(start_date, "%Y-%m-%d").date())
    if end_date:
        query = query.filter(Event.date <= datetime.strptime(end_date, "%Y-%m-%d").date())
    
    events = query.order_by(Event.date, Event.time).all()
    
    calendar_events = []
    
    # Add club events
    for event in events:
        event_datetime = datetime.combine(event.date, event.time)
        registration_count = Registration.query.filter_by(event_id=event.id, cancelled=False).count()
        
        calendar_events.append({
            "id": event.id,
            "title": event.title,
            "date": str(event.date),
            "time": str(event.time),
            "datetime": event_datetime.isoformat(),
            "location": event.location,
            "club_name": club.name,
            "club_category": club.category,
            "description": event.description,
            "registration_count": registration_count,
            "type": "clubhub"
        })
    
    # Check if club has permission to view university calendar
    permissions = ClubCalendarPermission.query.filter_by(club_id=club.id).all()
    calendar_ids = [p.calendar_id for p in permissions]
    
    if calendar_ids:
        official_events = UniversityOfficialCalendarEvent.query.join(
            UniversityOfficialCalendar
        ).filter(
            UniversityOfficialCalendar.id.in_(calendar_ids)
        )
        
        if start_date:
            official_events = official_events.filter(
                UniversityOfficialCalendarEvent.start_datetime >= datetime.strptime(start_date, "%Y-%m-%d")
            )
        if end_date:
            official_events = official_events.filter(
                UniversityOfficialCalendarEvent.start_datetime <= datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            )
        
        official_calendar_events = official_events.all()
        
        for official_event in official_calendar_events:
            uni_date = official_event.start_datetime.date()
            uni_time = official_event.start_datetime.time()
            
            calendar_events.append({
                "id": f"official_uni_{official_event.id}",
                "title": official_event.title,
                "date": str(uni_date),
                "time": str(uni_time),
                "datetime": official_event.start_datetime.isoformat(),
                "location": official_event.location or "University",
                "club_name": "Official University Calendar",
                "club_category": "University",
                "description": official_event.description,
                "type": "university"
            })
    
    # Sort by datetime
    calendar_events.sort(key=lambda x: x["datetime"])
    
    return jsonify(calendar_events), 200


@leader_bp.route("/check-in/<int:registration_id>", methods=["POST"])
@jwt_required()
def check_in_attendee(registration_id):
    """Check in an attendee using QR code (leader only)."""
    current_user = get_current_user_context()
    if not current_user or current_user.get("role") != "leader":
        return jsonify({"error": "Access denied"}), 403

    registration = Registration.query.get(registration_id)
    if not registration:
        return jsonify({"error": "Invalid QR code. Registration not found."}), 404

    if not leader_owns_event(current_user.get("id"), registration.event_id):
        return jsonify({"error": "You can only check in attendees for events from your own clubs."}), 403

    if registration.cancelled:
        return jsonify({"error": "This RSVP has been cancelled."}), 400

    if registration.checked_in:
        event = registration.event or Event.query.get(registration.event_id)
        return jsonify({
            "message": "Participant already checked in.",
            "participant": registration.participant_name,
            "email": registration.email,
            "event": event.title if event else "Unknown",
            "checked_in_at": str(registration.timestamp)
        }), 200

    try:
        registration.checked_in = True
        
        # Award points for check-in
        user = User.query.filter_by(email=registration.email).first()
        if user:
            award_points_and_badges(user.id, "check_in", 20)
        
        db.session.commit()

        event = registration.event or Event.query.get(registration.event_id)
        return jsonify({
            "message": "Check-in successful",
            "participant": registration.participant_name,
            "email": registration.email,
            "event": event.title if event else "Unknown",
            "event_id": registration.event_id
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ============================================================================
# SECTION 12: ROUTE BLUEPRINTS - UNIVERSITY ADMIN
# ============================================================================

university_bp = Blueprint("university", __name__)

@university_bp.route("/club-requests", methods=["GET"])
@university_required
def university_list_requests():
    """University can see all club requests, filtered by status."""
    status = request.args.get("status", "pending")
    q = ClubRequest.query
    if status in ["pending", "approved", "rejected"]:
        q = q.filter_by(status=status)
    requests = q.order_by(ClubRequest.created_at.asc()).all()

    return jsonify([
        {
            "id": r.id,
            "proposer_email": r.proposer.email if r.proposer else None,
            "proposer_name": r.proposer.name if r.proposer else None,
            "name": r.name,
            "description": r.description,
            "category": r.category,
            "mission": r.mission,
            "target_audience": r.target_audience,
            "activities_plan": r.activities_plan,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "decided_at": r.decided_at.isoformat() if r.decided_at else None,
            "decision_message": r.decision_message,
        }
        for r in requests
    ]), 200


@university_bp.route("/club-requests/<int:req_id>/decision", methods=["POST"])
@university_required
def university_decide_request(req_id):
    """University decides on a club proposal."""
    data = request.get_json() or {}
    decision = data.get("decision")
    message = data.get("message", "").strip()
    leader_email = data.get("leader_email", "").strip()
    leader_password = data.get("leader_password", "").strip()

    if decision not in ["approved", "rejected"]:
        return jsonify({"error": "Decision must be 'approved' or 'rejected'"}), 400

    if decision == "approved" and (not leader_email or not leader_password):
        return jsonify({"error": "Leader email and password are required for approval."}), 400

    req = ClubRequest.query.get(req_id)
    if not req:
        return jsonify({"error": "Club request not found"}), 404

    if req.status != "pending":
        return jsonify({"error": "Request already decided"}), 400

    req.status = decision
    req.decided_at = datetime.utcnow()
    req.decision_message = message or (
        "Your club has been approved." if decision == "approved" else "Your club proposal was not approved."
    )

    if decision == "approved":
        proposer = req.proposer
        if not proposer:
            return jsonify({"error": "Proposer not found"}), 500

        existing_club = Club.query.filter_by(name=req.name).first()
        if existing_club:
            return jsonify({"error": "A club with this name already exists."}), 400

        existing_user = User.query.filter_by(email=leader_email).first()
        if existing_user:
            return jsonify({"error": "Leader email already exists. Please choose a different email."}), 400

        req.leader_email = leader_email
        req.leader_password = leader_password

        hashed_pw = bcrypt.generate_password_hash(leader_password).decode("utf-8")
        new_leader = User(
            name=proposer.name + " (Leader)",
            email=leader_email,
            password=hashed_pw,
            role="leader"
        )
        db.session.add(new_leader)
        db.session.flush()

        new_club = Club(
            name=req.name,
            description=req.description,
            category=req.category,
            leader_id=new_leader.id
        )
        db.session.add(new_club)

    db.session.commit()
    return jsonify({"message": f"Decision '{decision}' saved successfully."}), 200


@university_bp.route("/clubs", methods=["GET"])
@university_required
def university_list_clubs():
    """University can see all clubs with their leaders."""
    clubs = Club.query.order_by(Club.id.desc()).all()
    
    output = []
    for club in clubs:
        leader = User.query.get(club.leader_id) if club.leader_id else None
        event_count = Event.query.filter_by(club_id=club.id).count()
        
        output.append({
            "id": club.id,
            "name": club.name,
            "description": club.description,
            "category": club.category,
            "leader_id": club.leader_id,
            "leader_email": leader.email if leader else None,
            "leader_name": leader.name if leader else None,
            "event_count": event_count
        })
    
    return jsonify(output), 200


@university_bp.route("/clubs/<int:club_id>", methods=["DELETE"])
@university_required
def university_delete_club(club_id):
    """University can delete a club."""
    club = Club.query.get(club_id)
    if not club:
        return jsonify({"error": "Club not found"}), 404
    
    try:
        db.session.delete(club)
        db.session.commit()
        return jsonify({"message": f"Club '{club.name}' deleted successfully."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@university_bp.route("/clubs/<int:club_id>/revoke-leader", methods=["POST"])
@university_required
def university_revoke_leader(club_id):
    """University can revoke leader access."""
    club = Club.query.get(club_id)
    if not club:
        return jsonify({"error": "Club not found"}), 404
    
    if not club.leader_id:
        return jsonify({"error": "This club has no leader assigned"}), 400
    
    leader = User.query.get(club.leader_id)
    if not leader:
        return jsonify({"error": "Leader account not found"}), 404
    
    leader_email = leader.email
    leader_id = leader.id
    
    try:
        club.leader_id = None
        club_requests_as_proposer = ClubRequest.query.filter_by(proposer_id=leader_id).all()
        
        if club_requests_as_proposer:
            leader.role = "participant"
            db.session.commit()
            return jsonify({
                "message": f"Leader access revoked. Account '{leader_email}' has been changed to participant role."
            }), 200
        else:
            db.session.delete(leader)
            db.session.commit()
            return jsonify({
                "message": f"Leader access revoked. Account '{leader_email}' has been deleted."
            }), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to revoke leader access: {str(e)}"}), 500


@university_bp.route("/events/calendar", methods=["GET"])
@university_required
def get_university_calendar_events():
    """Get all events from all clubs for university calendar view."""
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    
    # Get all events from all approved clubs
    query = Event.query.join(Club).filter(Club.approved == True)
    if start_date:
        query = query.filter(Event.date >= datetime.strptime(start_date, "%Y-%m-%d").date())
    if end_date:
        query = query.filter(Event.date <= datetime.strptime(end_date, "%Y-%m-%d").date())
    
    events = query.order_by(Event.date, Event.time).all()
    
    # Get registration counts for each event
    calendar_events = []
    for event in events:
        event_datetime = datetime.combine(event.date, event.time)
        registration_count = Registration.query.filter_by(event_id=event.id, cancelled=False).count()
        
        calendar_events.append({
            "id": event.id,
            "title": event.title,
            "date": str(event.date),
            "time": str(event.time),
            "datetime": event_datetime.isoformat(),
            "location": event.location,
            "club_name": event.club.name if event.club else "Unknown",
            "club_category": event.club.category if event.club else None,
            "description": event.description,
            "registration_count": registration_count,
            "type": "clubhub"
        })
    
    return jsonify(calendar_events), 200


@university_bp.route("/calendar/upload", methods=["POST"])
@university_required
def upload_university_calendar():
    """Upload or sync university official calendar from file."""
    current_user = get_current_user_context()
    university_id = current_user.get("id")
    
    # Check if file was uploaded
    if 'calendar_file' not in request.files:
        return jsonify({"error": "Calendar file required"}), 400
    
    file = request.files['calendar_file']
    calendar_name = request.form.get("calendar_name", "University Calendar")
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Check if file is .ics format
    if not file.filename.lower().endswith('.ics'):
        return jsonify({"error": "Only .ics (iCal) files are supported"}), 400
    
    try:
        # Read file content
        ical_data = file.read().decode('utf-8')
        
        # Check if calendar already exists
        existing_calendar = UniversityOfficialCalendar.query.filter_by(
            university_id=university_id,
            calendar_name=calendar_name
        ).first()
        
        if existing_calendar:
            calendar = existing_calendar
            calendar.updated_at = datetime.utcnow()
        else:
            calendar = UniversityOfficialCalendar(
                university_id=university_id,
                calendar_name=calendar_name,
                calendar_url=None  # No URL for file uploads
            )
            db.session.add(calendar)
            db.session.flush()  # Get the ID
        
        # Delete old events
        UniversityOfficialCalendarEvent.query.filter_by(calendar_id=calendar.id).delete()
        
        # Parse iCal and extract events
        events_found = []
        lines = ical_data.split('\n')
        current_event = {}
        in_event = False
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Handle line continuation
            if line.startswith(' ') or line.startswith('\t'):
                if in_event and current_event:
                    last_key = list(current_event.keys())[-1] if current_event else None
                    if last_key:
                        current_event[last_key] += line.strip()
                continue
            
            if line == "BEGIN:VEVENT":
                current_event = {}
                in_event = True
            elif line == "END:VEVENT":
                if current_event and current_event.get("title"):
                    try:
                        dtstart_str = current_event.get("start", "")
                        dtend_str = current_event.get("end", "")
                        
                        # Parse datetime
                        if len(dtstart_str) == 8:
                            start_dt = datetime.strptime(dtstart_str, "%Y%m%d")
                        elif 'T' in dtstart_str:
                            if dtstart_str.endswith('Z'):
                                start_dt = datetime.strptime(dtstart_str.replace('Z', ''), "%Y%m%dT%H%M%S")
                            else:
                                start_dt = datetime.strptime(dtstart_str.split('T')[0], "%Y%m%d")
                        else:
                            start_dt = datetime.strptime(dtstart_str[:8], "%Y%m%d")
                        
                        if len(dtend_str) == 8:
                            end_dt = datetime.strptime(dtend_str, "%Y%m%d")
                        elif 'T' in dtend_str:
                            if dtend_str.endswith('Z'):
                                end_dt = datetime.strptime(dtend_str.replace('Z', ''), "%Y%m%dT%H%M%S")
                            else:
                                end_dt = datetime.strptime(dtend_str.split('T')[0], "%Y%m%d")
                        else:
                            end_dt = datetime.strptime(dtend_str[:8], "%Y%m%d")
                        
                        # Create event
                        cal_event = UniversityOfficialCalendarEvent(
                            calendar_id=calendar.id,
                            title=current_event.get("title", "University Event"),
                            description=current_event.get("description", ""),
                            start_datetime=start_dt,
                            end_datetime=end_dt,
                            location=current_event.get("location", "")
                        )
                        db.session.add(cal_event)
                        events_found.append(cal_event.to_dict())
                    except Exception as parse_err:
                        print(f"Error parsing event: {parse_err}")
                        continue
                current_event = {}
                in_event = False
            elif line.startswith("SUMMARY:"):
                current_event["title"] = line.split(":", 1)[1] if ":" in line else ""
            elif line.startswith("DTSTART"):
                dt_part = line.split(":", 1)[1] if ":" in line else ""
                current_event["start"] = dt_part
            elif line.startswith("DTEND"):
                dt_part = line.split(":", 1)[1] if ":" in line else ""
                current_event["end"] = dt_part
            elif line.startswith("LOCATION:"):
                current_event["location"] = line.split(":", 1)[1] if ":" in line else ""
            elif line.startswith("DESCRIPTION:"):
                current_event["description"] = line.split(":", 1)[1] if ":" in line else ""
        
        calendar.last_synced = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            "message": "Calendar uploaded and synced successfully",
            "calendar": calendar.to_dict(),
            "events_found": len(events_found),
            "events": events_found[:10]
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to upload calendar: {str(e)}"}), 500


@university_bp.route("/calendar", methods=["GET"])
@university_required
def get_university_calendars():
    """Get all university calendars."""
    current_user = get_current_user_context()
    university_id = current_user.get("id")
    
    calendars = UniversityOfficialCalendar.query.filter_by(university_id=university_id).all()
    return jsonify([cal.to_dict() for cal in calendars]), 200


@university_bp.route("/clubs/<int:club_id>/calendar-permission", methods=["POST"])
@university_required
def grant_calendar_permission(club_id):
    """Grant calendar permission to a club."""
    current_user = get_current_user_context()
    data = request.get_json() or {}
    calendar_id = data.get("calendar_id")
    
    if not calendar_id:
        return jsonify({"error": "Calendar ID required"}), 400
    
    club = Club.query.get(club_id)
    if not club:
        return jsonify({"error": "Club not found"}), 404
    
    calendar = UniversityOfficialCalendar.query.get(calendar_id)
    if not calendar:
        return jsonify({"error": "Calendar not found"}), 404
    
    # Check if permission already exists
    existing = ClubCalendarPermission.query.filter_by(
        club_id=club_id,
        calendar_id=calendar_id
    ).first()
    
    if existing:
        return jsonify({"message": "Permission already granted", "permission": existing.to_dict()}), 200
    
    permission = ClubCalendarPermission(
        club_id=club_id,
        calendar_id=calendar_id,
        granted_by=current_user.get("id")
    )
    db.session.add(permission)
    db.session.commit()
    
    return jsonify({
        "message": f"Calendar permission granted to {club.name}",
        "permission": permission.to_dict()
    }), 200


@university_bp.route("/clubs/<int:club_id>/calendar-permission", methods=["DELETE"])
@university_required
def revoke_calendar_permission(club_id):
    """Revoke calendar permission from a club."""
    data = request.get_json() or {}
    calendar_id = data.get("calendar_id")
    
    if not calendar_id:
        return jsonify({"error": "Calendar ID required"}), 400
    
    permission = ClubCalendarPermission.query.filter_by(
        club_id=club_id,
        calendar_id=calendar_id
    ).first()
    
    if not permission:
        return jsonify({"error": "Permission not found"}), 404
    
    club_name = permission.club.name if permission.club else "Unknown"
    db.session.delete(permission)
    db.session.commit()
    
    return jsonify({
        "message": f"Calendar permission revoked from {club_name}"
    }), 200


# ============================================================================
# SECTION 13: ROUTE BLUEPRINTS - AI FEATURES
# ============================================================================

ai_bp = Blueprint("ai", __name__)

# Initialize Google Gemini AI
try:
    import google.generativeai as genai  # type: ignore[import]
except ImportError:
    genai = None  # type: ignore[assignment]
    print("Warning: google-generativeai not installed. Install with: pip install google-generativeai")

if GEMINI_API_KEY and genai:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-pro')
    except Exception as genai_err:
        gemini_model = None
        print(f"Warning: Failed to initialize Gemini AI client: {genai_err}")
elif not GEMINI_API_KEY:
    gemini_model = None
    print("Warning: GEMINI_API_KEY not set in .env file")
else:
    gemini_model = None


def generate_fallback_insights(base_analytics, attendance_rate, event_attendance, active_days, category_performance):
    """Generate data-driven insights when AI is unavailable."""
    total_events = base_analytics.get("total_events", 0)
    total_regs = base_analytics.get("total_registrations", 0)
    avg_regs = base_analytics.get("average_registrations_per_event", 0)
    
    top_event = None
    if event_attendance:
        top_event = max(event_attendance, key=lambda x: x.registrations or 0)
    
    most_active_day = max(active_days.items(), key=lambda x: x[1])[0] if active_days else None
    
    best_category = None
    if category_performance:
        try:
            best_row = max(category_performance, key=lambda x: x.registrations if hasattr(x, 'registrations') else x[1])
            best_category = best_row.category if hasattr(best_row, 'category') else best_row[0]
        except (AttributeError, IndexError, TypeError):
            pass
    
    summary = f"Your club management shows {total_events} events with {total_regs} total registrations. "
    if attendance_rate > 0:
        summary += f"Current attendance rate is {round(attendance_rate, 1)}%. "
    if top_event:
        summary += f"Your top event '{top_event.title}' has {top_event.registrations or 0} registrations."
    
    insights = []
    if total_events > 0:
        insights.append(f"You have {total_events} event(s) with an average of {round(avg_regs, 1)} registrations per event")
    if attendance_rate > 50:
        insights.append(f"Strong attendance rate of {round(attendance_rate, 1)}% indicates good event engagement")
    elif attendance_rate > 0:
        insights.append(f"Attendance rate of {round(attendance_rate, 1)}% - consider strategies to improve turnout")
    if most_active_day:
        insights.append(f"Most registrations occur on {most_active_day} - consider scheduling more events on this day")
    if best_category:
        insights.append(f"Your {best_category} events are performing well - focus on this category")
    if top_event:
        insights.append(f"Top event: '{top_event.title}' with {top_event.registrations or 0} registrations - analyze what made it successful")
    
    recommendations = []
    if attendance_rate < 50 and attendance_rate > 0:
        recommendations.append("Send reminder emails 24-48 hours before events to improve attendance")
    if most_active_day:
        recommendations.append(f"Schedule more events on {most_active_day} when engagement is highest")
    if best_category:
        recommendations.append(f"Expand your {best_category} event offerings based on strong performance")
    if top_event:
        recommendations.append(f"Replicate successful elements from '{top_event.title}' in future events")
    recommendations.append("Use analytics to identify peak engagement times and optimize event scheduling")
    
    return {
        "summary": summary,
        "key_insights": insights[:5],
        "recommendations": recommendations[:5]
    }


def call_gemini(prompt, model_name="gemini-pro", max_output_tokens=500):
    """Call Google Gemini API."""
    if not GEMINI_API_KEY:
        raise ValueError("Gemini API key not configured. Set GEMINI_API_KEY in your .env file")
    
    if not gemini_model:
        raise ValueError("Gemini AI not initialized. Install google-generativeai package: pip install google-generativeai")
    
    try:
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": max_output_tokens,
        }
        
        response = gemini_model.generate_content(prompt, generation_config=generation_config)
        
        if response and response.text:
            return response.text.strip()
        elif response and hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and candidate.content:
                if hasattr(candidate.content, 'parts'):
                    text_parts = [part.text for part in candidate.content.parts if hasattr(part, 'text')]
                    if text_parts:
                        return ' '.join(text_parts).strip()
            raise Exception("Could not extract text from Gemini response")
        else:
            raise Exception("Empty response from Gemini API")
            
    except Exception as e:
        error_msg = str(e)
        if "API key" in error_msg or "authentication" in error_msg.lower():
            raise Exception("Invalid Gemini API key. Please check your GEMINI_API_KEY in .env file")
        elif "quota" in error_msg.lower() or "limit" in error_msg.lower():
            raise Exception("Gemini API quota exceeded. Please check your Google AI Studio quota")
        elif "not found" in error_msg.lower() or "import" in error_msg.lower():
            raise Exception("google-generativeai package not installed. Run: pip install google-generativeai")
        else:
            raise Exception(f"Gemini API error: {error_msg}")


@ai_bp.route("/suggest-event", methods=["POST"])
def suggest_event_name():
    """Suggest event names using Gemini AI."""
    data = request.get_json()
    category = data.get("category", "General")
    description = data.get("description", "An event about innovation and learning.")
    prompt = f"Suggest 3 creative, short event titles for a {category} club event about: {description}"
    try:
        ideas = call_gemini(prompt, max_output_tokens=100)
        return jsonify({"suggestions": ideas.strip()}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_bp.route("/event-ideas", methods=["POST"])
@jwt_required()
def generate_event_ideas():
    """Generate comprehensive event ideas using Gemini AI."""
    current_user = get_current_user_context()
    if not current_user or current_user.get("role") != "leader":
        return jsonify({"error": "Access denied. Only leaders can generate event ideas."}), 403
    
    data = request.get_json() or {}
    club_id = data.get("club_id")
    club_category = data.get("club_category", "General")
    existing_title = data.get("title", "").strip()
    existing_description = data.get("description", "").strip()
    
    # Get club information if club_id is provided
    if club_id:
        try:
            club = Club.query.get(club_id)
            if club:
                club_category = club.category or club_category
        except Exception:
            pass
    
    # Build comprehensive prompt
    prompt = f"""You are an expert event planning assistant for a {club_category} club. Generate creative and engaging event ideas.

"""
    
    if existing_title or existing_description:
        prompt += f"""The leader is currently working on an event with:
- Title: {existing_title if existing_title else "Not yet set"}
- Description: {existing_description if existing_description else "Not yet set"}

Based on this, provide:
"""
    else:
        prompt += f"""For a {club_category} club, provide:
"""
    
    prompt += """1. 3 creative event title suggestions (short, catchy, under 60 characters each)
2. A detailed event description (2-3 sentences explaining what participants will experience)
3. 3-5 key talking points or topics that could be covered
4. Suggested event format (workshop, seminar, networking, hands-on, etc.)
5. Target audience description
6. Any special considerations or tips for success

Format your response as a JSON object with these keys:
- titles: array of 3 title strings
- description: string
- talking_points: array of 3-5 strings
- format: string
- target_audience: string
- tips: string

Make the suggestions practical, engaging, and relevant to a {club_category} club audience."""

    # Generate fallback ideas based on club category
    def generate_fallback_ideas(category):
        category_lower = category.lower()
        
        # Category-specific suggestions
        if "tech" in category_lower or "coding" in category_lower or "programming" in category_lower:
            return {
                "titles": [
                    "Tech Talk: Building Modern Web Apps",
                    "Code Workshop: Python Fundamentals",
                    "Hackathon Prep Session"
                ],
                "description": f"Join us for an engaging {category} event where you'll learn practical skills, network with peers, and explore the latest trends in technology. Perfect for beginners and experienced developers alike.",
                "talking_points": [
                    "Introduction to modern development tools",
                    "Hands-on coding exercises",
                    "Best practices and industry insights",
                    "Q&A with experienced developers"
                ],
                "format": "Workshop",
                "target_audience": "Students interested in technology and programming",
                "tips": "Bring your laptop, prepare questions, and be ready to code!"
            }
        elif "art" in category_lower or "design" in category_lower or "creative" in category_lower:
            return {
                "titles": [
                    f"{category} Creative Workshop",
                    "Design Thinking Session",
                    "Art & Innovation Meetup"
                ],
                "description": f"Explore your creative side at this {category} event. Learn new techniques, share your work, and connect with fellow artists and designers.",
                "talking_points": [
                    "Creative techniques and methods",
                    "Portfolio review and feedback",
                    "Industry trends in design",
                    "Collaboration opportunities"
                ],
                "format": "Interactive Workshop",
                "target_audience": "Creative students and design enthusiasts",
                "tips": "Bring your portfolio or samples of work, and come ready to create!"
            }
        elif "business" in category_lower or "entrepreneur" in category_lower or "finance" in category_lower:
            return {
                "titles": [
                    "Entrepreneurship Workshop",
                    "Business Strategy Session",
                    "Startup Pitch Night"
                ],
                "description": f"Learn about business and entrepreneurship at this {category} event. Network with aspiring entrepreneurs and gain insights from successful founders.",
                "talking_points": [
                    "Business model development",
                    "Pitching and presentation skills",
                    "Market analysis and research",
                    "Funding and resources"
                ],
                "format": "Seminar/Workshop",
                "target_audience": "Aspiring entrepreneurs and business-minded students",
                "tips": "Come with your business ideas and be ready to network!"
            }
        elif "sports" in category_lower or "fitness" in category_lower:
            return {
                "titles": [
                    f"{category} Training Session",
                    "Fitness & Wellness Workshop",
                    "Sports Strategy Discussion"
                ],
                "description": f"Get active and learn about {category} at this engaging event. Improve your skills, meet teammates, and stay fit!",
                "talking_points": [
                    "Training techniques and strategies",
                    "Nutrition and wellness",
                    "Team building activities",
                    "Competition preparation"
                ],
                "format": "Active Workshop",
                "target_audience": "Athletes and fitness enthusiasts",
                "tips": "Wear comfortable clothing and bring water!"
            }
        else:
            # Generic fallback
            return {
                "titles": [
                    f"Engaging {category} Workshop",
                    f"Interactive {category} Session",
                    f"{category} Community Meetup"
                ],
                "description": f"Join us for an exciting {category} event where you'll learn, network, and connect with like-minded students. Whether you're new to the field or experienced, there's something for everyone.",
                "talking_points": [
                    "Introduction to key concepts",
                    "Practical applications and examples",
                    "Networking and collaboration",
                    "Q&A and open discussion"
                ],
                "format": "Workshop or Seminar",
                "target_audience": f"Students interested in {category}",
                "tips": "Come prepared with questions, bring a notebook, and be ready to engage!"
            }
    
    try:
        # Try to use Gemini AI if available
        if gemini_model and GEMINI_API_KEY:
            ai_response = call_gemini(prompt, max_output_tokens=800)
            
            # Try to parse JSON response
            try:
                if "{" in ai_response and "}" in ai_response:
                    start = ai_response.find("{")
                    end = ai_response.rfind("}") + 1
                    json_str = ai_response[start:end]
                    ideas = json.loads(json_str)
                else:
                    # Fallback: parse text response
                    ideas = {
                        "titles": [],
                        "description": ai_response[:200] + "..." if len(ai_response) > 200 else ai_response,
                        "talking_points": [],
                        "format": "Workshop or Seminar",
                        "target_audience": "Club members and interested students",
                        "tips": "Plan ahead and promote early for better attendance"
                    }
                    # Try to extract titles from response
                    lines = ai_response.split("\n")
                    for line in lines:
                        if any(keyword in line.lower() for keyword in ["title", "suggestion", "idea"]):
                            if ":" in line:
                                title = line.split(":", 1)[1].strip()
                                if title and len(title) < 100:
                                    ideas["titles"].append(title)
                                    if len(ideas["titles"]) >= 3:
                                        break
            except json.JSONDecodeError:
                # Use fallback if JSON parsing fails
                ideas = generate_fallback_ideas(club_category)
        else:
            # Use fallback when Gemini is not available
            ideas = generate_fallback_ideas(club_category)
        
        return jsonify(ideas), 200
    except Exception as e:
        error_msg = str(e)
        # Even if there's an error, provide fallback ideas
        ideas = generate_fallback_ideas(club_category)
        return jsonify(ideas), 200


@ai_bp.route("/leader-insights", methods=["POST"])
@jwt_required()
def leader_insights():
    """Generate AI-powered insights for club leaders."""
    current_user = get_current_user_context()
    if not current_user or current_user.get("role") != "leader":
        return jsonify({"error": "Access denied"}), 403
    
    leader_id = current_user.get("id")
    
    try:
        leader_clubs = Club.query.filter_by(leader_id=leader_id).all()
        leader_club_ids = [club.id for club in leader_clubs]
        
        if not leader_club_ids:
            return jsonify({
                "summary": "You don't have any clubs yet. Create a club to start generating insights!",
                "key_insights": [],
                "recommendations": ["Create your first club to start organizing events"]
            }), 200
        
        base_analytics = get_event_analytics(leader_id=leader_id)
        attendance_stats = get_attendance_stats(leader_id=leader_id)
        
        event_attendance = (
            db.session.query(
                Event.title,
                Event.date,
                Club.name.label("club_name"),
                func.coalesce(
                    func.sum(case((Registration.cancelled == False, 1), else_=0)),
                    0
                ).label("registrations"),
                func.coalesce(
                    func.sum(case((and_(Registration.cancelled == False, Registration.checked_in == True), 1), else_=0)),
                    0
                ).label("checked_in")
            )
            .join(Club, Event.club_id == Club.id)
            .outerjoin(Registration, Registration.event_id == Event.id)
            .filter(Event.club_id.in_(leader_club_ids))
            .group_by(Event.id, Event.title, Event.date, Club.name)
            .order_by(Event.date.desc())
            .limit(10)
            .all()
        )
        
        active_days_data = (
            db.session.query(
                extract('dow', Event.date).label("day_of_week"),
                func.count(Registration.id).label("count")
            )
            .join(Registration, Registration.event_id == Event.id)
            .filter(Event.club_id.in_(leader_club_ids))
            .filter(Registration.cancelled == False)
            .group_by(extract('dow', Event.date))
            .all()
        )
        
        day_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        active_days = {day_names[int(row.day_of_week)]: row.count for row in active_days_data if row.day_of_week is not None}
        
        category_performance = (
            db.session.query(
                Club.category,
                func.count(Registration.id).label("registrations")
            )
            .join(Event, Club.id == Event.club_id)
            .join(Registration, Registration.event_id == Event.id)
            .filter(Event.club_id.in_(leader_club_ids))
            .filter(Registration.cancelled == False)
            .group_by(Club.category)
            .all()
        )
        
        total_checked_in = sum(row.checked_in or 0 for row in event_attendance)
        attendance_rate = (total_checked_in / base_analytics["total_registrations"] * 100) if base_analytics["total_registrations"] > 0 else 0
        
        analytics_data = {
            **base_analytics,
            "attendance_rate": round(attendance_rate, 2),
            "top_events": [
                {
                    "title": row.title,
                    "date": str(row.date),
                    "club": row.club_name,
                    "registrations": row.registrations or 0,
                    "checked_in": row.checked_in or 0
                }
                for row in event_attendance[:5]
            ],
            "active_days": active_days,
            "category_performance": [{"category": cat, "registrations": count} for cat, count in category_performance],
            "attendance_stats": attendance_stats.get("events", [])[:5] if isinstance(attendance_stats, dict) and "events" in attendance_stats else []
        }
        
        prompt = build_leader_insight_prompt(analytics_data)

        try:
            ai_response = call_gemini(prompt, max_output_tokens=800)
            
            try:
                if "{" in ai_response and "}" in ai_response:
                    start = ai_response.find("{")
                    end = ai_response.rfind("}") + 1
                    json_str = ai_response[start:end]
                    insights = json.loads(json_str)
                else:
                    insights = {
                        "summary": ai_response[:200] + "..." if len(ai_response) > 200 else ai_response,
                        "key_insights": [line.strip() for line in ai_response.split("\n") if line.strip() and not line.strip().startswith("#")][:5],
                        "recommendations": []
                    }
            except json.JSONDecodeError:
                insights = generate_fallback_insights(base_analytics, attendance_rate, event_attendance, active_days, category_performance)
        except Exception:
            insights = generate_fallback_insights(base_analytics, attendance_rate, event_attendance, active_days, category_performance)
        
        return jsonify(insights), 200
        
    except Exception as e:
        error_msg = str(e)
        return jsonify({
            "error": f"Failed to generate insights: {error_msg}",
            "details": "Please check: 1) Gemini API key is set, 2) google-generativeai is installed, 3) You have internet connection"
        }), 500


@ai_bp.route("/recommend-events", methods=["POST"])
@jwt_required()
def recommend_events():
    """Generate personalized event recommendations for participants."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Authentication required", "details": "Please log in to access AI recommendations"}), 401
    
    if current_user.get("role") != "participant":
        return jsonify({"error": "Access denied", "details": "This feature is only available for participants"}), 403
    
    participant_email = current_user.get("email")
    
    try:
        participant_analytics = get_event_analytics(email=participant_email)
        past_registrations = participant_analytics.get("participant_history", [])
        
        if len(past_registrations) < 4:
            return jsonify({
                "error": "Insufficient data for recommendations",
                "message": f"You need to register for at least 4 events to get AI recommendations. You currently have {len(past_registrations)} registration(s).",
                "current_count": len(past_registrations),
                "required_count": 4,
                "recommendations": []
            }), 200
        
        attended_categories = set()
        attended_clubs = set()
        time_preferences = []
        
        for reg in past_registrations:
            if reg.get("club_category"):
                attended_categories.add(reg["club_category"])
            if reg.get("club_name"):
                attended_clubs.add(reg["club_name"])
            if reg.get("event_date"):
                try:
                    event_date = datetime.strptime(reg["event_date"], "%Y-%m-%d")
                    time_preferences.append(event_date.strftime("%A"))
                except:
                    pass
        
        upcoming_events = (
            Event.query
            .join(Club, Event.club_id == Club.id)
            .filter(Event.date >= datetime.now().date())
            .order_by(Event.date.asc())
            .limit(50)
            .all()
        )
        
        event_popularity = {}
        for event in upcoming_events:
            reg_count = Registration.query.filter_by(event_id=event.id, cancelled=False).count()
            event_popularity[event.id] = reg_count
        
        week_ago = datetime.now() - timedelta(days=7)
        trending_events = (
            db.session.query(Event.id, func.count(Registration.id).label("recent_regs"))
            .join(Registration, Registration.event_id == Event.id)
            .filter(Registration.timestamp >= week_ago)
            .filter(Registration.cancelled == False)
            .group_by(Event.id)
            .order_by(func.count(Registration.id).desc())
            .limit(10)
            .all()
        )
        trending_event_ids = {row.id for row in trending_events}
        
        category_frequency = {}
        for reg in past_registrations:
            cat = reg.get("club_category")
            if cat:
                category_frequency[cat] = category_frequency.get(cat, 0) + 1
        
        most_preferred_category = max(category_frequency.items(), key=lambda x: x[1])[0] if category_frequency else None
        
        day_frequency = {}
        for day in time_preferences:
            day_frequency[day] = day_frequency.get(day, 0) + 1
        preferred_day = max(day_frequency.items(), key=lambda x: x[1])[0] if day_frequency else None
        
        participant_profile = {
            "email": participant_email,
            "past_registrations_count": len(past_registrations),
            "attended_categories": list(attended_categories),
            "attended_clubs": list(attended_clubs),
            "preferred_days": list(set(time_preferences)) if time_preferences else [],
            "category_frequency": category_frequency,
            "most_preferred_category": most_preferred_category,
            "preferred_day_of_week": preferred_day,
            "registration_history": past_registrations[:10]
        }
        
        events_data = []
        for event in upcoming_events[:20]:
            club = event.club
            events_data.append({
                "event_id": event.id,
                "title": event.title,
                "description": event.description or "",
                "date": str(event.date),
                "time": str(event.time),
                "location": event.location,
                "club_name": club.name if club else "Unknown",
                "club_category": club.category if club else "General",
                "popularity": event_popularity.get(event.id, 0),
                "is_trending": event.id in trending_event_ids
            })
        
        prompt = build_participant_prompt(participant_profile, events_data)

        try:
            ai_response = call_gemini(prompt, max_output_tokens=600)
        except Exception:
            matching_events = [
                e for e in events_data
                if (attended_categories and e["club_category"] in attended_categories) or not attended_categories
            ]
            if not matching_events:
                matching_events = events_data
            matching_events.sort(key=lambda x: (x["is_trending"], x["popularity"]), reverse=True)
            recommendations = [
                {
                    "event_id": e["event_id"],
                    "explanation": f"Popular {e['club_category']} event: {e['title']}. Based on your interest in similar events."
                }
                for e in matching_events[:3]
            ]
        else:
            try:
                if "[" in ai_response and "]" in ai_response:
                    start = ai_response.find("[")
                    end = ai_response.rfind("]") + 1
                    json_str = ai_response[start:end]
                    recommendations = json.loads(json_str)
                else:
                    raise ValueError("No JSON array found in AI response")
            except (json.JSONDecodeError, ValueError):
                matching_events = [
                    e for e in events_data
                    if (attended_categories and e["club_category"] in attended_categories) or not attended_categories
                ]
                if not matching_events:
                    matching_events = events_data
                matching_events.sort(key=lambda x: (x["is_trending"], x["popularity"]), reverse=True)
                recommendations = [
                    {
                        "event_id": e["event_id"],
                        "explanation": f"Popular {e['club_category']} event: {e['title']}. Based on your interest in similar events."
                    }
                    for e in matching_events[:3]
                ]
        
        enriched_recommendations = []
        for rec in recommendations[:3]:
            event_id = rec.get("event_id")
            event = next((e for e in upcoming_events if e.id == event_id), None)
            
            if event:
                club = event.club
                enriched_recommendations.append({
                    "event_id": event.id,
                    "title": event.title,
                    "description": event.description or "",
                    "date": str(event.date),
                    "time": str(event.time),
                    "location": event.location,
                    "club_name": club.name if club else "Unknown",
                    "club_category": club.category if club else "General",
                    "explanation": rec.get("explanation", "Recommended based on your interests"),
                    "popularity": event_popularity.get(event.id, 0)
                })
        
        if not enriched_recommendations:
            return jsonify({
                "error": "No events available for recommendations",
                "recommendations": [],
                "profile_summary": {
                    "past_events": len(past_registrations),
                    "interests": list(attended_categories)
                }
            }), 200
        
        return jsonify({
            "recommendations": enriched_recommendations,
            "profile_summary": {
                "past_events": len(past_registrations),
                "interests": list(attended_categories)
            }
        }), 200
        
    except Exception as e:
        error_msg = str(e)
        return jsonify({
            "error": f"Failed to generate recommendations: {error_msg}",
            "details": "Please check: 1) Gemini API key is set, 2) google-generativeai package is installed, 3) You have internet connection"
        }), 500


# ============================================================================
# SECTION 14: ROUTE BLUEPRINTS - PROFILE MANAGEMENT
# ============================================================================

profile_bp = Blueprint("profile", __name__)

@profile_bp.route("/", methods=["GET"])
@jwt_required()
def get_profile():
    """Get current user's profile information."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401
    
    user_id = current_user.get("id")
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    stats = {}
    if user.role == "participant":
        total_regs = Registration.query.filter_by(email=user.email, cancelled=False).count()
        events_attended = Registration.query.filter_by(email=user.email, checked_in=True).count()
        upcoming_regs = db.session.query(Registration).join(Event).filter(
            Registration.email == user.email,
            Registration.cancelled == False,
            Event.date >= date.today()
        ).count()
        
        stats = {
            "total_registrations": total_regs,
            "events_attended": events_attended,
            "upcoming_events": upcoming_regs
        }
    elif user.role == "leader":
        leader_clubs = Club.query.filter_by(leader_id=user.id).all()
        club_ids = [club.id for club in leader_clubs]
        
        total_events = Event.query.filter(Event.club_id.in_(club_ids)).count() if club_ids else 0
        total_regs = db.session.query(Registration).join(Event).filter(
            Event.club_id.in_(club_ids),
            Registration.cancelled == False
        ).count() if club_ids else 0
        total_attendees = db.session.query(Registration).join(Event).filter(
            Event.club_id.in_(club_ids),
            Registration.checked_in == True
        ).count() if club_ids else 0
        
        stats = {
            "total_clubs": len(leader_clubs),
            "total_events": total_events,
            "total_registrations": total_regs,
            "total_attendees": total_attendees
        }
    elif user.role == "university":
        total_clubs = Club.query.count()
        total_events = Event.query.count()
        total_participants = User.query.filter_by(role="participant").count()
        total_leaders = User.query.filter_by(role="leader").count()
        
        stats = {
            "total_clubs": total_clubs,
            "total_events": total_events,
            "total_participants": total_participants,
            "total_leaders": total_leaders
        }
    
    profile_data = user.to_dict()
    profile_data["stats"] = stats
    
    return jsonify(profile_data), 200


@profile_bp.route("/user-by-email", methods=["GET"])
@jwt_required()
def get_user_by_email():
    """Get user profile by email (for leaders to view participant profiles)."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401
    
    if current_user.get("role") != "leader":
        return jsonify({"error": "Access denied. Only leaders can view participant profiles."}), 403
    
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Email parameter required"}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    profile_data = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "profile_image": user.profile_image,
        "bio": user.bio,
        "role": user.role
    }
    
    return jsonify(profile_data), 200


@profile_bp.route("/", methods=["PUT"])
@jwt_required()
def update_profile():
    """Update user profile information."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401
    
    user_id = current_user.get("id")
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.get_json()
    
    if "name" in data:
        user.name = data["name"].strip()
    
    if "bio" in data:
        user.bio = data["bio"].strip()[:500]
    
    try:
        db.session.commit()
        return jsonify({
            "message": "Profile updated successfully",
            "user": user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update profile: {str(e)}"}), 500


@profile_bp.route("/upload-image", methods=["POST"])
@jwt_required()
def upload_profile_image():
    """Upload profile image for current user."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401
    
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    
    if not (file.filename and "." in file.filename and 
            file.filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS):
        return jsonify({"error": "Invalid file type. Allowed: PNG, JPG, JPEG, GIF, WEBP"}), 400
    
    try:
        user_id = current_user.get("id")
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if user.profile_image:
            old_image_path = os.path.join(PROFILE_IMAGES_DIR, os.path.basename(user.profile_image))
            if os.path.exists(old_image_path):
                try:
                    os.remove(old_image_path)
                except Exception:
                    pass
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        original_filename = secure_filename(file.filename)
        filename = f"profile_{user_id}_{timestamp}_{original_filename}"
        filepath = os.path.join(PROFILE_IMAGES_DIR, filename)
        
        file.save(filepath)
        
        image_url = f"/api/profile/images/{filename}"
        user.profile_image = image_url
        db.session.commit()
        
        return jsonify({
            "message": "Profile image uploaded successfully",
            "url": image_url,
            "user": user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500


@profile_bp.route("/images/<filename>", methods=["GET"])
def get_profile_image(filename):
    """Serve profile images."""
    try:
        safe_filename = secure_filename(filename)
        filepath = os.path.join(PROFILE_IMAGES_DIR, safe_filename)
        
        if not os.path.exists(filepath):
            return jsonify({"error": "Image not found"}), 404
        
        ext = safe_filename.rsplit(".", 1)[1].lower() if "." in safe_filename else ""
        mime_types = {
            "png": "image/png",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "gif": "image/gif",
            "webp": "image/webp"
        }
        mimetype = mime_types.get(ext, "image/jpeg")
        
        return send_file(filepath, mimetype=mimetype)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route("/registrations", methods=["GET"])
@jwt_required()
def get_profile_registrations():
    """Get user's registration history."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401
    
    user = User.query.get(current_user.get("id"))
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    registrations = (
        db.session.query(Registration, Event)
        .join(Event, Registration.event_id == Event.id)
        .filter(Registration.email == user.email)
        .order_by(Registration.timestamp.desc())
        .all()
    )
    
    registration_history = []
    for reg, event in registrations:
        club = event.club if event else None
        registration_history.append({
            "registration_id": reg.id,
            "event_id": event.id if event else None,
            "event_title": event.title if event else "Unknown Event",
            "event_date": str(event.date) if event else None,
            "event_time": str(event.time) if event else None,
            "club_name": club.name if club else "Unknown Club",
            "club_category": club.category if club else None,
            "registered_at": str(reg.timestamp),
            "checked_in": reg.checked_in,
            "cancelled": reg.cancelled,
            "qr_code_url": f"/api/registrations/{reg.id}/qr" if reg.qr_code_path else None
        })
    
    return jsonify(registration_history), 200


# ============================================================================
# SECTION 15: ROUTE BLUEPRINTS - PARTICIPANT FEATURES
# ============================================================================

participant_features_bp = Blueprint("participant_features", __name__)

@participant_features_bp.route("/participant/stats", methods=["GET"])
@jwt_required()
def get_participant_stats():
    """Get participant statistics and analytics."""
    current_user = get_current_user_context()
    if not current_user or current_user.get("role") != "participant":
        return jsonify({"error": "Participant access required"}), 403
    
    user_id = current_user.get("id")
    stats = ParticipantStats.query.filter_by(user_id=user_id).first()
    
    if not stats:
        stats = ParticipantStats(user_id=user_id)
        db.session.add(stats)
        db.session.commit()
    
    # Get additional analytics
    user = User.query.get(user_id)
    registrations = Registration.query.filter_by(email=user.email, cancelled=False).all()
    checked_in_count = sum(1 for r in registrations if r.checked_in)
    
    # Get category breakdown
    category_counts = {}
    for reg in registrations:
        event = Event.query.get(reg.event_id)
        if event and event.club:
            category = event.club.category or "Uncategorized"
            category_counts[category] = category_counts.get(category, 0) + 1
    
    favorite_category = max(category_counts.items(), key=lambda x: x[1])[0] if category_counts else None
    
    # Get monthly participation
    monthly_data = {}
    for reg in registrations:
        event = Event.query.get(reg.event_id)
        if event:
            month_key = event.date.strftime("%Y-%m")
            monthly_data[month_key] = monthly_data.get(month_key, 0) + 1
    
    return jsonify({
        "points": stats.points,
        "events_attended": stats.events_attended,
        "events_registered": stats.events_registered,
        "current_streak": stats.current_streak,
        "longest_streak": stats.longest_streak,
        "total_check_ins": checked_in_count,
        "favorite_category": favorite_category,
        "category_breakdown": category_counts,
        "monthly_participation": monthly_data,
        "badges_count": Badge.query.filter_by(user_id=user_id).count()
    }), 200


@participant_features_bp.route("/participant/badges", methods=["GET"])
@jwt_required()
def get_participant_badges():
    """Get participant badges."""
    current_user = get_current_user_context()
    if not current_user or current_user.get("role") != "participant":
        return jsonify({"error": "Participant access required"}), 403
    
    user_id = current_user.get("id")
    badges = Badge.query.filter_by(user_id=user_id).order_by(Badge.earned_at.desc()).all()
    
    return jsonify([{
        "id": b.id,
        "badge_type": b.badge_type,
        "badge_name": b.badge_name,
        "badge_description": b.badge_description,
        "earned_at": str(b.earned_at)
    } for b in badges]), 200


@participant_features_bp.route("/participant/friends", methods=["GET"])
@jwt_required()
def get_friends():
    """Get user's friends list."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401
    
    user_id = current_user.get("id")
    friendships = Friend.query.filter(
        or_(
            and_(Friend.user_id == user_id, Friend.status == "accepted"),
            and_(Friend.friend_id == user_id, Friend.status == "accepted")
        )
    ).all()
    
    friends = []
    for f in friendships:
        friend_user = f.friend if f.user_id == user_id else f.user
        friends.append({
            "id": friend_user.id,
            "name": friend_user.name,
            "email": friend_user.email,
            "profile_image": friend_user.profile_image
        })
    
    return jsonify(friends), 200


@participant_features_bp.route("/participant/friends/request", methods=["POST"])
@jwt_required()
def send_friend_request():
    """Send a friend request."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401
    
    data = request.get_json() or {}
    friend_email = data.get("email", "").strip()
    
    if not friend_email:
        return jsonify({"error": "Email required"}), 400
    
    user_id = current_user.get("id")
    friend_user = User.query.filter_by(email=friend_email).first()
    
    if not friend_user:
        return jsonify({"error": "User not found"}), 404
    
    if friend_user.id == user_id:
        return jsonify({"error": "Cannot add yourself as friend"}), 400
    
    # Check if friendship already exists
    existing = Friend.query.filter(
        or_(
            and_(Friend.user_id == user_id, Friend.friend_id == friend_user.id),
            and_(Friend.user_id == friend_user.id, Friend.friend_id == user_id)
        )
    ).first()
    
    if existing:
        return jsonify({"error": "Friendship already exists"}), 400
    
    friendship = Friend(user_id=user_id, friend_id=friend_user.id, status="pending")
    db.session.add(friendship)
    db.session.commit()
    
    return jsonify({"message": "Friend request sent"}), 200


@participant_features_bp.route("/participant/collections", methods=["GET"])
@jwt_required()
def get_collections():
    """Get user's event collections."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401
    
    user_id = current_user.get("id")
    collections = EventCollection.query.filter_by(user_id=user_id).order_by(EventCollection.created_at.desc()).all()
    
    return jsonify([{
        "id": c.id,
        "name": c.name,
        "description": c.description,
        "color": c.color,
        "event_count": len(c.events),
        "created_at": str(c.created_at)
    } for c in collections]), 200


@participant_features_bp.route("/participant/collections", methods=["POST"])
@jwt_required()
def create_collection():
    """Create a new event collection."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401
    
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    description = data.get("description", "").strip()
    color = data.get("color", "#3b82f6")
    
    if not name:
        return jsonify({"error": "Collection name required"}), 400
    
    user_id = current_user.get("id")
    collection = EventCollection(user_id=user_id, name=name, description=description, color=color)
    db.session.add(collection)
    db.session.commit()
    
    return jsonify({
        "id": collection.id,
        "name": collection.name,
        "description": collection.description,
        "color": collection.color
    }), 201


@participant_features_bp.route("/participant/collections/<int:collection_id>/events/<int:event_id>", methods=["POST"])
@jwt_required()
def add_event_to_collection(collection_id, event_id):
    """Add event to collection."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401
    
    collection = EventCollection.query.get(collection_id)
    if not collection or collection.user_id != current_user.get("id"):
        return jsonify({"error": "Collection not found"}), 404
    
    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404
    
    if event not in collection.events:
        collection.events.append(event)
        db.session.commit()
    
    return jsonify({"message": "Event added to collection"}), 200


@participant_features_bp.route("/participant/events/<int:event_id>/review", methods=["POST"])
@jwt_required()
def submit_event_review(event_id):
    """Submit a review for an event."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401
    
    data = request.get_json() or {}
    rating = data.get("rating")
    review_text = data.get("review_text", "").strip()
    
    if not rating or rating < 1 or rating > 5:
        return jsonify({"error": "Rating must be between 1 and 5"}), 400
    
    user_id = current_user.get("id")
    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404
    
    # Check if user registered for this event
    user = User.query.get(user_id)
    registration = Registration.query.filter_by(event_id=event_id, email=user.email).first()
    if not registration:
        return jsonify({"error": "You must register for the event to review it"}), 400
    
    # Check if review already exists
    existing_review = EventReview.query.filter_by(event_id=event_id, user_id=user_id).first()
    if existing_review:
        existing_review.rating = rating
        existing_review.review_text = review_text
    else:
        review = EventReview(event_id=event_id, user_id=user_id, rating=rating, review_text=review_text)
        db.session.add(review)
    
    db.session.commit()
    return jsonify({"message": "Review submitted"}), 200


@participant_features_bp.route("/participant/events/<int:event_id>/reviews", methods=["GET"])
def get_event_reviews(event_id):
    """Get reviews for an event."""
    reviews = EventReview.query.filter_by(event_id=event_id).order_by(EventReview.created_at.desc()).all()
    
    return jsonify([{
        "id": r.id,
        "user_name": r.user.name,
        "rating": r.rating,
        "review_text": r.review_text,
        "created_at": str(r.created_at)
    } for r in reviews]), 200


@participant_features_bp.route("/participant/events/calendar", methods=["GET"])
@jwt_required()
def get_calendar_events():
    """Get events in calendar format with conflict detection."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401
    
    user = User.query.get(current_user.get("id"))
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    
    # Get all events
    query = Event.query
    if start_date:
        query = query.filter(Event.date >= datetime.strptime(start_date, "%Y-%m-%d").date())
    if end_date:
        query = query.filter(Event.date <= datetime.strptime(end_date, "%Y-%m-%d").date())
    
    events = query.order_by(Event.date, Event.time).all()
    
    # Get user's registrations
    registrations = {r.event_id: r for r in Registration.query.filter_by(email=user.email, cancelled=False).all()}
    
    # Get user's personal university calendar events
    uni_events = UniversityCalendarEvent.query.filter_by(user_id=user.id).all()
    
    # Get official university calendar events if user's registered clubs have permission
    user_registrations = Registration.query.filter_by(email=user.email, cancelled=False).all()
    registered_club_ids = set()
    for reg in user_registrations:
        event = Event.query.get(reg.event_id)
        if event and event.club_id:
            registered_club_ids.add(event.club_id)
    
    # Check if any registered clubs have calendar permission
    official_calendar_events = []
    if registered_club_ids:
        permissions = ClubCalendarPermission.query.filter(
            ClubCalendarPermission.club_id.in_(registered_club_ids)
        ).all()
        
        calendar_ids = [p.calendar_id for p in permissions]
        if calendar_ids:
            official_events = UniversityOfficialCalendarEvent.query.join(
                UniversityOfficialCalendar
            ).filter(
                UniversityOfficialCalendar.id.in_(calendar_ids)
            )
            
            if start_date:
                official_events = official_events.filter(
                    UniversityOfficialCalendarEvent.start_datetime >= datetime.strptime(start_date, "%Y-%m-%d")
                )
            if end_date:
                official_events = official_events.filter(
                    UniversityOfficialCalendarEvent.start_datetime <= datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
                )
            
            official_calendar_events = official_events.all()
    
    calendar_events = []
    registered_event_times = []
    
    # Add ClubHub events
    for event in events:
        event_datetime = datetime.combine(event.date, event.time)
        is_registered = event.id in registrations
        has_conflict = False
        
        if is_registered:
            registered_event_times.append(event_datetime)
            # Check for conflicts with other registered events
            for other_time in registered_event_times:
                if other_time != event_datetime and abs((other_time - event_datetime).total_seconds()) < 3600:
                    has_conflict = True
                    break
        
        calendar_events.append({
            "id": event.id,
            "title": event.title,
            "date": str(event.date),
            "time": str(event.time),
            "datetime": event_datetime.isoformat(),
            "location": event.location,
            "club_name": event.club.name if event.club else "Unknown",
            "club_category": event.club.category if event.club else None,
            "description": event.description,
            "is_registered": is_registered,
            "has_conflict": has_conflict,
            "registration_id": registrations[event.id].id if is_registered else None,
            "type": "clubhub"
        })
    
    # Add user's personal university calendar events
    for uni_event in uni_events:
        uni_date = uni_event.start_datetime.date()
        uni_time = uni_event.start_datetime.time()
        
        calendar_events.append({
            "id": f"uni_{uni_event.id}",
            "title": uni_event.title,
            "date": str(uni_date),
            "time": str(uni_time),
            "datetime": uni_event.start_datetime.isoformat(),
            "location": uni_event.location or "University",
            "club_name": "University Calendar",
            "club_category": "University",
            "description": uni_event.description,
            "is_registered": False,
            "has_conflict": False,
            "type": "university"
        })
    
    # Add official university calendar events
    for official_event in official_calendar_events:
        uni_date = official_event.start_datetime.date()
        uni_time = official_event.start_datetime.time()
        
        calendar_events.append({
            "id": f"official_uni_{official_event.id}",
            "title": official_event.title,
            "date": str(uni_date),
            "time": str(uni_time),
            "datetime": official_event.start_datetime.isoformat(),
            "location": official_event.location or "University",
            "club_name": "Official University Calendar",
            "club_category": "University",
            "description": official_event.description,
            "is_registered": False,
            "has_conflict": False,
            "type": "university"
        })
    
    # Sort by datetime
    calendar_events.sort(key=lambda x: x["datetime"])
    
    return jsonify(calendar_events), 200


@participant_features_bp.route("/participant/events/calendar/export", methods=["GET"])
@jwt_required()
def export_calendar_ical():
    """Export user's registered events as iCal format."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401
    
    user = User.query.get(current_user.get("id"))
    registrations = Registration.query.filter_by(email=user.email, cancelled=False).all()
    
    # Generate iCal content
    ical_content = "BEGIN:VCALENDAR\r\n"
    ical_content += "VERSION:2.0\r\n"
    ical_content += "PRODID:-//Student Club-Hub//Event Calendar//EN\r\n"
    ical_content += "CALSCALE:GREGORIAN\r\n"
    ical_content += "METHOD:PUBLISH\r\n"
    ical_content += "X-WR-CALNAME:Student Club-Hub Events\r\n"
    ical_content += "X-WR-CALDESC:My registered Student Club-Hub events\r\n"
    
    for reg in registrations:
        event = Event.query.get(reg.event_id)
        if not event:
            continue
        
        # Format datetime for iCal
        event_dt = datetime.combine(event.date, event.time)
        dtstart = event_dt.strftime("%Y%m%dT%H%M%S")
        dtend = (event_dt + timedelta(hours=2)).strftime("%Y%m%dT%H%M%S")  # Assume 2 hour duration
        dtstamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        
        # Escape special characters in iCal
        def escape_ical(text):
            if not text:
                return ""
            return text.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;").replace("\n", "\\n")
        
        ical_content += "BEGIN:VEVENT\r\n"
        ical_content += f"UID:studentclubhub-{reg.id}@studentclubhub.com\r\n"
        ical_content += f"DTSTART:{dtstart}\r\n"
        ical_content += f"DTEND:{dtend}\r\n"
        ical_content += f"DTSTAMP:{dtstamp}\r\n"
        ical_content += f"SUMMARY:{escape_ical(event.title)}\r\n"
        ical_content += f"DESCRIPTION:{escape_ical(event.description or 'Student Club-Hub Event')}\r\n"
        ical_content += f"LOCATION:{escape_ical(event.location)}\r\n"
        ical_content += f"ORGANIZER;CN={escape_ical(event.club.name if event.club else 'Student Club-Hub')}:MAILTO:noreply@studentclubhub.com\r\n"
        ical_content += "STATUS:CONFIRMED\r\n"
        ical_content += "SEQUENCE:0\r\n"
        ical_content += "END:VEVENT\r\n"
    
    ical_content += "END:VCALENDAR\r\n"
    
    from flask import Response
    response = Response(
        ical_content,
        mimetype="text/calendar; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename=student-clubhub-events-{datetime.now().strftime('%Y%m%d')}.ics",
            "Content-Type": "text/calendar; charset=utf-8"
        }
    )
    return response


@participant_features_bp.route("/participant/events/calendar/university-sync", methods=["POST"])
@jwt_required()
def sync_university_calendar():
    """Sync with university calendar system."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401
    
    data = request.get_json() or {}
    calendar_url = data.get("calendar_url", "").strip()
    calendar_type = data.get("type", "ical")  # ical, google, outlook
    
    if not calendar_url:
        return jsonify({"error": "Calendar URL required"}), 400
    
    user_id = current_user.get("id")
    
    try:
        # For iCal URL, fetch and parse
        if calendar_type == "ical":
            import urllib.request
            import urllib.error
            
            try:
                with urllib.request.urlopen(calendar_url, timeout=10) as response:
                    ical_data = response.read().decode('utf-8')
            except urllib.error.URLError as e:
                return jsonify({"error": f"Failed to fetch calendar: {str(e)}"}), 400
            
            # Parse iCal and extract events
            events_found = []
            lines = ical_data.split('\n')
            current_event = {}
            in_event = False
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # Handle line continuation (iCal format)
                if line.startswith(' ') or line.startswith('\t'):
                    if in_event and current_event:
                        # Continue previous line
                        last_key = list(current_event.keys())[-1] if current_event else None
                        if last_key:
                            current_event[last_key] += line.strip()
                    continue
                
                if line == "BEGIN:VEVENT":
                    current_event = {}
                    in_event = True
                elif line == "END:VEVENT":
                    if current_event and current_event.get("title"):
                        # Parse datetime
                        try:
                            dtstart_str = current_event.get("start", "")
                            dtend_str = current_event.get("end", "")
                            
                            # Handle different iCal datetime formats
                            if len(dtstart_str) == 8:  # YYYYMMDD
                                start_dt = datetime.strptime(dtstart_str, "%Y%m%d")
                            elif 'T' in dtstart_str:
                                if dtstart_str.endswith('Z'):
                                    start_dt = datetime.strptime(dtstart_str.replace('Z', ''), "%Y%m%dT%H%M%S")
                                else:
                                    start_dt = datetime.strptime(dtstart_str.split('T')[0], "%Y%m%d")
                            else:
                                start_dt = datetime.strptime(dtstart_str[:8], "%Y%m%d")
                            
                            if len(dtend_str) == 8:  # YYYYMMDD
                                end_dt = datetime.strptime(dtend_str, "%Y%m%d")
                            elif 'T' in dtend_str:
                                if dtend_str.endswith('Z'):
                                    end_dt = datetime.strptime(dtend_str.replace('Z', ''), "%Y%m%dT%H%M%S")
                                else:
                                    end_dt = datetime.strptime(dtend_str.split('T')[0], "%Y%m%d")
                            else:
                                end_dt = datetime.strptime(dtend_str[:8], "%Y%m%d")
                            
                            # Save to database
                            uni_event = UniversityCalendarEvent(
                                user_id=user_id,
                                title=current_event.get("title", "University Event"),
                                description=current_event.get("description", ""),
                                start_datetime=start_dt,
                                end_datetime=end_dt,
                                location=current_event.get("location", ""),
                                calendar_url=calendar_url
                            )
                            db.session.add(uni_event)
                            events_found.append({
                                "title": uni_event.title,
                                "start": str(uni_event.start_datetime),
                                "end": str(uni_event.end_datetime),
                                "location": uni_event.location
                            })
                        except Exception as parse_err:
                            print(f"Error parsing event: {parse_err}")
                            continue
                    current_event = {}
                    in_event = False
                elif line.startswith("SUMMARY:"):
                    current_event["title"] = line.split(":", 1)[1] if ":" in line else ""
                elif line.startswith("DTSTART"):
                    dt_part = line.split(":", 1)[1] if ":" in line else ""
                    current_event["start"] = dt_part
                elif line.startswith("DTEND"):
                    dt_part = line.split(":", 1)[1] if ":" in line else ""
                    current_event["end"] = dt_part
                elif line.startswith("LOCATION:"):
                    current_event["location"] = line.split(":", 1)[1] if ":" in line else ""
                elif line.startswith("DESCRIPTION:"):
                    current_event["description"] = line.split(":", 1)[1] if ":" in line else ""
            
            db.session.commit()
            
            return jsonify({
                "message": "University calendar synced successfully",
                "events_found": len(events_found),
                "events": events_found[:10]  # Return first 10 for preview
            }), 200
        
        elif calendar_type == "google":
            return jsonify({
                "message": "Google Calendar sync",
                "instructions": "To sync Google Calendar:\n1. Open Google Calendar\n2. Go to Settings > Calendars\n3. Click on your calendar\n4. Copy the 'Public URL to iCal format'\n5. Paste it here"
            }), 200
        
        elif calendar_type == "outlook":
            return jsonify({
                "message": "Outlook Calendar sync",
                "instructions": "To sync Outlook Calendar:\n1. Open Outlook Calendar\n2. Go to Calendar Settings\n3. Find 'Publish Calendar'\n4. Copy the iCal link\n5. Paste it here"
            }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to sync calendar: {str(e)}"}), 500


@participant_features_bp.route("/participant/events/calendar/university-sync", methods=["DELETE"])
@jwt_required()
def remove_university_calendar():
    """Remove synced university calendar events."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401
    
    user_id = current_user.get("id")
    
    try:
        deleted_count = UniversityCalendarEvent.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        
        return jsonify({
            "message": "University calendar removed successfully",
            "events_removed": deleted_count
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to remove calendar: {str(e)}"}), 500


# Helper function to award points and check badges
def award_points_and_badges(user_id, action_type, points_amount):
    """Award points and check for badge achievements."""
    stats = ParticipantStats.query.filter_by(user_id=user_id).first()
    if not stats:
        stats = ParticipantStats(user_id=user_id, points=0, events_registered=0, events_attended=0)
        db.session.add(stats)
    
    # Ensure points and counters are not None
    if stats.points is None:
        stats.points = 0
    if stats.events_registered is None:
        stats.events_registered = 0
    if stats.events_attended is None:
        stats.events_attended = 0
    
    stats.points += points_amount
    stats.events_registered += 1 if action_type == "register" else 0
    stats.events_attended += 1 if action_type == "check_in" else 0
    
    # Check for badges
    if action_type == "register" and stats.events_registered == 1:
        badge = Badge(user_id=user_id, badge_type="first_event", badge_name="First Event", 
                     badge_description="Registered for your first event!")
        db.session.add(badge)
    
    if action_type == "check_in":
        # Update streak
        today = date.today()
        if stats.current_streak is None:
            stats.current_streak = 0
        if stats.last_event_date:
            days_diff = (today - stats.last_event_date).days
            if days_diff == 1:
                stats.current_streak += 1
            elif days_diff > 1:
                stats.current_streak = 1
        else:
            stats.current_streak = 1
        
        stats.last_event_date = today
        if stats.current_streak > stats.longest_streak:
            stats.longest_streak = stats.current_streak
        
        # Check for streak badges
        if stats.current_streak == 7:
            badge = Badge(user_id=user_id, badge_type="streak_7", badge_name="Week Warrior",
                         badge_description="7-day attendance streak!")
            db.session.add(badge)
        elif stats.current_streak == 30:
            badge = Badge(user_id=user_id, badge_type="streak_30", badge_name="Monthly Master",
                         badge_description="30-day attendance streak!")
            db.session.add(badge)
    
    db.session.commit()


# ============================================================================
# SECTION 16: ROUTE BLUEPRINTS - CLUB REQUESTS
# ============================================================================

club_requests_bp = Blueprint("club_requests", __name__)

@club_requests_bp.route("/club-requests", methods=["POST"])
@jwt_required()
def create_club_request():
    """Participant submits a club proposal."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401
    
    if current_user.get("role") not in ["participant"]:
        return jsonify({"error": "Only participants can propose new clubs."}), 403

    data = request.get_json() or {}

    name = data.get("name", "").strip()
    description = data.get("description", "").strip()
    category = data.get("category", "").strip()
    mission = data.get("mission", "").strip()
    target_audience = data.get("target_audience", "").strip()
    activities_plan = data.get("activities_plan", "").strip()

    if len(name) < 3:
        return jsonify({"error": "Club name must be at least 3 characters."}), 400
    if len(description) < 10:
        return jsonify({"error": "Description must be at least 10 characters."}), 400

    existing_club = Club.query.filter_by(name=name).first()
    if existing_club:
        return jsonify({"error": "A club with this name already exists."}), 400

    existing_request = ClubRequest.query.filter_by(name=name, status="pending").first()
    if existing_request:
        return jsonify({"error": "A pending request with this name already exists."}), 400

    req = ClubRequest(
        proposer_id=current_user.get("id"),
        name=name,
        description=description,
        category=category or None,
        mission=mission or None,
        target_audience=target_audience or None,
        activities_plan=activities_plan or None,
        status="pending",
    )
    req.visible_from = datetime.utcnow() + timedelta(days=5)

    db.session.add(req)
    db.session.commit()

    return jsonify({
        "message": "Club proposal submitted successfully. University will review within 5 days.",
        "request_id": req.id
    }), 201


@club_requests_bp.route("/club-requests/mine", methods=["GET"])
@jwt_required()
def my_club_requests():
    """Participant can see all club proposals they submitted."""
    current_user = get_current_user_context()
    if not current_user:
        return jsonify({"error": "Authentication required"}), 401

    requests = ClubRequest.query.filter_by(proposer_id=current_user.get("id")).order_by(ClubRequest.created_at.desc()).all()
    now = datetime.utcnow()

    output = []
    for r in requests:
        item = {
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "category": r.category,
            "mission": r.mission,
            "target_audience": r.target_audience,
            "activities_plan": r.activities_plan,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        if r.visible_from and now >= r.visible_from and r.status in ["approved", "rejected"]:
            item["decision_message"] = r.decision_message
            item["decided_at"] = r.decided_at.isoformat() if r.decided_at else None
            if r.status == "approved":
                item["leader_email"] = getattr(r, 'leader_email', None)
                item["leader_password"] = getattr(r, 'leader_password', None)
        else:
            item["decision_message"] = None
            item["decided_at"] = None
            item["leader_email"] = None
            item["leader_password"] = None
        output.append(item)

    return jsonify(output), 200


# ============================================================================
# SECTION 16: APPLICATION FACTORY AND MAIN RUN
# ============================================================================

def create_app():
    """Application factory pattern for creating Flask app."""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(Config)
    
    # Initialize extensions
    CORS(app)
    db.init_app(app)
    bcrypt.init_app(app)
    jwt = JWTManager(app)
    
    # Register blueprints
    # Reminder endpoints blueprint
    reminders_bp = Blueprint("reminders", __name__)
    
    @reminders_bp.route("/events/<int:event_id>/send-reminders", methods=["POST"])
    @jwt_required()
    @leader_required
    def send_event_reminders_endpoint(event_id):
        """Send reminders to all registered participants for an event (Leader only)."""
        current_user = get_current_user_context()
        event = Event.query.get(event_id)
        
        if not event:
            return jsonify({"error": "Event not found"}), 404
        
        # Verify leader owns the event's club
        if not leader_owns_club(current_user.get("id"), event.club_id):
            return jsonify({"error": "You can only send reminders for your own events"}), 403
        
        data = request.get_json() or {}
        channels = data.get("channels", ["email"])  # Default to email
        reminder_type = data.get("reminder_type", "manual")
        custom_message = data.get("message", "")
        
        # Get all registrations for this event
        registrations = Registration.query.filter_by(
            event_id=event_id, cancelled=False
        ).all()
        
        results = {
            "total": len(registrations),
            "sent": {"email": 0, "whatsapp": 0, "sms": 0},
            "failed": {"email": 0, "whatsapp": 0, "sms": 0}
        }
        
        for registration in registrations:
            user = User.query.filter_by(email=registration.email).first()
            if user:
                reminder_results = send_event_reminders(user, event, reminder_type, channels)
                for channel, success in reminder_results.items():
                    if success:
                        results["sent"][channel] += 1
                    else:
                        results["failed"][channel] += 1
        
        return jsonify({
            "message": "Reminders sent",
            "results": results
        }), 200
    
    @reminders_bp.route("/reminder-preferences", methods=["GET", "PUT"])
    @jwt_required()
    def manage_reminder_preferences():
        """Get or update user reminder preferences."""
        current_user = get_current_user_context()
        user = User.query.get(current_user.get("id"))
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if request.method == "GET":
            return jsonify({
                "phone_number": user.phone_number,
                "reminder_email_enabled": user.reminder_email_enabled,
                "reminder_whatsapp_enabled": user.reminder_whatsapp_enabled,
                "reminder_sms_enabled": user.reminder_sms_enabled
            }), 200
        
        # PUT - Update preferences
        data = request.get_json() or {}
        
        if "phone_number" in data:
            user.phone_number = data["phone_number"]
        if "reminder_email_enabled" in data:
            user.reminder_email_enabled = bool(data["reminder_email_enabled"])
        if "reminder_whatsapp_enabled" in data:
            user.reminder_whatsapp_enabled = bool(data["reminder_whatsapp_enabled"])
        if "reminder_sms_enabled" in data:
            user.reminder_sms_enabled = bool(data["reminder_sms_enabled"])
        
        try:
            db.session.commit()
            return jsonify({
                "message": "Reminder preferences updated",
                "preferences": {
                    "phone_number": user.phone_number,
                    "reminder_email_enabled": user.reminder_email_enabled,
                    "reminder_whatsapp_enabled": user.reminder_whatsapp_enabled,
                    "reminder_sms_enabled": user.reminder_sms_enabled
                }
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
    
    app.register_blueprint(general_bp)
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(clubs_bp, url_prefix="/api")
    app.register_blueprint(events_bp, url_prefix="/api")
    app.register_blueprint(registrations_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(leader_bp, url_prefix="/api/leader")
    app.register_blueprint(university_bp, url_prefix="/api/university")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(club_requests_bp, url_prefix="/api")
    app.register_blueprint(profile_bp, url_prefix="/api/profile")
    app.register_blueprint(participant_features_bp, url_prefix="/api")
    app.register_blueprint(reminders_bp, url_prefix="/api")
    
    # Initialize database schema
    with app.app_context():
        db.create_all()
        ensure_schema()
    
    return app


if __name__ == "__main__":
    app = create_app()
    print("✅ Student Club-Hub API v4.1 running at http://127.0.0.1:5000")
    app.run(debug=True, host="0.0.0.0", port=5000)
