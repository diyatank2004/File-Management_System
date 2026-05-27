const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const TOKEN_KEY = "sfm_token";
const USER_KEY = "sfm_user";

async function parseResponse(response) {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) { throw new Error("Invalid server response"); }
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.reload();
    }

    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    throw error;
  }
  return data;
}

function authHeaders(token, isFormData = false) {
  return {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json"
  };
}

export function getStoredToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  return (token && token !== "null") ? token : null;
}

export const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return (user && user !== "null") ? JSON.parse(user) : null;
};

export function storeSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function login(payload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
}

export async function signup(payload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
}

export async function getFiles(token, query = "", mode = "both", type = "all", dateRange = "all") {
  const params = new URLSearchParams();
  if (query.trim()) params.set("query", query.trim());
  params.set("mode", mode);
  if (type !== "all") params.set("type", type);

  // FIX: Parameter key changed from "date" to "dateRange" to match backend destructuring
  if (dateRange !== "all") params.set("dateRange", dateRange);

  const response = await fetch(`${API_BASE_URL}/api/files?${params.toString()}`, {
    method: "GET",
    headers: authHeaders(token)
  });
  return parseResponse(response);
}

export const uploadFile = async (token, file, relativePath = "", extractedText = "") => {
  const formData = new FormData();

  // 🌟 ALWAYS append text body fields BEFORE appending the file stream
  formData.append('relativePath', relativePath);
  formData.append('extractedText', extractedText);
  formData.append('file', file); // File goes last!

  const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  return parseResponse(response);
};

export async function searchFiles(token, query, type = 'content') {
  // FIX: Key structures synchronized uniformly here too
  const params = new URLSearchParams({ query: query, mode: type });
  const response = await fetch(`${API_BASE_URL}/api/files?${params.toString()}`, {
    method: "GET",
    headers: authHeaders(token)
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