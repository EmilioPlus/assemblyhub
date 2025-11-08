import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  IconButton,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

interface Option {
  text: string;
  value: string;
}

export default function CreateVoting() {
  const navigate = useNavigate();
  const { assemblyId } = useParams<{ assemblyId: string }>();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [assembly, setAssembly] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    questionText: "",
    questionType: "single",
    duration: 60, // segundos
    order: 1,
  });
  
  const [options, setOptions] = useState<Option[]>([
    { text: "", value: "" },
    { text: "", value: "" },
  ]);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    if (assemblyId) {
      fetchAssembly();
    }
  }, [user, navigate, assemblyId]);

  const fetchAssembly = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/assemblies/detalle/${assemblyId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAssembly(response.data.assembly);
    } catch (err: any) {
      setError("Error al cargar la asamblea");
    }
  };

  const handleOptionChange = (index: number, field: "text" | "value", value: string) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    
    // Auto-generar value si es text y no hay value
    if (field === "text" && !newOptions[index].value) {
      newOptions[index].value = value.toLowerCase().replace(/\s+/g, "_");
    }
    
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, { text: "", value: "" }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validaciones
    if (!formData.questionText.trim()) {
      setError("Debe ingresar el texto de la pregunta");
      return;
    }

    if (!assemblyId) {
      setError("ID de asamblea no válido");
      return;
    }

    const validOptions = options.filter((opt) => opt.text.trim() && opt.value.trim());
    if (validOptions.length < 2) {
      setError("Debe proporcionar al menos 2 opciones válidas");
      return;
    }

    if (formData.duration <= 0) {
      setError("La duración debe ser mayor a 0");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/votaciones/crear",
        {
          assemblyId,
          questionText: formData.questionText,
          questionType: formData.questionType,
          options: validOptions,
          duration: formData.duration,
          order: formData.order,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(response.data.msg || "Votación creada exitosamente");
      
      setTimeout(() => {
        navigate(`/admin-assemblies`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al crear la votación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        padding: "2rem",
      }}
    >
      {/* Header */}
      <Box sx={{ marginBottom: "2rem" }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: "#212529", marginBottom: "0.5rem" }}>
          Crear Votación
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {assembly
            ? `Asamblea: ${assembly.name || assembly.Nombre} - Complete los campos para crear una nueva pregunta de votación`
            : "Complete los campos para crear una nueva pregunta de votación"}
        </Typography>
      </Box>

      <Card
        sx={{
          background: "#fff",
          borderRadius: 2,
          padding: "2rem",
          maxWidth: 800,
          margin: "0 auto",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >

        <form onSubmit={handleSubmit}>
          {/* Texto de la pregunta */}
          <TextField
            fullWidth
            label="Texto de la pregunta *"
            name="questionText"
            value={formData.questionText}
            onChange={(e) =>
              setFormData({ ...formData, questionText: e.target.value })
            }
            margin="normal"
            required
            multiline
            rows={3}
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

          {/* Tipo de pregunta */}
          <FormControl fullWidth margin="normal">
            <InputLabel sx={{
              "&.Mui-focused": {
                color: "#1976d2",
              },
            }}>Tipo de pregunta *</InputLabel>
            <Select
              value={formData.questionType}
              label="Tipo de pregunta *"
              onChange={(e) =>
                setFormData({ ...formData, questionType: e.target.value })
              }
              required
              sx={{
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#e0e0e0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
              }}
            >
              <MenuItem value="single">Selección única</MenuItem>
              <MenuItem value="multiple">Selección múltiple</MenuItem>
            </Select>
          </FormControl>

          {/* Opciones */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#212529" }}>
              Opciones de respuesta *
            </Typography>
            {options.map((option, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  backgroundColor: "#fafafa",
                }}
              >
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <TextField
                    fullWidth
                    label={`Opción ${index + 1} - Texto`}
                    value={option.text}
                    onChange={(e) =>
                      handleOptionChange(index, "text", e.target.value)
                    }
                    required
                    sx={{
                      flex: 2,
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
                  <TextField
                    fullWidth
                    label="Valor"
                    value={option.value}
                    onChange={(e) =>
                      handleOptionChange(index, "value", e.target.value)
                    }
                    required
                    sx={{
                      flex: 1,
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: "#03A9F4",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#03A9F4",
                        },
                      },
                    }}
                    helperText="Se genera automáticamente"
                  />
                  {options.length > 2 && (
                    <IconButton
                      color="error"
                      onClick={() => removeOption(index)}
                      sx={{ mt: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </Paper>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={addOption}
              variant="outlined"
              sx={{
                borderColor: "#1976d2",
                color: "#1976d2",
                "&:hover": {
                  borderColor: "#1565c0",
                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                },
              }}
            >
              Agregar Opción
            </Button>
          </Box>

          {/* Duración y Orden */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Duración (segundos) *"
              name="duration"
              type="number"
              value={formData.duration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration: parseInt(e.target.value) || 0,
                })
              }
              margin="normal"
              required
              inputProps={{ min: 1 }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            />
            <TextField
              fullWidth
              label="Orden *"
              name="order"
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  order: parseInt(e.target.value) || 1,
                })
              }
              margin="normal"
              required
              inputProps={{ min: 1 }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            />
          </Box>

          {/* Mensajes */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}

          {/* Botones */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => navigate("/admin-assemblies")}
              disabled={loading}
              sx={{
                borderColor: "#757575",
                color: "#757575",
                "&:hover": {
                  borderColor: "#424242",
                  backgroundColor: "rgba(117, 117, 117, 0.08)",
                },
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                backgroundColor: "#1976d2",
                fontWeight: 600,
                textTransform: "none",
                padding: "0.75rem 2rem",
                "&:hover": {
                  backgroundColor: "#1565c0",
                },
              }}
            >
              {loading ? "Creando..." : "Crear Votación"}
            </Button>
          </Box>
        </form>
      </Card>
    </Box>
  );
}

