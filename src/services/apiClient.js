/**
 * AquaManage — Centralized Local API Client
 * Sends authenticated requests to the local Express backend (via Vite proxy /api).
 */

const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const config = {
    ...options,
    credentials: 'include', // send session cookie
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
  };

  // If body is JSON object, stringify and set header
  if (config.body && !(config.body instanceof FormData) && typeof config.body === 'object') {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch {
    throw new ApiError(
      'Unable to connect to AquaManage local backend server. Please verify the Express backend is running on port 4000.',
      0
    );
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, data);
  }

  return data;
}

export const apiClient = {
  get(endpoint, options = {}) {
    return request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, body, options = {}) {
    return request(endpoint, { ...options, method: 'POST', body });
  },

  patch(endpoint, body, options = {}) {
    return request(endpoint, { ...options, method: 'PATCH', body });
  },

  delete(endpoint, options = {}) {
    return request(endpoint, { ...options, method: 'DELETE' });
  },

  // Multipart form data upload helper
  upload(endpoint, formData, options = {}) {
    return request(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    });
  },
};

export default apiClient;
