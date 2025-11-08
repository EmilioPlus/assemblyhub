import { useState } from "react";
import { InputAdornment, MenuItem, InputLabel, Select, Alert } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  StyledContainer,
  StyledFormCard,
  StyledTitle,
  StyledGrid,
  StyledLabel,
  StyledTextField,
  StyledSelectField,
  StyledCreateButton,
  StyledBackLink,
  StyledHelperText,
  PersonIcon,
  EmailIcon,
  LockIcon,
  LocationOnIcon,
  HomeIcon,
} from "../Styles/Register.styles";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    address: "",
    zip: "",
    role: "participant",
  });
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
    address: false,
    zip: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleBlur = (field: keyof typeof touched) => () =>
    setTouched({ ...touched, [field]: true });

  // Validaciones de formulario para habilitar/deshabilitar el botón Registrar
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const doPasswordsMatch = formData.password.length > 0 && formData.password === formData.confirmPassword;
  const isPasswordLengthValid = formData.password.length >= 6;
  const requiredFieldsFilled =
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.password.trim() !== "" &&
    formData.confirmPassword.trim() !== "" &&
    formData.address.trim() !== "";
  const isFormValid = requiredFieldsFilled && isEmailValid && isPasswordLengthValid && doPasswordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validar contraseñas
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/auth/register", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      if (response.data) {
        // Intentar auto-login para obtener token y redirigir al dashboard
        try {
          const loginRes = await axios.post("http://localhost:5000/api/auth/login", {
            email: formData.email,
            password: formData.password,
          });
          if (loginRes.data?.token) {
            localStorage.setItem("token", loginRes.data.token);
            localStorage.setItem("user", JSON.stringify(loginRes.data.user));
            navigate("/dashboard");
            return;
          }
        } catch (loginErr) {
          // Si el auto-login falla, seguimos con el flujo normal
          console.warn("Auto-login falló:", loginErr);
        }

        // Si no hay token, redirigimos al login clásico
        alert("Usuario registrado exitosamente. Por favor, inicia sesión.");
        navigate("/");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al registrar usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer>
      <StyledFormCard>
        <StyledTitle>Create Account</StyledTitle>

        <form onSubmit={handleSubmit}>
          {/* First Name & Last Name */}
          <StyledGrid>
            <div>
              <StyledLabel>
                First name <span style={{ color: "#ff0000" }}>*</span>
              </StyledLabel>
              <StyledTextField
                variant="outlined"
                fullWidth
                placeholder="First name"
                value={formData.firstName}
                onChange={handleChange("firstName")}
                onBlur={handleBlur("firstName")}
                required
                error={touched.firstName && formData.firstName.trim() === ""}
                helperText={touched.firstName && formData.firstName.trim() === "" ? "El nombre es requerido" : " "}
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
              <StyledLabel>
                Last name <span style={{ color: "#ff0000" }}>*</span>
              </StyledLabel>
              <StyledTextField
                variant="outlined"
                fullWidth
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleChange("lastName")}
                onBlur={handleBlur("lastName")}
                required
                error={touched.lastName && formData.lastName.trim() === ""}
                helperText={touched.lastName && formData.lastName.trim() === "" ? "El apellido es requerido" : " "}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ fontSize: "20px", color: "#1976d2" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </div>
          </StyledGrid>

          {/* Email & Password */}
          <StyledGrid>
            <div>
              <StyledLabel>
                Email <span style={{ color: "#ff0000" }}>*</span>
              </StyledLabel>
              <StyledTextField
                variant="outlined"
                fullWidth
                placeholder="Email"
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                onBlur={handleBlur("email")}
                required
                error={
                  touched.email && (
                    formData.email.trim() === "" || !isEmailValid
                  )
                }
                helperText={
                  touched.email
                    ? formData.email.trim() === ""
                      ? "El email es requerido"
                      : !isEmailValid
                      ? "Formato de email inválido"
                      : " "
                    : " "
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ fontSize: "20px", color: "#1976d2" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </div>
            <div>
              <StyledLabel>
                Password <span style={{ color: "#ff0000" }}>*</span>
              </StyledLabel>
              <StyledTextField
                variant="outlined"
                fullWidth
                placeholder="Password"
                type="password"
                value={formData.password}
                onChange={handleChange("password")}
                onBlur={handleBlur("password")}
                required
                error={
                  touched.password && (
                    formData.password.trim() === "" || !isPasswordLengthValid
                  )
                }
                helperText={
                  touched.password
                    ? formData.password.trim() === ""
                      ? "La contraseña es requerida"
                      : !isPasswordLengthValid
                      ? "La contraseña debe tener al menos 6 caracteres"
                      : " "
                    : " "
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ fontSize: "20px", color: "#1976d2" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </div>
          </StyledGrid>

          {/* Confirm Password & Country */}
          <StyledGrid>
            <div>
              <StyledLabel>
                Confirm password <span style={{ color: "#ff0000" }}>*</span>
              </StyledLabel>
              <StyledTextField
                variant="outlined"
                fullWidth
                placeholder="Confirm password"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange("confirmPassword")}
                onBlur={handleBlur("confirmPassword")}
                required
                error={
                  touched.confirmPassword && (
                    formData.confirmPassword.trim() === "" || !doPasswordsMatch
                  )
                }
                helperText={
                  touched.confirmPassword
                    ? formData.confirmPassword.trim() === ""
                      ? "La confirmación es requerida"
                      : !doPasswordsMatch
                      ? "Las contraseñas no coinciden"
                      : " "
                    : " "
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ fontSize: "20px", color: "#1976d2" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </div>
            <div>
              <StyledLabel>Role</StyledLabel>
              <StyledSelectField>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  label="Role"
                >
                  <MenuItem value="participant">Participant</MenuItem>
                  <MenuItem value="admin">Administrator</MenuItem>
                </Select>
              </StyledSelectField>
            </div>
          </StyledGrid>

          {/* Address */}
          <div>
            <StyledLabel>
              Address <span style={{ color: "#ff0000" }}>*</span>
            </StyledLabel>
            <StyledTextField
              variant="outlined"
              fullWidth
              placeholder="Enter your address"
              value={formData.address}
              onChange={handleChange("address")}
              onBlur={handleBlur("address")}
              required
              error={touched.address && formData.address.trim() === ""}
              helperText={touched.address && formData.address.trim() === "" ? "La dirección es requerida" : " "}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <HomeIcon sx={{ fontSize: "20px", color: "#1976d2" }} />
                  </InputAdornment>
                ),
              }}
            />
            <StyledHelperText>Please add your home address</StyledHelperText>
          </div>

          {/* Zip */}
          <div>
            <StyledLabel>Zip</StyledLabel>
            <StyledTextField
              variant="outlined"
              fullWidth
              placeholder="Enter ZIP code"
              value={formData.zip}
              onChange={handleChange("zip")}
              onBlur={handleBlur("zip")}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOnIcon sx={{ fontSize: "20px", color: "#1976d2" }} />
                  </InputAdornment>
                ),
              }}
            />
            <StyledHelperText>Please add your ZIP code</StyledHelperText>
          </div>

          {/* Error message */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Create Account Button */}
          <StyledCreateButton type="submit" variant="contained" disabled={loading || !isFormValid}>
            {loading ? "Creando cuenta..." : "Create Account"}
          </StyledCreateButton>

          {/* Back to Login Link */}
          <StyledBackLink>
            <Link to="/">Back to Login</Link>
          </StyledBackLink>
        </form>
      </StyledFormCard>
    </StyledContainer>
  );
}