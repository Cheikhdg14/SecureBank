// BASE utilise un chemin relatif → le proxy Vite gère la redirection vers localhost:8080
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

export const api = {
  register: (email, password, fullName, phone) =>
    request("POST", "/auth/register", { email, password, fullName, phone }, false),
  login: (email, password) =>
    request("POST", "/auth/login", { email, password }, false),
  verifyOtp: (email, code, purpose) =>
    request("POST", "/auth/verify-otp", { email, code, purpose }, false),
  getAccounts: () => request("GET", "/accounts"),
  createAccount: (type, initialDeposit) =>
    request("POST", "/accounts", { type, initialDeposit }),
  getBalance: (accountNumber) => request("GET", `/accounts/${accountNumber}/balance`),
  initiateTransfer: (sourceAccount, destinationAccount, amount, description) =>
    request("POST", "/transactions/transfer/initiate", { sourceAccount, destinationAccount, amount, description }),
  confirmTransfer: (reference, otpCode) =>
    request("POST", "/transactions/transfer/confirm", { reference, otpCode }),
  getHistory: (accountNumber) => request("GET", `/transactions/history/${accountNumber}`),
  adminGetUsers: () => request("GET", "/admin/users"),
  adminToggleUser: (id, enabled) => request("PATCH", `/admin/users/${id}/enable?enabled=${enabled}`),
  adminSuspendAccount: (number) => request("PATCH", `/admin/accounts/${number}/suspend`),
  adminGetAudit: () => request("GET", "/admin/audit"),
  adminCheckIntegrity: () => request("GET", "/admin/audit/integrity"),
};
