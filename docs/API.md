# Student Club-Hub API Documentation

## Base URL
```
http://localhost:5000
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Register User
**POST** `/api/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "participant"  // or "leader"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully!"
}
```

---

### Login
**POST** `/api/login`

Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "role": "participant",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

## Club Endpoints

### Get All Clubs
**GET** `/api/clubs`

Retrieve all clubs.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Tech Club",
    "description": "Technology and innovation",
    "category": "Technical"
  }
]
```

---

### Create Club
**POST** `/api/clubs`

Create a new club (Leader only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "AI Club",
  "description": "Artificial Intelligence enthusiasts",
  "category": "Technical"
}
```

**Response:** `201 Created`
```json
{
  "message": "Club created successfully!",
  "club": {
    "id": 2,
    "name": "AI Club",
    "description": "Artificial Intelligence enthusiasts",
    "category": "Technical"
  }
}
```

---

## Event Endpoints

### Get All Events
**GET** `/api/events`

Retrieve all events.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "club_id": 1,
    "title": "AI Workshop",
    "description": "Introduction to Machine Learning",
    "date": "2025-12-01",
    "time": "14:00:00",
    "location": "Room 204",
    "created_at": "2025-11-20T10:00:00"
  }
]
```

---

### Create Event
**POST** `/api/events`

Create a new event (Leader only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "club_id": 1,
  "title": "AI Workshop",
  "description": "Introduction to Machine Learning",
  "date": "2025-12-01",
  "time": "14:00",
  "location": "Room 204"
}
```

**Response:** `201 Created`
```json
{
  "message": "Event created successfully!",
  "event": { /* event object */ }
}
```

---

### Update Event
**PUT** `/api/events/<event_id>`

Update an existing event (Leader only, 7+ days before event).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Advanced AI Workshop",
  "description": "Deep Learning fundamentals",
  "date": "2025-12-02",
  "time": "15:00",
  "location": "Room 305",
  "club_id": 1
}
```

**Response:** `200 OK`
```json
{
  "message": "Event updated successfully!",
  "event": { /* updated event object */ }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "error": "Events can only be edited at least 7 days in advance."
}
```

---

### Delete Event
**DELETE** `/api/events/<event_id>`

Delete an event (Leader only, 7+ days before event).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Event deleted successfully."
}
```

---

## Registration Endpoints

### RSVP for Event
**POST** `/api/events/<event_id>/register`

Register for an event (Authenticated users).

**Headers:** `Authorization: Bearer <token>`

**Response:** `201 Created`
```json
{
  "message": "RSVP confirmed!",
  "event": { /* event object */ },
  "registration": { /* registration object */ },
  "qr_code_url": "/api/registrations/1/qr"
}
```

---

### Cancel RSVP
**DELETE** `/api/events/<event_id>/rsvp`

Cancel event registration.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "RSVP cancelled.",
  "event_id": 1
}
```

---

### Get User Registrations
**GET** `/api/participant/registrations/<email>`

Get all registrations for a user.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "event_id": 1,
    "participant_name": "John Doe",
    "email": "john@example.com",
    "timestamp": "2025-11-20T10:00:00",
    "cancelled": false
  }
]
```

---

### Get QR Code
**GET** `/api/registrations/<registration_id>/qr`

Download QR code for a registration.

**Response:** `200 OK` (PNG image)

---

## Leader Dashboard Endpoints

### Get Leader Events
**GET** `/api/leader/events`

Get all events with analytics (Leader only).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "AI Workshop",
    "date": "2025-12-01",
    "registration_count": 25,
    "view_count": 150,
    "club_name": "Tech Club"
  }
]
```

---

### Get Event Registrations
**GET** `/api/leader/registrations/<event_id>`

Get all registrations for a specific event (Leader only).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "event": { /* event object */ },
  "registrations": [
    {
      "id": 1,
      "participant_name": "John Doe",
      "email": "john@example.com",
      "timestamp": "2025-11-20T10:00:00"
    }
  ]
}
```

---

## Analytics Endpoints

### System Overview
**GET** `/api/analytics/overview`

Get system-wide statistics.

**Response:** `200 OK`
```json
{
  "total_clubs": 5,
  "total_events": 20,
  "total_registrations": 150
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```
