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
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { keyframes } from '@mui/system';

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
  const [showPassword, setShowPassword] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

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

        // If direct teacher login fails, try alternate phone format (+ prefix)
        if (!teacherResponse.ok) {
          const alternatePhone = login.startsWith('+') ? login.substring(1) : `+${login}`;
          const altResponse = await fetch("https://crm-backend-l7jq.onrender.com/api/v1/auth/teacher/login", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phone: alternatePhone,
              password: password,
            }),
          });

          if (altResponse.ok) {
            teacherResponse = altResponse;
            teacherData = await altResponse.json();
          }
        }

        if (!teacherResponse.ok) {
          let msg = teacherData.message || 'Login xatosi yuz berdi';
          if (msg.includes('Unauthorized') || msg.includes('Incorrect') || msg.toLowerCase().includes('invalid')) {
            msg = 'Login yoki parol xato kiritildi';
          } else if (msg.includes('Teacher not found') || msg.includes('not found') || msg.includes('User not found')) {
            msg = 'Bunday foydalanuvchi yoki o\'qituvchi mavjud emas';
          }
          throw new Error(msg);
        }

        response = teacherResponse;
        data = teacherData;
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
