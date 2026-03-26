Project: CivicEvents - Accessible City Events & Services Portal

Overview / Goal
Students will build the frontend (UI) only. The backend API is provided and contains endpoints for: auth, users, events, announcements (audio), promos (video + captions), notifications (in-app), dashboard statistics, event registrations and event feedback.

Goal: Your job is to design and implement a polished, accessible, responsive frontend that consumes those APIs, enforces the permission model (admin vs normal user), and demonstrates thoughtful UX for each feature.

Target tech: HTML, Tailwind CSS & jQuery.

1. Authentication & global app behavior
Requirements
Implement Sign up and Login pages.

After login store token with secure client storage rules:

If session-only: use sessionStorage.

If persistent: use localStorage (note security tradeoffs).

Include global auth context (or Redux) to hold user info { id, full_name, role } and token.

Attach Authorization: Bearer <token> header to protected API requests.

UI & Flows
Signup

Fields: full_name, email, password and confirm_password.

Show password strength meter. Enforce strong password policy (min 8 chars, mixed-case, number, special char).

On success redirect to login page with success toast.

Login

Fields: email, password.

On success save token and user, redirect to Dashboard.

Edge cases
Expired tokens should sign the user out and show message.

Show clear errors on 4xx/5xx responses.

2. Permissions (roles)
Two roles: admin, user (normal).

Enforce in UI (hide/show controls) and in any client-side guard. Example:

Only admins can create/edit/delete events, promos, announcements, manage users, and create broadcast notifications.

Normal users can view published content, register for events, submit feedback, view their profile and their registrations, etc

Always rely on backend for real security — frontend controls are only for UX.

3. Global layout & navigation
Logo, Search bar (global), Links: Events, Announcements, Promos, Notifications (bell icon + unread count), Profile (dropdown), Admin (if admin), Dashboard (if admin).

Left or top sidebar for Dashboard pages (admin).

Notification drawer/panel: shows in-app notifications from /api/notifications for logged-in user.

Footer with contact/help and other relevant information.

4. Events feature
Pages/components
Events List (GET /api/events)

Show only events where published=true (unless admin viewing an admin-only list).

Event display: title, date/time, location, image (if metadata.image_url), short description, actions: View, Register (if user), Edit/Delete (admin).

Search and filters (by date, location).

Pagination controls.

Event Detail (GET /api/events/:id)

Full description, image (from metadata.image_url), start/end datetime, location, map link if appropriate.

Register button (calls POST /api/event-registrations or register endpoint) — if already registered show Cancel registration.

Show list of registrants (admin only) from GET /api/event-registrations/event/:event_id.

Feedback section: show average rating, list of feedback, and Add Feedback form (rating 1–5 + comment).

Event create/edit (Admin)

Form fields: title, description, location, starts_at, ends_at, published toggle, image upload field (file: key 'image').

Upload flow: use multipart/form-data and the configured endpoint expects uploadEventImage.single('image') and event JSON fields.

After create/update, display success message and redirect.

UX considerations
Show preview of uploaded image before submit.

For image display, use the public URL: ${baseUrl}/uploads/events/<filename> as returned by the backend (or saved in metadata.image_url).

Show loading state during API calls.

Acceptance criteria
Users can see published events and register.

Admin can create/edit/delete events and upload image; image URL persists and displays.

5. Announcements (audio)
Pages/components
Announcements List (GET /api/announcements) — only published=true.

Card includes title, length (duration_seconds), play button, created_at.

Announcement Detail (GET /api/announcements/:id)

Audio player (HTML5 <audio> with source = audio_url), transcript (if provided).

Create Announcement (Admin)

Form fields: title, audio upload (file key audio), published toggle.

Upload audio using multipart/form-data, field name audio.

After create, backend will create a notification — UI should show success toast.

UX & accessibility
Use accessible audio controls (keyboard focus, labels).

Provide fallback text for browsers that can’t play format.

Display friendly playback UI and current time/duration.

Acceptance criteria
Audio is uploaded and playable from the announcement detail.

Admin-only create/edit/delete controls visible only to admin.

