import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import type { User } from '../types';
import { StyledModalContent, StyledUserInfo, StyledInfoRow } from '../Styles/ProfileModal.styles';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onEditProfile: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  open,
  onClose,
  user,
  onEditProfile,
}) => {
  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
      }}
    >
      <StyledModalContent>
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <PersonIcon sx={{ fontSize: 60, color: '#1976d2' }} />
          </Box>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600, color: '#424242' }}>
            {user.firstName} {user.lastName}
          </Typography>
          <Chip
            label={user.role === 'admin' ? 'Administrador' : 'Participante'}
            color={user.role === 'admin' ? 'primary' : 'secondary'}
            size="small"
            sx={{ mt: 1 }}
          />
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <StyledUserInfo>
            <StyledInfoRow>
              <EmailIcon sx={{ color: '#1976d2', mr: 1 }} />
              <Typography variant="body1">
                <strong>Email:</strong> {user.email}
              </Typography>
            </StyledInfoRow>

            {user.username && (
              <StyledInfoRow>
                <PersonIcon sx={{ color: '#1976d2', mr: 1 }} />
                <Typography variant="body1">
                  <strong>Usuario:</strong> {user.username}
                </Typography>
              </StyledInfoRow>
            )}

            <StyledInfoRow>
              <CalendarTodayIcon sx={{ color: '#1976d2', mr: 1 }} />
              <Typography variant="body1">
                <strong>Miembro desde:</strong> {formatDate(user.createdAt)}
              </Typography>
            </StyledInfoRow>
          </StyledUserInfo>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Haz clic en "Editar Perfil" para modificar tu información personal
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Cerrar
          </Button>
          <Button
            onClick={() => {
              onEditProfile();
              onClose();
            }}
            variant="contained"
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': { backgroundColor: '#1565c0' },
            }}
          >
            Editar Perfil
          </Button>
        </DialogActions>
      </StyledModalContent>
    </Dialog>
  );
};
