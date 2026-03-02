/**
 * Authenticated fetch wrapper for admin routes
 * Uses session token from login
 */

/**
 * Fetch with simple authentication
 * @param url - API endpoint
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    // Verificação de login
    const isLogged = localStorage.getItem('admin_logged') === 'true';
    const sessionToken = localStorage.getItem('admin_session_token');

    if (!isLogged) {
      throw new Error('User not authenticated');
    }

    // Add auth headers
    const headers = new Headers(options.headers);
    headers.set('X-Admin-Auth', 'authenticated');
    if (sessionToken) {
      headers.set('Authorization', `Bearer ${sessionToken}`);
    }

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
