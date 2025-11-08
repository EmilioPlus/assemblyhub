import { Box, TextField, Button, Typography, styled } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";

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
  width: 400,
  backgroundColor: "white",
  textAlign: "left",
  padding: "2.5rem",
  borderRadius: "12px",
  boxShadow: "0 0 15px rgba(0,0,0,0.1)",
});

// Title Typography Styles
export const StyledTitle = styled(Typography)({
  color: "#333333",
  fontSize: "1.5rem",
  fontWeight: 600,
  marginBottom: "0.5rem",
});

// Description Typography Styles
export const StyledDescription = styled(Typography)({
  color: "#666666",
  fontSize: "0.9rem",
  marginBottom: "2rem",
  lineHeight: 1.5,
});

// Label Typography Styles
export const StyledLabel = styled(Typography)({
  color: "#333333",
  fontSize: "0.85rem",
  fontWeight: 500,
  marginBottom: "0.5rem",
});

// Email TextField Styles
export const StyledEmailField = styled(TextField)({
  marginBottom: "1.5rem",
  width: "100%",
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "#FAFAFA",
    "& fieldset": { borderColor: "#E0E0E0" },
    "&:hover fieldset": { borderColor: "#1976d2" },
    "&.Mui-focused fieldset": { borderColor: "#1976d2" },
  },
  "& .MuiInputBase-input": {
    color: "#333333",
  },
});

// Request Reset Button Styles
export const StyledRequestButton = styled(Button)({
  width: "100%",
  backgroundColor: "#1976d2",
  color: "white",
  fontWeight: 600,
  padding: "0.9rem",
  borderRadius: "8px",
  marginBottom: "1.5rem",
  textTransform: "none",
  "&:hover": { 
    backgroundColor: "#1565c0" 
  },
});

// Back to Login Link Styles
export const StyledBackLink = styled(Box)({
  textAlign: "center",
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

// Icon style
export const iconStyle = {
  color: "#1976d2",
};

// Icon components export
export { EmailIcon };
