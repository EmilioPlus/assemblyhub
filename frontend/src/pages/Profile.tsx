import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { InputAdornment, IconButton, Alert, Button } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  StyledContainer,
  StyledFormCard,
  StyledTitle,
  StyledTextField,
  StyledButton,
  StyledBackLink,
} from "../Styles/Profile.styles";

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { updateProfile, isLoading, error, clearError } = useUserProfile();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    documentType: "",
    documentNumber: "",
  });
  const [touched, setTouched] = useState({ firstName: false, lastName: false });
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
        password: "",
        documentType: user.documentType || "",
        documentNumber: user.documentNumber || "",
      });
    }
  }, [isAuthenticated, navigate, user]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };
  const handleBlur = (field: keyof typeof touched) => () => setTouched({ ...touched, [field]: true });

  // Validaciones nombres/apellidos: solo letras y espacios, 2-80 chars
  const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,80}$/;
  const isFirstNameValid = nameRegex.test(formData.firstName.trim());
  const isLastNameValid = nameRegex.test(formData.lastName.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    clearError();

    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete (updateData as any).password;
      }

      await updateProfile(updateData);
      setSuccess("Perfil actualizado exitosamente");
      setFormData({ ...formData, password: "" });
    } catch (err: any) {
      // Error is handled by the hook
    }
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  if (!user) {
    return (
      <StyledContainer>
        <StyledFormCard>
          <StyledTitle>Cargando perfil...</StyledTitle>
        </StyledFormCard>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      <StyledFormCard>
        <StyledTitle>Mi Perfil</StyledTitle>
        <p style={{ color: "#757575", marginBottom: "2rem", textAlign: "center" }}>
          Administre su información personal
        </p>

        <form onSubmit={handleSubmit}>
          {/* First Name & Last Name */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <StyledTextField
                variant="outlined"
                fullWidth
                placeholder="Nombre"
                value={formData.firstName}
                onChange={handleChange("firstName")}
                onBlur={handleBlur("firstName")}
                error={touched.firstName && !isFirstNameValid}
                helperText={touched.firstName && !isFirstNameValid ? "Solo letras y espacios (2-80)" : " "}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ fontSize: "20px", color: "#1976d2" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </div>
            <div>
              <StyledTextField
                variant="outlined"
                fullWidth
                placeholder="Apellido"
                value={formData.lastName}
                onChange={handleChange("lastName")}
                onBlur={handleBlur("lastName")}
                error={touched.lastName && !isLastNameValid}
                helperText={touched.lastName && !isLastNameValid ? "Solo letras y espacios (2-80)" : " "}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ fontSize: "20px", color: "#1976d2" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </div>
          </div>

          {/* Username & Email */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <StyledTextField
                variant="outlined"
                fullWidth
                placeholder="Nombre de usuario"
                value={formData.username}
                onChange={handleChange("username")}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ fontSize: "20px", color: "#1976d2" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </div>
            <div>
              <StyledTextField
                variant="outlined"
                fullWidth
                placeholder="Email"
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                disabled
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ fontSize: "20px", color: "#1976d2" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </div>
          </div>

          {/* Document (read-only) - render only if values present */}
          {(formData.documentType || formData.documentNumber) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <StyledTextField
                  variant="outlined"
                  fullWidth
                  placeholder="Tipo de documento"
                  value={formData.documentType}
                  disabled
                />
              </div>
              <div>
                <StyledTextField
                  variant="outlined"
                  fullWidth
                  placeholder="Número de documento"
                  value={formData.documentNumber}
                  disabled
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div style={{ marginBottom: "1rem" }}>
            <StyledTextField
              variant="outlined"
              fullWidth
              placeholder="Nueva contraseña (dejar vacío para no cambiar)"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange("password")}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ fontSize: "20px", color: "#1976d2" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <VisibilityOffIcon color="primary" />
                      ) : (
                        <VisibilityIcon color="primary" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </div>

          {/* Role Display */}
          <div style={{ marginBottom: "1rem", textAlign: "center" }}>
            <p style={{ color: "#1976d2", fontWeight: "bold" }}>
              Rol: {user.role === "admin" ? "Administrador" : "Participante"}
            </p>
          </div>

          {/* Messages */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {/* Update Button */}
          <StyledButton type="submit" variant="contained" disabled={isLoading || !isFirstNameValid || !isLastNameValid}>
            {isLoading ? "Actualizando..." : "Actualizar Perfil"}
          </StyledButton>

          {/* Back to Dashboard */}
          <StyledBackLink>
            <Button onClick={handleBackToDashboard} variant="outlined">
              Volver al Dashboard
            </Button>
          </StyledBackLink>
        </form>
      </StyledFormCard>
    </StyledContainer>
  );
}
