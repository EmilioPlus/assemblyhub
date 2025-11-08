import { Box, TextField, Button, styled } from "@mui/material";

export const StyledContainer = styled(Box)({
  backgroundColor: "#d9ebfa",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem",
});

export const StyledFormCard = styled(Box)({
  background: "#fff",
  borderRadius: 16,
  padding: "2.5rem",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  width: "100%",
  maxWidth: 600,
});

export const StyledTitle = styled("h2")({
  color: "#1976d2",
  textAlign: "center",
  margin: "0 0 0.5rem 0",
  fontSize: "1.75rem",
  fontWeight: 600,
});

export const StyledDescription = styled("p")({
  color: "#757575",
  textAlign: "center",
  marginBottom: "2rem",
  fontSize: "0.9rem",
});

export const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: 8,
    backgroundColor: "#fff",
  },
});

export const StyledButtonGroup = styled(Box)({
  display: "flex",
  gap: "1rem",
  justifyContent: "flex-end",
  marginTop: "1rem",
});

export const StyledCreateButton = styled(Button)({
  borderRadius: 8,
  padding: "0.625rem 2rem",
  fontSize: "0.95rem",
  textTransform: "none",
  background: "#1976d2",
  color: "#fff",
  "&:hover": {
    background: "#1565c0",
  },
});

export const StyledCancelButton = styled(Button)({
  borderRadius: 8,
  padding: "0.625rem 2rem",
  fontSize: "0.95rem",
  textTransform: "none",
  background: "#fff",
  color: "#1976d2",
  border: "1px solid #1976d2",
  "&:hover": {
    background: "#f5f5f5",
  },
});
