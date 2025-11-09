/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  CircularProgress,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import HistoryIcon from "@mui/icons-material/History";
import CloseIcon from "@mui/icons-material/Close";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import DescriptionIcon from "@mui/icons-material/Description";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { StyledLoginButton } from "../Styles/Login.styles";
import { API_CONFIG } from "../config/api";

interface Assembly {
  _id: string;
  Nombre: string;
  FechaInicio: string;
  FechaCierre: string;
  Tipo: "assembly" | "voting";
  Estado: "scheduled" | "active" | "completed" | "cancelled";
  NumeroInscritos: number;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdBy?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participants?: any[];
}

interface AssemblyDetail {
  _id: string;
  name?: string;
  Nombre?: string;
  FechaInicio?: string;
  FechaCierre?: string;
  startDateTime?: string;
  endDateTime?: string;
  Tipo?: "assembly" | "voting";
  Estado?: "scheduled" | "active" | "completed" | "cancelled";
  NumeroInscritos?: number;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdBy?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participants?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminAssemblies() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [auditHistory, setAuditHistory] = useState<any[]>([]);

  // Modales
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAssembly, setSelectedAssembly] = useState<AssemblyDetail | null>(null);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadDocumentOpen, setUploadDocumentOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState({ name: "", file: null as File | null });
  const [validateModalOpen, setValidateModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [validateForm, setValidateForm] = useState({ status: "approved" as "approved" | "rejected", observations: "" });
  const [validationHistory, setValidationHistory] = useState<any[]>([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Formulario de edición
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    startDateTime: "",
    endDateTime: "",
  });

  useEffect(() => {
    if (!token || !user || user.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchAssemblies();
  }, [token, user, navigate, estadoFilter, tipoFilter]);

  const fetchAssemblies = async () => {
    try {
      setLoading(true);
      setError("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = {};
      if (estadoFilter) params.estado = estadoFilter;
      if (tipoFilter) params.tipo = tipoFilter;

      const response = await axios.get("http://localhost:5000/api/assemblies/listar", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setAssemblies(response.data.assemblies || []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al cargar las asambleas");
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas (basado en estado real calculado por fechas)
  const getStats = () => {
    const now = new Date();
    const active = assemblies.filter(a => {
      const start = new Date(a.FechaInicio);
      const end = new Date(a.FechaCierre);
      return now >= start && now <= end;
    }).length;
    
    const scheduled = assemblies.filter(a => {
      const start = new Date(a.FechaInicio);
      return now < start;
    }).length;
    
    const completed = assemblies.filter(a => {
      const end = new Date(a.FechaCierre);
      return now > end;
    }).length;
    
    return { active, scheduled, completed };
  };

  // Calcular estado real basado en fechas
  const getRealStatus = (assembly: Assembly): "scheduled" | "active" | "completed" | "cancelled" => {
    const now = new Date();
    const start = new Date(assembly.FechaInicio);
    const end = new Date(assembly.FechaCierre);
    
    if (assembly.Estado === "cancelled") return "cancelled";
    if (now < start) return "scheduled";
    if (now >= start && now <= end) return "active";
    return "completed";
  };

  // Filtrar asambleas por búsqueda
  const filteredAssemblies = assemblies.filter(assembly => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = assembly.Nombre.toLowerCase();
    const startDate = formatDate(assembly.FechaInicio).toLowerCase();
    const endDate = formatDate(assembly.FechaCierre).toLowerCase();
    return name.includes(query) || startDate.includes(query) || endDate.includes(query);
  });

  const handleViewDetail = async (id: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/assemblies/detalle/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedAssembly(response.data.assembly);
      
      // Cargar historial de auditoría
      try {
        const historyResponse = await axios.get(`http://localhost:5000/api/assemblies/auditoria/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAuditHistory(historyResponse.data.logs || []);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (historyErr) {
        // Si no hay endpoint de auditoría, continuar sin historial
        setAuditHistory([]);
      }
      
      setDetailModalOpen(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al cargar el detalle");
    }
  };

  const handleEditClick = async (id: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/assemblies/detalle/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const assembly = response.data.assembly;
      
      // Validar que la asamblea no haya iniciado
      const now = new Date();
      const startDate = new Date(assembly.startDateTime);
      
      if (startDate <= now) {
        setError("No se puede editar una asamblea que ya inició.");
        return;
      }

      setSelectedAssembly(assembly);
      setEditForm({
        name: assembly.name,
        description: assembly.description || "",
        startDateTime: new Date(assembly.startDateTime).toISOString().slice(0, 16),
        endDateTime: new Date(assembly.endDateTime).toISOString().slice(0, 16),
      });
      setEditModalOpen(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al cargar la asamblea");
    }
  };

  const handleEditSubmit = async () => {
    try {
      setError("");
      setSuccess("");
      
      await axios.put(
        `http://localhost:5000/api/assemblies/editar/${selectedAssembly?._id}`,
        editForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess("Asamblea editada exitosamente");
      setEditModalOpen(false);
      await fetchAssemblies();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al editar la asamblea");
    }
  };

  const handleDeleteClick = async (id: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/assemblies/detalle/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedAssembly(response.data.assembly);
      setDeleteModalOpen(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al cargar la asamblea");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setError("");
      setSuccess("");
      
      await axios.delete(`http://localhost:5000/api/assemblies/eliminar/${selectedAssembly?._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess("Asamblea eliminada exitosamente.");
      setDeleteModalOpen(false);
      await fetchAssemblies();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al eliminar la asamblea");
    }
  };

  const handleDocumentsClick = async (assemblyId: string) => {
    try {
      const response = await axios.get(API_CONFIG.ENDPOINTS.ASSEMBLY_DOCUMENTS.LIST(assemblyId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(response.data.documents || []);
      setSelectedAssembly({ _id: assemblyId } as AssemblyDetail);
      setDocumentsModalOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al cargar los documentos");
    }
  };

  const handleUploadDocument = async () => {
    if (!documentForm.name || !documentForm.file) {
      setError("El nombre y el archivo son obligatorios");
      return;
    }

    // Validar formato
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(documentForm.file.type)) {
      setError("El formato del archivo no es válido. Solo se permiten PDF, JPG o PNG.");
      return;
    }

    // Validar tamaño (10MB)
    if (documentForm.file.size > 10 * 1024 * 1024) {
      setError("El archivo supera el tamaño máximo permitido (10MB).");
      return;
    }

    try {
      setError("");
      setSuccess("");
      const formData = new FormData();
      formData.append("document", documentForm.file);
      formData.append("assemblyId", selectedAssembly?._id || "");
      formData.append("name", documentForm.name);

      await axios.post(API_CONFIG.ENDPOINTS.ASSEMBLY_DOCUMENTS.UPLOAD, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Documento cargado exitosamente");
      setUploadDocumentOpen(false);
      setDocumentForm({ name: "", file: null });
      // Recargar documentos
      if (selectedAssembly?._id) {
        await handleDocumentsClick(selectedAssembly._id);
      }
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al cargar el documento");
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm("¿Está seguro de eliminar este documento?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await axios.delete(API_CONFIG.ENDPOINTS.ASSEMBLY_DOCUMENTS.DELETE(documentId), {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess("Documento eliminado exitosamente");
      // Recargar documentos
      if (selectedAssembly?._id) {
        await handleDocumentsClick(selectedAssembly._id);
      }
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al eliminar el documento");
    }
  };

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    try {
      const url = API_CONFIG.ENDPOINTS.ASSEMBLY_DOCUMENTS.DOWNLOAD(documentId);
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      
      // Crear URL del blob y descargar
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al descargar el documento");
    }
  };

  const handlePreviewDocument = async (doc: any) => {
    try {
      setSelectedDocument(doc);
      // Obtener el documento como blob y crear URL local
      const url = API_CONFIG.ENDPOINTS.ASSEMBLY_DOCUMENTS.DOWNLOAD(doc._id);
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      
      const blob = new Blob([response.data], { type: doc.mimeType });
      const localUrl = window.URL.createObjectURL(blob);
      setPreviewUrl(localUrl);
      setPreviewModalOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al cargar la vista previa");
    }
  };

  const handleValidateClick = (doc: any) => {
    setSelectedDocument(doc);
    setValidateForm({ status: "approved", observations: "" });
    setValidateModalOpen(true);
  };

  const handleValidateSubmit = async () => {
    // Validar que si es rechazo, haya observaciones
    if (validateForm.status === "rejected" && !validateForm.observations.trim()) {
      setError("Debe incluir observaciones para rechazar un documento");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await axios.post(
        API_CONFIG.ENDPOINTS.ASSEMBLY_DOCUMENTS.VALIDATE,
        {
          documentId: selectedDocument?._id,
          status: validateForm.status,
          observations: validateForm.observations,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(
        validateForm.status === "approved"
          ? "Documento aprobado exitosamente."
          : "Documento rechazado. Se ha notificado al usuario."
      );
      setValidateModalOpen(false);
      setValidateForm({ status: "approved", observations: "" });
      // Recargar documentos
      if (selectedAssembly?._id) {
        await handleDocumentsClick(selectedAssembly._id);
      }
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al validar el documento");
    }
  };

  const handleViewHistory = async (documentId: string) => {
    try {
      const response = await axios.get(API_CONFIG.ENDPOINTS.ASSEMBLY_DOCUMENTS.HISTORY(documentId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setValidationHistory(response.data.history || []);
      setHistoryModalOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al cargar el historial");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      scheduled: "Programada",
      active: "Activa",
      completed: "Finalizada",
      cancelled: "Cancelada",
    };
    return labels[status] || status;
  };


  const getTipoLabel = (tipo: string) => {
    const labels: { [key: string]: string } = {
      assembly: "Asamblea",
      voting: "Votación",
    };
    return labels[tipo] || tipo;
  };

  const stats = getStats();

  return (
    <Box sx={{ backgroundColor: "#d9ebfa", minHeight: "100vh", padding: "2rem" }}>
      {/* Header */}
      <Box sx={{ marginBottom: "2rem" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: "#212529", marginBottom: "0.5rem" }}>
              Administración de asambleas
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Consulta, edita o elimina las asambleas creadas y mantén actualizada la información del evento.
            </Typography>
          </Box>
          <StyledLoginButton
            startIcon={<AddIcon />}
            onClick={() => navigate("/create-assembly")}
            sx={{
              width: "auto",
              minWidth: 220,
              height: 44,
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              padding: "0 1.25rem",
              boxShadow: "0 6px 18px rgba(3,169,244,0.25)",
              fontSize: "1rem",
              backgroundColor: "#03A9F4",
              color: "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              "&:hover": {
                backgroundColor: "#2196F3",
                boxShadow: "0 8px 22px rgba(33,150,243,0.22)",
              },
            }}
          >
            Crear nueva asamblea
          </StyledLoginButton>
        </Box>
      </Box>

      {/* Tarjetas de resumen */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, marginBottom: "2rem" }}>
        {/* Activas */}
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: "0 0 15px rgba(0,0,0,0.1)",
          borderLeft: "4px solid #4caf50"
        }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ marginBottom: "0.5rem" }}>
                  Activas
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 600, color: "#212529" }}>
                  {stats.active}
                </Typography>
              </Box>
              <Box sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: "50%", 
                backgroundColor: "#4caf50",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <CheckCircleIcon sx={{ color: "#fff", fontSize: 28 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Programadas */}
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: "0 0 15px rgba(0,0,0,0.1)",
          borderLeft: "4px solid #2196f3"
        }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ marginBottom: "0.5rem" }}>
                  Programadas
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 600, color: "#212529" }}>
                  {stats.scheduled}
                </Typography>
              </Box>
              <Box sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: "50%", 
                backgroundColor: "#2196f3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <CalendarTodayIcon sx={{ color: "#fff", fontSize: 28 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Finalizadas */}
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: "0 0 15px rgba(0,0,0,0.1)",
          borderLeft: "4px solid #757575"
        }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ marginBottom: "0.5rem" }}>
                  Finalizadas
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 600, color: "#212529" }}>
                  {stats.completed}
                </Typography>
              </Box>
              <Box sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: "50%", 
                backgroundColor: "#757575",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <AccessTimeIcon sx={{ color: "#fff", fontSize: 28 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Búsqueda y Filtros */}
      <Card sx={{ background: "#fff", borderRadius: 2, padding: "1.5rem", marginBottom: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            placeholder="Buscar por nombre o fecha..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: "#757575", mr: 1 }} />,
            }}
            sx={{ flexGrow: 1, minWidth: 300 }}
            size="small"
          />
          <FormControl sx={{ minWidth: 180 }} size="small">
            <InputLabel>Todos los estados</InputLabel>
            <Select
              value={estadoFilter}
              label="Todos los estados"
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <MenuItem value="">Todos los estados</MenuItem>
              <MenuItem value="scheduled">Programada</MenuItem>
              <MenuItem value="active">Activa</MenuItem>
              <MenuItem value="completed">Finalizada</MenuItem>
              <MenuItem value="cancelled">Cancelada</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 180 }} size="small">
            <InputLabel>Todos los tipos</InputLabel>
            <Select
              value={tipoFilter}
              label="Todos los tipos"
              onChange={(e) => setTipoFilter(e.target.value)}
            >
              <MenuItem value="">Todos los tipos</MenuItem>
              <MenuItem value="assembly">Asamblea</MenuItem>
              <MenuItem value="voting">Votación</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Card>

      {/* Mensajes */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* Tabla */}
      <Card sx={{ background: "#fff", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#eaf6ff" }}>
                <TableCell sx={{ fontWeight: 600, color: "#212529" }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#212529" }}>Fecha inicio</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#212529" }}>Fecha cierre</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#212529" }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#212529" }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#212529" }}>N° inscritos</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#212529" }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ padding: "3rem" }}>
                    <Typography>Cargando...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredAssemblies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ padding: "3rem" }}>
                    <Typography>No hay asambleas registradas</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssemblies.map((assembly) => (
                  <TableRow 
                    key={assembly._id} 
                    hover
                    sx={{ "&:hover": { backgroundColor: "#f8f9fa" } }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{assembly.Nombre}</TableCell>
                    <TableCell>{formatDateShort(assembly.FechaInicio)} {new Date(assembly.FechaInicio).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                    <TableCell>{formatDateShort(assembly.FechaCierre)} {new Date(assembly.FechaCierre).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                    <TableCell>{getTipoLabel(assembly.Tipo)}</TableCell>
                    <TableCell>
                      {(() => {
                        const realStatus = getRealStatus(assembly);
                        return (
                          <Chip
                            label={getStatusLabel(realStatus)}
                            size="small"
                            sx={{
                              backgroundColor: 
                                realStatus === "active" ? "#4caf50" :
                                realStatus === "scheduled" ? "#2196f3" :
                                realStatus === "completed" ? "#757575" :
                                "#f44336",
                              color: "#fff",
                              fontWeight: 500,
                            }}
                            avatar={
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  backgroundColor: "#fff",
                                  marginLeft: "4px",
                                }}
                              />
                            }
                          />
                        );
                      })()}
                    </TableCell>
                    <TableCell>{assembly.NumeroInscritos}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetail(assembly._id)}
                          title="Ver Detalle"
                          sx={{ color: "#757575" }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(assembly._id)}
                          title="Editar"
                          sx={{ color: "#757575" }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(assembly._id)}
                          title={
                            assembly.NumeroInscritos > 0
                              ? "No se puede eliminar una asamblea con participantes registrados"
                              : "Eliminar"
                          }
                          disabled={assembly.NumeroInscritos > 0}
                          sx={{ 
                            color: assembly.NumeroInscritos > 0 ? "#ccc" : "#757575",
                            "&:hover": {
                              color: assembly.NumeroInscritos > 0 ? "#ccc" : "#f44336",
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          title="Participantes"
                          sx={{ color: "#757575" }}
                          onClick={() => handleViewDetail(assembly._id)}
                        >
                          <PeopleIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          title="Crear Votación"
                          sx={{ color: "#03A9F4" }}
                          onClick={() => navigate(`/create-voting/${assembly._id}`)}
                        >
                          <HowToVoteIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          title="Gestionar Documentos"
                          sx={{ color: "#9C27B0" }}
                          onClick={() => handleDocumentsClick(assembly._id)}
                        >
                          <DescriptionIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
        <Button variant="outlined" onClick={() => navigate("/dashboard")}>
          Volver al Panel
        </Button>
      </Box>

      {/* Modal Ver Detalle */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          borderBottom: "1px solid #e0e0e0",
          pb: 2
        }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: "#212529", mb: 0.5 }}>
              Detalle de la Asamblea
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Información completa del evento y participantes
            </Typography>
          </Box>
          <IconButton onClick={() => setDetailModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedAssembly && (
            <Box>
              {/* Nombre y Estado */}
              <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: "#212529" }}>
                  {selectedAssembly.name || selectedAssembly.Nombre}
                </Typography>
                {selectedAssembly.Estado && (
                  <Chip
                    label={getStatusLabel(selectedAssembly.Estado)}
                    size="small"
                    sx={{
                      backgroundColor: 
                        selectedAssembly.Estado === "active" ? "#4caf50" :
                        selectedAssembly.Estado === "scheduled" ? "#2196f3" :
                        selectedAssembly.Estado === "completed" ? "#757575" :
                        "#f44336",
                      color: "#fff",
                      fontWeight: 500,
                    }}
                  />
                )}
              </Box>

              {/* Detalles principales */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarTodayIcon sx={{ color: "#757575" }} />
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Fecha de inicio
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(selectedAssembly.FechaInicio || selectedAssembly.startDateTime || "")}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AccessTimeIcon sx={{ color: "#757575" }} />
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Fecha de cierre
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(selectedAssembly.FechaCierre || selectedAssembly.endDateTime || "")}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ fontSize: 20 }}>📄</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Tipo
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedAssembly.Tipo ? getTipoLabel(selectedAssembly.Tipo) : "-"}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PeopleIcon sx={{ color: "#757575" }} />
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Participantes inscritos
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedAssembly.NumeroInscritos || selectedAssembly.participants?.length || 0}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Descripción */}
              {selectedAssembly.description && (
                <Box sx={{ mb: 3, borderTop: "1px solid #e0e0e0", pt: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                    Descripción
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedAssembly.description}
                  </Typography>
                </Box>
              )}
              
              {/* Lista de Participantes */}
              {selectedAssembly.participants && selectedAssembly.participants.length > 0 && (
                <Box sx={{ mb: 3, borderTop: "1px solid #e0e0e0", pt: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <PeopleIcon sx={{ fontSize: 20 }} />
                    Lista de Participantes
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300, overflow: "auto" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                          <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Rol</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedAssembly.participants.map((participant: any) => (
                          <TableRow key={participant._id}>
                            <TableCell sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <PersonIcon sx={{ fontSize: 18, color: "#757575" }} />
                              {participant.firstName} {participant.lastName}
                            </TableCell>
                            <TableCell>Participante</TableCell>
                            <TableCell>
                              <Chip
                                label="Confirmado"
                                size="small"
                                sx={{
                                  backgroundColor: "#2196f3",
                                  color: "#fff",
                                  fontSize: "0.75rem",
                                  height: 24,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Historial de Cambios */}
              {auditHistory.length > 0 && (
                <Box sx={{ borderTop: "1px solid #e0e0e0", pt: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <HistoryIcon sx={{ fontSize: 20 }} />
                    Historial de Cambios
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                          <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Acción</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {auditHistory.map((log: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              {new Date(log.createdAt).toLocaleString("es-ES", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell>
                              {log.action === "create" ? "Creación" :
                               log.action === "edit" ? "Edición" :
                               log.action === "delete" ? "Eliminación" : log.action}
                              {log.details?.newData?.description && log.details?.previousData?.description && 
                                log.action === "edit" && " de descripción"}
                            </TableCell>
                            <TableCell>
                              {log.userId?.firstName} {log.userId?.lastName || "Admin Principal"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid #e0e0e0", p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setDetailModalOpen(false);
              if (selectedAssembly?._id) {
                navigate(`/create-voting/${selectedAssembly._id}`);
              }
            }}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              minWidth: 200,
              height: 40,
              backgroundColor: "#03A9F4",
              color: "#ffffff",
              "&:hover": {
                backgroundColor: "#2196F3",
                boxShadow: "0 8px 22px rgba(33,150,243,0.18)",
              },
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              boxShadow: "0 6px 18px rgba(3,169,244,0.20)",
            }}
          >
            Crear Votación
          </Button>
          <Button onClick={() => setDetailModalOpen(false)} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Editar */}
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "flex-start",
          borderBottom: "1px solid #e0e0e0",
          pb: 2
        }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: "#212529", mb: 0.5 }}>
              Editar Asamblea
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Modifica la información de la asamblea. Solo se pueden editar asambleas que no han iniciado.
            </Typography>
          </Box>
          <IconButton onClick={() => setEditModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Nombre de la asamblea"
              fullWidth
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              variant="outlined"
            />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Fecha de inicio
                </Typography>
                <TextField
                  type="datetime-local"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={editForm.startDateTime}
                  onChange={(e) => setEditForm({ ...editForm, startDateTime: e.target.value })}
                  variant="outlined"
                />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Fecha de cierre
                </Typography>
                <TextField
                  type="datetime-local"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={editForm.endDateTime}
                  onChange={(e) => setEditForm({ ...editForm, endDateTime: e.target.value })}
                  variant="outlined"
                />
              </Box>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Tipo de asamblea
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={selectedAssembly?.Tipo || ""}
                  disabled
                  variant="outlined"
                >
                  <MenuItem value="assembly">Asamblea</MenuItem>
                  <MenuItem value="voting">Votación</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Descripción
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                variant="outlined"
                placeholder="Descripción de la asamblea..."
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid #e0e0e0", p: 2, gap: 1 }}>
          <Button onClick={() => setEditModalOpen(false)} variant="outlined">
            Cancelar
          </Button>
          <Button onClick={handleEditSubmit} variant="contained" sx={{ textTransform: "none" }}>
            Guardar cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Eliminar */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: "#212529" }}>
          ¿Está seguro de eliminar esta asamblea?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="textSecondary">
            Esta acción eliminará permanentemente la asamblea "{selectedAssembly?.name || selectedAssembly?.Nombre}". Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setDeleteModalOpen(false)} 
            variant="outlined"
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            sx={{ 
              backgroundColor: "#f44336",
              "&:hover": { backgroundColor: "#d32f2f" },
              textTransform: "none"
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Gestionar Documentos */}
      <Dialog
        open={documentsModalOpen}
        onClose={() => setDocumentsModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: "#212529", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Gestionar Documentos</span>
          <IconButton onClick={() => setDocumentsModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="textSecondary">
              Solo los documentos aprobados son visibles para los participantes
            </Typography>
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={() => setUploadDocumentOpen(true)}
              sx={{
                backgroundColor: "#1976d2",
                textTransform: "none",
                "&:hover": { backgroundColor: "#1565c0" },
              }}
            >
              Cargar Documento
            </Button>
          </Box>
          {documents.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: "center", py: 4 }}>
              No hay documentos cargados para esta asamblea
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#eaf6ff" }}>
                    <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Archivo</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tamaño</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Subido por</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc._id}>
                      <TableCell>{doc.name}</TableCell>
                      <TableCell>{doc.originalFileName}</TableCell>
                      <TableCell>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</TableCell>
                      <TableCell>
                        {doc.uploadedBy?.firstName} {doc.uploadedBy?.lastName}
                      </TableCell>
                      <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            doc.status === "pending"
                              ? "Pendiente"
                              : doc.status === "approved"
                              ? "Aprobado"
                              : "Rechazado"
                          }
                          color={
                            doc.status === "pending"
                              ? "warning"
                              : doc.status === "approved"
                              ? "success"
                              : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handlePreviewDocument(doc)}
                            title="Vista previa"
                            sx={{ color: "#1976d2" }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadDocument(doc._id, doc.originalFileName)}
                            title="Descargar"
                            sx={{ color: "#1976d2" }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                          {doc.status === "pending" && (
                            <IconButton
                              size="small"
                              onClick={() => handleValidateClick(doc)}
                              title="Validar"
                              sx={{ color: "#ff9800" }}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleViewHistory(doc._id)}
                            title="Ver historial"
                            sx={{ color: "#9c27b0" }}
                          >
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteDocument(doc._id)}
                            title="Eliminar"
                            sx={{ color: "#f44336" }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Cargar Documento */}
      <Dialog
        open={uploadDocumentOpen}
        onClose={() => {
          setUploadDocumentOpen(false);
          setDocumentForm({ name: "", file: null });
        }}
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: "#212529" }}>
          Cargar Documento
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Nombre del documento *"
              value={documentForm.name}
              onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
              variant="outlined"
              required
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              sx={{ textTransform: "none" }}
            >
              Seleccionar archivo (PDF, JPG, PNG - Máx. 10MB)
              <input
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setDocumentForm({ ...documentForm, file });
                  }
                }}
              />
            </Button>
            {documentForm.file && (
              <Typography variant="body2" color="textSecondary">
                Archivo seleccionado: {documentForm.file.name} ({(documentForm.file.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setUploadDocumentOpen(false);
              setDocumentForm({ name: "", file: null });
            }}
            variant="outlined"
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUploadDocument}
            variant="contained"
            sx={{
              backgroundColor: "#1976d2",
              textTransform: "none",
              "&:hover": { backgroundColor: "#1565c0" },
            }}
            disabled={!documentForm.name || !documentForm.file}
          >
            Cargar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Validar Documento */}
      <Dialog
        open={validateModalOpen}
        onClose={() => {
          setValidateModalOpen(false);
          setValidateForm({ status: "approved", observations: "" });
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: "#212529" }}>
          Validar Documento
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Documento: {selectedDocument?.name}
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={validateForm.status}
                label="Estado"
                onChange={(e) =>
                  setValidateForm({
                    ...validateForm,
                    status: e.target.value as "approved" | "rejected",
                  })
                }
              >
                <MenuItem value="approved">Aprobar</MenuItem>
                <MenuItem value="rejected">Rechazar</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label={validateForm.status === "rejected" ? "Observaciones *" : "Observaciones (opcional)"}
              value={validateForm.observations}
              onChange={(e) =>
                setValidateForm({ ...validateForm, observations: e.target.value })
              }
              multiline
              rows={4}
              variant="outlined"
              required={validateForm.status === "rejected"}
              helperText={
                validateForm.status === "rejected"
                  ? "Las observaciones son obligatorias para rechazar un documento"
                  : "Puede agregar observaciones adicionales"
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setValidateModalOpen(false);
              setValidateForm({ status: "approved", observations: "" });
            }}
            variant="outlined"
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleValidateSubmit}
            variant="contained"
            sx={{
              backgroundColor:
                validateForm.status === "approved" ? "#4caf50" : "#f44336",
              textTransform: "none",
              "&:hover": {
                backgroundColor:
                  validateForm.status === "approved" ? "#45a049" : "#d32f2f",
              },
            }}
            disabled={
              validateForm.status === "rejected" &&
              !validateForm.observations.trim()
            }
          >
            {validateForm.status === "approved" ? "Aprobar" : "Rechazar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Vista Previa Documento */}
      <Dialog
        open={previewModalOpen}
        onClose={() => {
          if (previewUrl) {
            window.URL.revokeObjectURL(previewUrl);
          }
          setPreviewModalOpen(false);
          setSelectedDocument(null);
          setPreviewUrl(null);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            color: "#212529",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Vista Previa: {selectedDocument?.name}</span>
          <IconButton
            onClick={() => {
              if (previewUrl) {
                window.URL.revokeObjectURL(previewUrl);
              }
              setPreviewModalOpen(false);
              setSelectedDocument(null);
              setPreviewUrl(null);
            }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedDocument && previewUrl ? (
            <Box sx={{ mt: 2 }}>
              {selectedDocument.mimeType === "application/pdf" ? (
                <iframe
                  src={previewUrl}
                  width="100%"
                  height="600px"
                  style={{ border: "none" }}
                  title={selectedDocument.name}
                />
              ) : selectedDocument.mimeType?.startsWith("image/") ? (
                <Box sx={{ textAlign: "center" }}>
                  <img
                    src={previewUrl}
                    alt={selectedDocument.name}
                    style={{ maxWidth: "100%", height: "auto", maxHeight: "600px" }}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Vista previa no disponible para este tipo de archivo
                </Typography>
              )}
            </Box>
          ) : (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              if (previewUrl) {
                window.URL.revokeObjectURL(previewUrl);
              }
              setPreviewModalOpen(false);
              setSelectedDocument(null);
              setPreviewUrl(null);
            }}
            variant="outlined"
            sx={{ textTransform: "none" }}
          >
            Cerrar
          </Button>
          {selectedDocument && (
            <Button
              onClick={() =>
                handleDownloadDocument(
                  selectedDocument._id,
                  selectedDocument.originalFileName
                )
              }
              variant="contained"
              startIcon={<DownloadIcon />}
              sx={{
                backgroundColor: "#1976d2",
                textTransform: "none",
                "&:hover": { backgroundColor: "#1565c0" },
              }}
            >
              Descargar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Modal Historial de Validación */}
      <Dialog
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            color: "#212529",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Historial de Validación</span>
          <IconButton onClick={() => setHistoryModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {validationHistory.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: "center", py: 4 }}>
              No hay historial de validación para este documento
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#eaf6ff" }}>
                    <TableCell sx={{ fontWeight: 600 }}>Acción</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Estado Anterior</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Estado Nuevo</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Observaciones</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validationHistory.map((h: any) => (
                    <TableRow key={h._id}>
                      <TableCell>
                        <Chip
                          label={
                            h.action === "upload"
                              ? "Carga"
                              : h.action === "approve"
                              ? "Aprobación"
                              : "Rechazo"
                          }
                          color={
                            h.action === "upload"
                              ? "default"
                              : h.action === "approve"
                              ? "success"
                              : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {h.userId?.firstName} {h.userId?.lastName}
                      </TableCell>
                      <TableCell>
                        {h.previousStatus
                          ? h.previousStatus === "pending"
                            ? "Pendiente"
                            : h.previousStatus === "approved"
                            ? "Aprobado"
                            : "Rechazado"
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {h.newStatus
                          ? h.newStatus === "pending"
                            ? "Pendiente"
                            : h.newStatus === "approved"
                            ? "Aprobado"
                            : "Rechazado"
                          : "-"}
                      </TableCell>
                      <TableCell>{h.observations || "-"}</TableCell>
                      <TableCell>{formatDate(h.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

