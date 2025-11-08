import { Box, Avatar, TextField, Button, Checkbox, Typography, styled } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

// Container Styles
export const StyledContainer = styled(Box)({
  backgroundColor: "#d9ebfa",
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

// Card/Form Container Styles
export const StyledFormCard = styled(Box)({
  width: 360,
  backgroundColor: "#d9ebfa",
  textAlign: "center",
  padding: "2rem",
  borderRadius: "8px",
  boxShadow: "0 0 15px rgba(0,0,0,0.1)",
});

// Avatar Styles
export const StyledAvatar = styled(Avatar)({
  width: 80,
  height: 80,
  margin: "0 auto 25px",
  backgroundColor: "transparent",
  color: "#1976d2",
  border: "3px solid #1976d2",
});

// Username TextField Styles
export const StyledUsernameField = styled(TextField)({
  marginBottom: "1rem",
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "white",
    "& fieldset": { borderColor: "#1976d2" },
    "&:hover fieldset": { borderColor: "#1565c0" },
    "&.Mui-focused fieldset": { borderColor: "#1565c0" },
  },
});

// Password TextField Styles
export const StyledPasswordField = styled(TextField)({
  marginBottom: "0.5rem",
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "white",
    "& fieldset": { borderColor: "#1976d2" },
    "&:hover fieldset": { borderColor: "#1565c0" },
    "&.Mui-focused fieldset": { borderColor: "#1565c0" },
  },
});

// Options Box (Remember me + Forgot password)
export const StyledOptionsBox = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "1.5rem",
  marginTop: "0.5rem",
});

// Checkbox Styles
export const StyledCheckbox = styled(Checkbox)({
  color: "#1976d2",
  "&.Mui-checked": { color: "#1976d2" },
});

// Label Typography Styles
export const StyledLabelTypography = styled(Typography)({
  color: "#1976d2",
  fontSize: "0.9rem",
  fontWeight: 500,
});

// Login Button Styles
export const StyledLoginButton = styled(Button)({
  width: "100%",
  backgroundColor: "#1976d2",
  fontWeight: 600,
  letterSpacing: "1px",
  padding: "0.8rem",
  borderRadius: "10px",
  "&:hover": { backgroundColor: "#1565c0" },
});

// eslint-disable-next-line react-refresh/only-export-components
export const iconStyle = {
  fontSize: 60,
};
// eslint-disable-next-line react-refresh/only-export-components
export const smallIconStyle = {
  color: "#1976d2",
};

// Icon components export
export { AccountCircleIcon };
