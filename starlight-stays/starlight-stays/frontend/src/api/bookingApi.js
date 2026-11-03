import axiosClient from './axiosClient';

export const bookingApi = {
  createBooking: async (bookingData) => {
    const response = await axiosClient.post('/api/bookings', bookingData);
    return response.data;
  },

  getAllBookings: async () => {
    const response = await axiosClient.get('/api/bookings');
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await axiosClient.get(`/api/bookings/${id}`);
    return response.data;
  },

  getBookingsByUser: async (userId) => {
    const response = await axiosClient.get(`/api/bookings/user/${userId}`);
    return response.data;
  },

  cancelBooking: async (id) => {
    const response = await axiosClient.put(`/api/bookings/${id}/cancel`);
    return response.data;
  },

  checkAvailability: async (roomId, checkIn, checkOut) => {
    const response = await axiosClient.get('/api/bookings/availability', {
      params: { roomId, checkIn, checkOut },
    });
    return response.data;
  },
};
