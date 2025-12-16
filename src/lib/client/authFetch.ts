/**
 * Authenticated fetch wrapper for admin routes
 * Automatically adds Firebase ID token to Authorization header
 */

import { getAuth } from 'firebase/auth';
import { getFirebaseApp } from '@/firebase/firebaseApp';

/**
 * Fetch with Firebase authentication
 * @param url - API endpoint
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    // Get current user and token
    const app = getFirebaseApp();
    const auth = getAuth(app);
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get fresh token (Firebase handles refresh automatically)
    const idToken = await user.getIdToken();

    // Update localStorage with fresh token
    localStorage.setItem('firebase_token', idToken);

    // Add Authorization header
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${idToken}`);

    // Make request
    return fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error('[authFetch] Error:', error);
    
    // If token refresh fails, redirect to login
    if ((error as any).code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection.');
    }
    
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
