const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("scholarsense_token");
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
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

export const readinessApi = {
  getMine() {
    return apiRequest("/readiness/me");
  }
};

export const diagnosisApi = {
  getMine() {
    return apiRequest("/diagnosis/me");
  }
};

export const ocrApi = {
  analyze(file) {
    const formData = new FormData();
    formData.append("screenshot", file);

    return apiRequest("/ocr/analyze", {
      method: "POST",
      body: formData
    });
  }
};

export const notificationApi = {
  list() {
    return apiRequest("/notifications");
  },
  create(payload) {
    return apiRequest("/notifications", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  markRead(id) {
    return apiRequest(`/notifications/${id}/read`, {
      method: "PUT"
    });
  },
  markAllRead() {
    return apiRequest("/notifications/read-all", {
      method: "PUT"
    });
  }
};

export const emailApi = {
  status() {
    return apiRequest("/email/status");
  }
};
