import { Box, Card, Typography, TextField, styled } from "@mui/material";

export const StyledContainer = styled(Box)({
  backgroundColor: "#d9ebfa",
  minHeight: "100vh",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  paddingTop: "2rem",
});

export const StyledCard = styled(Card)({
  width: "90%",
  maxWidth: 1200,
  backgroundColor: "white",
  borderRadius: 16,
  padding: "2rem",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
});

export const StyledTitle = styled(Typography)({
  color: "#424242",
  fontSize: "1.8rem",
  fontWeight: 600,
  marginBottom: "1rem",
  textAlign: "center",
});

export const StyledActionCard = styled(Card)({
  backgroundColor: "#fff",
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  cursor: "pointer",
  transition: "transform 0.2s, box-shadow 0.2s",
  textAlign: "center",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
  },
});

export const StyledSearchField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "#F5F5F5",
    "& fieldset": { borderColor: "#BBDEFB" },
    "&:hover fieldset": { borderColor: "#2196F3" },
    "&.Mui-focused fieldset": { borderColor: "#2196F3" },
  },
});

export const StyledBackLink = styled(Box)({
  textAlign: "center",
  marginTop: "2rem",
});
