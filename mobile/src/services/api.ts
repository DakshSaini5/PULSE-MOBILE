import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn("CRITICAL: EXPO_PUBLIC_API_URL is not set in environment.");
}
const BASE_URL = process.env.EXPO_PUBLIC_API_URL as string;
console.log('[API] Base URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('pulse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Strict network error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('[API] ❌ TIMEOUT:', error.config?.url);
    } else if (!error.response) {
      console.error('[API] ❌ NETWORK DROP - No response from server:', error.config?.url, error.message);
    } else {
      console.error(`[API] ❌ ${error.response.status} on ${error.config?.url}:`, error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;

export interface Hospital {
  id: string;
  name: string;
  [key: string]: any;
}
export interface Review { [key: string]: any; }
export interface PrescriptionAnalysis { [key: string]: any; }
export interface Prescription { [key: string]: any; }
export interface MedicalReportValue { [key: string]: any; }
export interface SpecialistRecommendation { [key: string]: any; }
export interface MedicalReport { [key: string]: any; }
export interface HealthTrend { [key: string]: any; }
export interface HealthInsight { [key: string]: any; }
export interface AdminStats { [key: string]: any; }
export interface Notification { [key: string]: any; }
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  age?: number;
  gender?: string;
  weight?: string;
  bloodGroup?: string;
  medicalConditions?: string;
  _count: {
    prescriptions: number;
    medicalReports: number;
  };
}
export interface EmergencyContact { [key: string]: any; }

export const authAPI = {
  login: async (identifier: string, password: string) => {
    const res = await api.post('/api/auth/login', { identifier, password });
    if (res.data.token) {
      await SecureStore.setItemAsync('pulse_token', res.data.token);
      if (res.data.refreshToken) await SecureStore.setItemAsync('pulse_refresh_token', res.data.refreshToken);
      await SecureStore.setItemAsync('pulse_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  sendRegisterOTP: async (email: string) => {
    const res = await api.post('/api/auth/register-otp', { email });
    return res.data;
  },
  register: async (name: string, email: string, mobileNumber: string, password: string, code: string) => {
    const res = await api.post('/api/auth/register', { name, email, mobileNumber, password, code });
    if (res.data.token) {
      await SecureStore.setItemAsync('pulse_token', res.data.token);
      await SecureStore.setItemAsync('pulse_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  sendForgotPasswordOTP: async (identifier: string) => {
    const res = await api.post('/api/auth/forgot-password-otp', { identifier });
    return res.data;
  },
  resetPassword: async (data: { newPassword: string; resetToken?: string; identifier?: string; code?: string }) => {
    const res = await api.post('/api/auth/reset-password', data);
    return res.data;
  },
  verifyToken: async () => {
    const res = await api.get('/api/auth/me');
    return res.data;
  },
  requestEmailOTP: async (email: string) => {
    const res = await api.post('/api/auth/request-email-otp', { email });
    return res.data;
  },
  verifyEmailOTP: async (email: string, code: string) => {
    const res = await api.post('/api/auth/verify-email-otp', { email, code });
    return res.data;
  },
  logout: async () => {
    try { await api.post('/api/auth/logout'); } catch (e) {}
    await SecureStore.deleteItemAsync('pulse_token');
    await SecureStore.deleteItemAsync('pulse_refresh_token');
    await SecureStore.deleteItemAsync('pulse_user');
  },
  getCurrentUser: async () => {
    const user = await SecureStore.getItemAsync('pulse_user');
    return user ? JSON.parse(user) : null;
  }
};

export const hospitalAPI = {
  search: async (q?: string, specialty?: string, radius?: number, lat?: number, lng?: number, city?: string) => {
    const res = await api.get('/api/hospitals/search', { params: { q, specialty, radius, lat, lng, city } });
    return res.data as Hospital[];
  },
  autocomplete: async (q: string, lat?: number, lng?: number, city?: string) => {
    const res = await api.get('/api/hospitals/autocomplete', { params: { q, lat, lng, city } });
    return res.data as { hospitals: Array<{ id: string; name: string }>; specialties: Array<{ name: string }> };
  },
  getById: async (id: string, lat?: number, lng?: number) => {
    const res = await api.get(`/api/hospitals/${id}`, { params: { lat, lng } });
    return res.data as Hospital;
  },
  compare: async (ids: string[], lat?: number, lng?: number) => {
    const res = await api.get(`/api/hospitals/compare`, { params: { ids: ids.join(','), lat, lng } });
    return res.data as Hospital[];
  },
  save: async (id: string) => {
    const res = await api.post(`/api/hospitals/${id}/save`);
    return res.data;
  },
  unsave: async (id: string) => {
    const res = await api.delete(`/api/hospitals/${id}/save`);
    return res.data;
  },
  getSaved: async (lat?: number, lng?: number) => {
    const res = await api.get('/api/hospitals/saved', { params: { lat, lng } });
    return res.data as Hospital[];
  },
  getReviews: async (id: string, page: number = 1, limit: number = 10) => {
    const res = await api.get(`/api/hospitals/${id}/reviews`, { params: { page, limit } });
    return res.data as { reviews: Review[], pagination: { total: number, page: number, pages: number } };
  },
  postReview: async (id: string, rating: number, reviewText: string) => {
    const res = await api.post(`/api/hospitals/${id}/reviews`, { rating, reviewText });
    return res.data as Review;
  },
  addHospital: async (data: any) => {
    const res = await api.post('/api/hospitals', data);
    return res.data as Hospital;
  },
};

export const geocodingAPI = {
  geocode: async (params: { street?: string; city?: string; state?: string; pincode?: string; q?: string }) => {
    const res = await api.get('/api/geocoding/geocode', { params });
    return res.data as { latitude: number; longitude: number; label: string; city: string; state: string; };
  },
};

export const prescriptionAPI = {
  upload: async (formData: FormData) => {
    const res = await api.post('/api/prescriptions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });
    return res.data as Prescription;
  },
  verify: async (id: string, verifiedData: any) => {
    const res = await api.post(`/api/prescriptions/${id}/verify`, { verifiedData }, { timeout: 60000 });
    return res.data as Prescription;
  },
  getAll: async () => {
    const res = await api.get('/api/prescriptions');
    return res.data.data as Prescription[];
  },
  getById: async (id: string) => {
    const res = await api.get(`/api/prescriptions/${id}`);
    return res.data as Prescription;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/api/prescriptions/${id}`);
    return res.data;
  },
  checkInteractions: async () => {
    const res = await api.get<{ interactions: string; severity: string; medicinesChecked: number }>('/api/prescriptions/interactions');
    return res.data;
  }
};

export const reportAPI = {
  upload: async (formData: FormData) => {
    const res = await api.post('/api/reports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });
    return res.data as MedicalReport;
  },
  verify: async (id: string, verifiedData: any) => {
    const res = await api.post(`/api/reports/${id}/verify`, { verifiedData }, { timeout: 60000 });
    return res.data as MedicalReport;
  },
  getAll: async (page = 1, limit = 10) => {
    const res = await api.get(`/api/reports?page=${page}&limit=${limit}`);
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/api/reports/${id}`);
    return res.data as MedicalReport;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/api/reports/${id}`);
    return res.data;
  },
  getRiskAssessment: async () => {
    const res = await api.get<{ score: number; summary: string; biomarkersAnalyzed: number }>('/api/reports/risk-assessment');
    return res.data;
  }
};

export const trendAPI = {
  getTrends: async () => {
    const res = await api.get('/api/trends');
    return res.data as HealthTrend[];
  },
  getInsights: async () => {
    const res = await api.get('/api/trends/insights');
    return res.data as HealthInsight[];
  },
};

export const notificationAPI = {
  getAll: async () => {
    const res = await api.get('/api/notifications');
    return res.data as Notification[];
  },
  getUnreadCount: async () => {
    const res = await api.get('/api/notifications/unread-count');
    return res.data.count as number;
  },
  markAsRead: async (id: string) => {
    const res = await api.patch(`/api/notifications/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await api.patch('/api/notifications/read-all');
    return res.data;
  },
};

export const adminAPI = {
  getStats: async () => {
    const res = await api.get('/api/admin/stats');
    return res.data as AdminStats;
  },
};

export const userAPI = {
  getProfile: async () => {
    const res = await api.get('/api/user/profile');
    return res.data as UserProfile;
  },
  updateProfile: async (data: { name?: string; age?: string; gender?: string; weight?: string; bloodGroup?: string; medicalConditions?: string }) => {
    const res = await api.put('/api/user/profile', data);
    return res.data;
  },
  requestEmailChange: async (newEmail: string) => {
    const res = await api.post('/api/user/request-email-change', { newEmail });
    return res.data as { message: string };
  },
  confirmEmailChange: async (newEmail: string, code: string) => {
    const res = await api.post('/api/user/confirm-email-change', { newEmail, code });
    return res.data as { message: string; user: any };
  },
  changePassword: async (data: any) => {
    const res = await api.post('/api/user/change-password', data);
    return res.data;
  },
  deleteAccount: async () => {
    const res = await api.delete('/api/user/account');
    return res.data;
  },
};

export const emergencyAPI = {
  getContacts: async () => {
    const res = await api.get('/api/emergency/contacts');
    return res.data as EmergencyContact[];
  },
  addContact: async (data: { name: string; phoneNumber: string; relationship: string }) => {
    const res = await api.post('/api/emergency/contacts', data);
    return res.data as EmergencyContact;
  },
  deleteContact: async (id: string) => {
    const res = await api.delete(`/api/emergency/contacts/${id}`);
    return res.data;
  },
  triggerPanic: async (lat?: number, lng?: number) => {
    const res = await api.post('/api/emergency/panic', { lat, lng });
    return res.data as { message: string, results: any[], simulated: boolean };
  },
};

export const chatAPI = {
  sendMessage: async (message: string) => {
    const res = await api.post('/api/chat', { message });
    return res.data.reply as string;
  },
};

export const dashboardAPI = {
  getSummary: async () => {
    const res = await api.get('/api/dashboard/summary');
    return res.data;
  }
};
