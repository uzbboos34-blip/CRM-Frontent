import { Box, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';

export default function StudentPlaceholder() {
  const location = useLocation();
  const path = location.pathname;

  const getTitle = () => {
    if (path.includes('dashboard')) return 'Bosh sahifa';
    if (path.includes('payments')) return "To'lovlarim";
    if (path.includes('indicators')) return "Ko'rsatkichlarim";
    if (path.includes('rating')) return 'Reyting';
    if (path.includes('shop')) return "Do'kon";
    if (path.includes('extra-lessons')) return "Qo'shimcha darslar";
    if (path.includes('settings')) return 'Sozlamalar';
    return 'Sahifa';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        animation: 'fadeIn 0.3s ease-out',
        p: 3
      }}
    >
      <Box
        sx={{
          p: 4,
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          textAlign: 'center',
          maxWidth: 400,
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827', mb: 2 }}>
          {getTitle()}
        </Typography>
        <Typography sx={{ color: '#9ca3af', fontWeight: 600 }}>
          Ushbu sahifa hozirda ishlab chiqilmoqda va tez orada taqdim etiladi! 🚀
        </Typography>
      </Box>
    </Box>
  );
}
