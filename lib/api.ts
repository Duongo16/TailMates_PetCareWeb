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
  // Login with email/password
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  // Legacy register (kept for backward compatibility)
  register: async (data: {
    email: string;
    password: string;
    full_name: string;
    phone_number?: string;
    role: string;
    shop_name?: string;
    address?: string;
    terms_accepted?: boolean;
  }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Send OTP for registration
  sendOtp: async (data: {
    email: string;
    password: string;
    full_name: string;
    phone_number?: string;
    role?: string;
    shop_name?: string;
    address?: string;
    terms_accepted: boolean;
  }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Verify OTP and complete registration
  verifyOtp: async (email: string, otp: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    return response.json();
  },

  // Resend OTP
  resendOtp: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  // Login with Google OAuth
  loginWithGoogle: async (idToken: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: idToken }),
    });
    return response.json();
  },

  // Refresh access token
  refreshToken: async (refreshToken: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    return response.json();
  },

  // Logout (invalidate refresh tokens)
  logout: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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
    color?: string;
    fur_type?: string;
    image?: { url: string; public_id: string };
    mediaGallery?: any[];
    datingProfile?: {
      bio?: string;
      lookingFor?: "Playdate" | "Breeding" | "Any";
    };
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

  getMedicalRecords: (petId: string, status?: string) =>
    fetchWithAuth<any[]>(`/pets/${petId}/medical-records${status ? `?status=${status}` : ""}`),

  getMedicalRecordsPending: (petId: string) =>
    fetchWithAuth<any[]>(`/pets/${petId}/medical-records?status=PENDING`),

  getMedicalRecord: (petId: string, recordId: string) =>
    fetchWithAuth<any>(`/pets/${petId}/medical-records/${recordId}`),

  addMedicalRecord: (
    petId: string,
    data: {
      record_type: string;
      visit_date: string;
      diagnosis: string;
      treatment?: string;
      condition?: string;
      notes?: string;
      vaccines?: string[];
      medications?: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration_days?: number;
        notes?: string;
      }>;
      follow_up_date?: string;
      follow_up_notes?: string;
      attachments?: Array<{ url: string; public_id: string }>;
      booking_id?: string;
    }
  ) =>
    fetchWithAuth(`/pets/${petId}/medical-records`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateMedicalRecord: (
    petId: string,
    recordId: string,
    data: Record<string, unknown>
  ) =>
    fetchWithAuth(`/pets/${petId}/medical-records/${recordId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  confirmMedicalRecord: (
    petId: string,
    recordId: string,
    action: "confirm" | "reject" | "request_revision",
    customer_feedback?: string
  ) =>
    fetchWithAuth(`/pets/${petId}/medical-records/${recordId}`, {
      method: "PATCH",
      body: JSON.stringify({ action, customer_feedback }),
    }),

  deleteMedicalRecord: (petId: string, recordId: string) =>
    fetchWithAuth(`/pets/${petId}/medical-records/${recordId}`, {
      method: "DELETE",
    }),

  getQRCode: (petId: string) => fetchWithAuth(`/pets/${petId}/qr-code`),
};

// ==================== Payment API ====================
export const paymentAPI = {
  createQR: (data: { type: string; amount: number; reference_id?: string }) =>
    fetchWithAuth<any>("/payment/create-qr", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  payWithTM: (data: { type: string; amount: number; reference_id: string }) =>
    fetchWithAuth<any>("/payment/pay-with-tm", {
      method: "POST",
      body: JSON.stringify(data),
    }),
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

  suggestions: (petId: string, type?: "food" | "service" | "all") =>
    fetchWithAuth<any>("/ai/suggestions", {
      method: "POST",
      body: JSON.stringify({ petId, type: type || "all" }),
    }),

  // Personality Analysis
  getPersonalityAnalysis: (petId: string) =>
    fetchWithAuth<any>(`/ai/personality?petId=${petId}`),

  analyzePersonality: (petId: string) =>
    fetchWithAuth<any>("/ai/personality", {
      method: "POST",
      body: JSON.stringify({ petId }),
    }),

  // Health Analysis (cached)
  getCachedHealthAnalysis: (petId: string) =>
    fetchWithAuth<any>(`/ai/suggestions?petId=${petId}`),
};

// ==================== Products API (Public) ====================
export const productsAPI = {
  list: (params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    // Specifications filters
    targetSpecies?: string;
    lifeStage?: string;
    breedSize?: string;
    healthTags?: string[];
    isSterilized?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append("category", params.category);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    // Specifications filters
    if (params?.targetSpecies) searchParams.append("targetSpecies", params.targetSpecies);
    if (params?.lifeStage) searchParams.append("lifeStage", params.lifeStage);
    if (params?.breedSize) searchParams.append("breedSize", params.breedSize);
    if (params?.healthTags && params.healthTags.length > 0) {
      searchParams.append("healthTags", params.healthTags.join(","));
    }
    if (params?.isSterilized !== undefined) {
      searchParams.append("isSterilized", params.isSterilized.toString());
    }
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
    items: Array<{
      product_id: string;
      quantity: number;
      product_name?: string;
      price?: number;
      product_image?: string;
    }>;
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

  getBookedSlots: (serviceId: string, date: string, petId?: string) =>
    fetchWithAuth<{ booked_slots: string[]; service_booked_slots: string[]; pet_booked_slots: string[] }>(
      `/bookings/slots?service_id=${serviceId}&date=${encodeURIComponent(date)}${petId ? `&pet_id=${petId}` : ""}`
    ),
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

  // Medical Records
  getMedicalRecords: (params?: { status?: string; pet_id?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.pet_id) searchParams.append("pet_id", params.pet_id);
    return fetchWithAuth<any>(`/merchant/medical-records?${searchParams.toString()}`);
  },

  getCompletedBookings: () =>
    fetchWithAuth<any>("/merchant/medical-records?type=bookings"),

  // Analytics
  getAnalytics: (range: string = "7d", from?: string, to?: string) => {
    const params = new URLSearchParams()
    params.append("range", range)
    if (from) params.append("from", from)
    if (to) params.append("to", to)
    return fetchWithAuth<any>(`/merchant/analytics?${params.toString()}`)
  },
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
  listUsers: (params?: { role?: string; status?: string; search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.append("role", params.role);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.search) searchParams.append("search", params.search);
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

// ==================== Banners API ====================
export const bannersAPI = {
  list: (location?: string) => {
    const params = location ? `?location=${location}` : "";
    return fetchWithAuth<any>(`/banners${params}`);
  },

  create: (data: {
    image: { url: string; public_id: string };
    targetUrl?: string;
    priority?: number;
    displayLocation?: string;
    title?: string;
    isActive?: boolean;
  }) =>
    fetchWithAuth("/banners", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    fetchWithAuth(`/banners/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchWithAuth(`/banners/${id}`, {
      method: "DELETE",
    }),
};

// ==================== Notifications API ====================
export const notificationsAPI = {
  list: (params?: { limit?: number; page?: number; unread?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.unread) searchParams.append("unread", "true");
    return fetchWithAuth<any>(`/notifications?${searchParams.toString()}`);
  },

  markAsRead: (id: string) =>
    fetchWithAuth(`/notifications/${id}`, {
      method: "PATCH",
    }),

  markAllAsRead: () =>
    fetchWithAuth("/notifications/read-all", {
      method: "POST",
    }),
};

// ==================== Blog API ====================
export const blogAPI = {
  // Public
  list: (params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append("category", params.category);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.sort) searchParams.append("sort", params.sort);
    return fetchWithAuth<any>(`/blog?${searchParams.toString()}`);
  },

  get: (id: string) => fetchWithAuth<any>(`/blog/${id}`),

  getCategories: () => fetchWithAuth<string[]>(`/blog/categories`),

  // Authenticated - User
  create: (data: {
    title: string;
    content: string;
    excerpt?: string;
    featured_image?: { url: string; public_id: string };
    category: string;
    tags?: string[];
    status?: string;
  }) =>
    fetchWithAuth("/blog", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    fetchWithAuth(`/blog/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchWithAuth(`/blog/${id}`, {
      method: "DELETE",
    }),

  submit: (id: string) =>
    fetchWithAuth(`/blog/${id}/submit`, {
      method: "POST",
    }),

  vote: (id: string, voteType: "LIKE" | "DISLIKE" | null) =>
    fetchWithAuth(`/blog/${id}/vote`, {
      method: "POST",
      body: JSON.stringify({ vote_type: voteType }),
    }),

  // User's posts
  myPosts: (params?: { status?: string; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.page) searchParams.append("page", params.page.toString());
    return fetchWithAuth<any>(`/blog/my-posts?${searchParams.toString()}`);
  },
};

// ==================== Conversations API ====================
export const conversationsAPI = {
  list: (type?: string) => {
    const params = type ? `?type=${type}` : "";
    return fetchWithAuth<any[]>(`/conversations${params}`);
  },

  create: (data: {
    type: string;
    participantIds: string[];
    contextId?: string;
    metadata?: any;
  }) =>
    fetchWithAuth<any>("/conversations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  markAsRead: (id: string) =>
    fetchWithAuth<any>(`/conversations/${id}/read`, {
      method: "POST",
    }),
};

// ==================== Messages API ====================
export const messagesAPI = {
  list: (conversationId: string) =>
    fetchWithAuth<any[]>(`/messages?conversationId=${conversationId}`),

  send: (data: { conversationId: string; content: string; media?: any[] }) =>
    fetchWithAuth<any>("/messages", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ==================== Manager Blog API ====================

// ==================== Manager Blog API ====================
export const managerBlogAPI = {
  list: (params?: { status?: string; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.page) searchParams.append("page", params.page.toString());
    return fetchWithAuth<any>(`/manager/blog?${searchParams.toString()}`);
  },

  approve: (id: string, managerNote?: string) =>
    fetchWithAuth(`/manager/blog/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ action: "APPROVE", manager_note: managerNote }),
    }),

  reject: (id: string, managerNote: string) =>
    fetchWithAuth(`/manager/blog/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ action: "REJECT", manager_note: managerNote }),
    }),
};

// ==================== PawMatch API ====================
export const pawmatchAPI = {
  getDiscovery: (petId: string) =>
    fetchWithAuth<any[]>(`/pawmatch/discovery?petId=${petId}`),

  getLiked: (petId: string) => fetchWithAuth<any[]>(`/pawmatch/liked?petId=${petId}`),
  getLikedMe: (petId: string) => fetchWithAuth<any[]>(`/pawmatch/liked-me?petId=${petId}`),

  swipe: (data: {
    swiperPetId: string;
    targetPetId: string;
    direction: "like" | "nope";
  }) =>
    fetchWithAuth("/pawmatch/swipe", {
      method: "POST",
      body: JSON.stringify({
        actorPetId: data.swiperPetId,
        targetPetId: data.targetPetId,
        action: data.direction === "nope" ? "PASS" : "LIKE"
      }),
    }),

  getMatches: (petId: string) =>
    fetchWithAuth<any[]>(`/pawmatch/matches?petId=${petId}`),

  getMessages: (matchId: string) =>
    fetchWithAuth<any[]>(`/pawmatch/messages?matchId=${matchId}`),

  sendMessage: (data: {
    matchId: string;
    senderPetId: string;
    content: string;
  }) =>
    fetchWithAuth("/pawmatch/messages", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};


