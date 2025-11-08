import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Chip,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

interface Assembly {
  _id: string;
  Nombre: string;
  FechaInicio: string;
  FechaCierre: string;
  Tipo: "assembly" | "voting";
  Estado: "scheduled" | "active" | "completed" | "cancelled";
  NumeroInscritos: number;
}

export default function SelectAssemblyForVoting() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchAssemblies();
  }, [user, navigate]);

  const fetchAssemblies = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/assemblies/listar", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filtrar solo asambleas activas o programadas
      const filtered = (response.data.assemblies || []).filter(
        (a: Assembly) => a.Estado === "active" || a.Estado === "scheduled"
      );
      setAssemblies(filtered);
    } catch (err: any) {
      setError("Error al cargar las asambleas");
    } finally {
      setLoading(false);
    }
  };

  const filteredAssemblies = assemblies.filter((assembly) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return assembly.Nombre.toLowerCase().includes(query);
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
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

  const getStatusColor = (status: string) => {
    return status === "active" ? "#4caf50" : "#2196f3";
  };

  return (
    <Box sx={{ backgroundColor: "#f5f5f5", minHeight: "100vh", padding: "2rem" }}>
      {/* Header */}
      <Box sx={{ marginBottom: "2rem" }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: "#212529", marginBottom: "0.5rem" }}>
          Crear Votación
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Seleccione una asamblea activa o programada para crear una pregunta de votación
        </Typography>
      </Box>

      {/* Búsqueda */}
      <Card sx={{ background: "#fff", borderRadius: 2, padding: "1.5rem", marginBottom: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <TextField
          fullWidth
          placeholder="Buscar por nombre de asamblea..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: "#757575", mr: 1 }} />,
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              "&:hover fieldset": {
                borderColor: "#03A9F4",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#03A9F4",
              },
            },
          }}
        />
      </Card>

      {/* Mensajes */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Tabla */}
      <Card sx={{ background: "#fff", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                <TableCell sx={{ fontWeight: 600, color: "#212529" }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#212529" }}>Fecha inicio</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#212529" }}>Fecha cierre</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#212529" }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#212529" }}>Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ padding: "3rem" }}>
                    <Typography>Cargando...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredAssemblies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ padding: "3rem" }}>
                    <Typography>No hay asambleas activas o programadas disponibles</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssemblies.map((assembly) => (
                  <TableRow key={assembly._id} hover sx={{ "&:hover": { backgroundColor: "#f8f9fa" } }}>
                    <TableCell sx={{ fontWeight: 500 }}>{assembly.Nombre}</TableCell>
                    <TableCell>{formatDate(assembly.FechaInicio)}</TableCell>
                    <TableCell>{formatDate(assembly.FechaCierre)}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(assembly.Estado)}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(assembly.Estado),
                          color: "#fff",
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        onClick={() => navigate(`/create-voting/${assembly._id}`)}
                        sx={{
                          backgroundColor: "#03A9F4",
                          "&:hover": {
                            backgroundColor: "#2196F3",
                          },
                          textTransform: "none",
                          fontWeight: 500,
                        }}
                      >
                        Crear Votación
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
        <Button
          variant="outlined"
          onClick={() => navigate("/dashboard")}
          sx={{
            borderColor: "#757575",
            color: "#757575",
            "&:hover": {
              borderColor: "#424242",
            },
          }}
        >
          Volver al Dashboard
        </Button>
      </Box>
    </Box>
  );
}

