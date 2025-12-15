import { handleApiError, errorService } from './errorService';
import { retryWithBackoff } from './utils';

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retries: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || '';
    this.timeout = config.timeout || 10000;
    this.retries = config.retries || 3;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    context?: string
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await retryWithBackoff(async () => {
        const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
        
        const requestOptions: RequestInit = {
          ...options,
          headers: {
            ...this.defaultHeaders,
            ...options.headers,
          },
          signal: controller.signal,
        };

        const response = await fetch(fullUrl, requestOptions);
        
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: response.statusText };
          }
          throw handleApiError(response, errorData);
        }

        return response;
      }, this.retries);

      clearTimeout(timeoutId);

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return null as T;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = errorService.createError(
          'Request timeout',
          'TIMEOUT_ERROR',
          408
        );
        errorService.logError(timeoutError, context);
        throw timeoutError;
      }

      errorService.logError(error as Error, context);
      throw error;
    }
  }

  async get<T>(url: string, options: RequestInit = {}, context?: string): Promise<T> {
    return this.makeRequest<T>(url, { ...options, method: 'GET' }, context);
  }

  async post<T>(
    url: string,
    data?: any,
    options: RequestInit = {},
    context?: string
  ): Promise<T> {
    return this.makeRequest<T>(
      url,
      {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      context
    );
  }

  async put<T>(
    url: string,
    data?: any,
    options: RequestInit = {},
    context?: string
  ): Promise<T> {
    return this.makeRequest<T>(
      url,
      {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      context
    );
  }

  async patch<T>(
    url: string,
    data?: any,
    options: RequestInit = {},
    context?: string
  ): Promise<T> {
    return this.makeRequest<T>(
      url,
      {
        ...options,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      context
    );
  }

  async delete<T>(url: string, options: RequestInit = {}, context?: string): Promise<T> {
    return this.makeRequest<T>(url, { ...options, method: 'DELETE' }, context);
  }

  // File upload with progress
  async uploadFile<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    context?: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch {
            resolve(null as T);
          }
        } else {
          const error = handleApiError(
            { status: xhr.status, statusText: xhr.statusText } as Response,
            { message: xhr.responseText }
          );
          errorService.logError(error, context);
          reject(error);
        }
      });

      xhr.addEventListener('error', () => {
        const error = errorService.createNetworkError('File upload failed');
        errorService.logError(error, context);
        reject(error);
      });

      xhr.addEventListener('timeout', () => {
        const error = errorService.createError('Upload timeout', 'TIMEOUT_ERROR', 408);
        errorService.logError(error, context);
        reject(error);
      });

      xhr.timeout = this.timeout;
      xhr.open('POST', url.startsWith('http') ? url : `${this.baseURL}${url}`);
      
      // Add default headers except Content-Type (let browser set it for FormData)
      Object.entries(this.defaultHeaders).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'content-type') {
          xhr.setRequestHeader(key, value);
        }
      });

      xhr.send(formData);
    });
  }

  // Set authorization header
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Remove authorization header
  clearAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }

  // Update base URL
  setBaseURL(baseURL: string) {
    this.baseURL = baseURL;
  }
}

// Default API client instance
export const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
});

// Supabase API client with specific configuration
export const supabaseApiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  headers: {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
});