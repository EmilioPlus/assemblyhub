import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography, Alert, Chip } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import {
  StyledContainer,
  StyledTitleCard,
  StyledAssembliesGrid,
  StyledAssemblyCard,
  StyledStatusBadge,
  StyledBackButton,
} from "../Styles/AssemblyList.styles";

interface Assembly {
  _id: string;
  name: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  processType: "assembly" | "voting";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdBy: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participants: any[];
  createdAt: string;
  updatedAt: string;
}

export default function AssemblyList() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAssemblies = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/assemblies", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAssemblies(response.data.assemblies || []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.response?.data?.msg || "Error al cargar las asambleas");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAssemblies();
    }
  }, [token]);

  const getStatus = (startDateTime: string, endDateTime: string) => {
    const now = new Date();
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (now < start) return { status: "upcoming", label: "Próxima" };
    if (now >= start && now <= end) return { status: "active", label: "En curso" };
    return { status: "finished", label: "Finalizada" };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <StyledContainer>
        <Alert severity="info">Cargando asambleas...</Alert>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      <StyledTitleCard>
        <Typography variant="h4" color="primary" gutterBottom>
          Listado de Asambleas
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Aquí puedes ver todas las asambleas creadas en el sistema
        </Typography>
      </StyledTitleCard>

      {error && <Alert severity="error" sx={{ mb: 2, width: "90%", maxWidth: 1200 }}>{error}</Alert>}

      {assemblies.length === 0 ? (
        <Alert severity="info" sx={{ width: "90%", maxWidth: 1200 }}>
          No hay asambleas registradas
        </Alert>
      ) : (
        <StyledAssembliesGrid>
          {assemblies.map((assembly) => {
            const status = getStatus(assembly.startDateTime, assembly.endDateTime);
            return (
              <StyledAssemblyCard key={assembly._id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                  <Typography variant="h6" color="textPrimary" sx={{ fontWeight: 600 }}>
                    {assembly.name}
                  </Typography>
                  <StyledStatusBadge status={status.status}>
                    {status.label}
                  </StyledStatusBadge>
                </div>

                {assembly.description && (
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    {assembly.description}
                  </Typography>
                )}

                <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.5 }}>
                  <strong>Inicio:</strong> {formatDate(assembly.startDateTime)}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 1 }}>
                  <strong>Fin:</strong> {formatDate(assembly.endDateTime)}
                </Typography>

                <Chip
                  label={assembly.processType === "assembly" ? "Asamblea" : "Votación"}
                  size="small"
                  color="primary"
                  sx={{ mr: 1 }}
                />
                <Typography variant="caption" color="textSecondary">
                  {assembly.participants.length} participante{assembly.participants.length !== 1 ? "s" : ""}
                </Typography>
              </StyledAssemblyCard>
            );
          })}
        </StyledAssembliesGrid>
      )}

      <StyledBackButton>
        <Button
          variant="contained"
          onClick={() => navigate("/dashboard")}
          sx={{ borderRadius: 8, textTransform: "none" }}
        >
          Volver al Panel
        </Button>
      </StyledBackButton>
    </StyledContainer>
  );
}
