import axiosClient from './axiosClient';

export const hotelApi = {
  getAllHotels: async () => {
    const response = await axiosClient.get('/api/hotels');
    return response.data;
  },

  getHotelById: async (id) => {
    const response = await axiosClient.get(`/api/hotels/${id}`);
    return response.data;
  },

  getHotelsByLocation: async (location) => {
    const response = await axiosClient.get(`/api/hotels/location/${encodeURIComponent(location)}`);
    return response.data;
  },

  addHotel: async (hotelData) => {
    const response = await axiosClient.post('/api/hotels', hotelData);
    return response.data;
  },

  deleteHotel: async (id) => {
    const response = await axiosClient.delete(`/api/hotels/${id}`);
    return response.data;
  },
};
