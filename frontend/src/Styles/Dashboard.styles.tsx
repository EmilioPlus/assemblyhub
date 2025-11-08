import { Box, styled } from "@mui/material";

export const DashContainer = styled(Box)({
  backgroundColor: "#d9ebfa",
  minHeight: "100vh",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  paddingTop: "2rem",
  flexDirection: "column",
  gap: "1rem",
});

export const HeaderCard = styled(Box)({
  width: "90%",
  maxWidth: 1200,
  background: "white",
  borderRadius: 16,
  padding: "2rem",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  textAlign: "center",
  margin: "0 auto",
});

export const CardsGrid = styled(Box)({
  width: "90%",
  maxWidth: 1200,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "1rem",
  "@media (max-width: 1200px)": {
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  },
  "@media (max-width: 600px)": {
    gridTemplateColumns: "1fr",
  },
});

export const Card = styled(Box)({
  background: "#fff",
  borderRadius: 16,
  padding: "1.25rem",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  textAlign: "center",
  cursor: "pointer",
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
  },
});

export const ProfileCard = styled(Card)({
  position: "relative",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
    "&::after": {
      content: '"Pasa el mouse para ver información"',
      position: "absolute",
      top: "-30px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#1976d2",
      color: "white",
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      whiteSpace: "nowrap",
      zIndex: 1000,
    },
  },
});

export const LogoutCard = styled(Card)({
  background: "#ef5350",
  color: "#fff",
  "&:hover": {
    background: "#d32f2f",
    transform: "translateY(-5px)",
    boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
  },
});