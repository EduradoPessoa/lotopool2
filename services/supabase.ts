import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Inicializando Supabase Client...');
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRÍTICO: Supabase URL ou Key não encontradas!');
} else {
  console.log('Supabase URL detectada:', supabaseUrl.substring(0, 15) + '...');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
