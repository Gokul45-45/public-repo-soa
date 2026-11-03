import axiosClient from './axiosClient';

export const authApi = {
  // Returns raw JWT string from UserController.login
  login: async (credentials) => {
    const response = await axiosClient.post('/api/users/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await axiosClient.post('/api/users/register', userData);
    return response.data;
  },

  getUserById: async (id) => {
    const response = await axiosClient.get(`/api/users/${id}`);
    return response.data;
  },

  getAllUsers: async () => {
    const response = await axiosClient.get('/api/users');
    return response.data;
  },
};
