const BASE = "/api";

function getToken() {
  const stored = localStorage.getItem("sb_auth");
  return stored ? JSON.parse(stored).token : null;
}

async function request(method, path, body = null, auth = true) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Erreur serveur");
  return data;
}

async function downloadCsv(path) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transactions.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export const api = {
  // ── Auth ─────────────────────────────────────
  register: (email, password, fullName, phone) =>
    request("POST", "/auth/register", { email, password, fullName, phone }, false),
  login: (email, password) =>
    request("POST", "/auth/login", { email, password }, false),
  verifyOtp: (email, code, purpose) =>
    request("POST", "/auth/verify-otp", { email, code, purpose }, false),
  forgotPassword: (email) =>
    request("POST", "/auth/forgot-password", { email }, false),
  resetPassword: (email, token, newPassword) =>
    request("POST", "/auth/reset-password", { email, token, newPassword }, false),
  changePassword: (oldPassword, newPassword) =>
    request("POST", "/auth/change-password", { oldPassword, newPassword }),

  // ── Comptes ───────────────────────────────────
  getAccounts: () =>
    request("GET", "/accounts"),
  createAccount: (type, initialDeposit) =>
    request("POST", "/accounts", { type, initialDeposit }),
  getBalance: (accountNumber) =>
    request("GET", `/accounts/${accountNumber}/balance`),
  deposit: (accountNumber, amount) =>
    request("POST", `/accounts/${accountNumber}/deposit`, { amount }),
  requestDeletion: (accountNumber) =>
    request("POST", `/accounts/${accountNumber}/request-deletion`),
  getMyDeletionRequests: () =>
    request("GET", "/accounts/deletion-requests"),

  // ── Transactions ──────────────────────────────
  initiateTransfer: (sourceAccount, destinationAccount, amount, description) =>
    request("POST", "/transactions/transfer/initiate",
      { sourceAccount, destinationAccount, amount, description }),
  confirmTransfer: (reference, otpCode) =>
    request("POST", "/transactions/transfer/confirm", { reference, otpCode }),
  getHistory: (accountNumber) =>
    request("GET", `/transactions/history/${accountNumber}`),

  // ── Admin – Utilisateurs ──────────────────────
  adminGetUsers: () =>
    request("GET", "/admin/users"),
  adminToggleUser: (id, enabled) =>
    request("PATCH", `/admin/users/${id}/enable?enabled=${enabled}`),
  adminSuspendedUsers: () =>
    request("GET", "/admin/users/suspended"),

  // ── Admin – Comptes ───────────────────────────
  adminSuspendAccount: (number) =>
    request("PATCH", `/admin/accounts/${number}/suspend`),
  adminSuspendedAccounts: () =>
    request("GET", "/admin/accounts/suspended"),
  adminDeposit: (number, amount) =>
    request("POST", `/admin/accounts/${number}/deposit`, { amount }),
  adminDeleteAccount: (number) =>
    request("DELETE", `/admin/accounts/${number}`),

  // ── Admin – Demandes de suppression ───────────
  adminGetDeletionRequests: () =>
    request("GET", "/admin/deletion-requests"),
  adminApproveDeletion: (id) =>
    request("POST", `/admin/deletion-requests/${id}/approve`),
  adminRejectDeletion: (id, comment) =>
    request("POST", `/admin/deletion-requests/${id}/reject`, { comment }),

  // ── Admin – Statistiques ──────────────────────
  adminGetStats: () =>
    request("GET", "/admin/stats"),
  adminGetTransactions: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status)    params.append("status", filters.status);
    if (filters.minAmount) params.append("minAmount", filters.minAmount);
    if (filters.maxAmount) params.append("maxAmount", filters.maxAmount);
    if (filters.from)      params.append("from", filters.from);
    if (filters.to)        params.append("to", filters.to);
    return request("GET", `/admin/transactions?${params.toString()}`);
  },
  adminExportCsv: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status)    params.append("status", filters.status);
    if (filters.minAmount) params.append("minAmount", filters.minAmount);
    if (filters.maxAmount) params.append("maxAmount", filters.maxAmount);
    if (filters.from)      params.append("from", filters.from);
    if (filters.to)        params.append("to", filters.to);
    return downloadCsv(`/admin/transactions/export?${params.toString()}`);
  },

  // ── Admin – Audit ─────────────────────────────
  adminGetAudit: () =>
    request("GET", "/admin/audit"),
  adminCheckIntegrity: () =>
    request("GET", "/admin/audit/integrity"),
};