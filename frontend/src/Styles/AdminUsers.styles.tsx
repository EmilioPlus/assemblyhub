import { Box, Card, Typography, styled, Chip } from "@mui/material";

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

export const StyledUserCard = styled(Card)({
  backgroundColor: "#fff",
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
  },
});

export const StyledUserInfo = styled(Box)({
  textAlign: "center",
  "& > *": {
    marginBottom: "0.5rem",
  },
});

export const StyledRoleChip = styled(Chip)({
  marginTop: "0.5rem",
  marginBottom: "0.5rem",
});

export const StyledBackLink = styled(Box)({
  textAlign: "center",
  marginTop: "2rem",
});
