import { useState, useEffect } from "react";
import { IconButton, InputAdornment, FormControlLabel, Alert } from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  StyledContainer,
  StyledFormCard,
  StyledAvatar,
  StyledUsernameField,
  StyledPasswordField,
  StyledOptionsBox,
  StyledCheckbox,
  StyledLabelTypography,
  StyledLoginButton,
  iconStyle,
  AccountCircleIcon,
} from "../Styles/Login.styles";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(""); // Clear success message when trying to login
    setLoading(true);

    try {
      await login(email, password);
      // Redirigir al Dashboard como destino principal
      setError("");
      navigate("/dashboard");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer>
      <StyledFormCard>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Avatar */}
        <StyledAvatar>
          <AccountCircleIcon sx={iconStyle} />
        </StyledAvatar>

        {/* Email */}
        <StyledUsernameField
          variant="outlined"
          fullWidth
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AccountCircleIcon color="primary" />
              </InputAdornment>
            ),
          }}
        />

        {/* Password */}
        <StyledPasswordField
          variant="outlined"
          fullWidth
          placeholder="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon color="primary" />
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

        {/* Remember me */}
        <StyledOptionsBox>
          <FormControlLabel
            control={
              <StyledCheckbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
            }
            label={<StyledLabelTypography>Remember me</StyledLabelTypography>}
          />
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Link
              to="/register"
              style={{
                fontSize: "0.9rem",
                color: "#1976d2",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
            >
              Register
            </Link>
            <span style={{ fontSize: "0.9rem", color: "#1976d2" }}>|</span>
            <Link
              to="/forgot-password"
              style={{
                fontSize: "0.9rem",
                color: "#1976d2",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
            >
              Forgot password?
            </Link>
          </div>
        </StyledOptionsBox>

        {/* Error / Success messages */}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

          {/* Login button */}
          <StyledLoginButton type="submit" variant="contained" disabled={loading}>
            {loading ? "Ingresando..." : "LOGIN"}
          </StyledLoginButton>
        </form>
      </StyledFormCard>
    </StyledContainer>
  );
}