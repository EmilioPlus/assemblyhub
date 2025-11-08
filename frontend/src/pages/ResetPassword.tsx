import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { ModalBackdrop, ModalCard, Field, ConfirmButton } from "../Styles/ResetPassword.styles";
import axios from "axios";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const token = params.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (email && token) setOpen(true);
  }, [email, token]);

  const handleConfirm = async () => {
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/reset-password", { email, token, newPassword });
      setOpen(false);
      // Redireccionar automáticamente al login después de 1 segundo
      setTimeout(() => {
        navigate("/", { state: { message: "Contraseña actualizada correctamente. Por favor, inicia sesión." } });
      }, 1000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <ModalBackdrop>
          <ModalCard>
            <h2 style={{ margin: 0 }}>Change Password</h2>
            <p style={{ color: "#888", fontSize: 12, marginTop: 8 }}>Ingresa tu nueva contraseña para continuar</p>
            
            {error && (
              <div style={{ color: "#d32f2f", fontSize: "0.875rem", marginBottom: "1rem", textAlign: "center" }}>
                {error}
              </div>
            )}
            
            <Field 
              fullWidth 
              placeholder="New Password" 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
            <Field 
              fullWidth 
              placeholder="Confirm Password" 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <ConfirmButton onClick={handleConfirm} disabled={loading}>
              {loading ? "Actualizando..." : "CONFIRM CHANGE"}
            </ConfirmButton>
            <div style={{ marginTop: 12 }}>
              <Link to="/">Volver al login</Link>
            </div>
          </ModalCard>
        </ModalBackdrop>
      )}
    </>
  );
}


