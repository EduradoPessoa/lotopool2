
import { supabase } from './services/supabase';

async function checkDb() {
  console.log('Checking database structure...');

  const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(1);
  console.log('Profiles table:', pError ? pError.message : 'OK');

  const { data: participants, error: paError } = await supabase.from('participants').select('*').limit(1);
  console.log('Participants table:', paError ? paError.message : 'OK');

  // Test insert into profiles manually to see if it works (RLS might block this from client, but error message will be different)
  // actually we can't insert into profiles due to RLS policies I set (users can view/update own, but trigger creates)
  // But we can check if we can read.

  // Check if roles check constraint is valid? Hard to check from client.
}

checkDb();
