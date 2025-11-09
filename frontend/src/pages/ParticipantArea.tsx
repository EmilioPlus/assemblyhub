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
  participants: string[] | any[]; // Puede ser array de strings (IDs) o objetos (populated)
}

export default function ParticipantArea() {
  const navigate = useNavigate();
  const { user, token, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registering, setRegistering] = useState<string | null>(null);

  // Log para debug
  useEffect(() => {
    console.log("ParticipantArea - User state:", { user, hasUser: !!user, userId: user?._id, token: !!token, authLoading });
  }, [user, token, authLoading]);

  useEffect(() => {
    const fetchAssemblies = async () => {
      // Esperar a que el contexto de autenticación termine de cargar
      if (authLoading) {
        return;
      }
      
      // Si no hay token, no hacer la petición
      if (!token) {
        setLoading(false);
        setError("No hay sesión activa. Por favor, inicia sesión.");
        return;
      }
      
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/assemblies", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Normalizar los datos de las asambleas
        const assembliesData = (response.data.assemblies || []).map((assembly: any) => ({
          _id: assembly._id,
          name: assembly.name || assembly.Nombre,
          description: assembly.description,
          startDateTime: assembly.startDateTime || assembly.FechaInicio,
          endDateTime: assembly.endDateTime || assembly.FechaCierre,
          processType: assembly.processType || assembly.Tipo,
          participants: assembly.participants || [],
        }));
        
        console.log("Assemblies fetched:", assembliesData);
        setAssemblies(assembliesData);
        setError(""); // Limpiar errores previos
      } catch (err: any) {
        setError(err.response?.data?.msg || "Error al cargar las asambleas");
      } finally {
        setLoading(false);
      }
    };

    fetchAssemblies();
  }, [token, authLoading]);

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
      
      // Recargar las asambleas para obtener la estructura correcta desde el backend
      const refreshResponse = await axios.get("http://localhost:5000/api/assemblies", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Normalizar los datos de las asambleas
      const assembliesData = (refreshResponse.data.assemblies || []).map((assembly: any) => ({
        _id: assembly._id,
        name: assembly.name || assembly.Nombre,
        description: assembly.description,
        startDateTime: assembly.startDateTime || assembly.FechaInicio,
        endDateTime: assembly.endDateTime || assembly.FechaCierre,
        processType: assembly.processType || assembly.Tipo,
        participants: assembly.participants || [],
      }));
      
      setAssemblies(assembliesData);
      setError("");
      alert("Te has inscrito exitosamente a la asamblea");
    } catch (err: any) {
      const errorMsg = err.response?.data?.msg || "Error al inscribirse a la asamblea";
      
      // Si el error es que ya está inscrito, recargar las asambleas para actualizar el estado
      if (errorMsg.toLowerCase().includes("ya estás inscrito") || errorMsg.toLowerCase().includes("ya está inscrito")) {
        // Recargar las asambleas para actualizar el estado
        try {
          const refreshResponse = await axios.get("http://localhost:5000/api/assemblies", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          const assembliesData = (refreshResponse.data.assemblies || []).map((assembly: any) => ({
            _id: assembly._id,
            name: assembly.name || assembly.Nombre,
            description: assembly.description,
            startDateTime: assembly.startDateTime || assembly.FechaInicio,
            endDateTime: assembly.endDateTime || assembly.FechaCierre,
            processType: assembly.processType || assembly.Tipo,
            participants: assembly.participants || [],
          }));
          
          setAssemblies(assembliesData);
          setError(""); // Limpiar el error ya que el usuario ya está inscrito
        } catch (refreshError) {
          setError(errorMsg);
        }
      } else {
        setError(errorMsg);
      }
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
    // Obtener el ID del usuario (puede ser _id o id)
    const userId = user?._id || (user as any)?.id;
    
    if (!user || !userId) {
      console.log("isUserRegistered: No user or userId", { 
        hasUser: !!user, 
        userId: userId,
        userObject: user 
      });
      return false;
    }
    
    if (!assembly.participants || !Array.isArray(assembly.participants) || assembly.participants.length === 0) {
      console.log("isUserRegistered: No participants", { assemblyId: assembly._id, participants: assembly.participants });
      return false;
    }
    
    // Verificar si el usuario está en la lista de participantes
    // El array puede contener strings (IDs) u objetos (cuando está populated)
    const isRegistered = assembly.participants.some((participant: any) => {
      // Si el participante es un string (ID directo)
      if (typeof participant === 'string') {
        const matches = participant.toString() === userId.toString();
        if (matches) console.log("✅ Match found (string):", { participant, userId });
        return matches;
      } 
      // Si el participante es un objeto con _id
      else if (participant && participant._id) {
        const matches = participant._id.toString() === userId.toString();
        if (matches) console.log("✅ Match found (object with _id):", { participantId: participant._id, userId });
        return matches;
      }
      // Si el participante es un objeto con id (por si acaso)
      else if (participant && participant.id) {
        const matches = participant.id.toString() === userId.toString();
        if (matches) console.log("✅ Match found (object with id):", { participantId: participant.id, userId });
        return matches;
      }
      return false;
    });
    
    console.log("isUserRegistered result:", { 
      assemblyId: assembly._id, 
      assemblyName: assembly.name,
      userId: userId, 
      participants: assembly.participants.map((p: any) => {
        if (typeof p === 'string') return p;
        return p._id || p.id || 'no id';
      }),
      isRegistered 
    });
    
    return isRegistered;
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
                const isActive = status === "En curso";
                const statusColors: { [key: string]: string } = {
                  "Próxima": "#ff9800",
                  "En curso": "#4caf50",
                  "Finalizada": "#f44336"
                };
                
                // Debug logs
                console.log("Assembly card render:", {
                  assemblyId: assembly._id,
                  assemblyName: assembly.name,
                  status,
                  isRegistered,
                  isActive,
                  startDateTime: assembly.startDateTime,
                  endDateTime: assembly.endDateTime,
                  participantsCount: assembly.participants?.length || 0,
                });

                // Manejar clic en la tarjeta si está registrado y la asamblea está activa
                const handleCardClick = (e: React.MouseEvent) => {
                  // Solo navegar si se hace clic en la tarjeta, no en el botón u otros elementos interactivos
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.closest('a') || target.tagName === 'BUTTON' || target.tagName === 'A') {
                    return; // Si se hizo clic en un botón o enlace, no hacer nada aquí
                  }
                  
                  if (isRegistered && isActive) {
                    console.log("Clic en tarjeta - Navegando a:", `/voting/${assembly._id}`, { isRegistered, isActive, status });
                    // Redirigir directamente a la sala de votación/evento en vivo
                    // El backend validará que el usuario esté inscrito
                    navigate(`/voting/${assembly._id}`);
                  } else {
                    console.log("Clic en tarjeta - No navegando", { isRegistered, isActive, status });
                  }
                };

                return (
                  <Card 
                    key={assembly._id} 
                    sx={{ 
                      backgroundColor: "#fff",
                      borderRadius: 12,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      transition: "all 0.2s ease-in-out",
                      cursor: isRegistered && isActive ? "pointer" : "default",
                      border: isRegistered && isActive ? "2px solid transparent" : "2px solid transparent",
                      position: "relative",
                      "&:hover": {
                        transform: isRegistered && isActive ? "translateY(-4px)" : "translateY(-2px)",
                        boxShadow: isRegistered && isActive 
                          ? "0 8px 24px rgba(76, 175, 80, 0.25)" 
                          : "0 6px 16px rgba(0,0,0,0.12)",
                        border: isRegistered && isActive ? "2px solid #4caf50" : "2px solid transparent",
                      },
                    }}
                    onClick={handleCardClick}
                  >
                    {isRegistered && isActive && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          backgroundColor: "#4caf50",
                          color: "#fff",
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          zIndex: 1,
                        }}
                      >
                        Clic para ingresar
                      </Box>
                    )}
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                        <Typography variant="h6" component="div" sx={{ pr: isRegistered && isActive ? 8 : 0 }}>
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
                        {Array.isArray(assembly.participants) ? assembly.participants.length : 0} participante{(Array.isArray(assembly.participants) ? assembly.participants.length : 0) !== 1 ? "s" : ""}
                      </Typography>

                      {(() => {
                        // Determinar qué botón mostrar basado en el estado
                        // Si está registrado Y la asamblea está activa, mostrar botón para ingresar
                        if (isRegistered && isActive) {
                          return (
                            <Button
                              variant="contained"
                              fullWidth
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log("✅ Botón 'Ingresar al evento en vivo' clickeado");
                                console.log("Navegando a:", `/voting/${assembly._id}`);
                                console.log("Estado:", { isRegistered, isActive, status, assemblyId: assembly._id });
                                navigate(`/voting/${assembly._id}`);
                              }}
                              sx={{
                                backgroundColor: "#4caf50",
                                "&:hover": { 
                                  backgroundColor: "#45a049",
                                },
                                fontWeight: 600,
                                cursor: "pointer",
                                textTransform: "none",
                              }}
                            >
                              Ingresar al evento en vivo
                            </Button>
                          );
                        } 
                        // Si está registrado pero la asamblea NO está activa (próxima o finalizada)
                        else if (isRegistered) {
                          return (
                            <Button
                              variant="outlined"
                              fullWidth
                              disabled
                              sx={{
                                borderColor: "#4caf50",
                                color: "#4caf50",
                                textTransform: "none",
                              }}
                            >
                              Ya estás inscrito
                            </Button>
                          );
                        } 
                        // Si NO está registrado y la asamblea NO está finalizada
                        else if (status !== "Finalizada") {
                          return (
                            <Button
                              variant="contained"
                              fullWidth
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleJoinAssembly(assembly._id);
                              }}
                              disabled={registering === assembly._id}
                              sx={{
                                backgroundColor: "#1976d2",
                                "&:hover": { backgroundColor: "#1565c0" },
                                textTransform: "none",
                              }}
                            >
                              {registering === assembly._id ? "Inscribiendo..." : "Inscribirse"}
                            </Button>
                          );
                        } 
                        // Si la asamblea está finalizada
                        else {
                          return (
                            <Button
                              variant="outlined"
                              fullWidth
                              disabled
                              sx={{
                                borderColor: "#f44336",
                                color: "#f44336",
                                textTransform: "none",
                              }}
                            >
                              Finalizada
                            </Button>
                          );
                        }
                      })()}
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
