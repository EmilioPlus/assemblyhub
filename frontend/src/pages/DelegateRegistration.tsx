import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Step,
  Stepper,
  StepLabel,
  Alert,
  LinearProgress,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

interface Assembly {
  _id: string;
  name: string;
  startDateTime: string;
  endDateTime: string;
}

const steps = [
  "Seleccionar asamblea",
  "Registrar datos",
  "Confirmar registro"
];

const DOCUMENT_TYPES = [
  { value: "CC", label: "Cédula de Ciudadanía" },
  { value: "CE", label: "Cédula de Extranjería" },
  { value: "PA", label: "Pasaporte" },
  { value: "TI", label: "Tarjeta de Identidad" },
];

export default function DelegateRegistration() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [selectedAssembly, setSelectedAssembly] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    firstName: "",
    secondName: "",
    firstLastName: "",
    secondLastName: "",
    documentType: "",
    documentNumber: "",
    email: "",
    sharesDelegated: "",
  });
  const [powerOfAttorneyFile, setPowerOfAttorneyFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchAvailableAssemblies = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/delegates/available-assemblies", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAssemblies(response.data.assemblies || []);
      } catch (err: any) {
        setError(err.response?.data?.msg || "Error al cargar las asambleas");
      }
    };

    if (token) {
      fetchAvailableAssemblies();
    }
  }, [token]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validar tipo de archivo
      if (file.type !== "application/pdf") {
        setError("Solo se permiten archivos PDF");
        return;
      }

      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("El archivo supera el tamaño máximo permitido (5MB)");
        return;
      }

      setPowerOfAttorneyFile(file);
      setError("");
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!selectedAssembly) {
        setError("Debe seleccionar una asamblea");
        return;
      }
      setActiveStep(1);
      setError("");
    } else if (activeStep === 1) {
      // Validar campos obligatorios
      if (!formData.firstName || !formData.firstLastName || 
          !formData.documentType || !formData.documentNumber || 
          !formData.email || !formData.sharesDelegated || !powerOfAttorneyFile) {
        setError("Debe completar todos los campos obligatorios");
        return;
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Formato de correo inválido");
        return;
      }

      // Validar número de acciones
      const shares = parseInt(formData.sharesDelegated);
      if (isNaN(shares) || shares <= 0) {
        setError("El número de acciones a delegar debe ser mayor a 0");
        return;
      }

      setActiveStep(2);
      setError("");
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError("");
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      
      const formDataToSend = new FormData();
      formDataToSend.append("assembly", selectedAssembly);
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("secondName", formData.secondName);
      formDataToSend.append("firstLastName", formData.firstLastName);
      formDataToSend.append("secondLastName", formData.secondLastName);
      formDataToSend.append("documentType", formData.documentType);
      formDataToSend.append("documentNumber", formData.documentNumber);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("sharesDelegated", formData.sharesDelegated);
      
      if (powerOfAttorneyFile) {
        formDataToSend.append("powerOfAttorney", powerOfAttorneyFile);
      }

      const response = await axios.post(
        "http://localhost:5000/api/delegates/registrar",
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess(response.data.msg || "Delegado registrado exitosamente");
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        navigate("/participant-area");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al registrar el delegado");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/participant-area");
  };

  return (
    <Box sx={{ backgroundColor: "#d9ebfa", minHeight: "100vh", padding: "2rem" }}>
      <Card sx={{ maxWidth: 800, margin: "0 auto" }}>
        <CardContent sx={{ padding: "2rem" }}>
          <Typography variant="h4" color="primary" gutterBottom>
            Registro de delegado
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
            Designa a una persona que te represente en una asamblea si no puedes asistir personalmente.
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            Cada participante puede registrar solo un delegado por asamblea.
          </Alert>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Step 1: Seleccionar asamblea */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Seleccionar asamblea
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Asamblea en la que estás inscrito (*)</InputLabel>
                <Select
                  value={selectedAssembly}
                  onChange={(e) => setSelectedAssembly(e.target.value)}
                  label="Asamblea en la que estás inscrito (*)"
                >
                  {assemblies.map((assembly) => (
                    <MenuItem key={assembly._id} value={assembly._id}>
                      {assembly.name} - {new Date(assembly.startDateTime).toLocaleDateString()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Step 2: Registrar datos */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Datos del delegado
              </Typography>
              
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 2 }}>
                <TextField
                  label="Primer nombre (*)"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  fullWidth
                  required
                />
                <TextField
                  label="Segundo nombre"
                  value={formData.secondName}
                  onChange={(e) => handleChange("secondName", e.target.value)}
                  fullWidth
                />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 2 }}>
                <TextField
                  label="Primer apellido (*)"
                  value={formData.firstLastName}
                  onChange={(e) => handleChange("firstLastName", e.target.value)}
                  fullWidth
                  required
                />
                <TextField
                  label="Segundo apellido"
                  value={formData.secondLastName}
                  onChange={(e) => handleChange("secondLastName", e.target.value)}
                  fullWidth
                />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 2 }}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de documento (*)</InputLabel>
                  <Select
                    value={formData.documentType}
                    onChange={(e) => handleChange("documentType", e.target.value)}
                    label="Tipo de documento (*)"
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Número de documento (*)"
                  value={formData.documentNumber}
                  onChange={(e) => handleChange("documentNumber", e.target.value)}
                  fullWidth
                  required
                />
              </Box>

              <TextField
                label="Correo electrónico (*)"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                fullWidth
                required
                sx={{ mb: 2 }}
              />

              <TextField
                label="Número de acciones/participaciones a delegar (*)"
                type="number"
                value={formData.sharesDelegated}
                onChange={(e) => handleChange("sharesDelegated", e.target.value)}
                fullWidth
                required
                sx={{ mb: 2 }}
              />

              <Box sx={{ mb: 2 }}>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  id="powerOfAttorneyFile"
                />
                <label htmlFor="powerOfAttorneyFile">
                  <Button variant="outlined" component="span" fullWidth>
                    {powerOfAttorneyFile ? powerOfAttorneyFile.name : "Cargar documento de poder (PDF, máx. 5MB)"}
                  </Button>
                </label>
                {powerOfAttorneyFile && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    Archivo seleccionado: {powerOfAttorneyFile.name}
                  </Alert>
                )}
              </Box>
            </Box>
          )}

          {/* Step 3: Confirmar */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Confirmar registro
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Revisa la información antes de confirmar
              </Typography>
              {/* Aquí mostrar resumen de datos */}
            </Box>
          )}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              variant="outlined"
            >
              Atrás
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={loading}
              >
                {loading ? "Registrando..." : "Registrar delegado"}
              </Button>
            ) : (
              <Button onClick={handleNext} variant="contained">
                Continuar
              </Button>
            )}
            <Button onClick={handleCancel} variant="outlined">
              Cancelar
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
