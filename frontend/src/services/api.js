// services/api.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const TOKEN_KEY = "sfm_token";
const USER_KEY = "sfm_user";

/**
 * Helper to handle JSON parsing and HTTP errors
 */
async function parseResponse(response) {
  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("API_DEBUG: Received non-JSON response from server.");
    throw new Error("Invalid server response (Non-JSON)");
  }

  if (!response.ok) {
    // If 401 Unauthorized, clear session
    if (response.status === 401) {
      console.warn("API_DEBUG: Unauthorized (401) - Clearing local session.");
      clearSession();
      // Optional: Force a page reload to trigger the login redirect in App.jsx
      window.location.reload();
    }

    const message = data.message || `Error ${response.status}: Request failed`;
    throw new Error(message);
  }
  return data;
}

/**
 * Helper for Authorization headers
 * FIXED: Removed default Content-Type to prevent conflicts with FormData
 */
function authHeaders(token, isFormData = false) {
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json"
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

// --- Session Management ---

export function getStoredToken() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || token === "undefined" || token === "null") return null;
    return token;
  } catch (e) {
    return null;
  }
}

export const getStoredUser = () => {
  try {
    const user = localStorage.getItem(USER_KEY);
    if (!user || user === "undefined" || user === "null") return null;
    return JSON.parse(user);
  } catch (error) {
    console.error("API_DEBUG: Session corruption:", error);
    clearSession();
    return null;
  }
};

export function storeSession(token, user) {
  if (!token || !user) {
    console.error("API_DEBUG: Failed to store session - Missing token or user.");
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
  const userValue = typeof user === 'object' ? JSON.stringify(user) : user;
  localStorage.setItem(USER_KEY, userValue);
  console.log("API_DEBUG: Session successfully saved.");
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  console.log("API_DEBUG: Local session cleared.");
}

// --- Authentication Services ---

export async function signup(payload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
}

export async function login(payload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
}

// --- File Services ---

export async function getFiles(token, query = "") {
  if (!token) throw new Error("No authentication token provided");

  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());

  const path = params.toString() ? `/api/files?${params.toString()}` : "/api/files";

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: authHeaders(token)
  });
  return parseResponse(response);
}

/**
 * FIXED: Explicitly use the authHeaders helper with the FormData flag.
 * This ensures the browser generates the correct boundary string for the file.
 */
export async function uploadFile(token, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
    method: "POST",
    headers: authHeaders(token, true), // true indicates FormData
    body: formData
  });
  return parseResponse(response);
}

export async function deleteFileMetadata(token, id) {
  const response = await fetch(`${API_BASE_URL}/api/files/${id}`, {
    method: "DELETE",
    headers: authHeaders(token)
  });
  return parseResponse(response);
}