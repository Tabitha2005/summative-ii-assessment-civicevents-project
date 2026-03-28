# CivicEvents+ — Postman API Testing Script

> A step-by-step walkthrough of every API endpoint in the order you should test them.
> Follow this from top to bottom — each step builds on the one before it.
> Replace any `:id` values with the actual IDs you get back from the responses.

---

## Before You Start

Make sure your backend is running. Open your terminal and check that the server is up at `http://localhost:3000`. Also open Postman and create a new Collection called **CivicEvents+ Tests** so you can keep everything organized.

One important thing — once you log in, you'll get a token back. Copy that token and add it to every request after that as a Header:

```
Key:   Authorization
Value: Bearer <paste your token here>
```

You can also set this as a Collection Variable in Postman so you don't have to paste it every single time.

---

## STEP 1 — Sign Up a New User

First things first, let's create a regular user account. This is the starting point of everything.

```
POST   http://localhost:3000/api/auth/signup
```

Set Body → `raw` → `JSON`:

```json
{
  "full_name": "Test User",
  "email": "testuser@example.com",
  "password": "Test@1234"
}
```

**What to expect:** You should get a `201` response with a success message. If you get a `409`, that email is already taken — just change the email and try again.

---

## STEP 2 — Log In as That User

Now log in with the account you just created.

```
POST   http://localhost:3000/api/auth/login
```

Body → `raw` → `JSON`:

```json
{
  "email": "testuser@example.com",
  "password": "Test@1234"
}
```

**What to expect:** A `200` response with a `token` and user info `{ id, full_name, role }`. Copy that token — you'll need it for every request from here on. This user has role `user`.

---

## STEP 3 — Check Your Own Profile

Let's confirm the user was created correctly and the token works.

```
GET    http://localhost:3000/api/users/profile/me
```

> Add the `Authorization: Bearer <token>` header here.

**What to expect:** Your profile data — `full_name`, `email`, `role: "user"`, `is_active: true`.

---

## STEP 4 — Update Your Profile

Try updating your name and email. This should work fine.

```
PATCH  http://localhost:3000/api/users/profile/me
```

Body → `raw` → `JSON`:

```json
{
  "full_name": "Updated Test User",
  "email": "updated@example.com"
}
```

**What to expect:** `200` with the updated user object. Try sending `"role": "admin"` in the body too — the backend should reject it with a validation error. That's the expected behavior.

---

## STEP 5 — Browse Events (as a Normal User)

Let's see what events are available.

```
GET    http://localhost:3000/api/events
```

**What to expect:** A list of events. As a normal user, you'll only see published ones on the frontend — but the API returns all of them and the frontend filters. Note down an `id` from one of the events for the next steps.

---

## STEP 6 — Get a Single Event

Pick any event ID from Step 5 and fetch its full details.

```
GET    http://localhost:3000/api/events/:id
```

Replace `:id` with an actual event ID, for example:

```
GET    http://localhost:3000/api/events/1
```

**What to expect:** Full event object including `title`, `description`, `location`, `starts_at`, `ends_at`, `published`, and `metadata.image_url` if an image was uploaded.

---

## STEP 7 — Register for an Event

Now let's register the current user for that event.

```
POST   http://localhost:3000/api/event-registrations/register
```

Body → `raw` → `JSON`:

```json
{
  "event_id": 1
}
```

**What to expect:** `201` with a registration confirmation. Try hitting this same endpoint again with the same `event_id` — you should get a `409 Already registered` error. That's correct behavior.

---

## STEP 8 — View My Registrations

Check that the registration actually saved.

```
GET    http://localhost:3000/api/event-registrations/my-registrations
```

**What to expect:** A list containing the event you just registered for, with `status: "registered"`.

---

## STEP 9 — Submit Feedback for That Event

Leave a rating and comment on the event you registered for.

```
POST   http://localhost:3000/api/event-feedback
```

Body → `raw` → `JSON`:

```json
{
  "event_id": 1,
  "rating": 5,
  "comment": "This was a fantastic civic event!"
}
```

