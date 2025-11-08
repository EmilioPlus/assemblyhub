// Configuración de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    AUTH: {
      LOGIN: `${API_BASE_URL}/api/auth/login`,
      REGISTER: `${API_BASE_URL}/api/auth/register`,
      FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
      RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
    },
    ASSEMBLIES: {
      LIST: `${API_BASE_URL}/api/assemblies/listar`,
      DETAIL: (id: string) => `${API_BASE_URL}/api/assemblies/detalle/${id}`,
      CREATE: `${API_BASE_URL}/api/assemblies`,
      EDIT: (id: string) => `${API_BASE_URL}/api/assemblies/editar/${id}`,
      DELETE: (id: string) => `${API_BASE_URL}/api/assemblies/eliminar/${id}`,
      AUDIT: (id: string) => `${API_BASE_URL}/api/assemblies/auditoria/${id}`,
    },
    USERS: {
      LIST: `${API_BASE_URL}/api/users`,
      PROFILE: `${API_BASE_URL}/api/users/me`,
    },
    ROLES: {
      UPDATE: (id: string) => `${API_BASE_URL}/api/roles/${id}`,
      HISTORY: `${API_BASE_URL}/api/roles/history`,
      SEARCH: `${API_BASE_URL}/api/roles/search`,
    },
    DELEGATES: {
      REGISTER: `${API_BASE_URL}/api/delegates/registrar`,
      LIST: `${API_BASE_URL}/api/delegates/my-delegates`,
      AVAILABLE_ASSEMBLIES: `${API_BASE_URL}/api/delegates/available-assemblies`,
    },
    VOTING: {
      CREATE: `${API_BASE_URL}/api/votaciones/crear`,
      LIST: (assemblyId: string) => `${API_BASE_URL}/api/votaciones/listar/${assemblyId}`,
      QUESTIONS: (assemblyId: string) => `${API_BASE_URL}/api/votaciones/preguntas/${assemblyId}`,
      EMIT: `${API_BASE_URL}/api/votaciones/emitir`,
      RESULTS: (questionId: string) => `${API_BASE_URL}/api/votaciones/resultados/${questionId}`,
      UPDATE_STATUS: (id: string) => `${API_BASE_URL}/api/votaciones/estado/${id}`,
    },
    REPORTS: {
      EXPORT: `${API_BASE_URL}/api/reportes/exportar`,
    },
  },
};

export default API_CONFIG;