6. Promos (video + captions)
Pages/components
Promos List (GET /api/promos) — show only published=true.

Promo display: thumbnail (if backend provides or render first frame), title, short description, Play button.

Promo Detail (GET /api/promos/:id)

HTML5 <video> element with src = video_url and <track kind="captions" src="caption_url" srclang="en" label="English">.

Play/pause, volume, fullscreen.

Create Promo (Admin)

Fields: title, description, video upload (file key video) and caption_text.

Upload uses uploadPromoVideo.single('video') and optional captions.

UX & accessibility
Captions track must be available and enabled by default or easily toggled.

Provide a transcript or description for accessibility if possible.

Acceptance criteria
Videos play with captions when available.

Admin can upload video and captions; promo persists and can be published/unpublished.

7. Notifications (in-app)
Data model assumptions
Notifications returned by /api/notifications should be filtered to the logged-in user (or show broadcast items).

Pages/components
Notification Bell: shows count.

Notifications Drawer/Inbox (GET /api/notifications)

List notifications (title, message, time, type), click opens detail.

Delete (admins) /DELETE /api/notifications/:id.

Notification detail: show full message and include link to related resource using metadata (e.g., event_id → open event).

Acceptance criteria
Notifications list shows broadcast and targeted ones for the user.

Admins can delete notifications via UI (a form in Admin panel).

8. Dashboard (admin)
Pages/components
Dashboard summary (GET /api/dashboard/admin)

Display: total events, total promos, users count, registrations count, unread notifications, etc

Users management (admin)

List users, enable/disable toggle (PATCH endpoints), view profile.

Note: Admins cannot change a user’s role via UI according to rules.

Acceptance criteria
Dashboard displays correct numbers from API.

Charts are readable and update when data changes.

9. Users & Profile
Pages/components
My Profile

Show user info: full_name, email, role, is_active.

Form to update full_name and email; disallow updates to role and is_active.

When user updates email, frontend should show confirmation if API returns conflict.

Admin user management

List users (GET /api/users), view single user (GET /api/users/:id).

Admin-only actions: enable/disable user via PATCH or dedicated endpoints. Admins cannot update user role from the UI (per rules).

Acceptance criteria
Users can update their profile (not their role).

Admin can enable/disable but not change user role.

10. Event registration & feedback
Registration
POST /api/event-registrations with user_id and event_id (or dedicated register endpoint).

Provide “My registrations” page (GET /api/event-registrations/my-registrations) showing registered events.

Cancel registration option calls PATCH/DELETE depending on API.

Feedback
Users can submit one feedback per event (rating + comment).

Display average rating on event detail.

Acceptance criteria
Users can register/unregister; registrations persist and display in “My events”.

Feedback is linked to event and user; user cannot leave multiple feedback entries for same event.

11. Error handling & edge cases
Always show user-friendly error messages from API responses.

Show network error fallback and retry options for critical operations.

Validate inputs client-side before sending to server.

For file uploads: show size/type errors before uploading.

If user is unauthorized (401), redirect to login.

If user is forbidden (403) show appropriate message and options (contact admin).

12. Accessibility & responsive design
Use semantic HTML, proper aria-* attributes, and keyboard focus management.

Ensure color contrast is acceptable.

Make layout responsive: mobile-first breakpoints for lists/cards.

Provide labels for file inputs and show clear progress indicators for uploads.

13. Performance & UX polish
Use lazy loading for heavy media (videos).

Show skeleton loaders for lists when data is loading.

Use optimistic UI for small actions (e.g., marking a notification as read) but revert on failure.

Cache lists where appropriate (e.g., promos) and invalidate on create/update.

14. Backend API Setup
Refer to Readme.md file in the backend directory located in the GitHub repository
Deliverables
Each student must submit:

A working frontend app (GitHub repository) with:

README with how to run locally, and notes on any environment variables.

Instructions for how to connect to the provided backend (base URL).

All UI implementation must go into the frontend directory/folder in the GitHub repository.
Short recorded demo (5–7 minutes) showing:

all admin actions.

all normal user actions.

backend API and database setup.
Code comments explaining where role-based guards are implemented.
