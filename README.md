# Secret Santa Magic

A festive Secret Santa web experience for orchestrating a gift exchange among individuals or couples. The project provides a React front-end with animated funnel screens and a Node.js backend that performs draw logic and dispatches participant emails.

## Features

- 🎄 Guided three-step funnel for event name, date, and four couples with validation and playful animations.
- 🎁 Animated draw visualisation with spinning participant cards, snow, and confetti-inspired effects.
- ✉️ Backend derangement algorithm that ensures no-one draws themselves or their spouse and emails every participant their assignment.
- 📱 Responsive, mobile-first layout with accessible colours and focus states.

## Project Structure

```
SecretSanta/
├── frontend/   # React + Vite single-page app for the funnel and animations
└── backend/    # Express server handling draw logic and email dispatch
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install dependencies

From the repository root:

```bash
cd frontend
npm install
cd ../backend
npm install
```

### Configure email (optional)

The backend defaults to a JSON transport that logs messages to the console. To send real emails set the following environment variables (e.g. in `backend/.env`):

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-user
SMTP_PASSWORD=your-password
FROM_EMAIL=secretsanta@example.com
```

### Configure Google reCAPTCHA

The event setup form uses Google reCAPTCHA to prevent automated submissions. Provide the following environment variables:

- Frontend (`frontend/.env`): `VITE_RECAPTCHA_SITE_KEY` – use the public site key `6Lc7wQgsAAAAACVeB6gfJbqnjb8-GjDteQQ5etDe`.
- Backend (`backend/.env`): `RECAPTCHA_SECRET_KEY` – set this to the secret key `6Lc7wQgsAAAAALqvrhAs7iCsDsdKqlbcFQU5gykw` using a secrets manager (e.g. DigitalOcean App Platform Parameters) so it is not committed to source control.

The repository includes `.env.example` files in both `frontend/` and `backend/` to illustrate the expected configuration.

### Run the application

Start the backend (port 4000):

```bash
cd backend
npm start
```

In a separate terminal start the front-end dev server (port 5173):

```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` to create your event and trigger the draw.

## Testing the Draw Logic

The backend exposes a `/health` endpoint for simple monitoring. For automated validation you can post to `/api/draw` with the same payload used by the front-end.

```bash
curl -X POST http://localhost:4000/api/draw \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Family Christmas",
    "date": "2025-12-24",
    "couples": [
      {"participants": [{"name": "Alice", "email": "alice@example.com"}, {"name": "Bob", "email": "bob@example.com"}]},
      {"participants": [{"name": "Carol", "email": "carol@example.com"}, {"name": "Dave", "email": "dave@example.com"}]},
      {"participants": [{"name": "Eve", "email": "eve@example.com"}, {"name": "Frank", "email": "frank@example.com"}]},
      {"participants": [{"name": "Grace", "email": "grace@example.com"}, {"name": "Heath", "email": "heath@example.com"}]}
    ]
  }'
```

You will receive JSON assignments while the email payloads are printed to the backend console when SMTP is not configured.

## Accessibility & Styling Notes

- Headings use the playful **Fredoka One** font while body copy uses **Roboto** for readability.
- High-contrast gradients and focus outlines keep the experience accessible on mobile and desktop.
- Animations rely on CSS keyframes and Framer Motion for smooth transitions while remaining performant.

## License

MIT
