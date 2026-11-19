# AutoRelief website — Lagos pilot

A responsive React + Vite website prototype for AutoRelief, using the premium navy / orange visual direction. The page includes roadside rescue, GPS capture, a five-second cancellable SOS flow, Leaflet map, SMS fallback, optional browser voice trigger, mechanic/provider registration interest, spare-parts discovery and safety messaging.

## Run locally

1. Install Node.js 20 or later.
2. In this folder run `npm install`.
3. Copy `.env.example` to `.env` and add your Supabase project URL, anon key and the dispatch SMS number (optional for preview).
4. Run `npm run dev` and open the local URL shown by Vite.
5. Run `npm run build` before deployment.

Without Supabase credentials, the SOS flow runs in **demo mode** and records nothing on a server. It clearly labels the request as a local demo.

## Deploy the frontend

- Push this folder to a private or public GitHub repository.
- Import the repository into Vercel.
- Build command: `npm run build`
- Output directory: `dist`
- Add the environment variables from `.env.example` in Vercel.
- Connect a custom domain after purchasing it. Check AutoRelief name and trademark availability before buying a domain.

## Production work still required — do not skip

This is a frontend prototype, not a live emergency response service. Do not advertise SOS as operational until the following are built, tested and staffed:

1. **SOS server endpoint:** implement a Supabase Edge Function or Node server route. Validate inputs, authenticate where possible, rate-limit by account/device/IP, add idempotency, spam controls and audit logs. Keep privileged keys server-side.
2. **Dispatch workflow:** dispatcher console, provider availability, proximity search (Haversine/PostGIS), manual assignment and status transitions (`waiting → assigned → en_route → completed/cancelled`).
3. **Real-time updates:** use Supabase Realtime for authorized customer/dispatcher/provider channels. Restrict subscriptions so users can only see their own active request.
4. **Location lifecycle:** collect location only after explicit consent, store it only for an active request, and run a scheduled cleanup job immediately after completion/cancellation or a short configured expiry. Avoid retaining precise location in analytics/logs.
5. **SMS:** the current `sms:` link opens the user's messaging app with a prefilled message. Automatic SMS delivery requires an SMS gateway and a server-side provider integration; browsers cannot silently send SMS.
6. **Offline behavior:** cache the lightweight shell with a service worker, queue only non-sensitive draft data, and clearly show when a request has not reached the server. SMS is not guaranteed to send without cellular service.
7. **Identity checks:** secure provider document upload, OCR extraction, human verification, credential expiry and suspension workflow.
8. **Payments/fraud:** integrate a payment provider only after legal/compliance review; flag duplicate accounts and suspicious payment patterns for human review.
9. **Routing:** add road-network routing and traffic provider only after dispatch MVP is stable. Straight-line proximity is not road travel time.
10. **Operational readiness:** staffed dispatch centre, provider contracts, insurance/liability review, incident escalation, privacy notice, terms, data retention policy, security testing and backup procedures.

## Stack mapping

- Frontend: React, Vite, Tailwind CSS, Leaflet and HTML5 Geolocation.
- Data: Supabase PostgreSQL; `supabase/schema.sql` is a starting schema.
- Realtime: Supabase Realtime (to be configured with private channels).
- Hosting: Vercel frontend + Supabase backend.
- Dispatch: server-side function / Edge Function; no dispatch engine is active in this prototype.
- OCR: provider ID verification workflow is planned, not implemented.
- Routing: optional later phase; not included in the MVP.

## Pilot recommendation

Start with one tightly managed Lagos service area (the planned Gbagada pilot), a small manually verified provider group and a human dispatcher. Test request-to-arrival operations before opening coverage across Lagos.
