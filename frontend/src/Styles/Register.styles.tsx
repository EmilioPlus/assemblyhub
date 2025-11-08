import { Box, TextField, Button, FormControl, Typography, styled } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import HomeIcon from "@mui/icons-material/Home";

// Container Styles
export const StyledContainer = styled(Box)({
  backgroundColor: "#d9ebfa",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem 0",
});

// Card/Form Container Styles
export const StyledFormCard = styled(Box)({
  width: 600,
  maxWidth: "90%",
  backgroundColor: "white",
  padding: "2.5rem",
  borderRadius: "12px",
  boxShadow: "0 0 20px rgba(0,0,0,0.1)",
});

// Title Styles
export const StyledTitle = styled(Typography)({
  color: "#333333",
  fontSize: "1.75rem",
  fontWeight: 600,
  marginBottom: "1.5rem",
  textAlign: "center",
  textTransform: "uppercase",
  letterSpacing: "1px",
});

// Two Column Grid
export const StyledGrid = styled(Box)({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "1rem",
  marginBottom: "1rem",
  "@media (max-width: 600px)": {
    gridTemplateColumns: "1fr",
  },
});

// Label Typography Styles
export const StyledLabel = styled(Typography)({
  color: "#333333",
  fontSize: "0.85rem",
  fontWeight: 500,
  marginBottom: "0.4rem",
  display: "flex",
  alignItems: "center",
  gap: "0.3rem",
});

// TextField Styles
export const StyledTextField = styled(TextField)({
  marginBottom: "1rem",
  width: "100%",
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#FAFAFA",
    "& fieldset": { borderColor: "#E0E0E0" },
    "&:hover fieldset": { borderColor: "#1976d2" },
    "&.Mui-focused fieldset": { borderColor: "#1976d2" },
  },
  "& .MuiInputBase-input": {
    color: "#333333",
  },
});

// Select Field Styles
export const StyledSelectField = styled(FormControl)({
  marginBottom: "1rem",
  width: "100%",
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#FAFAFA",
    "& fieldset": { borderColor: "#E0E0E0" },
    "&:hover fieldset": { borderColor: "#1976d2" },
    "&.Mui-focused fieldset": { borderColor: "#1976d2" },
  },
  "& .MuiSelect-select": {
    color: "#333333",
  },
});

// Create Account Button Styles
export const StyledCreateButton = styled(Button)({
  width: "100%",
  backgroundColor: "#1976d2",
  color: "white",
  fontWeight: 600,
  padding: "0.9rem",
  borderRadius: "8px",
  marginTop: "1rem",
  textTransform: "uppercase",
  fontSize: "0.95rem",
  letterSpacing: "1px",
  "&:hover": { 
    backgroundColor: "#1565c0" 
  },
});

// Back to Login Link Styles
export const StyledBackLink = styled(Box)({
  textAlign: "center",
  marginTop: "1rem",
  "& a": {
    color: "#1976d2",
    textDecoration: "none",
    fontSize: "0.9rem",
    fontWeight: 500,
    "&:hover": {
      textDecoration: "underline",
    },
  },
});

// Helper Text Styles
export const StyledHelperText = styled(Typography)({
  color: "#999999",
  fontSize: "0.75rem",
  marginTop: "-0.75rem",
  marginBottom: "0.5rem",
  fontStyle: "italic",
});

// eslint-disable-next-line react-refresh/only-export-components
export const iconStyle = {
  color: "#1976d2",
  fontSize: "18px",
};

// Icon components export
export { PersonIcon, EmailIcon, LockIcon, LocationOnIcon, HomeIcon };
