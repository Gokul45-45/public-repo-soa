import axiosClient from './axiosClient';

export const paymentApi = {
  getAllPayments: async () => {
    const response = await axiosClient.get('/api/payments');
    return response.data;
  },

  getPaymentById: async (id) => {
    const response = await axiosClient.get(`/api/payments/${id}`);
    return response.data;
  },

  getPaymentsByBooking: async (bookingId) => {
    const response = await axiosClient.get(`/api/payments/booking/${bookingId}`);
    return response.data;
  },

  getPaymentsByUser: async (userId) => {
    const response = await axiosClient.get(`/api/payments/user/${userId}`);
    return response.data;
  },

  refundPayment: async (id) => {
    const response = await axiosClient.put(`/api/payments/${id}/refund`);
    return response.data;
  },
};
