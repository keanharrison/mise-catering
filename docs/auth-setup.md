# Accounts setup (Supabase)

Model: customers self-register; staff are invite-only; restaurants request a demo. Roles are `customer`, `owner`, `manager`, `staff`. The role lives in `public.profiles` and is never taken from anything the browser sends.

## One-time setup

1. Create a project at supabase.com.
2. SQL editor: run `supabase/migrations/0001_accounts.sql`.
3. Project settings > API: copy the project URL and the **anon** key into `app/.env.local` (see `app/.env.example`). Never use the service_role key in the app.
4. Authentication > URL configuration: add `http://localhost:5173/pearl-login.html` (and the production URL) to the redirect allow-list.
5. Authentication > Providers > Email: keep "Confirm email" on for production.
6. Restart `npm run dev`.

## First owner (bootstrap)

Staff cannot sign up, so create the first owner by hand: Authentication > Users > Invite user, then in the SQL editor:

```sql
insert into public.staff_invitations (restaurant_id, email, role)
select id, 'owner@example.com', 'owner' from public.restaurants where slug = 'pearl-island';
```

Run the insert **before** sending the invite: the profile is created when the invited user first appears, and only invited users can claim an invitation. The invitee opens the email link, sets a password, and lands in `/staff`. Later, owners and managers can add rows to `staff_invitations` for their own restaurant.

## Reading demo requests

`demo_inquiries` is write-only from the app. Read it in the Supabase dashboard (Table editor).

## Not built yet

- Orders and drafts still live in the browser; moving them into Postgres (with row-level security per customer and per restaurant) is the next step.
- Restaurant-branded customer pages (`restaurants.brand` holds colors and images, no UI reads it yet).
- Sending the staff invite email from inside the app (needs a server function using the service_role key).
