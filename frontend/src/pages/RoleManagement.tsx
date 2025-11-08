import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Alert, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions 
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface HistoryEntry {
  _id: string;
  modifiedUser: User;
  previousRole: string;
  newRole: string;
  modifiedBy: User;
  createdAt: string;
}

const ROLE_PERMISSIONS = {
  admin: [
    "Crear asambleas",
    "Inscribir participantes",
    "Ver resultados",
    "Generar reportes",
    "Gestionar roles"
  ],
  participant: [
    "Inscribirse a asambleas",
    "Votar",
    "Ver resultados de votaciones en las que participó"
  ],
  guest: [
    "Solo visualizar información pública de asambleas"
  ]
};

const ROLE_LABELS = {
  admin: "Administrador",
  participant: "Participante",
  guest: "Invitado"
};

export default function RoleManagement() {
  const navigate = useNavigate();
  const { token, user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchUsers, setSearchUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    // Cargar todos los usuarios al iniciar
    loadAllUsers();
  }, [currentUser, navigate]);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAllUsers(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setError("");
      const response = await axios.get(`http://localhost:5000/api/roles/search`, {
        params: { query: searchQuery },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSearchUsers(response.data.users || []);
      if (response.data.users.length === 0) {
        setError("No se encontraron usuarios");
      }
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al buscar usuarios");
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setError("");
    setSuccess("");
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    if (selectedUser.role === newRole) {
      setError("El usuario ya tiene este rol asignado");
      return;
    }

    setConfirmDialogOpen(true);
  };

  const confirmRoleChange = async () => {
    setConfirmDialogOpen(false);

    try {
      setError("");
      setSuccess("");
      
      await axios.put(
        `http://localhost:5000/api/users/rol`,
        { userId: selectedUser?._id, newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Rol asignado exitosamente");
      
      // Actualizar usuario seleccionado
      if (selectedUser) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
      
      // Actualizar lista de usuarios
      await loadAllUsers();
      // Limpiar búsqueda
      setSearchUsers([]);
      setSearchQuery("");
    } catch (err: any) {
      const errorMsg = err.response?.data?.msg || "Error al asignar rol";
      setError(errorMsg);
      if (errorMsg.includes("ya tiene este rol")) {
        setError("⚠️ " + errorMsg);
      }
    }
  };

  const handleShowHistory = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/roles/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setHistory(response.data.history || []);
      setShowHistory(true);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al cargar historial");
    }
  };

  const handleCancel = () => {
    setSelectedUser(null);
    setSearchQuery("");
    setSearchUsers([]);
    setNewRole("");
    setError("");
    setSuccess("");
  };

  return (
    <Box sx={{ 
      backgroundColor: "#d9ebfa", 
      minHeight: "100vh", 
      padding: "2rem",
      display: "flex",
      flexDirection: "column",
      gap: "2rem"
    }}>
      {/* Header */}
      <Card sx={{ background: "#fff", borderRadius: 16, padding: "2rem" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <Typography variant="h4" color="primary">
            Gestión de Roles y Permisos
          </Typography>
        </Box>
        <Typography variant="body1" color="textSecondary">
          Asigna y administra los roles de los usuarios registrados en la plataforma
        </Typography>
        
        {/* Banner de advertencia */}
        <Alert severity="warning" sx={{ marginTop: "1rem" }}>
          Solo los administradores principales pueden modificar roles de otros administradores.
        </Alert>
      </Card>

      {/* Users Table Section */}
      <Card sx={{ background: "#fff", borderRadius: 16, padding: "2rem" }}>
        <Typography variant="h5" sx={{ marginBottom: "1rem" }}>Usuarios Registrados</Typography>
        
        {/* Search Section */}
        <Box sx={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value) {
                handleSearch();
              } else {
                setSearchUsers([]);
              }
            }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: "#1976d2", mr: 1 }} />,
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{ minWidth: "150px" }}
          >
            Buscar
          </Button>
        </Box>

        {/* Table with all users */}
        {loading ? (
          <Typography>Cargando usuarios...</Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 1, fontWeight: 600, marginBottom: "0.5rem", padding: "0.5rem", borderBottom: "2px solid #1976d2" }}>
              <Box>Nombre</Box>
              <Box>Email</Box>
              <Box>Rol</Box>
            </Box>
            {(searchUsers.length > 0 ? searchUsers : allUsers).map((user) => (
              <Box 
                key={user._id} 
                sx={{ 
                  display: "grid", 
                  gridTemplateColumns: "2fr 2fr 1fr", 
                  gap: 1, 
                  padding: "0.75rem", 
                  borderBottom: "1px solid #e0e0e0",
                  cursor: "pointer",
                  "&:hover": { backgroundColor: "#f5f5f5" }
                }}
                onClick={() => handleUserSelect(user)}
              >
                <Box>{user.firstName} {user.lastName}</Box>
                <Box>{user.email}</Box>
                <Box
                  sx={{
                    display: "inline-block",
                    padding: "0.25rem 0.75rem",
                    borderRadius: 2,
                    fontSize: "0.75rem",
                    backgroundColor: user.role === "admin" ? "#e3f2fd" : user.role === "participant" ? "#e8f5e9" : "#f3e5f5",
                    color: user.role === "admin" ? "#1976d2" : user.role === "participant" ? "#2e7d32" : "#7b1fa2",
                  }}
                >
                  {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
                </Box>
              </Box>
            ))}
            {allUsers.length === 0 && searchUsers.length === 0 && !loading && (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: "center", padding: "2rem" }}>
                No hay usuarios registrados
              </Typography>
            )}
          </Box>
        )}

      </Card>

      {/* User Details Section */}
      {selectedUser && (
        <Card sx={{ background: "#fff", borderRadius: 16, padding: "2rem" }}>
          <Typography variant="h5" sx={{ marginBottom: "1rem" }}>Información del usuario</Typography>
          
          <Box sx={{ marginBottom: "2rem" }}>
            <Typography variant="h6">{selectedUser.firstName} {selectedUser.lastName}</Typography>
            <Typography variant="body2" color="textSecondary">{selectedUser.email}</Typography>
            <Typography variant="body2" color="textSecondary">ID: {selectedUser._id}</Typography>
          </Box>

          {/* Current Role */}
          <Box sx={{ marginBottom: "2rem" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, marginBottom: "0.5rem" }}>
              Rol actual
            </Typography>
            <Box
              sx={{
                display: "inline-block",
                padding: "0.5rem 1rem",
                borderRadius: 2,
                backgroundColor: selectedUser.role === "admin" ? "#e3f2fd" : selectedUser.role === "participant" ? "#e8f5e9" : "#f3e5f5",
                color: selectedUser.role === "admin" ? "#1976d2" : selectedUser.role === "participant" ? "#2e7d32" : "#7b1fa2",
                fontWeight: 600,
              }}
            >
              {ROLE_LABELS[selectedUser.role as keyof typeof ROLE_LABELS]}
            </Box>
          </Box>

          {/* New Role Selection */}
          <Box sx={{ marginBottom: "2rem" }}>
            <FormControl fullWidth>
              <InputLabel>Nuevo rol</InputLabel>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                label="Nuevo rol"
              >
                <MenuItem value="admin">Administrador</MenuItem>
                <MenuItem value="participant">Participante</MenuItem>
                <MenuItem value="guest">Invitado</MenuItem>
              </Select>
            </FormControl>
            
            {selectedUser.role === newRole && (
              <Alert severity="warning" sx={{ marginTop: "1rem" }}>
                El usuario ya tiene este rol asignado.
              </Alert>
            )}
          </Box>

          {/* Permissions */}
          <Box sx={{ marginBottom: "2rem" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, marginBottom: "1rem" }}>
              Permisos del rol
            </Typography>
            <List sx={{ backgroundColor: "#f5f5f5", borderRadius: 2 }}>
              {ROLE_PERMISSIONS[newRole as keyof typeof ROLE_PERMISSIONS]?.map((permission, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary={permission} />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Messages */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: "1rem" }}>
            <Button variant="contained" color="primary" onClick={handleRoleChange}>
              Asignar rol
            </Button>
            <Button variant="outlined" onClick={handleCancel}>
              Cancelar
            </Button>
          </Box>
        </Card>
      )}

      {/* History Section */}
      <Card sx={{ background: "#fff", borderRadius: 16, padding: "2rem" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <Typography variant="h5">Historial de cambios de roles</Typography>
          <Button variant="outlined" onClick={handleShowHistory}>
            {showHistory ? "Ocultar" : "Ver historial"}
          </Button>
        </Box>

        {showHistory && (
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, fontWeight: 600, marginBottom: "0.5rem" }}>
              <Box>Usuario modificado</Box>
              <Box>Rol anterior</Box>
              <Box>Nuevo rol</Box>
              <Box>Modificado por</Box>
              <Box>Fecha y hora</Box>
            </Box>
            {history.map((entry) => (
              <Box key={entry._id} sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, padding: "0.5rem", borderBottom: "1px solid #e0e0e0" }}>
                <Box>{entry.modifiedUser?.firstName} {entry.modifiedUser?.lastName}</Box>
                <Box
                  sx={{
                    display: "inline-block",
                    padding: "0.25rem 0.75rem",
                    borderRadius: 2,
                    fontSize: "0.75rem",
                    backgroundColor: entry.previousRole === "admin" ? "#e3f2fd" : entry.previousRole === "participant" ? "#e8f5e9" : "#f3e5f5",
                    color: entry.previousRole === "admin" ? "#1976d2" : entry.previousRole === "participant" ? "#2e7d32" : "#7b1fa2",
                  }}
                >
                  {ROLE_LABELS[entry.previousRole as keyof typeof ROLE_LABELS]}
                </Box>
                <Box
                  sx={{
                    display: "inline-block",
                    padding: "0.25rem 0.75rem",
                    borderRadius: 2,
                    fontSize: "0.75rem",
                    backgroundColor: entry.newRole === "admin" ? "#e3f2fd" : entry.newRole === "participant" ? "#e8f5e9" : "#f3e5f5",
                    color: entry.newRole === "admin" ? "#1976d2" : entry.newRole === "participant" ? "#2e7d32" : "#7b1fa2",
                  }}
                >
                  {ROLE_LABELS[entry.newRole as keyof typeof ROLE_LABELS]}
                </Box>
                <Box>{entry.modifiedBy?.firstName} {entry.modifiedBy?.lastName}</Box>
                <Box>{new Date(entry.createdAt).toLocaleString("es-ES")}</Box>
              </Box>
            ))}
            {history.length === 0 && (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: "center", padding: "2rem" }}>
                No hay historial de cambios
              </Typography>
            )}
          </Box>
        )}
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>¿Asignar nuevo rol al usuario?</DialogTitle>
        <DialogContent>
          <Typography>
            Estás a punto de cambiar el rol de <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong> de{" "}
            <strong>{ROLE_LABELS[selectedUser?.role as keyof typeof ROLE_LABELS]}</strong> a{" "}
            <strong>{ROLE_LABELS[newRole as keyof typeof ROLE_LABELS]}</strong>.{" "}
            Esta acción será registrada en el historial de auditoría.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} variant="outlined">
            Cancelar
          </Button>
          <Button onClick={confirmRoleChange} variant="contained" color="primary">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Back Button */}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Button variant="contained" onClick={() => navigate("/dashboard")}>
          Volver al Panel
        </Button>
      </Box>
    </Box>
  );
}
