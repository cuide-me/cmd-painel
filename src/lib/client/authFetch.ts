/**
 * Authenticated fetch wrapper for admin routes
 * Uses Firebase ID token from authenticated admin session
 */

import { getFirebaseAuth } from '@/firebase/firebaseApp';

/**
 * Fetch with simple authentication
 * @param url - API endpoint
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const idToken = await currentUser.getIdToken();

    // Add auth headers
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${idToken}`);

    // Make request
    return fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error('[authFetch] Error:', error);
    throw error;
  }
}

/**
 * Authenticated fetch with JSON response
 */
export async function authFetchJson<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await authFetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}
