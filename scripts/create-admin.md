# Creating Your First Admin User

Since you've successfully set up the database, you need to create your first admin user.

## Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Enter email and password
4. Click "Create user"
5. Copy the User ID that was created

6. Go to Table Editor → profiles table
7. Click "Insert" → "Insert row"
8. Fill in:
   - `id`: paste the User ID from step 5
   - `email`: same email as step 3
   - `full_name`: your name
   - `phone`: your phone number
   - `role`: **admin** (important!)
9. Click "Save"

## Option 2: Via SQL Editor

```sql
-- First, create the auth user (replace with your email/password)
-- Note: This is just a reference - you'll need to do this via the Dashboard

-- Then, insert into profiles table
INSERT INTO profiles (id, email, full_name, phone, role)
VALUES (
  'your-user-id-from-auth',
  'admin@wingside.com',
  'Admin User',
  '+234 800 000 0000',
  'admin'
);
```

## Option 3: Sign Up and Update

1. Start your dev server: `npm run dev`
2. Go to http://localhost:3000/signup
3. Sign up with your email
4. Go to Supabase Dashboard → Table Editor → profiles
5. Find your profile and change `role` from 'customer' to 'admin'
6. Refresh the page and you'll have admin access

## After Creating Admin User

Test your admin access:
1. Go to http://localhost:3000/login
2. Login with your admin credentials
3. You should be redirected to /admin
4. Check the dashboard and orders page

## Security Note

Keep your admin credentials secure! The service role key in .env.local has full database access.
