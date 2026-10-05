# Platform Ops & Support schedule

## Local setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in the SQL editor.
4. Create the seven users in Supabase Authentication with their real email addresses and passwords. Replace the profile IDs in the seed section with those auth user IDs before running the seed inserts, or insert matching profile rows after account creation. The `profiles.id` value must exactly equal the corresponding `auth.users.id`; otherwise that user can view the board but cannot save.
5. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6. Run `npm run dev`.

Users can view the full team schedule. The database policies only allow each authenticated user to write their own schedule rows; the UI also disables editing when another member is selected.

To find the Auth ID for Aryan after creating the account, run this in the Supabase SQL editor, then use the returned UUID in the Aryan profile seed row:

```sql
select id, email from auth.users where email = 'raj.aryan@orange';
```

For the supplied Aryan account, you can instead run [`supabase/link-aryan.sql`](./supabase/link-aryan.sql). This replaces the placeholder Aryan profile with the real Auth user ID, which enables editing and saving.

For Khushbu, run [`supabase/link-khushbu.sql`](./supabase/link-khushbu.sql) once to connect `kushbu.singh@orange.com` to the `Singh Khushbu` profile.

If all seven Auth users already exist, use [`supabase/sync-profiles-from-auth.sql`](./supabase/sync-profiles-from-auth.sql) instead. It matches all seven exact email addresses to their Auth UUIDs in one operation and is the recommended setup.