**What to expect:** `201` with the feedback object. Try submitting feedback for the same event again — you should get an error saying you already submitted. That's the one-feedback-per-event rule working correctly.

---

## STEP 10 — View My Feedback

Confirm your feedback was saved.

```
GET    http://localhost:3000/api/event-feedback/my-feedback
```

**What to expect:** A list with the feedback you just submitted, linked to the event ID.

---

## STEP 11 — Update Your Feedback

Change your mind? You can update it.

```
PUT    http://localhost:3000/api/event-feedback/:id
```

Replace `:id` with the feedback ID from Step 10. Body → `raw` → `JSON`:

```json
{
  "rating": 4,
  "comment": "Still great, but the venue was a bit small."
}
```

**What to expect:** `200` with the updated feedback.

---

## STEP 12 — Cancel Your Registration

Let's test the cancel flow.

```
POST   http://localhost:3000/api/event-registrations/cancel
```

Body → `raw` → `JSON`:

```json
{
  "event_id": 1
}
```

**What to expect:** `200` with a cancellation confirmation. Go back and hit Step 8 again — the registration should now show `status: "cancelled"`.

---

## STEP 13 — Browse Announcements

Check what audio announcements are available.

```
GET    http://localhost:3000/api/announcements
```

**What to expect:** A list of announcements. Note down an `id` for the next step.

---

## STEP 14 — Get a Single Announcement

```
GET    http://localhost:3000/api/announcements/:id
```

**What to expect:** Full announcement object with `title`, `audio_url`, `duration_seconds`, `published`, `transcript` (if any).

---

## STEP 15 — Browse Promos

```
GET    http://localhost:3000/api/promos
```

**What to expect:** A list of video promos. Note down an `id`.

---

## STEP 16 — Get a Single Promo

```
GET    http://localhost:3000/api/promos/:id
```

**What to expect:** Full promo object with `title`, `description`, `video_url`, `caption_text`, `published`.

---

## STEP 17 — View Notifications

```
GET    http://localhost:3000/api/notifications
```

**What to expect:** A list of notifications for the logged-in user — broadcast ones and any targeted to you. Each has `title`, `message`, `type`, `created_at`, and optionally `metadata.event_id`.

---

## STEP 18 — Get a Single Notification

```
GET    http://localhost:3000/api/notifications/:id
```

**What to expect:** Full notification detail.

---

## STEP 19 — Check User Dashboard

```
GET    http://localhost:3000/api/dashboard/me
```

**What to expect:** A summary of the current user's activity — their registrations, feedback, etc.

---

---

## Now Switch to Admin — Log In as Admin

Everything above was tested as a normal user. Now let's test all the admin-only endpoints. Log in with the admin credentials.

```
POST   http://localhost:3000/api/auth/login
```

Body → `raw` → `JSON`:

```json
{
  "email": "admin@civicevents.com",
  "password": "Admin@1234"
}
```

**What to expect:** A new token with `role: "admin"`. Copy this new token and replace the old one in your Authorization header for all requests from here on.

---

## STEP 20 — Get Admin Dashboard Stats

```
GET    http://localhost:3000/api/dashboard/admin
```

**What to expect:** A full stats object — `total_events`, `total_promos`, `total_users`, `total_registrations`, `total_notifications`, `user_growth` array for the chart, upcoming vs past events breakdown.

---

## STEP 21 — List All Users

```
GET    http://localhost:3000/api/users
```

**What to expect:** Every registered user on the platform with their `id`, `full_name`, `email`, `role`, `is_active`, `created_at`. Note down a regular user's `id` for the next two steps.

---

## STEP 22 — Get a Single User

```
GET    http://localhost:3000/api/users/:id
```

**What to expect:** Full profile of that specific user.

---

## STEP 23 — Disable a User

```
PATCH  http://localhost:3000/api/users/:id/disable
```

No body needed. **What to expect:** `200` confirming the user is now disabled (`is_active: false`). Go back and hit Step 22 — you should see `is_active: false` now.

---

## STEP 24 — Re-enable That User

```
PATCH  http://localhost:3000/api/users/:id/enable
```

No body needed. **What to expect:** `200` confirming the user is active again. Good — the toggle works both ways.

