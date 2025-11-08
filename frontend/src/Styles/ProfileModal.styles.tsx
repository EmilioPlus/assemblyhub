import { Box, styled } from '@mui/material';

export const StyledModalContent = styled(Box)({
  padding: '1rem',
});

export const StyledUserInfo = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
});

export const StyledInfoRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: '0.5rem 0',
  '&:not(:last-child)': {
    borderBottom: '1px solid #f0f0f0',
  },
});
