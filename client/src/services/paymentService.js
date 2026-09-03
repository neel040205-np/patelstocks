import authService from './authService';

const rawBase = import.meta.env.VITE_API_URL || '';
const BASE_URL = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

const paymentService = {
  // Client API
  getClientPayments: async () => {
    const token = authService.getToken();
    const response = await fetch(`${BASE_URL}/api/client/payments`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch payments');
    }
    return data;
  },

  // Admin API
  addClientPayment: async (clientId, paymentData) => {
    const token = authService.getToken();
    const response = await fetch(`${BASE_URL}/api/admin/clients/${clientId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add payment record');
    }
    return data;
  },

  updateClientPayment: async (paymentId, paymentData) => {
    const token = authService.getToken();
    const response = await fetch(`${BASE_URL}/api/admin/payments/${paymentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update payment record');
    }
    return data;
  },

  deleteClientPayment: async (paymentId) => {
    const token = authService.getToken();
    const response = await fetch(`${BASE_URL}/api/admin/payments/${paymentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete payment record');
    }
    return data;
  },
};

export default paymentService;
