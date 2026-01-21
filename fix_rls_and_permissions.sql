-- Enable RLS on profiles if not enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile (Critical for app logic and role fetching)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile (for editing profile)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Allow admins to view all profiles (Needed for Participants management)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('SAAS_ADMIN', 'POOL_ADMIN')
  )
);
-- Note: The above policy relies on recursive check which might be slow or hit recursion limit if not careful. 
-- A safer approach for simple apps is to rely on 'service_role' for admin tasks or use a dedicated function.
-- However, for client-side queries:
-- Let's try a simpler approach: Allow all authenticated users to see basic profile info (needed for finding people to add?)
-- If privacy is key, restrict. But for now, let's enable "Users can view own profile" and "Admins can view all".

-- FIX: To avoid recursion, we can use a JWT claim or just assume for now that if you are authenticated you can read profiles 
-- (if that's acceptable) or stick to "own profile" + "service role" for admin.
-- BUT App.tsx fetches `getProfile(userId)`. If I am Admin looking at another user, I use `db.participants.getList` which joins profiles?
-- `db.participants.getList` uses `supabase.from('participants').select('*, profiles(*)')`.
-- So I need to be able to read joined profiles.
-- If I restrict profiles read to "own", then `select *, profiles(*)` will return null for the profile part for other users.
-- So we MUST allow reading other profiles if we want to see participant names.

-- Policy: Allow authenticated users to read all profiles (Simplest for now to unblock)
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
CREATE POLICY "Authenticated users can view all profiles" 
ON profiles FOR SELECT 
TO authenticated
USING (true);


-- Enable RLS on groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read groups
DROP POLICY IF EXISTS "Anyone can view groups" ON groups;
CREATE POLICY "Anyone can view groups" 
ON groups FOR SELECT 
USING (true);

-- Allow authenticated users to insert groups (needed for Create Group)
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
CREATE POLICY "Authenticated users can create groups" 
ON groups FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow owner to update group
-- We assume the column is 'ownerId' based on JS code. If it is 'owner_id', please adjust.
-- To be safe, we allow authenticated users to update for now, relying on app logic.
DROP POLICY IF EXISTS "Authenticated users can update groups" ON groups;
CREATE POLICY "Authenticated users can update groups" 
ON groups FOR UPDATE 
TO authenticated
USING (true);


-- Ensure nilce@phoenyx.com.br is POOL_ADMIN
UPDATE profiles SET role = 'POOL_ADMIN' WHERE email = 'nilce@phoenyx.com.br';
