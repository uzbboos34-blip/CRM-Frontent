import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Box, Typography, Paper, Avatar, Divider, CircularProgress,
  Stack, Card, CardContent, Grid, Chip, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Snackbar, Alert, InputAdornment
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://crm-backend-l7jq.onrender.com';

const getInitials = (name = '') => {
  const parts = (name || '').trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : (parts[0]?.[0] || '?').toUpperCase();
};

const formatPhone = (phoneStr) => {
  if (!phoneStr) return '-';
  const clean = phoneStr.replace(/\+/g, '').replace(/\s+/g, '');
  if (clean.length === 12 && clean.startsWith('998')) {
    return `(+998) ${clean.slice(3, 5)} ${clean.slice(5, 8)} ${clean.slice(8, 10)} ${clean.slice(10, 12)}`;
  }
  return phoneStr;
};

const formatBirthDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return '-';
  }
};

export default function StudentSettings() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal / Dialog states
  const [passDialogOpen, setPassDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Alert/Toast states
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await api.get('/api/v1/students/my/profile');
      if (res.data?.success) {
        setProfile(res.data.data);
      }
    } catch (e) {
      console.error('Error loading student profile:', e);
      showToast("Profil ma'lumotlarini yuklashda xatolik yuz berdi", 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [navigate]);

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleSavePassword = async () => {
    if (!currentPassword) {
      showToast("Amaldagi parolni kiriting", 'warning');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showToast("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak", 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Parollar mos kelmadi", 'warning');
      return;
    }

    try {
      const res = await api.put('/api/v1/students/my/profile', {
        currentPassword,
        password: newPassword
      });

      if (res.data?.success) {
        showToast("Parol muvaffaqiyatli o'zgartirildi!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPassDialogOpen(false);
      }
    } catch (e) {
      console.error('Error changing password:', e);
      showToast(e.response?.data?.message || "Parolni yangilashda xatolik yuz berdi", 'error');
    }
  };

  const resolvePhoto = (photo) => {
    if (!photo) return '';
    if (photo.startsWith('http') || photo.startsWith('blob:')) return photo;
    return `${BASE_URL}/file/${photo}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#7b61ff' }} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Profil ma'lumotlarini yuklab bo'lmadi.</Typography>
      </Box>
    );
  }

  // Split full_name
  const nameParts = (profile.full_name || '').trim().split(' ');
  const displayFirstName = nameParts[0] || '';
  const displayLastName = nameParts.slice(1).join(' ') || '-';

  return (
    <Box sx={{ width: '100%', p: 0, animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Toast Alert */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          variant="filled"
          sx={{ borderRadius: '12px', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

      {/* Main Container Card: Shaxsiy ma'lumotlar */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          backgroundColor: '#fff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
          mb: 3
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827', mb: 3, fontSize: '1.45rem' }}>
          Shaxsiy ma'lumotlar
        </Typography>

        <Grid container spacing={4} alignItems="center">
          {/* Photos side */}
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={3} justifyContent="center" alignItems="center">
              {/* Sample frame */}
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 120,
                    height: 150,
                    borderRadius: '4px',
                    border: '1px solid #000',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fff'
                  }}
                >
                  <Avatar
                    src="/namuna.jpg"
                    variant="square"
                    sx={{ width: '100%', height: 120, objectFit: 'cover' }}
                  />
                  <Box sx={{ py: 0.5, width: '100%', backgroundColor: '#fff', borderTop: '1px solid #000' }}>
                    <Typography variant="caption" sx={{ color: '#000', fontWeight: 600, fontSize: '0.75rem' }}>
                      Namuna
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ display: 'block', color: '#6b7280', fontSize: '0.68rem', mt: 1, maxWidth: 120 }}>
                  500x500 o`lcham, JPEG, JPG, PNG format, maksimum 2MB
                </Typography>
              </Box>

              {/* Student Actual Avatar */}
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  src={resolvePhoto(profile.photo)}
                  sx={{
                    width: 120,
                    height: 120,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    bgcolor: '#7b61ff',
                    color: '#fff'
                  }}
                >
                  {getInitials(profile.full_name)}
                </Avatar>

                <Chip
                  label="Talabga mos"
                  icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#fff !important' }} />}
                  sx={{
                    backgroundColor: '#10b981',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    height: 22,
                    mt: 2,
                    px: 0.5,
                    borderRadius: '6px'
                  }}
                />
              </Box>
            </Stack>
          </Grid>

          {/* Static Info Columns */}
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 3.5
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mb: 0.5, fontWeight: 500, fontSize: '0.85rem' }}>
                  Ism
                </Typography>
                <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '1.05rem' }}>
                  {displayFirstName}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mb: 0.5, fontWeight: 500, fontSize: '0.85rem' }}>
                  Familiya
                </Typography>
                <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '1.05rem' }}>
                  {displayLastName}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mb: 0.5, fontWeight: 500, fontSize: '0.85rem' }}>
                  Telefon raqam
                </Typography>
                <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '1.05rem' }}>
                  {formatPhone(profile.phone)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mb: 0.5, fontWeight: 500, fontSize: '0.85rem' }}>
                  Tug'ilgan sana
                </Typography>
                <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '1.05rem' }}>
                  {formatBirthDate(profile.birth_date)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mb: 0.5, fontWeight: 500, fontSize: '0.85rem' }}>
                  Jinsi
                </Typography>
                <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '1.05rem' }}>
                  Male
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mb: 0.5, fontWeight: 500, fontSize: '0.85rem' }}>
                  HH ID
                </Typography>
                <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '1.05rem' }}>
                  {profile.id}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Security Cards Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Kirish card */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              height: 140,
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(0,0,0,0.01)'
            }}
          >
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Typography sx={{ fontWeight: 700, color: '#374151', fontSize: '1.05rem', mb: 2 }}>
                Kirish
              </Typography>
              <Typography sx={{ fontWeight: 600, color: '#9ca3af', fontSize: '1.1rem' }}>
                {profile.id}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Parol card */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              height: 140,
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
              position: 'relative'
            }}
          >
            <IconButton
              onClick={() => setPassDialogOpen(true)}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                p: 0.8,
                bgcolor: '#fff',
                '&:hover': { bgcolor: '#f9fafb' }
              }}
            >
              <EditIcon sx={{ fontSize: 16, color: '#6b7280' }} />
            </IconButton>
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Typography sx={{ fontWeight: 700, color: '#374151', fontSize: '1.05rem', mb: 2 }}>
                Parol
              </Typography>
              <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '1.2rem', letterSpacing: '4px' }}>
                ••••••••
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Bildirishnoma card */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              height: 140,
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
              position: 'relative'
            }}
          >
            <IconButton
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                p: 0.8,
                bgcolor: '#fff',
                '&:hover': { bgcolor: '#f9fafb' }
              }}
            >
              <EditIcon sx={{ fontSize: 16, color: '#6b7280' }} />
            </IconButton>
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Typography sx={{ fontWeight: 700, color: '#374151', fontSize: '1.05rem', mb: 2 }}>
                Bildirishnoma sozlamalari
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Shartnomalarim Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          backgroundColor: '#fff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
          minHeight: 120
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', mb: 2, fontSize: '1.15rem' }}>
          Shartnomalarim
        </Typography>
      </Paper>

      {/* Password Change Dialog (Mockup style matching the second screenshot) */}
      <Dialog
        open={passDialogOpen}
        onClose={() => setPassDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 3,
            position: 'relative',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        {/* Close Icon */}
        <IconButton
          onClick={() => setPassDialogOpen(false)}
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            color: '#9ca3af'
          }}
        >
          <CloseIcon sx={{ fontSize: 22 }} />
        </IconButton>

        <DialogContent sx={{ p: 0, mt: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827', mb: 1.5, fontSize: '1.35rem' }}>
            Parolni o'zgartirish
          </Typography>
          <Typography sx={{ color: '#6b7280', mb: 4, fontWeight: 500, fontSize: '0.92rem' }}>
            Quyidagi ma'lumotlarni to'ldiring
          </Typography>

          <Stack spacing={3.5}>
            {/* Amaldagi parol */}
            <Box>
              <Typography sx={{ fontWeight: 600, color: '#4b5563', mb: 1, fontSize: '0.9rem' }}>
                Amaldagi parol
              </Typography>
              <TextField
                fullWidth
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Parolingizni kiriting"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                        {showCurrentPassword ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    '& fieldset': { borderColor: '#d1d5db' },
                    '&:hover fieldset': { borderColor: '#9ca3af' }
                  },
                  '& .MuiOutlinedInput-input': { py: 1.5 }
                }}
              />
            </Box>

            {/* Yangi parol */}
            <Box>
              <Typography sx={{ fontWeight: 600, color: '#4b5563', mb: 1, fontSize: '0.9rem' }}>
                Yangi parol
              </Typography>
              <TextField
                fullWidth
                type={showNewPassword ? "text" : "password"}
                placeholder="Parolingizni kiriting"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                        {showNewPassword ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    '& fieldset': { borderColor: '#d1d5db' },
                    '&:hover fieldset': { borderColor: '#9ca3af' }
                  },
                  '& .MuiOutlinedInput-input': { py: 1.5 }
                }}
              />
            </Box>

            {/* Parolni tasdiqlash */}
            <Box>
              <Typography sx={{ fontWeight: 600, color: '#4b5563', mb: 1, fontSize: '0.9rem' }}>
                Parolni tasdiqlash
              </Typography>
              <TextField
                fullWidth
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Parolingizni kiriting"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    '& fieldset': { borderColor: '#d1d5db' },
                    '&:hover fieldset': { borderColor: '#9ca3af' }
                  },
                  '& .MuiOutlinedInput-input': { py: 1.5 }
                }}
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 0, mt: 4, justifyContent: 'center' }}>
          <Button
            onClick={handleSavePassword}
            variant="contained"
            fullWidth
            sx={{
              borderRadius: '8px',
              bgcolor: '#bc9363',
              '&:hover': { bgcolor: '#aa8254' },
              fontWeight: 700,
              fontSize: '1rem',
              py: 1.5,
              textTransform: 'none',
              boxShadow: 'none'
            }}
          >
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
