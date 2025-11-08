import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, CardContent, Typography, Box } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import {
  StyledContainer,
  StyledTitle,
  StyledCard,
  StyledUserCard,
  StyledUserInfo,
  StyledRoleChip,
  StyledBackLink,
} from "../Styles/AdminUsers.styles";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    if (user?.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data);
      } catch (err: any) {
        setError("Error al cargar los usuarios");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate, token, user]);

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <StyledContainer>
      <StyledCard>
        <StyledTitle>Gestión de Usuarios</StyledTitle>
        <p style={{ color: "#757575", marginBottom: "2rem", textAlign: "center" }}>
          Administre todos los usuarios registrados en el sistema
        </p>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" onClick={() => navigate('/admin-login-attempts')}>
            Ver historial de intentos de acceso
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Typography>Cargando usuarios...</Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {users.map((user) => (
              <StyledUserCard key={user._id}>
                <CardContent>
                  <StyledUserInfo>
                    <Typography variant="h6" component="div">
                      {user.firstName} {user.lastName}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      {user.username || "Sin nombre de usuario"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                    <StyledRoleChip
                      label={user.role === "admin" ? "Administrador" : "Participante"}
                      color={user.role === "admin" ? "primary" : "secondary"}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Registrado: {formatDate(user.createdAt)}
                    </Typography>
                  </StyledUserInfo>
                </CardContent>
              </StyledUserCard>
            ))}
          </Box>
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
