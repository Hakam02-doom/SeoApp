/**
 * Client-side API utilities for making authenticated requests
 */

// Use relative URLs for client-side requests to avoid CORS and connection issues
const API_BASE_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000');

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  code?: string;
  details?: any;
}

export interface APIRequestOptions extends RequestInit {
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: APIRequestOptions = {}
): Promise<APIResponse<T>> {
  const { showErrorToast = true, showSuccessToast = false, successMessage, ...fetchOptions } = options;
  
  try {
    // Use relative URL for client-side requests
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      credentials: 'include',
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    let data: any;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      // Try to parse as JSON, fallback to text
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text || 'Request failed', code: 'INVALID_RESPONSE' };
      }
    }

    if (!response.ok) {
      const errorResponse: APIResponse<T> = {
        error: data.error || 'Request failed',
        code: data.code,
        details: data.details,
      };

      // Show error toast if enabled
      if (showErrorToast && typeof window !== 'undefined') {
        try {
          const { handleAPIError } = await import('./utils/toast');
          handleAPIError(errorResponse);
        } catch (e) {
          // Toast not available, just log
          console.error('API Error:', errorResponse);
        }
      }

      return errorResponse;
    }

    // Show success toast if enabled
    if (showSuccessToast && typeof window !== 'undefined' && successMessage) {
      try {
        const { showSuccess } = await import('./utils/toast');
        showSuccess(successMessage);
      } catch (e) {
        // Toast not available, just log
        console.log('Success:', successMessage);
      }
    }

    return { data };
  } catch (error: any) {
    const errorResponse: APIResponse<T> = {
      error: error.message || 'Network error',
      code: 'NETWORK_ERROR',
    };

    // Show error toast if enabled
    if (showErrorToast && typeof window !== 'undefined') {
      try {
        const { handleAPIError } = await import('./utils/toast');
        handleAPIError(errorResponse);
      } catch (e) {
        // Toast not available, just log
        console.error('Network Error:', errorResponse);
      }
    }

    return errorResponse;
  }
}

/**
 * GET request
 */
export async function apiGet<T = any>(endpoint: string): Promise<APIResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function apiPost<T = any>(endpoint: string, body?: any, options?: APIRequestOptions): Promise<APIResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
}

/**
 * PUT request
 */
export async function apiPut<T = any>(endpoint: string, body?: any): Promise<APIResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(endpoint: string): Promise<APIResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

/**
 * PATCH request
 */
export async function apiPatch<T = any>(endpoint: string, body?: any): Promise<APIResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

