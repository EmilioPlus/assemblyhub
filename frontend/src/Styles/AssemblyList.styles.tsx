import { Box, styled } from "@mui/material";

export const StyledContainer = styled(Box)({
  backgroundColor: "#d9ebfa",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "2rem",
});

export const StyledTitleCard = styled(Box)({
  background: "white",
  borderRadius: 16,
  padding: "2rem",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  width: "90%",
  maxWidth: 1200,
  marginBottom: "2rem",
  textAlign: "center",
});

export const StyledAssembliesGrid = styled(Box)({
  width: "90%",
  maxWidth: 1200,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: "1.5rem",
  marginBottom: "2rem",
});

export const StyledAssemblyCard = styled(Box)({
  background: "#fff",
  borderRadius: 16,
  padding: "1.5rem",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
  },
});

export const StyledStatusBadge = styled(Box)<{ status: string }>(({ status }) => ({
  display: "inline-block",
  padding: "0.25rem 0.75rem",
  borderRadius: 12,
  fontSize: "0.75rem",
  fontWeight: 600,
  backgroundColor: status === "active" ? "#e8f5e9" : status === "upcoming" ? "#fff3e0" : "#fce4ec",
  color: status === "active" ? "#2e7d32" : status === "upcoming" ? "#f57c00" : "#c2185b",
}));

export const StyledBackButton = styled(Box)({
  marginTop: "2rem",
  marginBottom: "1rem",
});
