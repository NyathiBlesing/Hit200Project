import axios from "axios";

// Base URLs
const BASE_URL = "http://127.0.0.1:8000/api/";

// Axios instance with default headers
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000, 
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Add a request interceptor to include the Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if this is a public route (signup, login)
    const isPublicRoute = originalRequest.url.includes('/auth/signup/') || 
                         originalRequest.url.includes('/auth/login/') ||
                         originalRequest.url.includes('/auth/setup-account/');

    if (error.response?.status === 401 && !originalRequest._retry && !isPublicRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(`${BASE_URL}token/refresh/`, {
          refresh: refreshToken,
        });

        localStorage.setItem("access_token", response.data.access);
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${response.data.access}`;
        processQueue();
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        console.error("Failed to refresh token:", refreshError);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error("Response error:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Request error:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error:", error.message);
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error, customMessage) => {
  if (error.response) {
    // Server responded with error
    const message = error.response.data?.message || error.response.data?.detail || customMessage;
    throw new Error(message);
  } else if (error.request) {
    // Request made but no response
    throw new Error("No response from server. Please check your connection.");
  } else {
    // Other errors
    throw new Error(error.message || customMessage);
  }
};

// Devices API
export const deviceAPI = {
  getDevices: async () => {
    try {
      // Always include cleared devices in the list
      const response = await axiosInstance.get('devices/?include_cleared=true');
      return response.data;
    } catch (error) {
      console.error('Error fetching devices:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch devices');
    }
  },

  getAssignedDevices: async (userId) => {
    try {
      const response = await axiosInstance.get(`devices/assigned/${userId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch assigned devices. Please try again later.");
    }
  },

  addDevice: async (device) => {
    try {
      const response = await axiosInstance.post("devices/", device);
      return response.data;
    } catch (error) {
      handleApiError(error, "Failed to add device. Please try again.");
    }
  },

  updateDevice: async (deviceId, deviceData) => {
    try {
      const response = await axiosInstance.patch(`devices/${deviceId}/`, deviceData);
      return response.data;
    } catch (error) {
      console.error('Error updating device:', error);
      throw new Error(error.response?.data?.error || 'Failed to update device');
    }
  },

  deleteDevice: async (id) => {
    try {
      await axiosInstance.delete(`devices/${id}/`);
    } catch (error) {
      handleApiError(error, "Failed to delete device. Please try again.");
    }
  },

  createDevice: async (deviceData) => {
    try {
      const response = await axiosInstance.post('devices/', deviceData);
      return response.data;
    } catch (error) {
      console.error('Error creating device:', error);
      throw new Error(error.response?.data?.error || 'Failed to create device');
    }
  },

  clearDevice: async (deviceId, clearanceData) => {
    try {
      const response = await axiosInstance.post(`devices/${deviceId}/clear_device/`, clearanceData);
      return response.data;
    } catch (error) {
      console.error('Error clearing device:', error);
      throw new Error(error.response?.data?.error || 'Failed to clear device');
    }
  },

  getDeviceHistory: async (deviceId) => {
    try {
      const response = await axiosInstance.get(`devices/${deviceId}/history/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching device history:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch device history');
    }
  }
};

// Users API
export const userAPI = {
  getUsers: async () => {
    try {
      const response = await axiosInstance.get('users/');
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error('Error fetching users:', error.response.data);
        throw new Error(error.response.data.error || error.response.data.detail || 'Failed to fetch users');
      }
      console.error('Error fetching users:', error);
      throw new Error('Network error or server is not responding');
    }
  },

  getUserById: async (userId) => {
    try {
      const response = await axiosInstance.get(`users/${userId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch user data. Please try again later.");
    }
  },

  addUser: async (user) => {
    try {
      const response = await axiosInstance.post('users/', user);
      return response.data;
    } catch (error) {
      handleApiError(error, "Failed to add user. Please try again.");
    }
  },

  createUser: async (userData) => {
    try {
      const response = await axiosInstance.post('users/create/', userData);
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error('Error creating user:', error.response.data);
        throw new Error(error.response.data.error || error.response.data.detail || 'Failed to create user');
      }
      console.error('Error creating user:', error);
      throw new Error('Network error or server is not responding');
    }
  },

  updateUser: async (id, updatedUser) => {
    try {
      const response = await axiosInstance.put(`users/${id}/`, updatedUser);
      return response.data;
    } catch (error) {
      handleApiError(error, "Failed to update user. Please try again.");
    }
  },

  deleteUser: async (id) => {
    try {
      await axiosInstance.delete(`users/${id}/`);
    } catch (error) {
      handleApiError(error, "Failed to delete user. Please try again.");
    }
  },
};

