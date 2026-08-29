import authService from './authService';

const rawBase = import.meta.env.VITE_API_URL || '';
const BASE_URL = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

const portfolioService = {
  // Client APIs
  getClientDashboard: async () => {
    const token = authService.getToken();
    const response = await fetch(`${BASE_URL}/api/client/dashboard`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch dashboard data');
    }
    return data;
  },

  getClientPortfolio: async () => {
    const token = authService.getToken();
    const response = await fetch(`${BASE_URL}/api/client/portfolio`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch portfolio data');
    }
    return data;
  },

  // Admin APIs
  getAdminDashboard: async () => {
    const token = authService.getToken();
    const response = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch admin stats');
    }
    return data;
  },

  getAdminClients: async (search = '', status = 'ALL') => {
    const token = authService.getToken();
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (status) queryParams.append('status', status);

    const response = await fetch(`${BASE_URL}/api/admin/clients?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch clients list');
    }
    return data;
  },

  getAdminClientById: async (id) => {
    const token = authService.getToken();
    const response = await fetch(`${BASE_URL}/api/admin/clients/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch client details');
    }
    return data;
  },

  addOrUpdateInvestment: async (clientId, investmentData) => {
    const token = authService.getToken();
    const response = await fetch(`${BASE_URL}/api/admin/clients/${clientId}/investments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(investmentData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update investment details');
    }
    return data;
  },

  seedTestUsers: async () => {
    const token = authService.getToken();
    const response = await fetch(`${BASE_URL}/api/admin/seed-test-users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to seed test users');
    }
    return data;
  },

  wipeTestData: async () => {
    const token = authService.getToken();
    const response = await fetch(`${BASE_URL}/api/admin/wipe-test-data`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to wipe test data');
    }
    return data;
  },
};

export default portfolioService;
