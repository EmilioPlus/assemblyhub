import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ProfileModal } from "../components/ProfileModal";
import {
  StyledAvatar,
  iconStyle,
  AccountCircleIcon,
} from "../Styles/Login.styles";
import { DashContainer, HeaderCard, CardsGrid, Card, LogoutCard, ProfileCard } from "../Styles/Dashboard.styles";

export default function Dashboard() {
  const nav = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  
  useEffect(() => {
    if (!isAuthenticated) {
      nav("/");
    }
  }, [isAuthenticated, nav]);

  const handleLogout = () => {
    logout();
    nav("/");
  };

  const handleCardClick = (path: string) => {
    nav(path);
  };

  const handleProfileModalClose = () => {
    setProfileModalOpen(false);
  };

  const handleProfileCardClick = () => {
    setProfileModalOpen(true);
  };

  const handleEditProfile = () => {
    nav("/profile");
  };

  if (!user) return null;

  const isAdmin = user.role === "admin";

  return (
    <DashContainer>
      <HeaderCard>
        <StyledAvatar>
          <AccountCircleIcon sx={iconStyle} />
        </StyledAvatar>
        <h1 style={{ margin: 0, color: "#1976d2" }}>
          {isAdmin ? "Panel de Administración" : "Panel de Participante"}
        </h1>
        <p style={{ color: "#757575", marginTop: "0.5rem" }}>Seleccione una opción para continuar</p>
        <p style={{ color: "#888" }}>Sesión activa como {user.role}</p>
      </HeaderCard>

      {isAdmin ? (
        <CardsGrid>
          <ProfileCard
            onClick={handleProfileCardClick}
          >
            <div style={{ fontSize: 40, color: "#1976d2" }}>👤</div>
            <h3 style={{ color: "#424242", margin: "0.5rem 0" }}>Perfil</h3>
            <p style={{ color: "#757575", fontSize: 12 }}>Administre su información personal.</p>
          </ProfileCard>
          <Card onClick={() => handleCardClick("/create-assembly")}>
            <div style={{ fontSize: 40, color: "#1976d2" }}>➕</div>
            <h3 style={{ color: "#424242", margin: "0.5rem 0" }}>Crear Asamblea</h3>
            <p style={{ color: "#757575", fontSize: 12 }}>Convocar oficialmente a los participantes.</p>
          </Card>
          <Card onClick={() => handleCardClick("/admin-users")}>
            <div style={{ fontSize: 40, color: "#1976d2" }}>👥</div>
            <h3 style={{ color: "#424242", margin: "0.5rem 0" }}>Gestión de Usuarios</h3>
            <p style={{ color: "#757575", fontSize: 12 }}>Administre todos los usuarios registrados.</p>
          </Card>
          <Card onClick={() => handleCardClick("/admin-assemblies")}>
            <div style={{ fontSize: 40, color: "#1976d2" }}>📋</div>
            <h3 style={{ color: "#424242", margin: "0.5rem 0" }}>Administración de Asambleas</h3>
            <p style={{ color: "#757575", fontSize: 12 }}>Gestiona las asambleas creadas.</p>
          </Card>
          <Card onClick={() => handleCardClick("/create-voting")}>
            <div style={{ fontSize: 40, color: "#1976d2" }}>🗳️</div>
            <h3 style={{ color: "#424242", margin: "0.5rem 0" }}>Crear Votación</h3>
            <p style={{ color: "#757575", fontSize: 12 }}>Crea preguntas de votación para asambleas activas.</p>
          </Card>
          <Card onClick={() => handleCardClick("/role-management")}>
            <div style={{ fontSize: 40, color: "#1976d2" }}>🛡️</div>
            <h3 style={{ color: "#424242", margin: "0.5rem 0" }}>Gestión de Roles</h3>
            <p style={{ color: "#757575", fontSize: 12 }}>Asigne y gestione roles de usuarios.</p>
          </Card>
          <Card onClick={() => handleCardClick("/generate-reports")}>
            <div style={{ fontSize: 40, color: "#1976d2" }}>📊</div>
            <h3 style={{ color: "#424242", margin: "0.5rem 0" }}>Generar Reportes</h3>
            <p style={{ color: "#757575", fontSize: 12 }}>Descargue reportes en PDF o Excel.</p>
          </Card>
          <LogoutCard onClick={handleLogout}>
            <div style={{ fontSize: 40 }}>↩️</div>
            <h3 style={{ margin: "0.5rem 0" }}>Cerrar Sesión</h3>
            <p style={{ fontSize: 12 }}>Finalizar la sesión actual.</p>
          </LogoutCard>
        </CardsGrid>
      ) : (
        <CardsGrid>
          <ProfileCard
            onClick={handleProfileCardClick}
          >
            <div style={{ fontSize: 40, color: "#1976d2" }}>👤</div>
            <h3 style={{ color: "#424242", margin: "0.5rem 0" }}>Mi Perfil</h3>
            <p style={{ color: "#757575", fontSize: 12 }}>Vea y edite su información personal.</p>
          </ProfileCard>
          <Card onClick={() => handleCardClick("/participant-area")}>
            <div style={{ fontSize: 40, color: "#1976d2" }}>🎯</div>
            <h3 style={{ color: "#424242", margin: "0.5rem 0" }}>Área de Participantes</h3>
            <p style={{ color: "#757575", fontSize: 12 }}>Inscríbase en asambleas y acceda a eventos.</p>
          </Card>
          <Card onClick={() => handleCardClick("/delegate-registration")}>
            <div style={{ fontSize: 40, color: "#1976d2" }}>✍️</div>
            <h3 style={{ color: "#424242", margin: "0.5rem 0" }}>Representación</h3>
            <p style={{ color: "#757575", fontSize: 12 }}>Registre un delegado para que lo represente.</p>
          </Card>
          <LogoutCard onClick={handleLogout}>
            <div style={{ fontSize: 40 }}>↩️</div>
            <h3 style={{ margin: "0.5rem 0" }}>Cerrar Sesión</h3>
            <p style={{ fontSize: 12 }}>Finalizar la sesión actual.</p>
          </LogoutCard>
        </CardsGrid>
      )}

      <ProfileModal
        open={profileModalOpen}
        onClose={handleProfileModalClose}
        user={user}
        onEditProfile={handleEditProfile}
      />
    </DashContainer>
  );
}