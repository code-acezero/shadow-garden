import { supabase } from '@/lib/supabase';

export interface AdminActionResult<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
}

/**
 * Dispatches an authenticated administrative mutation through the secure server backend.
 * Uses SUPABASE_SERVICE_ROLE_KEY on the server to reliably bypass Row Level Security.
 */
export async function executeAdminAction<T = any>(action: string, payload: any = {}): Promise<T> {
  // 1. Retrieve current authenticated user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Guild Master session expired or unauthenticated. Please sign in again.');
  }

  // 2. Transmit command to secure admin route
  const res = await fetch('/api/admin/action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ action, payload })
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error || `Server responded with status ${res.status}`);
  }

  return json.data as T;
}

