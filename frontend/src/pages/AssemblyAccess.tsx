import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import axios from "axios";
import API_CONFIG from "../config/api";

interface Assembly {
  id: string;
  name: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
}

export default function AssemblyAccess() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: código acceso, 1: documento, 2: código verificación
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Paso 1: Código de acceso
  const [accessCode, setAccessCode] = useState("");
  const [assembly, setAssembly] = useState<Assembly | null>(null);

  // Paso 2: Documento
  const [documentNumber, setDocumentNumber] = useState("");
  const [verificationId, setVerificationId] = useState("");

  // Paso 3: Código de verificación
  const [verificationCode, setVerificationCode] = useState("");

  const steps = ["Código de acceso", "Número de documento", "Código de verificación"];

  // Paso 1: Verificar código de acceso
  const handleVerifyAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await axios.post(API_CONFIG.ENDPOINTS.ASSEMBLY_ACCESS.VERIFY_ACCESS_CODE, {
        accessCode: accessCode.trim().toUpperCase(),
      });

      if (response.data.canAccess) {
        setAssembly(response.data.assembly);
        setSuccess("Código de acceso válido");
        setTimeout(() => {
          setStep(1);
          setSuccess("");
        }, 1000);
      } else {
        // Asamblea no iniciada o finalizada
        setError(response.data.msg);
        setAssembly(response.data.assembly);
      }
    } catch (err: any) {
      setError(err.response?.data?.msg || "Código de acceso inválido");
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Verificar documento
  const handleVerifyDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!assembly) {
      setError("No hay asamblea seleccionada");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(API_CONFIG.ENDPOINTS.ASSEMBLY_ACCESS.VERIFY_DOCUMENT, {
        assemblyId: assembly.id,
        documentNumber: documentNumber.trim(),
      });

      setVerificationId(response.data.verificationId);
      setSuccess(response.data.msg || "Código de verificación enviado a tu correo electrónico");
      
      // En desarrollo, mostrar el código si está disponible
      if (response.data.email) {
        console.log("Email de destino:", response.data.email);
      }

      setTimeout(() => {
        setStep(2);
        setSuccess("");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al verificar documento");
    } finally {
      setLoading(false);
    }
  };

  // Paso 3: Verificar código de verificación
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!assembly || !verificationId) {
      setError("Faltan datos necesarios");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(API_CONFIG.ENDPOINTS.ASSEMBLY_ACCESS.VERIFY_CODE, {
        assemblyId: assembly.id,
        verificationId: verificationId,
        code: verificationCode.trim(),
      });

      if (response.data.accessGranted) {
        setSuccess(`Bienvenido a ${response.data.assembly.name}`);
        
        // Guardar información de acceso en localStorage para la sesión
        localStorage.setItem(`assembly_access_${assembly.id}`, JSON.stringify({
          assemblyId: assembly.id,
          assemblyName: response.data.assembly.name,
          participantId: response.data.participant.id,
          accessTime: new Date().toISOString(),
        }));
        
        // Redirigir a la sala de votación después de 2 segundos
        setTimeout(() => {
          navigate(`/voting/${assembly.id}`);
        }, 2000);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.msg || "Código de verificación incorrecto";
      setError(errorMsg);

      // Si hay información de intentos, mostrarla
      if (err.response?.data?.attempts) {
        setError(`${errorMsg} (Intento ${err.response.data.attempts} de 3)`);
      }

      // Si está bloqueado, mostrar mensaje especial
      if (err.response?.status === 423) {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setError("");
      setSuccess("");
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#d9ebfa",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
      }}
    >
      <Card
        sx={{
          maxWidth: 600,
          width: "100%",
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <CardContent sx={{ padding: "3rem" }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: "#212529",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            Acceso a la Asamblea
          </Typography>

          {/* Stepper */}
          <Stepper activeStep={step} sx={{ marginBottom: "2rem", marginTop: "1rem" }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Mensajes */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}

          {/* Paso 1: Código de acceso */}
          {step === 0 && (
            <form onSubmit={handleVerifyAccessCode}>
              <Typography variant="body1" sx={{ mb: 2, color: "#666" }}>
                Ingrese el código de acceso proporcionado para la asamblea
              </Typography>
              <TextField
                fullWidth
                label="Código de acceso"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                margin="normal"
                required
                disabled={loading}
                inputProps={{
                  maxLength: 8,
                  style: { textTransform: "uppercase", textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5rem" },
                }}
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
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || !accessCode.trim()}
                sx={{
                  marginTop: 2,
                  padding: "0.75rem",
                  backgroundColor: "#1976d2",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#1565c0",
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Verificar código"}
              </Button>
            </form>
          )}

          {/* Paso 2: Número de documento */}
          {step === 1 && (
            <form onSubmit={handleVerifyDocument}>
              {assembly && (
                <Box sx={{ mb: 2, p: 2, backgroundColor: "#e3f2fd", borderRadius: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "#1976d2" }}>
                    {assembly.name}
                  </Typography>
                </Box>
              )}
              <Typography variant="body1" sx={{ mb: 2, color: "#666" }}>
                Ingrese su número de documento o email
              </Typography>
              <TextField
                fullWidth
                label="Número de documento o email"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                margin="normal"
                required
                disabled={loading}
                type="text"
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
              <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={loading}
                  sx={{
                    flex: 1,
                    textTransform: "none",
                    borderColor: "#757575",
                    color: "#757575",
                    "&:hover": {
                      borderColor: "#424242",
                      backgroundColor: "rgba(117, 117, 117, 0.08)",
                    },
                  }}
                >
                  Volver
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !documentNumber.trim()}
                  sx={{
                    flex: 1,
                    padding: "0.75rem",
                    backgroundColor: "#1976d2",
                    fontWeight: 600,
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "#1565c0",
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Verificar"}
                </Button>
              </Box>
            </form>
          )}

          {/* Paso 3: Código de verificación */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode}>
              {assembly && (
                <Box sx={{ mb: 2, p: 2, backgroundColor: "#e3f2fd", borderRadius: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "#1976d2" }}>
                    {assembly.name}
                  </Typography>
                </Box>
              )}
              <Typography variant="body1" sx={{ mb: 2, color: "#666" }}>
                Ingrese el código de verificación que se envió a su correo electrónico
              </Typography>
              <TextField
                fullWidth
                label="Código de verificación"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").substring(0, 6))}
                margin="normal"
                required
                disabled={loading}
                inputProps={{
                  maxLength: 6,
                  style: { textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5rem" },
                }}
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
              <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={loading}
                  sx={{
                    flex: 1,
                    textTransform: "none",
                    borderColor: "#757575",
                    color: "#757575",
                    "&:hover": {
                      borderColor: "#424242",
                      backgroundColor: "rgba(117, 117, 117, 0.08)",
                    },
                  }}
                >
                  Volver
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || verificationCode.length !== 6}
                  sx={{
                    flex: 1,
                    padding: "0.75rem",
                    backgroundColor: "#1976d2",
                    fontWeight: 600,
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "#1565c0",
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Verificar código"}
                </Button>
              </Box>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

