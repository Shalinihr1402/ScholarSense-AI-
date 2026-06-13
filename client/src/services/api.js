const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("scholarsense_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export const authApi = {
  register(payload) {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  login(payload) {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  me() {
    return apiRequest("/auth/me");
  }
};

export const profileApi = {
  getMine() {
    return apiRequest("/profile/me");
  },
  saveMine(payload) {
    return apiRequest("/profile/me", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  }
};

export const scholarshipApi = {
  list(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    const query = params.toString();
    return apiRequest(`/scholarships${query ? `?${query}` : ""}`);
  },
  personalized() {
    return apiRequest("/scholarships/personalized");
  },
  create(payload) {
    return apiRequest("/scholarships", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
};
