const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Auth endpoints
  async login(credentials: { username: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async createUser(userData: any) {
    return this.request('/auth/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Dashboard endpoints
  async getDashboardMetrics() {
    return this.request('/dashboard/metrics');
  }

  async getAnalytics(params?: { startDate?: string; endDate?: string }) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/dashboard/analytics${query}`);
  }

  // Asset endpoints
  async getAssets() {
    return this.request('/assets');
  }

  async createAsset(assetData: any) {
    return this.request('/assets', {
      method: 'POST',
      body: JSON.stringify(assetData),
    });
  }

  async updateAsset(id: string, assetData: any) {
    return this.request(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assetData),
    });
  }

  // Purchase endpoints
  async getPurchases() {
    return this.request('/purchases');
  }

  async createPurchase(purchaseData: any) {
    return this.request('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchaseData),
    });
  }

  async updatePurchaseStatus(id: string, statusData: any) {
    return this.request(`/purchases/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  }

  // Transfer endpoints
  async getTransfers() {
    return this.request('/transfers');
  }

  async createTransfer(transferData: any) {
    return this.request('/transfers', {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  }

  async updateTransferStatus(id: string, statusData: any) {
    return this.request(`/transfers/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  }

  // Assignment endpoints
  async getAssignments() {
    return this.request('/assignments');
  }

  async createAssignment(assignmentData: any) {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
  }

  async markAssignmentExpended(assignmentId: string, data: any) {
    return this.request('/assignments/expended', {
      method: 'POST',
      body: JSON.stringify({ assignmentId, ...data }),
    });
  }

  async returnAssignment(id: string, data: any) {
    return this.request(`/assignments/${id}/return`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Base endpoints
  async getBases() {
    return this.request('/bases');
  }

  async createBase(baseData: any) {
    return this.request('/bases', {
      method: 'POST',
      body: JSON.stringify(baseData),
    });
  }

  // Audit endpoints
  async getAuditLogs(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/audit/logs${query}`);
  }
}

export const api = new ApiService();