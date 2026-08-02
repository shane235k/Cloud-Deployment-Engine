import axios from 'axios';

// const api = axios.create({
//   baseURL: 'http://localhost:5000',
// });

const api = axios.create({
  baseURL: '/api',
});
// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getDeployments = async () => {
  const response = await api.get('/deployments');
  return response.data;
};
export async function getDeployment(id) {
  const response = await api.get(`/deployments/${id}`);
  return response.data;
}

export async function startDeployment(id) {
  const response = await api.post(`/deployments/${id}/start`);
  return response.data;
}

export async function stopDeployment(id) {
  const response = await api.post(`/deployments/${id}/stop`);
  return response.data;
}

export async function deleteDeployment(id) {
  const response = await api.delete(`/deployments/${id}`);
  return response.data;
}
export async function createDeployment(deploymentData) {
  const response = await api.post('/deploy', deploymentData);
  return response.data;
}
export async function login(username, password) {
  const response = await api.post("/auth/login", {
    username,
    password,
  });

  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get("/auth/me");
  return response.data;
}
export async function getProfile() {
  const response = await api.get("/profile");
  return response.data;
}

export async function updateProfile(profileData) {
  const response = await api.put("/profile", profileData);
  return response.data;
}
export async function getMonitoringData() {
  const response = await api.get('/monitoring');
  return response.data;
}
export async function getDeploymentMetrics(id) {
  const response = await api.get(`/deployments/${id}/metrics`);
  return response.data;
}
export async function submitRegisterRequest(data) {
  const response = await api.post("/auth/register-request", data);
  return response.data;
}


export async function getGithubClientId() {
  const response = await api.get('/github/client-id');
  return response.data;
}

export async function saveGithubToken(accessToken) {
  const response = await api.post('/github/save-token', { accessToken });
  return response.data;
}

export async function getGithubRepos() {
  const response = await api.get('/github/repos');
  return response.data;
}

export function getGrafanaUrl() {
  return "http://localhost:3001";
}
export default api;