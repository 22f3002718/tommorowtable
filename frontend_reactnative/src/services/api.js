import axios from 'axios';
import { API_URL } from '../config/api';

// Restaurants
export const getRestaurants = async () => {
  const response = await axios.get(`${API_URL}/restaurants`);
  return response.data;
};

export const getRestaurant = async (id) => {
  const response = await axios.get(`${API_URL}/restaurants/${id}`);
  return response.data;
};

export const getMenuItems = async (restaurantId) => {
  const response = await axios.get(`${API_URL}/restaurants/${restaurantId}/menu`);
  return response.data;
};

// Orders
export const createOrder = async (orderData) => {
  const response = await axios.post(`${API_URL}/orders`, orderData);
  return response.data;
};

export const getMyOrders = async () => {
  const response = await axios.get(`${API_URL}/orders/my-orders`);
  return response.data;
};

export const getOrderById = async (orderId) => {
  const response = await axios.get(`${API_URL}/orders/${orderId}`);
  return response.data;
};

export const rateOrder = async (orderId, rating, review) => {
  const response = await axios.post(`${API_URL}/orders/${orderId}/rate`, {
    rating,
    review,
  });
  return response.data;
};

// Wallet
export const getWalletBalance = async () => {
  const response = await axios.get(`${API_URL}/wallet/balance`);
  return response.data;
};

export const getWalletTransactions = async () => {
  const response = await axios.get(`${API_URL}/wallet/transactions`);
  return response.data;
};

export const addMoneyToWallet = async (amount) => {
  const response = await axios.post(`${API_URL}/wallet/add-money`, {
    amount,
  });
  return response.data;
};

// Location
export const updateLocation = async (address, latitude, longitude, houseNumber, buildingName) => {
  const data = {
    address,
    latitude,
    longitude,
  };
  if (houseNumber) data.house_number = houseNumber;
  if (buildingName) data.building_name = buildingName;
  
  const response = await axios.patch(`${API_URL}/auth/update-location`, data);
  return response.data;
};

// Push Notifications
export const registerPushToken = async (pushToken, platform) => {
  const response = await axios.post(`${API_URL}/auth/register-push-token`, {
    push_token: pushToken,
    platform,
  });
  return response.data;
};

// Vendor APIs
export const getVendorOrders = async () => {
  const response = await axios.get(`${API_URL}/vendor/orders`);
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await axios.patch(`${API_URL}/vendor/orders/${orderId}/status`, {
    status,
  });
  return response.data;
};

export const getVendorRestaurant = async () => {
  const response = await axios.get(`${API_URL}/vendor/restaurant`);
  return response.data;
};

export const updateRestaurantImage = async (imageUrl) => {
  const response = await axios.patch(`${API_URL}/vendor/restaurant/image`, {
    image_url: imageUrl,
  });
  return response.data;
};

// Rider APIs
export const getRiderOrders = async () => {
  const response = await axios.get(`${API_URL}/rider/orders`);
  return response.data;
};

export const updateDeliveryStatus = async (orderId, status) => {
  const response = await axios.patch(`${API_URL}/rider/orders/${orderId}/status`, {
    status,
  });
  return response.data;
};