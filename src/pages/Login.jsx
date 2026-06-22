import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import { Visibility, VisibilityOff, Close } from '@mui/icons-material';
import { keyframes } from '@mui/system';
import api from '../api/axios';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
`;

const zoomInRotate = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9) rotate(-3deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
`;

const fadeOutScale = keyframes`
  from {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);
  }
  to {
    opacity: 0;
    transform: scale(1.02);
    filter: blur(4px);
  }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
`;

export default function Login() {
  const SHOW_TEST_LOGINS = true;
  const TEST_LOGINS = [
    { role: 'Student', phone: '998901234567', password: 'Sanjar04@', color: '#c5a059' },
    { role: 'Superadmin', phone: '+998907012161', password: 'Rahmonbergan04@', color: '#1e3a5f' },
    { role: 'Teacher', phone: '998971230998', password: '123456', color: '#10b981' }
  ];

  const handleFillDemo = (phone, pass) => {
    setLogin(phone);
    setPassword(pass);
  };

  const [showPassword, setShowPassword] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Forgot Password States
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetPhone, setResetPhone] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleCloseDialog = () => {
    setOpenResetDialog(false);
    setResetStep(1);
    setResetPhone('');
    setResetOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError(null);
    setResetSuccess(null);
    setResetLoading(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!resetPhone) {
      setResetError("Telefon raqamingizni kiriting");
      return;
    }

    let cleanedPhone = resetPhone.trim();
    if (cleanedPhone.length === 9) {
      cleanedPhone = `+998${cleanedPhone}`;
    } else if (cleanedPhone.length === 12 && !cleanedPhone.startsWith('+')) {
      cleanedPhone = `+${cleanedPhone}`;
    }

    setResetLoading(true);
    setResetError(null);
    try {
      await api.post('/api/v1/verification/send/phone/verify', { phone: cleanedPhone });
      setResetPhone(cleanedPhone);
      setResetStep(2);
    } catch (err) {
      setResetError(err.response?.data?.message || err.userMessage || "SMS yuborishda xatolik yuz berdi");
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!resetOtp) {
      setResetError("Tasdiqlash kodini kiriting");
      return;
    }
    setResetLoading(true);
    setResetError(null);
    try {
      await api.post('/api/v1/verification/verify/otp', { phone: resetPhone, otp: resetOtp.trim() });
      setResetStep(3);
    } catch (err) {
      setResetError(err.response?.data?.message || err.userMessage || "Kodni tasdiqlashda xatolik yuz berdi");
    } finally {
      setResetLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setResetError("Parollarni kiriting");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Parollar bir-biriga mos kelmadi");
      return;
    }
    if (newPassword.length < 6) {
      setResetError("Parol uzunligi kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    setResetLoading(true);
    setResetError(null);
    try {
      await api.post('/api/v1/verification/change-password', {
        phone: resetPhone,
        new_password: newPassword
      });
      setResetSuccess("Parolingiz muvaffaqiyatli o'zgartirildi!");
      setTimeout(() => {
        handleCloseDialog();
      }, 2000);
    } catch (err) {
      setResetError(err.response?.data?.message || err.userMessage || "Parolni o'zgartirishda xatolik yuz berdi");
    } finally {
      setResetLoading(false);
    }
  };

  const handleTogglePassword = () => setShowPassword((prev) => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!login || !password) {
      setError('Phone va parolni kiriting');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let response = await fetch("https://crm-backend-l7jq.onrender.com/api/v1/auth/user/login", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: login, // Backend LoginDto expects 'phone'
          password: password,
        }),
      });

      let data = await response.json();

      if (!response.ok) {
        // If user login fails, try teacher login
        let teacherResponse = await fetch("https://crm-backend-l7jq.onrender.com/api/v1/auth/teacher/login", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: login,
            password: password,
          }),
        });

        let teacherData = await teacherResponse.json();

        if (!teacherResponse.ok) {
          // If teacher login fails, try student login
          let studentResponse = await fetch("https://crm-backend-l7jq.onrender.com/api/v1/auth/student/login", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phone: login,
              password: password,
            }),
          });

          let studentData = await studentResponse.json();

          if (!studentResponse.ok) {
            // Try alternate phone format (+ prefix) for teacher and student
            const alternatePhone = login.startsWith('+') ? login.substring(1) : `+${login}`;

            // Try student with alternate phone
            let altStudentResponse = await fetch("https://crm-backend-l7jq.onrender.com/api/v1/auth/student/login", {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                phone: alternatePhone,
                password: password,
              }),
            });

            if (altStudentResponse.ok) {
              response = altStudentResponse;
              data = await altStudentResponse.json();
            } else {
              // Try teacher with alternate phone
              let altTeacherResponse = await fetch("https://crm-backend-l7jq.onrender.com/api/v1/auth/teacher/login", {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  phone: alternatePhone,
                  password: password,
                }),
              });

              if (altTeacherResponse.ok) {
                response = altTeacherResponse;
                data = await altTeacherResponse.json();
              } else {
                let msg = studentData.message || 'Login yoki parol xato kiritildi';
                if (msg.includes('Unauthorized') || msg.includes('Incorrect') || msg.toLowerCase().includes('invalid')) {
                  msg = 'Login yoki parol xato kiritildi';
                }
                throw new Error(msg);
              }
            }
          } else {
            response = studentResponse;
            data = studentData;
          }
        } else {
          response = teacherResponse;
          data = teacherData;
        }
      }

      setSuccess(true);

      // Save token and redirect
      localStorage.setItem('token', data.token);

      // Fetch user role info by decoding JWT token
      let role = null;
      try {
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        role = payload.role;
        localStorage.setItem('user', JSON.stringify(payload));
      } catch (e) {
        console.error('JWT decode error:', e);
      }

      setTimeout(() => {
        if (role === 'TEACHER') {
          navigate('/groups');
        } else if (role === 'STUDENT') {
          navigate('/student/groups');
        } else {
          navigate('/dashboard');
        }
      }, 800);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        animation: success ? `${fadeOutScale} 0.8s forwards` : 'none',
        transition: 'all 0.8s ease-in-out'
      }}
    >
      {/* ========== Left Side - Illustration ========== */}
      <Box
        sx={{
          flex: '0 0 47%',
          backgroundColor: '#1e3a5f',
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >

        {/* Study illustration */}
        <Box
          component="img"
          src="/study.svg"
          alt="Student studying"
          sx={{
            width: '100%',
            maxWidth: 750,
            objectFit: 'contain',
            position: 'relative',
            zIndex: 1,
            animation: `${zoomInRotate} 1.2s ease-out forwards`
          }}
        />
      </Box>

      {/* ========== Right Side - Login Form ========== */}
      <Box
        sx={{
          flex: { xs: '1 1 100%', md: '0 0 53%' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          position: 'relative',
          px: { xs: 3, sm: 6, md: 8 },
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 360,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
            animation: `${slideUp} 0.8s ease-out forwards`
          }}
        >
          {/* Najot Logo */}
          <Box
            component="img"
            src="/najot-logo.svg"
            alt="Najot Ta'lim Logo"
            sx={{
              width: 150,
              height: 75,
              objectFit: 'contain',
              mb: 0.3,
            }}
          />

          {/* Title */}
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.88rem',
              letterSpacing: 1.5,
              color: '#111827',
              mb: 3,
              textAlign: 'center',
            }}
          >
            LEARNING MANAGEMENT SYSTEM
          </Typography>

          {/* ===== Form ===== */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}
          >
            {/* Login field */}
            <Typography
              sx={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500, mb: 0.5 }}
            >
              Phone
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Phone kiriting"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  '& fieldset': { borderColor: '#d1d5db' },
                  '&:hover fieldset': { borderColor: '#9ca3af' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: 1 },
                },
                '& input': { py: '9px', px: '12px', color: '#374151' },
              }}
            />

            {/* Password field */}
            <Typography
              sx={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500, mb: 0.5 }}
            >
              Parol
            </Typography>
            <TextField
              fullWidth
              size="small"
              type={showPassword ? 'text' : 'password'}
              placeholder="Parolni kiriting"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        edge="end"
                        size="small"
                        tabIndex={-1}
                        sx={{ color: '#9ca3af', mr: '-4px' }}
                      >
                        {showPassword ? (
                          <VisibilityOff sx={{ fontSize: 18 }} />
                        ) : (
                          <Visibility sx={{ fontSize: 18 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  '& fieldset': { borderColor: '#d1d5db' },
                  '&:hover fieldset': { borderColor: '#9ca3af' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: 1 },
                },
                '& input': { py: '9px', px: '12px', color: '#374151' },
              }}
            />

            {/* Forgot password link */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                type="button"
                onClick={() => setOpenResetDialog(true)}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: '#3b82f6',
                  p: 0,
                  minWidth: 0,
                  '&:hover': {
                    background: 'none',
                    textDecoration: 'underline',
                  },
                }}
              >
                Parolni unutdingizmi?
              </Button>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disableElevation
              disabled={loading}
              sx={{
                py: 1.1,
                backgroundColor: '#0b1c4bff',
                borderRadius: '4px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                letterSpacing: 0.3,
                '&:hover': {
                  backgroundColor: '#1e40af',
                },
                '&.Mui-disabled': {
                  backgroundColor: '#9ca3af',
                  color: '#e5e7eb'
                }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Kirish'}
            </Button>

            {/* ==================== DEMO LOGINS SECTION (EASY TO REMOVE) ==================== */}
            {SHOW_TEST_LOGINS && (
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed #e5e7eb', width: '100%' }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600, mb: 1.5, textAlign: 'center' }}>
                  Test loginlar (Tanlang):
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {TEST_LOGINS.map((demo) => (
                    <Button
                      key={demo.role}
                      size="small"
                      variant="outlined"
                      onClick={() => handleFillDemo(demo.phone, demo.password)}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: demo.color,
                        borderColor: demo.color,
                        py: 0.7,
                        borderRadius: '6px',
                        '&:hover': {
                          backgroundColor: `${demo.color}0a`,
                          borderColor: demo.color
                        }
                      }}
                    >
                      {demo.role} ({demo.phone})
                    </Button>
                  ))}
                </Box>
              </Box>
            )}
            {/* ============================================================================== */}
          </Box>
        </Box>

        <Snackbar
          open={!!error}
          autoHideDuration={4000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ animation: `${shake} 0.5s ease-in-out` }}
        >
          <Alert
            onClose={() => setError(null)}
            severity="error"
            variant="filled"
            sx={{
              width: '100%',
              backgroundColor: '#ef4444',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.35)',
              alignItems: 'center',
              fontWeight: 600,
              fontSize: '0.9rem',
              letterSpacing: 0.3,
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {error} ⚠️
          </Alert>
        </Snackbar>

        <Snackbar
          open={success}
          autoHideDuration={6000}
          onClose={() => setSuccess(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSuccess(false)}
            severity="success"
            variant="filled"
            sx={{
              width: '100%',
              backgroundColor: '#10b981',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
              alignItems: 'center',
              fontWeight: 500,
              fontSize: '0.95rem',
              letterSpacing: 0.3,
              px: 3,
              py: 1
            }}
          >
            Muvaffaqiyatli kirdingiz! 🎉
          </Alert>
        </Snackbar>

        {/* ========== Password Reset Dialog ========== */}
        <Dialog
          open={openResetDialog}
          onClose={handleCloseDialog}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              p: 1.5,
              boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
            },
          }}
        >
          <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e3a5f' }}>
              Parolni tiklash
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small" sx={{ color: '#9ca3af' }}>
              <Close fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ pt: 1 }}>
            {/* Step Indicator */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              {[1, 2, 3].map((s) => (
                <Box
                  key={s}
                  sx={{
                    flex: 1,
                    height: '4px',
                    borderRadius: '2px',
                    backgroundColor: resetStep >= s ? '#1e3a5f' : '#e5e7eb',
                    transition: 'background-color 0.3s ease',
                  }}
                />
              ))}
            </Box>

            {resetError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '8px', fontSize: '0.82rem' }}>
                {resetError}
              </Alert>
            )}

            {resetSuccess && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: '8px', fontSize: '0.82rem' }}>
                {resetSuccess}
              </Alert>
            )}

            {/* STEP 1: Enter Phone Number */}
            {resetStep === 1 && (
              <Box component="form" onSubmit={handleSendOtp} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#4b5563' }}>
                  Hisobingizga bog'langan telefon raqamingizni kiriting. Tasdiqlash kodi yuboriladi.
                </Typography>
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500, mb: 0.5 }}>
                    Telefon raqam
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="+998901234567"
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    disabled={resetLoading}
                    autoFocus
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        '& fieldset': { borderColor: '#d1d5db' },
                        '&:hover fieldset': { borderColor: '#9ca3af' },
                        '&.Mui-focused fieldset': { borderColor: '#1e3a5f', borderWidth: 1.5 },
                      },
                      '& input': { py: '10px', px: '12px', color: '#374151' },
                    }}
                  />
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  disableElevation
                  disabled={resetLoading}
                  sx={{
                    mt: 1,
                    py: 1,
                    backgroundColor: '#1e3a5f',
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    '&:hover': {
                      backgroundColor: '#111827',
                    },
                  }}
                >
                  {resetLoading ? <CircularProgress size={20} color="inherit" /> : "Kodni yuborish"}
                </Button>
              </Box>
            )}

            {/* STEP 2: Enter OTP Code */}
            {resetStep === 2 && (
              <Box component="form" onSubmit={handleVerifyOtp} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#4b5563' }}>
                  Kiritilgan <b>{resetPhone}</b> raqamiga yuborilgan tasdiqlash kodini (OTP) kiriting.
                </Typography>
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500, mb: 0.5 }}>
                    Tasdiqlash kodi (OTP)
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Tasdiqlash kodini kiriting"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    disabled={resetLoading}
                    autoFocus
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        '& fieldset': { borderColor: '#d1d5db' },
                        '&:hover fieldset': { borderColor: '#9ca3af' },
                        '&.Mui-focused fieldset': { borderColor: '#1e3a5f', borderWidth: 1.5 },
                      },
                      '& input': { py: '10px', px: '12px', color: '#374151' },
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => setResetStep(1)}
                    disabled={resetLoading}
                    sx={{
                      flex: 1,
                      py: 1,
                      borderRadius: '8px',
                      borderColor: '#d1d5db',
                      color: '#4b5563',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      '&:hover': {
                        backgroundColor: '#f3f4f6',
                        borderColor: '#9ca3af',
                      },
                    }}
                  >
                    Orqaga
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disableElevation
                    disabled={resetLoading}
                    sx={{
                      flex: 1.5,
                      py: 1,
                      backgroundColor: '#1e3a5f',
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      '&:hover': {
                        backgroundColor: '#111827',
                      },
                    }}
                  >
                    {resetLoading ? <CircularProgress size={20} color="inherit" /> : "Tasdiqlash"}
                  </Button>
                </Box>
              </Box>
            )}

            {/* STEP 3: Change Password */}
            {resetStep === 3 && (
              <Box component="form" onSubmit={handleChangePassword} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#4b5563' }}>
                  Yangi parolingizni kiriting va uni tasdiqlang.
                </Typography>
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500, mb: 0.5 }}>
                    Yangi parol
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Yangi parolni kiriting"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={resetLoading}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              edge="end"
                              size="small"
                              tabIndex={-1}
                            >
                              {showNewPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      mb: 1.5,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        '& fieldset': { borderColor: '#d1d5db' },
                        '&:hover fieldset': { borderColor: '#9ca3af' },
                        '&.Mui-focused fieldset': { borderColor: '#1e3a5f', borderWidth: 1.5 },
                      },
                      '& input': { py: '10px', px: '12px', color: '#374151' },
                    }}
                  />

                  <Typography sx={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500, mb: 0.5 }}>
                    Parolni tasdiqlang
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Parolni tasdiqlang"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={resetLoading}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                              size="small"
                              tabIndex={-1}
                            >
                              {showConfirmPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        '& fieldset': { borderColor: '#d1d5db' },
                        '&:hover fieldset': { borderColor: '#9ca3af' },
                        '&.Mui-focused fieldset': { borderColor: '#1e3a5f', borderWidth: 1.5 },
                      },
                      '& input': { py: '10px', px: '12px', color: '#374151' },
                    }}
                  />
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  disableElevation
                  disabled={resetLoading || resetSuccess}
                  sx={{
                    mt: 1,
                    py: 1,
                    backgroundColor: '#1e3a5f',
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    '&:hover': {
                      backgroundColor: '#111827',
                    },
                  }}
                >
                  {resetLoading ? <CircularProgress size={20} color="inherit" /> : "Parolni o'zgartirish"}
                </Button>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <Typography
          sx={{
            position: 'absolute',
            bottom: 12,
            color: '#1c1d20ff',
            fontSize: '0.8rem',
            textAlign: 'center',
            px: 2,
          }}
        >
          Copyrient o 2021 0 tasnkent Uniersity of intermation technologies
        </Typography>
      </Box>
    </Box>
  );
}
