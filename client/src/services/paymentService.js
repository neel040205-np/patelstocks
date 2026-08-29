import authService from './authService';

const BASE_URL = import.meta.env.VITE_API_URL || '';

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
};

export default paymentService;
