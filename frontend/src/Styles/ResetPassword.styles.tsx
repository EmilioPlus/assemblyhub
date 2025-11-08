import { Box, TextField, Button, styled } from "@mui/material";

export const ModalBackdrop = styled(Box)({
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
});

export const ModalCard = styled(Box)({
  width: 380,
  maxWidth: "95%",
  background: "#fff",
  borderRadius: 16,
  padding: "2rem",
  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
  textAlign: "center",
});

export const Field = styled(TextField)({
  marginTop: "0.75rem",
  "& .MuiOutlinedInput-root": {
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
  },
});

export const ConfirmButton = styled(Button)({
  marginTop: "1rem",
  background: "#FFAA33",
  color: "#fff",
  fontWeight: 700,
  borderRadius: 12,
  padding: "0.9rem",
  "&:hover": { background: "#FF9900" },
});


