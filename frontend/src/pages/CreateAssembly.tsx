import { useState, useEffect } from "react";
import { Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import {
  StyledContainer,
  StyledFormCard,
  StyledTitle,
  StyledDescription,
  StyledTextField,
  StyledButtonGroup,
  StyledCreateButton,
  StyledCancelButton,
} from "../Styles/CreateAssembly.styles";

export default function CreateAssembly() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDateTime: "",
    endDateTime: "",
    processType: "assembly", // Tipo fijo: siempre es "assembly" para esta página
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      
      // Validar fechas en tiempo real
      if (name === "startDateTime" || name === "endDateTime") {
        const hasError = validateDates(newData.startDateTime, newData.endDateTime);
        // Limpiar error general si las fechas son válidas
        if (!hasError) {
          setError((prevError) => {
            if (prevError && (prevError.includes("fecha") || prevError.includes("Fecha"))) {
              return "";
            }
            return prevError;
          });
        }
      }
      
      return newData;
    });
  };

  const validateDates = (startDateTime: string, endDateTime: string): boolean => {
    if (startDateTime && endDateTime) {
      const startDate = new Date(startDateTime);
      const endDate = new Date(endDateTime);

      if (endDate <= startDate) {
        setDateError("La fecha de cierre debe ser mayor a la fecha de inicio");
        return true; // Hay error
      } else {
        setDateError("");
        return false; // No hay error
      }
    } else {
      setDateError("");
      return false; // No hay error si falta información
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validar campos obligatorios
    if (!formData.name || !formData.startDateTime || !formData.endDateTime) {
      setError("Debe completar los campos obligatorios");
      return;
    }

    // Validar que fecha de cierre > fecha de inicio
    const startDate = new Date(formData.startDateTime);
    const endDate = new Date(formData.endDateTime);

    if (endDate <= startDate) {
      setError("La fecha de cierre debe ser mayor a la fecha de inicio");
      setDateError("La fecha de cierre debe ser mayor a la fecha de inicio");
      return;
    }

    // Si hay error de fecha, no permitir envío
    if (dateError) {
      setError(dateError);
      return;
    }

    setLoading(true);

    try {
      if (!token) {
        setError("No hay token de autenticación. Por favor, inicie sesión nuevamente.");
        setLoading(false);
        return;
      }

      // Enviar datos con processType siempre como "assembly"
      const submitData = {
        ...formData,
        processType: "assembly", // Asegurar que siempre sea "assembly"
      };

      await axios.post(
        "http://localhost:5000/api/assemblies",
        submitData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Asamblea creada exitosamente");
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error al crear asamblea:", err);
      setError(err.response?.data?.error || err.response?.data?.msg || "Error al crear la asamblea");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer>
      <StyledFormCard>
        <StyledTitle>Crear Nueva Asamblea</StyledTitle>
        <StyledDescription>
          Complete los campos para crear una nueva asamblea y convocar a los participantes
        </StyledDescription>

        <form onSubmit={handleSubmit}>
          {/* Nombre */}
          <StyledTextField
            fullWidth
            label="Nombre de la asamblea *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            required
          />

          {/* Descripción */}
          <StyledTextField
            fullWidth
            label="Descripción o agenda del evento"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
          />

          {/* Fecha y hora de inicio */}
          <StyledTextField
            fullWidth
            label="Fecha y hora de inicio *"
            name="startDateTime"
            type="datetime-local"
            value={formData.startDateTime}
            onChange={handleChange}
            margin="normal"
            required
            error={!!dateError}
            InputLabelProps={{
              shrink: true,
            }}
          />

          {/* Fecha y hora de cierre */}
          <StyledTextField
            fullWidth
            label="Fecha y hora de cierre *"
            name="endDateTime"
            type="datetime-local"
            value={formData.endDateTime}
            onChange={handleChange}
            margin="normal"
            required
            error={!!dateError}
            helperText={dateError}
            InputLabelProps={{
              shrink: true,
            }}
          />

          {/* Mensajes */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}

          {/* Botones */}
          <StyledButtonGroup>
            <StyledCancelButton
              variant="outlined"
              onClick={() => navigate("/dashboard")}
              disabled={loading}
            >
              Cancelar
            </StyledCancelButton>
            <StyledCreateButton
              type="submit"
              variant="contained"
              disabled={loading || !!dateError}
            >
              {loading ? "Creando..." : "Crear Asamblea"}
            </StyledCreateButton>
          </StyledButtonGroup>
        </form>
      </StyledFormCard>
    </StyledContainer>
  );
}
