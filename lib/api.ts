/**
 * API Client for TailMates
 * Centralized API service with authentication handling
 */

const API_BASE_URL = "/api/v1";

// Get token from localStorage
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tailmates_token");
}

// Base fetch wrapper with auth
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: string }> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Request failed",
        error: data.message,
      };
    }

    return {
      success: true,
      data: data.data,
      message: data.message,
    };
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      message: "Network error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ==================== Auth API ====================
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  register: async (data: {
    email: string;
    password: string;
    full_name: string;
    phone_number?: string;
    role: string;
    shop_name?: string;
    address?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getMe: () => fetchWithAuth("/users/me"),

  updateProfile: (data: Record<string, unknown>) =>
    fetchWithAuth("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ==================== Pets API ====================
export const petsAPI = {
  list: () => fetchWithAuth<any[]>("/pets"),

  get: (id: string) => fetchWithAuth<any>(`/pets/${id}`),

  create: (data: {
    name: string;
    species: string;
    breed?: string;
    age_months: number;
    weight_kg?: number;
    gender: string;
    sterilized?: boolean;
    image?: { url: string; public_id: string };
  }) =>
    fetchWithAuth("/pets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    fetchWithAuth(`/pets/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchWithAuth(`/pets/${id}`, {
      method: "DELETE",
    }),

  getMedicalRecords: (petId: string) =>
    fetchWithAuth<any[]>(`/pets/${petId}/medical-records`),

  addMedicalRecord: (
    petId: string,
    data: {
      visit_date: string;
      diagnosis: string;
      treatment?: string;
      notes?: string;
      vaccines?: string[];
    }
  ) =>
    fetchWithAuth(`/pets/${petId}/medical-records`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getQRCode: (petId: string) => fetchWithAuth(`/pets/${petId}/qr-code`),
};

// ==================== AI API ====================
export const aiAPI = {
  consultation: (petId: string, symptomsInput: string) =>
    fetchWithAuth("/ai/consultation", {
      method: "POST",
      body: JSON.stringify({ pet_id: petId, symptoms_input: symptomsInput }),
    }),

  getConsultationHistory: (petId?: string) =>
    fetchWithAuth(`/ai/consultation${petId ? `?pet_id=${petId}` : ""}`),

  recommendProducts: (petId: string) =>
    fetchWithAuth("/ai/recommend-products", {
      method: "POST",
      body: JSON.stringify({ pet_id: petId }),
    }),

  recommendServices: (petId: string, needType?: string) =>
    fetchWithAuth("/ai/recommend-services", {
      method: "POST",
      body: JSON.stringify({ pet_id: petId, need_type: needType }),
    }),
};

// ==================== Products API (Public) ====================
export const productsAPI = {
  list: (params?: { category?: string; search?: string; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append("category", params.category);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.page) searchParams.append("page", params.page.toString());
    return fetchWithAuth<any>(`/products?${searchParams.toString()}`);
  },
};

// ==================== Services API (Public) ====================
export const servicesAPI = {
  list: (params?: { page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    return fetchWithAuth<any>(`/services?${searchParams.toString()}`);
  },
};

// ==================== Orders API ====================
export const ordersAPI = {
  list: () => fetchWithAuth<any[]>("/orders"),

  create: (data: {
    items: Array<{ product_id: string; quantity: number }>;
    shipping_address?: string;
    note?: string;
    payment_method?: string;
  }) =>
    fetchWithAuth("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStatus: (orderId: string, status: string) =>
    fetchWithAuth(`/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
};

// ==================== Bookings API ====================
export const bookingsAPI = {
  list: () => fetchWithAuth<any[]>("/bookings"),

  create: (data: {
    service_id: string;
    pet_id: string;
    booking_time: string;
    note?: string;
  }) =>
    fetchWithAuth("/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStatus: (bookingId: string, status: string) =>
    fetchWithAuth(`/bookings/${bookingId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
};

// ==================== Packages API ====================
export const packagesAPI = {
  listCustomer: () => fetchWithAuth<any[]>("/packages-customer"),
  listMerchant: () => fetchWithAuth<any[]>("/packages-merchant"),

  subscribeCustomer: (packageId: string) =>
    fetchWithAuth("/payment/subscribe-customer", {
      method: "POST",
      body: JSON.stringify({ package_id: packageId }),
    }),

  subscribeMerchant: (packageId: string) =>
    fetchWithAuth("/payment/subscribe-merchant", {
      method: "POST",
      body: JSON.stringify({ package_id: packageId }),
    }),

  // Manager/Admin methods
  listAll: () => fetchWithAuth<any[]>("/packages"),

  create: (data: any) =>
    fetchWithAuth("/packages", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    fetchWithAuth(`/packages/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchWithAuth(`/packages/${id}`, {
      method: "DELETE",
    }),
};

// ==================== Merchant API ====================
export const merchantAPI = {
  // Products
  listProducts: () => fetchWithAuth<any[]>("/merchant/products"),

  createProduct: (data: Record<string, unknown>) =>
    fetchWithAuth("/merchant/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProduct: (id: string, data: Record<string, unknown>) =>
    fetchWithAuth(`/merchant/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: string) =>
    fetchWithAuth(`/merchant/products/${id}`, {
      method: "DELETE",
    }),

  // Services
  listServices: () => fetchWithAuth<any[]>("/merchant/services"),

  createService: (data: Record<string, unknown>) =>
    fetchWithAuth("/merchant/services", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateService: (id: string, data: Record<string, unknown>) =>
    fetchWithAuth(`/merchant/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteService: (id: string) =>
    fetchWithAuth(`/merchant/services/${id}`, {
      method: "DELETE",
    }),
};

// ==================== Manager API ====================
export const managerAPI = {
  getRevenueStats: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    return fetchWithAuth(`/manager/stats/revenue?${params.toString()}`);
  },

  listMerchants: (params?: { status?: string; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.page) searchParams.append("page", params.page.toString());
    return fetchWithAuth<any>(`/manager/merchants?${searchParams.toString()}`);
  },

  updateMerchantStatus: (merchantId: string, isActive: boolean) =>
    fetchWithAuth(`/manager/merchants/${merchantId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    }),
};

// ==================== Admin API ====================
export const adminAPI = {
  listUsers: (params?: { role?: string; status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.append("role", params.role);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    return fetchWithAuth<any>(`/admin/users?${searchParams.toString()}`);
  },

  updateUser: (userId: string, data: { is_active?: boolean; role?: string }) =>
    fetchWithAuth(`/admin/users`, {
      method: "PATCH",
      body: JSON.stringify({ user_id: userId, ...data }),
    }),
};
