import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Transaction API calls ──────────────────────────────────────

export const addTransaction = (data) =>
  API.post("/transactions", data);

export const getTransactions = (params) =>
  API.get("/transactions", { params });

export const updateTransaction = (id, data) =>
  API.put(`/transactions/${id}`, data);

export const deleteTransaction = (id) =>
  API.delete(`/transactions/${id}`);

// ── Export ────────────────────────────────────────────────────
export const exportExcel = () =>
  API.get("/transactions/export/excel", { responseType: "blob" });

export const exportPdf = () =>
  API.get("/transactions/export/pdf", { responseType: "blob" });


// ── Budget API calls ───────────────────────────────────────────
export const getBudgets = (month, year) =>
  API.get("/budgets", { params: { month, year } });

export const createBudget = (data) =>
  API.post("/budgets", data);

export const updateBudget = (id, data) =>
  API.put(`/budgets/${id}`, data);

export const deleteBudget = (id) =>
  API.delete(`/budgets/${id}`);

export const getDashboard = (startDate, endDate) =>
  API.get("/dashboard", { params: { startDate, endDate } });

export const getSavingsTrend = () =>
  API.get("/dashboard/savings-trend");


export default API;