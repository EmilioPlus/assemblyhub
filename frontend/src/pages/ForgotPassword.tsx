import { useState } from "react";
import { InputAdornment, Alert } from "@mui/material";
import axios from "axios";
import { ModalBackdrop, ModalCard, Field, ConfirmButton } from "../Styles/ResetPassword.styles";
import { Link } from "react-router-dom";
import EmailIcon from "@mui/icons-material/Email";
import {
  StyledContainer,
  StyledFormCard,
  StyledTitle,
  StyledDescription,
  StyledLabel,
  StyledEmailField,
  StyledRequestButton,
  StyledBackLink,
} from "../Styles/ForgotPassword.styles";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
      setSuccess("Se ha enviado un enlace de recuperación a su correo electrónico");
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al enviar el enlace de recuperación");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    // Este modal es decorativo en esta pantalla; el reseteo real se hace en ResetPassword.tsx
    setShowReset(false);
  };

  return (
    <StyledContainer>
      <StyledFormCard>
        <StyledTitle>Forgot your password?</StyledTitle>
        <StyledDescription>
          Please enter the email address you'd like your password reset information sent to
        </StyledDescription>

        <form onSubmit={handleSubmit}>
          <StyledLabel>Enter email address</StyledLabel>
          <StyledEmailField
            variant="outlined"
            fullWidth
            placeholder="Enter your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: "#1976d2" }} />
                </InputAdornment>
              ),
            }}
          />

          {success && (
            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess("")}>{success}</Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>{error}</Alert>
          )}

          <StyledRequestButton type="submit" variant="contained" disabled={loading}>
            {loading ? "Enviando..." : "Request reset link"}
          </StyledRequestButton>

          <StyledBackLink>
            <Link to="/">Back to Login</Link>
          </StyledBackLink>
        </form>
      </StyledFormCard>
      {showReset && (
        <ModalBackdrop>
          <ModalCard>
            <img alt="lock" src="/lock.png" style={{ width: 80, marginBottom: 16 }} />
            <h2 style={{ margin: 0 }}>Change Password</h2>
            <p style={{ color: "#888", fontSize: 12, marginTop: 8 }}>
              Ingresa tu nueva contraseña para continuar
            </p>
            <Field
              fullWidth
              placeholder="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Field
              fullWidth
              placeholder="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <ConfirmButton onClick={handleConfirmReset}>CONFIRM CHANGE</ConfirmButton>
          </ModalCard>
        </ModalBackdrop>
      )}
    </StyledContainer>
  );
}
