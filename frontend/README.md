# CivicEvents+ Frontend

A complete frontend for the CivicEvents+ civic engagement platform, built with HTML5, Tailwind CSS (CDN), jQuery, and Vanilla JS.

---

## How to Run Locally

1. Make sure the backend is running at `http://localhost:4000` (see `/backend/README.md`)
2. Open any `.html` file directly in your browser, **or** use [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VS Code for best results (avoids CORS issues with `$.load()` partials)
3. Navigate to `index.html` — it auto-redirects logged-in users to `events.html`

> **Note:** The nav/footer partials use jQuery `$.load()` which requires a local server (Live Server, http-server, etc.) — they won't load when opening HTML files directly via `file://`.

---

## Configuring BASE_URL

Edit `js/config.js`, line 1:

```js
const BASE_URL = "http://localhost:4000"; // Change to your backend URL
```

---

## Admin Test Credentials

| Field    | Value               |
|----------|---------------------|
| Email    | tabitha@admin.com   |
| Password | Admin@1234          |

---

## Pages & Purpose

| Page                       | Purpose                                              |
|----------------------------|------------------------------------------------------|
| `index.html`               | Landing page — redirects logged-in users to events   |
| `login.html`               | User login                                           |
| `signup.html`              | User registration with password strength meter       |
| `events.html`              | Browse events with search, filter, pagination        |
| `event-detail.html`        | Event details, registration, feedback                |
| `event-form.html`          | Admin: create/edit event with image upload           |
| `announcements.html`       | Browse audio announcements                           |
| `announcement-detail.html` | Custom HTML5 audio player with keyboard controls     |
| `announcement-form.html`   | Admin: create/edit announcement with audio upload    |
| `promos.html`              | Browse video promos                                  |
| `promo-detail.html`        | Custom HTML5 video player with captions              |
| `promo-form.html`          | Admin: create/edit promo with video upload           |
| `notifications.html`       | Full notifications inbox (paginated)                 |
| `dashboard.html`           | Admin: stats, charts, manage all resources           |
| `profile.html`             | View/edit own profile (name, email only)             |
| `my-registrations.html`    | View and cancel event registrations                  |

---

## Role-Based Guards

Guards are implemented in `js/config.js`:

| Function      | Purpose                                                        | Used In                                                    |
|---------------|----------------------------------------------------------------|------------------------------------------------------------|
| `authGuard()` | Redirects to login if not authenticated                        | Every protected page on load                               |
| `adminGuard()`| Shows 403 if user is not admin; calls `authGuard()` internally | `event-form.html`, `announcement-form.html`, `promo-form.html`, `dashboard.html` |
| `isAdmin()`   | Returns `true` if role === 'admin'                             | Conditionally shows admin UI elements in all list pages    |

**Role-change is intentionally blocked:**
- `js/users.js` — comment: `// ROLE-GUARD: Role field intentionally excluded from update form`
- `js/dashboard.js` — comment: `// ROLE-GUARD: Admin cannot update user role per business rules`
- No role-change UI exists anywhere in the frontend

---

## Tech Stack

- HTML5 (semantic, accessible)
- [Tailwind CSS](https://tailwindcss.com/) via CDN
- [jQuery 3.7.1](https://jquery.com/) for DOM + AJAX
- [Chart.js 4.4](https://www.chartjs.org/) for dashboard charts (CDN)
- Vanilla JS for auth logic and utilities