// Issues API
export const issueAPI = {
  getIssues: async () => {
    try {
      const response = await axiosInstance.get("issues/");
      return response.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch issues. Please try again later.");
    }
  },

  createIssue: async (issueData) => {
    try {
      const response = await axiosInstance.post("issues/", {
        ...issueData,
        status: "Pending", // Set initial status
      });
      return response.data;
    } catch (error) {
      handleApiError(error, "Failed to create issue. Please try again.");
    }
  },

  updateIssue: async (id, updatedIssue) => {
    try {
      const response = await axiosInstance.patch(`issues/${id}/`, updatedIssue);
      return response.data;
    } catch (error) {
      handleApiError(error, "Failed to update issue. Please try again.");
    }
  },

  deleteIssue: async (id) => {
    try {
      await axiosInstance.delete(`issues/${id}/`);
    } catch (error) {
      handleApiError(error, "Failed to delete issue. Please try again.");
    }
  },

  getUserIssues: async (userId) => {
    try {
      const response = await axiosInstance.get(`issues/user/${userId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch user issues. Please try again later.");
    }
  },

  // New method to get issues by device
  getDeviceIssues: async (deviceId) => {
    try {
      const response = await axiosInstance.get(`issues/device/${deviceId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch device issues. Please try again later.");
    }
  },

  // New method to get assigned issues
  getAssignedIssues: async () => {
    try {
      const response = await axiosInstance.get("issues/assigned/");
      return response.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch assigned issues. Please try again later.");
    }
  },
};

// Maintenance API
export const maintenanceAPI = {
  getMaintenance: async () => {
    try {
      const response = await axiosInstance.get("maintenances/");
      return response.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch maintenance records. Please try again later.");
    }
  },

  scheduleMaintenance: async (maintenanceData) => {
    try {
      const response = await axiosInstance.post("maintenances/", maintenanceData);
      return response.data;
    } catch (error) {
      handleApiError(error, "Failed to schedule maintenance. Please try again.");
    }
  },

  updateMaintenance: async (id, maintenanceData) => {
    try {
      const response = await axiosInstance.patch(`maintenances/${id}/`, maintenanceData);
      return response.data;
    } catch (error) {
      handleApiError(error, "Failed to update maintenance record. Please try again.");
    }
  },

  deleteMaintenance: async (id) => {
    try {
      await axiosInstance.delete(`maintenances/${id}/`);
    } catch (error) {
      handleApiError(error, "Failed to delete maintenance record. Please try again.");
    }
  },

  getDeviceMaintenance: async (deviceId) => {
    try {
      const response = await axiosInstance.get(`maintenances/device/${deviceId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch device maintenance records. Please try again later.");
    }
  },

  getUpcomingMaintenance: async () => {
    try {
      const response = await axiosInstance.get("maintenances/upcoming/");
      return response.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch upcoming maintenance records. Please try again later.");
    }
  },
};

// Audit Logs API
export const auditLogAPI = {
  cleanup: async (data) => {
    try {
      const response = await axiosInstance.post('audit-logs/cleanup/', data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to cleanup audit logs');
    }
  },

  getLogs: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query parameters
      if (filters.startDate) {
        queryParams.append('start_date', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        queryParams.append('end_date', filters.endDate.toISOString());
      }
      if (filters.actionType) {
        queryParams.append('action', filters.actionType);
      }
      if (filters.resourceType) {
        queryParams.append('resource_type', filters.resourceType);
      }
      if (filters.status) {
        queryParams.append('status', filters.status);
      }

      const apiUrl = `audit-logs/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('Fetching audit logs from:', apiUrl);
      
      const response = await axiosInstance.get(apiUrl);
      console.log('Audit logs response:', response.data);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      // Transform the response data to include formatted timestamps and parsed changes
      const transformedLogs = response.data.map(log => ({
        ...log,
        timestamp: new Date(log.timestamp),
        changes: log.changes ? (typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes) : null
      }));
      
      return transformedLogs;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        throw new Error(error.response.data.error || 'Failed to fetch audit logs');
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response received from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error('Error setting up the request');
      }
    }
  },

  exportLogs: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query parameters
      if (filters.startDate) {
        queryParams.append('start_date', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        queryParams.append('end_date', filters.endDate.toISOString());
      }
      if (filters.actionType) {
        queryParams.append('action', filters.actionType);
      }
      if (filters.resourceType) {
        queryParams.append('resource_type', filters.resourceType);
      }
      if (filters.status) {
        queryParams.append('status', filters.status);
      }

      const apiUrl = `audit-logs/export/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await axiosInstance.get(apiUrl, {
        responseType: 'blob'
      });
      
      // Create a download link for the file
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return response.data;
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      if (error.response) {
        throw new Error(error.response.data.error || 'Failed to export audit logs');
      } else if (error.request) {
        throw new Error('No response received from server');
      } else {
        throw new Error('Error setting up the request');
      }
    }
  }
};

// Notifications API
export const notificationAPI = {
  getNotifications: async () => {
    try {
      const response = await axiosInstance.get("notifications/");
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch notifications');
    }
  },
  markAsRead: async (notificationId) => {
    try {
      const response = await axiosInstance.post(`notifications/${notificationId}/mark_as_read/`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error(error.response?.data?.error || 'Failed to mark notification as read');
    }
  },
  markAllAsRead: async () => {
    try {
      const response = await axiosInstance.post('notifications/mark_all_as_read/');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error(error.response?.data?.error || 'Failed to mark all notifications as read');
    }
  },
  clearAll: async () => {
    const response = await axiosInstance.delete('notifications/');
    return response.data;
  }
};

// Clearance API
export const clearanceAPI = {
  getLogs: async () => {
    try {
      const response = await axiosInstance.get('clearance-logs/');
      return response.data;
    } catch (error) {
      console.error('Error fetching clearance logs:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch clearance logs');
    }
  },
};

// Auth API
export const authAPI = {
  completeSetup: async (token, password) => {
    const response = await axios.post(`${BASE_URL}/api/auth/setup-account/`, {
      token,
      password,
    });
    return response.data;
  },


  signup: async (userData) => {
    const response = await axios.post(`${BASE_URL}auth/signup/`, userData);
    return response.data;
  },

  login: async (credentials) => {
    try {
      const response = await axios.post(`${BASE_URL}auth/login/`, credentials);
      return response.data;
    } catch (error) {
      handleApiError(error, "Login failed. Please check your credentials.");
    }
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("email");
    localStorage.removeItem("username");
    localStorage.removeItem("department");
    localStorage.removeItem("first_name");
    localStorage.removeItem("last_name");
    window.location.href = "/login";
  },

  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }
      const response = await axios.post(`${BASE_URL}token/refresh/`, {
        refresh: refreshToken,
      });
      localStorage.setItem("access_token", response.data.access);
      return response.data;
    } catch (error) {
      handleApiError(error, "Failed to refresh token. Please login again.");
    }
  }
};
