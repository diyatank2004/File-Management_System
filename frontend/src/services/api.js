const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const TOKEN_KEY = "sfm_token";
const USER_KEY = "sfm_user";

function parseResponse(response) {
  return response.json().catch(() => ({})).then((data) => {
    if (!response.ok) {
      const message = data.message || "Request failed";
      throw new Error(message);
    }
    return data;
  });
}

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function storeSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function signup(payload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
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

export async function getFiles(token, query = "") {
  const params = new URLSearchParams();
  if (query.trim()) {
    params.set("q", query.trim());
  }

  const path = params.toString() ? `/api/files?${params.toString()}` : "/api/files";
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: authHeaders(token)
  });
  return parseResponse(response);
}

export async function addFileMetadata(token, payload) {
  const response = await fetch(`${API_BASE_URL}/api/files`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
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

export async function deleteAllFileMetadata(token) {
  const response = await fetch(`${API_BASE_URL}/api/files/all`, {
    method: "DELETE",
    headers: authHeaders(token)
  });
  return parseResponse(response);
}
