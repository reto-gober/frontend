import axios from "axios";
import notifications from "./notifications";

const API_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    console.log(
      "🔐 [API Interceptor] Token encontrado:",
      token ? "✅ Sí" : "❌ No"
    );
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔐 [API Interceptor] Authorization header configurado");
    } else {
      console.warn("⚠️ [API Interceptor] No se encontró token en localStorage");
    }
  }
  console.log("📤 [API Interceptor] Request URL:", config.url);
  console.log("📤 [API Interceptor] Request Method:", config.method);
  return config;
});

// Response interceptor to handle authentication errors (401/403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      const status = error.response?.status;
      const message = error.response?.data?.message || "";
      const currentPath = window.location.pathname;
      const isLoginRequest = error.config?.url?.includes("/api/auth/login");
      const isRegisterRequest =
        error.config?.url?.includes("/api/auth/registro");

      // Mensajes que indican problemas de autenticación (token inválido, expirado, faltante)
      const authenticationErrors = [
        "Autenticación requerida",
        "Token JWT con firma inválida",
        "Token expirado",
        "Token JWT expirado",
        "proporcione un token válido",
        "Autenticación rechazada",
        "JWT expired",
        "invalid signature",
        "malformed",
      ];

      // Verificar si el mensaje indica un problema real de autenticación
      const isAuthenticationError = authenticationErrors.some((errMsg) =>
        message.toLowerCase().includes(errMsg.toLowerCase())
      );

      // Handle 401 (Unauthorized) ONLY if it's an authentication issue (not permission issue)
      // BUT: Don't redirect if we're attempting to login/register (let the form handle it)
      if (
        status === 401 &&
        isAuthenticationError &&
        !isLoginRequest &&
        !isRegisterRequest
      ) {
        // Clear stored auth data
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");

        // Remove cookie if exists
        document.cookie =
          "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        // Show session expired message
        if (currentPath !== "/login" && currentPath !== "/registro") {
          notifications.warning(
            "Por favor, inicia sesión nuevamente",
            "Sesión expirada"
          );
        }

        // Redirect to login
        window.location.href = "/login";
      }

      // For 403 or 401 without authentication error message, let the application handle it
      // (could be permission denied, access forbidden, etc.)
    }
    return Promise.reject(error);
  }
);

export default api;
