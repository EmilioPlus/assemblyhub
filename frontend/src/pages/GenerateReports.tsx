import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, MenuItem, CircularProgress, Box } from "@mui/material";
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

export default function GenerateReports() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [reportType, setReportType] = useState("");
  const [format, setFormat] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleGenerate = async (exportFormat: "pdf" | "excel") => {
    if (!reportType) {
      setError("Debe seleccionar un tipo de reporte");
      return;
    }

    if (!format) {
      setError("Debe seleccionar un formato de descarga");
      return;
    }

    if (format !== exportFormat) {
      setFormat(exportFormat);
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!token) {
        setError("No hay token de autenticación. Por favor, inicie sesión nuevamente.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/api/reportes/exportar",
        {
          tipo: reportType,
          formato: exportFormat,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: exportFormat === "pdf" ? "blob" : "arraybuffer",
        }
      );

      // Crear blob y descargar
      const blob = new Blob(
        [response.data],
        {
          type: exportFormat === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_${reportType}_${new Date().getTime()}.${exportFormat === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess("✅ El reporte se ha generado correctamente.");
    } catch (err: any) {
      console.error("Error al generar reporte:", err);
      setError("❌ Error al generar el archivo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer>
      <StyledFormCard>
        <StyledTitle>Generar Reportes</StyledTitle>
        <StyledDescription>
          Seleccione el tipo de reporte y formato de descarga para generar el archivo
        </StyledDescription>

        {/* Tipo de reporte */}
        <StyledTextField
          fullWidth
          select
          label="Tipo de reporte *"
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          margin="normal"
          disabled={loading}
        >
          <MenuItem value="resultados">Resultados</MenuItem>
          <MenuItem value="participantes">Participantes</MenuItem>
          <MenuItem value="asamblea">Asamblea</MenuItem>
        </StyledTextField>

        {/* Formato de descarga */}
        <StyledTextField
          fullWidth
          select
          label="Formato de descarga *"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          margin="normal"
          disabled={loading}
        >
          <MenuItem value="pdf">PDF</MenuItem>
          <MenuItem value="excel">Excel</MenuItem>
        </StyledTextField>

        {/* Indicador de progreso */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", my: 3 }}>
            <CircularProgress />
            <span style={{ marginLeft: "1rem", color: "#1976d2" }}>Generando reporte...</span>
          </Box>
        )}

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

        {/* Botones de acción */}
        <StyledButtonGroup>
          <StyledCancelButton
            variant="outlined"
            onClick={() => navigate("/dashboard")}
            disabled={loading}
          >
            Cancelar
          </StyledCancelButton>
          <StyledCreateButton
            variant="contained"
            onClick={() => {
              if (!format) setFormat("pdf");
              handleGenerate("pdf");
            }}
            disabled={loading || !reportType}
            sx={{ mr: 1 }}
          >
            {loading && (!format || format === "pdf") ? "Generando..." : "Descargar PDF"}
          </StyledCreateButton>
          <StyledCreateButton
            variant="contained"
            onClick={() => {
              if (!format) setFormat("excel");
              handleGenerate("excel");
            }}
            disabled={loading || !reportType}
          >
            {loading && (!format || format === "excel") ? "Generando..." : "Descargar Excel"}
          </StyledCreateButton>
        </StyledButtonGroup>
      </StyledFormCard>
    </StyledContainer>
  );
}

