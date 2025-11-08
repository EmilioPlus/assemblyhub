import { useEffect, useState } from "react";
import { 
  Alert, 
  Box, 
  Button, 
  MenuItem, 
  Pagination, 
  TextField, 
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface AttemptItem {
  _id: string;
  email: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  status: "success" | "wrong_password" | "user_not_found" | "locked";
  message?: string;
  createdAt: string;
}

export default function AdminLoginAttempts() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AttemptItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"one" | "email" | "all">("one");
  const [deleteTarget, setDeleteTarget] = useState<{ id?: string; email?: string }>({});
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    if (user?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
  }, [token, user, navigate]);

  const fetchData = async (pageToLoad = 1) => {
    try {
      setLoading(true);
      setError("");
      const params: any = { page: pageToLoad, limit };
      if (email) params.email = email;
      if (status) params.status = status;
      const res = await axios.get("http://localhost:5000/api/auth/login-attempts", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setItems(res.data.items);
      setTotal(res.data.total);
      setPage(res.data.page);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al cargar intentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleDeleteClick = (type: "one" | "email" | "all", target?: { id?: string; email?: string }) => {
    setDeleteType(type);
    setDeleteTarget(target || {});
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (deleteType === "one" && deleteTarget.id) {
        await axios.delete(`http://localhost:5000/api/auth/login-attempts/${deleteTarget.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess("Intento de acceso eliminado exitosamente");
      } else if (deleteType === "email" && deleteTarget.email) {
        const response = await axios.delete(`http://localhost:5000/api/auth/login-attempts?email=${encodeURIComponent(deleteTarget.email)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess(response.data.msg || "Intentos de acceso eliminados exitosamente");
      } else if (deleteType === "all") {
        const response = await axios.delete(`http://localhost:5000/api/auth/login-attempts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess(response.data.msg || "Todo el historial eliminado exitosamente");
      }

      setDeleteDialogOpen(false);
      // Recargar datos
      await fetchData(1);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al eliminar intentos de acceso");
    } finally {
      setLoading(false);
    }
  };

  const getDeleteDialogMessage = () => {
    if (deleteType === "one") {
      return `¿Está seguro de que desea eliminar este intento de acceso?`;
    } else if (deleteType === "email") {
      return `¿Está seguro de que desea eliminar todos los intentos de acceso del email "${deleteTarget.email}"? Esta acción no se puede deshacer.`;
    } else {
      return `¿Está seguro de que desea eliminar TODO el historial de intentos de acceso? Esta acción no se puede deshacer.`;
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Historial de intentos de acceso</Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField label="Email" size="small" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField
          label="Estado"
          select
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="success">Éxito</MenuItem>
          <MenuItem value="wrong_password">Contraseña incorrecta</MenuItem>
          <MenuItem value="user_not_found">Correo no registrado</MenuItem>
          <MenuItem value="locked">Bloqueada</MenuItem>
        </TextField>
        <Button variant="contained" onClick={() => fetchData(1)}>Buscar</Button>
        <Button variant="text" onClick={() => { setEmail(""); setStatus(""); fetchData(1); }}>Limpiar</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

      <Box sx={{ border: "1px solid #eee", borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 3fr 1fr auto", bgcolor: "#f7f7f7", p: 1, fontWeight: 600 }}>
          <div>Email</div>
          <div>Estado</div>
          <div>IP</div>
          <div>Mensaje</div>
          <div>Fecha</div>
          <div>Acciones</div>
        </Box>
        {loading ? (
          <Box sx={{ p: 2 }}>
            <Typography>Cargando...</Typography>
          </Box>
        ) : (
          items.map((it) => (
            <Box key={it._id} sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 3fr 1fr auto", p: 1, borderTop: "1px solid #eee", alignItems: "center" }}>
              <div>{it.email}</div>
              <div>{it.status}</div>
              <div>{it.ip || "-"}</div>
              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.message || ""}</div>
              <div>{new Date(it.createdAt).toLocaleString()}</div>
              <div>
                <Tooltip title="Eliminar este intento">
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteClick("one", { id: it._id })}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar todos los intentos de este email">
                  <IconButton 
                    size="small" 
                    color="warning"
                    onClick={() => handleDeleteClick("email", { email: it.email })}
                  >
                    <DeleteSweepIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            </Box>
          ))
        )}
      </Box>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => fetchData(v)} />
      </Box>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button variant="outlined" onClick={() => navigate('/admin-users')}>Volver</Button>
        <Button 
          variant="contained" 
          color="error" 
          startIcon={<DeleteSweepIcon />}
          onClick={() => handleDeleteClick("all")}
        >
          Eliminar Todo el Historial
        </Button>
      </Box>

      {/* Dialog de confirmación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          {deleteType === "one" 
            ? "Eliminar Intento de Acceso" 
            : deleteType === "email" 
            ? "Eliminar Intentos por Email" 
            : "Eliminar Todo el Historial"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {getDeleteDialogMessage()}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