---

## STEP 25 — Create a New Event (with Image Upload)

This one uses `form-data` not JSON because we're uploading a file.

```
POST   http://localhost:3000/api/events
```

Set Body → `form-data` and add these fields:

```
title        → Community Budget Meeting
description  → Join us to discuss the city's annual budget
location     → City Hall, Main Chamber
starts_at    → 2025-09-15T10:00
ends_at      → 2025-09-15T12:00
published    → true
image        → [select a JPG or PNG file from your computer]
```

**What to expect:** `201` with the new event object including `metadata.image_url` pointing to the uploaded file. Note down the new event's `id`.

---

## STEP 26 — Edit That Event

```
PUT    http://localhost:3000/api/events/:id
```

Body → `form-data`:

```
title        → Community Budget Meeting 2025
description  → Updated: Join us to discuss the revised city budget
location     → City Hall, Main Chamber — Room A
starts_at    → 2025-09-16T10:00
ends_at      → 2025-09-16T13:00
published    → true
```

**What to expect:** `200` with the updated event. The image stays the same if you don't upload a new one.

---

## STEP 27 — View All Registrations (Admin)

```
GET    http://localhost:3000/api/event-registrations/all
```

**What to expect:** Every registration across the entire platform — user name, email, event title, status, dates.

---

## STEP 28 — View Attendees for a Specific Event

```
GET    http://localhost:3000/api/event-registrations/event/:event_id/attendees
```

Replace `:event_id` with the event ID from Step 25 or any existing event. **What to expect:** A list of users who registered for that specific event.

---

## STEP 29 — View All Feedback for an Event (Admin)

```
GET    http://localhost:3000/api/event-feedback/event/:event_id
```

**What to expect:** All feedback submitted for that event — ratings, comments, user info. This is the admin view of what users said.

---

## STEP 30 — Create an Announcement (with Audio Upload)

```
POST   http://localhost:3000/api/announcements
```

Body → `form-data`:

```
title      → Road Closure Notice — Downtown
published  → true
audio      → [select an MP3 or WAV file from your computer]
```

**What to expect:** `201` with the announcement object including `audio_url`. Note down the `id`.

---

## STEP 31 — Edit That Announcement

```
PUT    http://localhost:3000/api/announcements/:id
```

Body → `form-data`:

```
title      → Road Closure Notice — Downtown (Updated)
published  → true
```

**What to expect:** `200` with the updated announcement. Audio stays the same if you don't upload a new file.

---

## STEP 32 — Unpublish the Announcement

```
PATCH  http://localhost:3000/api/announcements/:id/unpublish
```

No body needed. **What to expect:** `200` — the announcement is now a draft. Normal users won't see it anymore.

---

## STEP 33 — Publish the Announcement Again

```
PATCH  http://localhost:3000/api/announcements/:id/publish
```

No body needed. **What to expect:** `200` — it's live again. A broadcast notification should also be created automatically by the backend.

---

## STEP 34 — Create a Promo (with Video Upload)

```
POST   http://localhost:3000/api/promos
```

Body → `form-data`:

```
title        → Summer in the City 2025
description  → Highlights from this year's summer civic programs
caption_text → Welcome to Summer in the City — a celebration of community
published    → true
video        → [select an MP4 file from your computer]
```

**What to expect:** `201` with the promo object including `video_url`. Note down the `id`.

---

## STEP 35 — Edit That Promo

```
PUT    http://localhost:3000/api/promos/:id
```

Body → `form-data`:

```
title        → Summer in the City 2025 — Official
description  → The official highlights reel from this year's summer programs
caption_text → Welcome to the official Summer in the City 2025 showcase
published    → true
```

**What to expect:** `200` with the updated promo.

---

## STEP 36 — Unpublish the Promo

```
PATCH  http://localhost:3000/api/promos/:id/unpublish
```

No body. **What to expect:** `200` — promo is now a draft.

---

## STEP 37 — Publish the Promo Again

```
PATCH  http://localhost:3000/api/promos/:id/publish
```

No body. **What to expect:** `200` — promo is live again.

