import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Box, Typography, Paper, Avatar, Divider, CircularProgress,
  Stack, Card, CardContent, Grid, Chip, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Snackbar, Alert, InputAdornment, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BadgeIcon from '@mui/icons-material/Badge';
import KeyIcon from '@mui/icons-material/VpnKey';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArticleIcon from '@mui/icons-material/Article';
import WgIcon from '@mui/icons-material/Wc';
import HomeIcon from '@mui/icons-material/Home';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://crm-backend-l7jq.onrender.com';

const getInitials = (name = '') => {
  const parts = (name || '').trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : (parts[0]?.[0] || '?').toUpperCase();
};

export default function StudentSettings() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states for personal details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('Male');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Modal / dialog states
  const [passDialogOpen, setPassDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [notifDialogOpen, setNotifDialogOpen] = useState(false);
  const [smsNotifs, setSmsNotifs] = useState(true);

  // Alert/Toast states
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await api.get('/api/v1/students/my/profile');
        if (res.data?.success) {
          const data = res.data.data;
          setProfile(data);

          // Split full_name
          const nameParts = (data.full_name || '').trim().split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');

          setPhone(data.phone || '');
          setAddress(data.address || '');
          setGender(localStorage.getItem(`student_gender_${data.id}`) || 'Male');
          setSmsNotifs(localStorage.getItem(`student_sms_${data.id}`) !== 'false');

          if (data.birth_date) {
            // format as YYYY-MM-DD for date input
            const dateStr = new Date(data.birth_date).toISOString().split('T')[0];
            setBirthDate(dateStr);
          }
        }
      } catch (e) {
        console.error('Error loading student profile:', e);
        showToast("Profil ma'lumotlarini yuklashda xatolik yuz berdi", 'error');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [navigate]);

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("Rasm hajmi 2MB dan oshmasligi kerak", 'error');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveInfo = async () => {
    try {
      const formData = new FormData();
      formData.append('full_name', `${firstName} ${lastName}`.trim());
      formData.append('phone', phone);
      formData.append('address', address);
      if (birthDate) {
        formData.append('birth_date', new Date(birthDate).toISOString());
      }
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await api.put('/api/v1/students/my/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (res.data?.success) {
        showToast("Ma'lumotlar muvaffaqiyatli saqlandi!");
        // Update local gender preference
        if (profile?.id) {
          localStorage.setItem(`student_gender_${profile.id}`, gender);
        }
        
        // Refresh local profile state
        const updatedRes = await api.get('/api/v1/students/my/profile');
        if (updatedRes.data?.success) {
          setProfile(updatedRes.data.data);
        }
      }
    } catch (e) {
      console.error('Error saving profile:', e);
      showToast(e.response?.data?.message || "Saqlashda xatolik yuz berdi", 'error');
    }
  };

  const handleSavePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showToast("Parol kamida 6 ta belgidan iborat bo'lishi kerak", 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Parollar mos kelmadi", 'warning');
      return;
    }

    try {
      const res = await api.put('/api/v1/students/my/profile', {
        password: newPassword
      });

      if (res.data?.success) {
        showToast("Parol muvaffaqiyatli o'zgartirildi!");
        setNewPassword('');
        setConfirmPassword('');
        setPassDialogOpen(false);
      }
    } catch (e) {
      console.error('Error changing password:', e);
      showToast(e.response?.data?.message || "Parolni yangilashda xatolik", 'error');
    }
  };

  const handleSaveNotifications = () => {
    if (profile?.id) {
      localStorage.setItem(`student_sms_${profile.id}`, smsNotifs ? 'true' : 'false');
    }
    showToast("Bildirishnoma sozlamalari yangilandi!");
    setNotifDialogOpen(false);
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

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 4 }, animation: 'fadeIn 0.5s ease-out' }}>
      
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

      {/* Main Container Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: '24px',
          border: '1px solid #e5e7eb',
          backgroundColor: '#fff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.01)',
          mb: 4
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827', mb: 4 }}>
          Shaxsiy ma'lumotlar
        </Typography>

        <Grid container spacing={4}>
          {/* Avatar upload / mockup photos side */}
          <Grid item xs={12} md={4.5}>
            <Stack direction="row" spacing={3} justifyContent="center" alignItems="center" sx={{ mb: 2 }}>
              {/* Sample model frame */}
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 130,
                    height: 160,
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f9fafb',
                    position: 'relative'
                  }}
                >
                  <Avatar
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
                    variant="square"
                    sx={{ width: '100%', height: 135 }}
                  />
                  <Box sx={{ py: 0.5, width: '100%', backgroundColor: '#fff', borderTop: '1px solid #e5e7eb' }}>
                    <Typography variant="caption" sx={{ color: '#374151', fontWeight: 600, fontSize: '0.75rem' }}>
                      Namuna
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ display: 'block', color: '#6b7280', fontSize: '0.68rem', mt: 1, maxWidth: 130 }}>
                  500x500 o`lcham, JPEG, JPG, PNG format, maksimum 2MB
                </Typography>
              </Box>

              {/* Student's Actual Photo */}
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar
                    src={photoPreview || resolvePhoto(profile.photo)}
                    sx={{
                      width: 125,
                      height: 125,
                      border: '4px solid #fff',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                      fontSize: '2.5rem',
                      fontWeight: 800,
                      bgcolor: '#7b61ff',
                      color: '#fff',
                      cursor: 'pointer',
                      '&:hover .upload-overlay': { opacity: 1 }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {getInitials(profile.full_name)}
                    <Box
                      className="upload-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        opacity: 0,
                        transition: 'opacity 0.2s ease'
                      }}
                    >
                      <CameraAltIcon sx={{ color: '#fff', fontSize: 24 }} />
                    </Box>
                  </Avatar>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </Box>

                <Chip
                  label="Talabga mos"
                  icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#fff !important' }} />}
                  sx={{
                    backgroundColor: '#10b981',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    height: 22,
                    mt: 2.5,
                    px: 0.5
                  }}
                />
              </Box>
            </Stack>
          </Grid>

          {/* Form details side */}
          <Grid item xs={12} md={7.5}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ism"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: '#9ca3af', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Familiya"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: '#9ca3af', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefon raqam"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: '#9ca3af', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Tug'ilgan sana"
                  InputLabelProps={{ shrink: true }}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonthIcon sx={{ color: '#9ca3af', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                  <InputLabel id="gender-select-label">Jinsi</InputLabel>
                  <Select
                    labelId="gender-select-label"
                    value={gender}
                    label="Jinsi"
                    onChange={(e) => setGender(e.target.value)}
                    startAdornment={<WgIcon sx={{ color: '#9ca3af', fontSize: 20, mr: 1, ml: 0.5 }} />}
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="HH ID"
                  disabled
                  value={profile.id}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon sx={{ color: '#9ca3af', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Manzil"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <HomeIcon sx={{ color: '#9ca3af', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3.5, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSaveInfo}
                sx={{
                  bgcolor: '#7b61ff',
                  '&:hover': { bgcolor: '#684de2' },
                  borderRadius: '12px',
                  fontWeight: 700,
                  px: 4,
                  py: 1.2,
                  boxShadow: '0 4px 14px rgba(123, 97, 255, 0.25)'
                }}
              >
                Saqlash
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Security Info Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Kirish card */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '20px',
              border: '1px solid #e5e7eb',
              height: '100%',
              background: '#fff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.01)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, color: '#374151', fontSize: '1.05rem', mb: 3 }}>
                Kirish
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
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
              borderRadius: '20px',
              border: '1px solid #e5e7eb',
              height: '100%',
              background: '#fff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.01)',
              position: 'relative'
            }}
          >
            <IconButton
              size="small"
              onClick={() => setPassDialogOpen(true)}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                p: 1
              }}
            >
              <EditIcon sx={{ fontSize: 16, color: '#4b5563' }} />
            </IconButton>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, color: '#374151', fontSize: '1.05rem', mb: 3 }}>
                Parol
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#9ca3af', letterSpacing: '2px' }}>
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
              borderRadius: '20px',
              border: '1px solid #e5e7eb',
              height: '100%',
              background: '#fff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.01)',
              position: 'relative'
            }}
          >
            <IconButton
              size="small"
              onClick={() => setNotifDialogOpen(true)}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                p: 1
              }}
            >
              <EditIcon sx={{ fontSize: 16, color: '#4b5563' }} />
            </IconButton>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, color: '#374151', fontSize: '1.05rem', mb: 2.5 }}>
                Bildirishnoma sozlamalari
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: smsNotifs ? '#10b981' : '#6b7280', display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon sx={{ fontSize: 18, color: smsNotifs ? '#10b981' : '#9ca3af' }} />
                {smsNotifs ? "SMS bildirishnomalari faol" : "SMS bildirishnomalari faol emas"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Shartnomalarim Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: '24px',
          border: '1px solid #e5e7eb',
          backgroundColor: '#fff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.01)'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ArticleIcon sx={{ color: '#7b61ff' }} />
          Shartnomalarim
        </Typography>

        {(!profile.studentGroups || profile.studentGroups.length === 0) ? (
          <Box sx={{ py: 3, textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '16px', border: '1px dashed #d1d5db' }}>
            <Typography sx={{ color: '#9ca3af', fontWeight: 600 }}>
              Sizda hozircha faol shartnomalar mavjud emas.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {profile.studentGroups.map((sg, index) => {
              const group = sg.groups;
              if (!group) return null;
              
              // Custom mock contracts based on actual groups
              const contractNo = `S-2026-${(3000 + profile.id + group.id * 7).toString()}`;
              return (
                <Box
                  key={group.id || index}
                  sx={{
                    p: 2.5,
                    border: '1px solid #e5e7eb',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: '#7b61ff',
                      boxShadow: '0 4px 12px rgba(123, 97, 255, 0.03)'
                    }
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>
                      Kurs: {group.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mt: 0.5 }}>
                      Shartnoma: <strong style={{ color: '#374151' }}>{contractNo}</strong>
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: { xs: '100%', sm: 'auto' }, justifyContent: 'space-between' }}>
                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                      <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                        To'lov turi / Narxi
                      </Typography>
                      <Typography sx={{ fontWeight: 700, color: '#374151', fontSize: '0.9rem' }}>
                        1,200,000 UZS / oy
                      </Typography>
                    </Box>
                    
                    <Chip
                      label="Faol"
                      color="success"
                      size="small"
                      sx={{
                        backgroundColor: '#ecfdf5',
                        color: '#10b981',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        px: 1
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </Paper>

      {/* Password Change Dialog */}
      <Dialog
        open={passDialogOpen}
        onClose={() => setPassDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: '20px', width: '100%', maxWidth: 400, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#111827' }}>
          Parolni o'zgartirish
        </DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              type="password"
              label="Yangi parol"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyIcon sx={{ color: '#9ca3af', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <TextField
              fullWidth
              type="password"
              label="Yangi parolni tasdiqlang"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyIcon sx={{ color: '#9ca3af', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setPassDialogOpen(false)}
            sx={{ borderRadius: '10px', color: '#6b7280', fontWeight: 600 }}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={handleSavePassword}
            variant="contained"
            sx={{
              borderRadius: '10px',
              bgcolor: '#7b61ff',
              '&:hover': { bgcolor: '#684de2' },
              fontWeight: 700
            }}
          >
            Yangilash
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog
        open={notifDialogOpen}
        onClose={() => setNotifDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: '20px', width: '100%', maxWidth: 400, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#111827' }}>
          Bildirishnomalar
        </DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
            <Typography sx={{ fontWeight: 600, color: '#374151' }}>
              SMS bildirishnomalar
            </Typography>
            <Button
              onClick={() => setSmsNotifs(!smsNotifs)}
              variant={smsNotifs ? "contained" : "outlined"}
              color={smsNotifs ? "success" : "inherit"}
              size="small"
              sx={{ borderRadius: '8px', fontWeight: 700 }}
            >
              {smsNotifs ? "Yoqilgan" : "O'chirilgan"}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setNotifDialogOpen(false)}
            sx={{ borderRadius: '10px', color: '#6b7280', fontWeight: 600 }}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={handleSaveNotifications}
            variant="contained"
            sx={{
              borderRadius: '10px',
              bgcolor: '#7b61ff',
              '&:hover': { bgcolor: '#684de2' },
              fontWeight: 700
            }}
          >
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
