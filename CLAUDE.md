<!-- supabase-migration-start -->
This project is being migrated to [Supabase](https://supabase.com) for auth and
database storage, with Netlify functions providing privileged server-side API
operations.

When working on backend behavior, keep browser code on the Supabase anon client
only and route service-role operations through `netlify/functions/*`. Never
expose `SUPABASE_SERVICE_ROLE_KEY`, Razorpay secrets, or Google OAuth secrets to
the Vite client.

Legacy Convex files may still exist during migration, but the active app path is
Supabase + Netlify unless the user explicitly asks to restore Convex.
<!-- supabase-migration-end -->