---

## STEP 38 — Delete a Notification (Admin)

Go back to Step 17 and pick a notification `id`.

```
DELETE http://localhost:3000/api/notifications/:id
```

No body. **What to expect:** `200` confirming deletion. Hit `GET /api/notifications` again — that notification should be gone.

---

## STEP 39 — Delete the Event You Created

```
DELETE http://localhost:3000/api/events/:id
```

Use the event ID from Step 25. No body. **What to expect:** `200` confirming deletion. Hit `GET /api/events/:id` with that same ID — you should get a `404` now.

---

## STEP 40 — Delete the Announcement You Created

```
DELETE http://localhost:3000/api/announcements/:id
```

Use the ID from Step 30. **What to expect:** `200` confirming deletion.

---

## STEP 41 — Delete the Promo You Created

```
DELETE http://localhost:3000/api/promos/:id
```

Use the ID from Step 34. **What to expect:** `200` confirming deletion.

---

## Quick Summary Table

| Step | Method | Endpoint | Body Type | Who |
|------|--------|----------|-----------|-----|
| 1 | POST | `/api/auth/signup` | JSON | Public |
| 2 | POST | `/api/auth/login` | JSON | Public |
| 3 | GET | `/api/users/profile/me` | — | User |
| 4 | PATCH | `/api/users/profile/me` | JSON | User |
| 5 | GET | `/api/events` | — | User |
| 6 | GET | `/api/events/:id` | — | User |
| 7 | POST | `/api/event-registrations/register` | JSON | User |
| 8 | GET | `/api/event-registrations/my-registrations` | — | User |
| 9 | POST | `/api/event-feedback` | JSON | User |
| 10 | GET | `/api/event-feedback/my-feedback` | — | User |
| 11 | PUT | `/api/event-feedback/:id` | JSON | User |
| 12 | POST | `/api/event-registrations/cancel` | JSON | User |
| 13 | GET | `/api/announcements` | — | User |
| 14 | GET | `/api/announcements/:id` | — | User |
| 15 | GET | `/api/promos` | — | User |
| 16 | GET | `/api/promos/:id` | — | User |
| 17 | GET | `/api/notifications` | — | User |
| 18 | GET | `/api/notifications/:id` | — | User |
| 19 | GET | `/api/dashboard/me` | — | User |
| — | POST | `/api/auth/login` (admin) | JSON | Admin login |
| 20 | GET | `/api/dashboard/admin` | — | Admin |
| 21 | GET | `/api/users` | — | Admin |
| 22 | GET | `/api/users/:id` | — | Admin |
| 23 | PATCH | `/api/users/:id/disable` | — | Admin |
| 24 | PATCH | `/api/users/:id/enable` | — | Admin |
| 25 | POST | `/api/events` | form-data | Admin |
| 26 | PUT | `/api/events/:id` | form-data | Admin |
| 27 | GET | `/api/event-registrations/all` | — | Admin |
| 28 | GET | `/api/event-registrations/event/:event_id/attendees` | — | Admin |
| 29 | GET | `/api/event-feedback/event/:event_id` | — | Admin |
| 30 | POST | `/api/announcements` | form-data | Admin |
| 31 | PUT | `/api/announcements/:id` | form-data | Admin |
| 32 | PATCH | `/api/announcements/:id/unpublish` | — | Admin |
| 33 | PATCH | `/api/announcements/:id/publish` | — | Admin |
| 34 | POST | `/api/promos` | form-data | Admin |
| 35 | PUT | `/api/promos/:id` | form-data | Admin |
| 36 | PATCH | `/api/promos/:id/unpublish` | — | Admin |
| 37 | PATCH | `/api/promos/:id/publish` | — | Admin |
| 38 | DELETE | `/api/notifications/:id` | — | Admin |
| 39 | DELETE | `/api/events/:id` | — | Admin |
| 40 | DELETE | `/api/announcements/:id` | — | Admin |
| 41 | DELETE | `/api/promos/:id` | — | Admin |

---

> Total: **41 test steps** covering all 35 endpoints, including create → read → update → delete cycles for every resource.
