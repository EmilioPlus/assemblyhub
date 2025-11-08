import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, Typography, Box, TextField, InputAdornment, Alert, Chip } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EventIcon from "@mui/icons-material/Event";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import PersonIcon from "@mui/icons-material/Person";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import {
  StyledContainer,
  StyledCard,
  StyledTitle,
  StyledActionCard,
  StyledBackLink,
} from "../Styles/ParticipantArea.styles";

interface Assembly {
  _id: string;
  name: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  processType: "assembly" | "voting";
  participants: string[];
}

export default function ParticipantArea() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssemblies = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/assemblies", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAssemblies(response.data.assemblies || []);
      } catch (err: any) {
        setError(err.response?.data?.msg || "Error al cargar las asambleas");
      } finally {
        setLoading(false);
      }
    };

    fetchAssemblies();
  }, [token]);

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleJoinAssembly = async (assemblyId: string) => {
    try {
      setRegistering(assemblyId);
      await axios.post(
        `http://localhost:5000/api/assemblies/${assemblyId}/register`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Actualizar el estado local para reflejar la inscripción
      setAssemblies(assemblies.map(assembly => 
        assembly._id === assemblyId 
          ? { ...assembly, participants: [...assembly.participants, user?._id || ""] }
          : assembly
      ));
      
      setError("");
      alert("Te has inscrito exitosamente a la asamblea");
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al inscribirse a la asamblea");
    } finally {
      setRegistering(null);
    }
  };

  const handleViewEvents = () => {
    alert("Accediendo a eventos. Esta funcionalidad se implementará próximamente.");
  };

  const handleRegisterDelegate = () => {
    navigate("/delegate-registration");
  };

  const getAssemblyStatus = (startDateTime: string, endDateTime: string) => {
    const now = new Date();
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (now < start) return "Próxima";
    if (now >= start && now <= end) return "En curso";
    return "Finalizada";
  };

  const isUserRegistered = (assembly: Assembly) => {
    return user && assembly.participants.includes(user._id);
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

  const filteredAssemblies = assemblies.filter(assembly =>
    assembly.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <StyledContainer>
      <StyledCard>
        <StyledTitle>Área de Participantes</StyledTitle>
        <p style={{ color: "#757575", marginBottom: "2rem", textAlign: "center" }}>
          Inscríbase en asambleas y acceda a eventos disponibles
        </p>

        {/* Search */}
        <TextField
          variant="outlined"
          fullWidth
          placeholder="Buscar asambleas..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#1976d2" }} />
              </InputAdornment>
            ),
          }}
          sx={{ marginBottom: "2rem" }}
        />

        {/* Quick Actions */}
        <Box sx={{ display: 'flex', gap: 2, marginBottom: "2rem", flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '280px' }}>
            <StyledActionCard onClick={handleViewEvents}>
              <CardContent>
                <EventIcon sx={{ fontSize: 40, color: "#1976d2", marginBottom: "1rem" }} />
                <Typography variant="h6" component="div">
                  Eventos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Acceda a eventos y actividades programadas
                </Typography>
              </CardContent>
            </StyledActionCard>
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: '280px' }}>
            <StyledActionCard>
              <CardContent>
                <GroupAddIcon sx={{ fontSize: 40, color: "#1976d2", marginBottom: "1rem" }} />
                <Typography variant="h6" component="div">
                  Mis Inscripciones
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vea las asambleas en las que está inscrito
                </Typography>
              </CardContent>
            </StyledActionCard>
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: '280px' }}>
            <StyledActionCard onClick={handleRegisterDelegate}>
              <CardContent>
                <PersonIcon sx={{ fontSize: 40, color: "#1976d2", marginBottom: "1rem" }} />
                <Typography variant="h6" component="div">
                  Registrar Delegado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Designe una persona que lo represente
                </Typography>
              </CardContent>
            </StyledActionCard>
          </Box>
        </Box>

        {/* Available Assemblies */}
        <Typography variant="h5" sx={{ marginBottom: "1rem", color: "#424242" }}>
          Asambleas Disponibles
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {loading ? (
          <Alert severity="info">Cargando asambleas...</Alert>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {filteredAssemblies.map((assembly) => {
                const status = getAssemblyStatus(assembly.startDateTime, assembly.endDateTime);
                const isRegistered = isUserRegistered(assembly);
                const statusColors: { [key: string]: string } = {
                  "Próxima": "#ff9800",
                  "En curso": "#4caf50",
                  "Finalizada": "#f44336"
                };

                return (
                  <Card key={assembly._id} sx={{ 
                    backgroundColor: "#fff",
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                    },
                  }}>
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                        <Typography variant="h6" component="div">
                          {assembly.name}
                        </Typography>
                        <Chip
                          label={assembly.processType === "assembly" ? "Asamblea" : "Votación"}
                          size="small"
                          color="primary"
                        />
                      </Box>
                      
                      {assembly.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ marginBottom: "0.5rem" }}>
                          {assembly.description}
                        </Typography>
                      )}
                      
                      <Typography variant="body2" color="text.secondary" sx={{ marginBottom: "0.25rem" }}>
                        <strong>Inicio:</strong> {formatDate(assembly.startDateTime)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ marginBottom: "0.5rem" }}>
                        <strong>Fin:</strong> {formatDate(assembly.endDateTime)}
                      </Typography>
                      
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: statusColors[status] || "#757575",
                          fontWeight: "bold",
                          marginBottom: "0.5rem"
                        }}
                      >
                        Estado: {status}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", marginBottom: "0.5rem" }}>
                        {assembly.participants.length} participante{assembly.participants.length !== 1 ? "s" : ""}
                      </Typography>

                      {isRegistered ? (
                        <Button
                          variant="outlined"
                          fullWidth
                          disabled
                          sx={{
                            borderColor: "#4caf50",
                            color: "#4caf50",
                          }}
                        >
                          Ya estás inscrito
                        </Button>
                      ) : status !== "Finalizada" ? (
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => handleJoinAssembly(assembly._id)}
                          disabled={registering === assembly._id}
                          sx={{
                            backgroundColor: "#1976d2",
                            "&:hover": { backgroundColor: "#1565c0" },
                          }}
                        >
                          {registering === assembly._id ? "Inscribiendo..." : "Inscribirse"}
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          fullWidth
                          disabled
                          sx={{
                            borderColor: "#f44336",
                            color: "#f44336",
                          }}
                        >
                          Finalizada
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>

            {filteredAssemblies.length === 0 && !loading && (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", marginTop: "2rem" }}>
                No se encontraron asambleas.
              </Typography>
            )}
          </>
        )}

        <StyledBackLink>
          <Button onClick={handleBackToDashboard} variant="outlined">
            Volver al Dashboard
          </Button>
        </StyledBackLink>
      </StyledCard>
    </StyledContainer>
  );
}
