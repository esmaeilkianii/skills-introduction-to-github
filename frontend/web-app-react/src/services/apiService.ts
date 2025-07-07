import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const loginUser = (credentials: any) => {
  return apiClient.post('/auth/login', credentials);
};

export const registerUser = (userData: any) => {
  return apiClient.post('/auth/register', userData);
};

export const getUserProfile = () => {
  return apiClient.get('/auth/users/me/profile');
};

// Document endpoints
export const uploadDocument = (formData: FormData) => {
  return apiClient.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getDocuments = () => {
  return apiClient.get('/documents');
};

export const getDocumentDetails = (docId: string | number) => {
  return apiClient.get(`/documents/${docId}`);
};

export const downloadDocument = (docId: string | number, versionNumber?: string | number) => {
  let url = `/documents/${docId}/download`;
  if (versionNumber) {
    url = `/documents/${docId}/versions/${versionNumber}/download`;
  }
  return apiClient.get(url, {
    responseType: 'blob', // Important for file downloads
  });
};

export default apiClient;
