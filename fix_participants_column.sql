-- Fix column name in participants table to match the expected "profileId" (camelCase)
DO $$
BEGIN
  -- 1. Check if 'profileid' (lowercase) exists and rename it to "profileId"
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='participants' AND column_name='profileid') THEN
    ALTER TABLE public.participants RENAME COLUMN profileid TO "profileId";
  END IF;

  -- 2. Check if 'profile_id' (snake_case) exists and rename it to "profileId"
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='participants' AND column_name='profile_id') THEN
    ALTER TABLE public.participants RENAME COLUMN profile_id TO "profileId";
  END IF;

  -- 3. If "profileId" (camelCase) still doesn't exist, create it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='participants' AND column_name='profileId') THEN
    ALTER TABLE public.participants ADD COLUMN "profileId" UUID REFERENCES public.profiles(id);
  END IF;
END $$;
