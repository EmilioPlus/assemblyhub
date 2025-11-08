import { Box, TextField, Button, Typography, styled } from "@mui/material";

export const StyledContainer = styled(Box)({
  backgroundColor: "#d9ebfa",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem",
});

export const StyledFormCard = styled(Box)({
  width: "100%",
  maxWidth: 600,
  backgroundColor: "white",
  textAlign: "center",
  padding: "2rem",
  borderRadius: "12px",
  boxShadow: "0 0 15px rgba(0,0,0,0.1)",
});

export const StyledTitle = styled(Typography)({
  color: "#424242",
  fontSize: "1.8rem",
  fontWeight: 600,
  marginBottom: "1rem",
});

export const StyledTextField = styled(TextField)({
  marginBottom: "1rem",
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "#F5F5F5",
    "& fieldset": { borderColor: "#BBDEFB" },
    "&:hover fieldset": { borderColor: "#2196F3" },
    "&.Mui-focused fieldset": { borderColor: "#2196F3" },
  },
});

export const StyledButton = styled(Button)({
  width: "100%",
  backgroundColor: "#1976d2",
  color: "white",
  fontWeight: 600,
  letterSpacing: "1px",
  padding: "1rem",
  borderRadius: "10px",
  marginTop: "1rem",
  "&:hover": { backgroundColor: "#1565c0" },
});

export const StyledBackLink = styled(Box)({
  textAlign: "center",
  marginTop: "1.5rem",
});
