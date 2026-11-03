import axiosClient from './axiosClient';

export const roomApi = {
  getAllRooms: async () => {
    const response = await axiosClient.get('/api/rooms');
    return response.data;
  },

  getRoomById: async (id) => {
    const response = await axiosClient.get(`/api/rooms/${id}`);
    return response.data;
  },

  getRoomsByHotel: async (hotelId) => {
    const response = await axiosClient.get(`/api/rooms/hotel/${hotelId}`);
    return response.data;
  },

  getAvailableRooms: async (hotelId) => {
    const response = await axiosClient.get(`/api/rooms/hotel/${hotelId}/available`);
    return response.data;
  },

  addRoom: async (roomData) => {
    const response = await axiosClient.post('/api/rooms', roomData);
    return response.data;
  },

  deleteRoom: async (id) => {
    const response = await axiosClient.delete(`/api/rooms/${id}`);
    return response.data;
  },
};
