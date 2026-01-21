import { describe, it, expect } from 'vitest';
import { supabase } from './supabase';

describe('Supabase Connection & Auth', () => {
  it('should have Supabase URL and Key configured', () => {
    // These come from import.meta.env which Vite/Vitest should load from .env
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    expect(url).toBeDefined();
    expect(url).not.toBe('https://placeholder.supabase.co');
    expect(key).toBeDefined();
    expect(key).not.toBe('placeholder');
  });

  it('should connect to Supabase (Health Check)', async () => {
    // Attempt a simple query. Even if 401/Empty, it confirms connectivity.
    // We use a table we know exists: 'profiles'
    const { data, error, status } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // If status is 0, connection failed completely.
    // 200-299 is success.
    // 400-499 is client/auth error (but connected).
    // 500+ is server error.
    expect(status).not.toBe(0);
    
    if (error) {
      console.log('Connection test note:', error.message);
      // Even if RLS blocks, we consider "connection" successful if we got a response.
      // 401 Unauthorized or 403 Forbidden means we reached the server.
    }
  });

  it('should handle login attempts (Auth Service Reachability)', async () => {
    // Attempt login with invalid credentials to verify Auth service is reachable
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'nonexistent_test_user@example.com',
      password: 'wrongpassword123'
    });

    expect(error).toBeDefined();
    expect(error?.status).not.toBe(0); // Should receive a response
    // Supabase usually returns 400 for invalid credentials
    expect(data.user).toBeNull();
    console.log('Auth response:', error?.message);
  });
});
