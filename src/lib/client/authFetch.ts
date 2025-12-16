/**
 * Authenticated fetch wrapper for admin routes
 * Simple authentication without Firebase
 */

/**
 * Fetch with simple authentication
 * @param url - API endpoint
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    // Verificação simples
    const isLogged = localStorage.getItem('admin_logged') === 'true';

    if (!isLogged) {
      throw new Error('User not authenticated');
    }

    // Add simple auth header with password
    const headers = new Headers(options.headers);
    headers.set('X-Admin-Auth', 'authenticated');
    headers.set('x-admin-password', 'cuideme@admin321'); // Senha simples

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
