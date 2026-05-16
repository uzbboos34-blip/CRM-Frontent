import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Box, Typography, Button, MenuItem, Select, FormControl,
  FormHelperText, TextField, Paper, Divider, CircularProgress,
  Snackbar, Alert, IconButton
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

export default function CreateVideo() {
  const { id: groupId } = useParams();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [formData, setFormData] = useState({
    lesson_id: '',
    title: '',
    video_url: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', sev: 'success' });

  useEffect(() => {
    if (!groupId) return;
    api.get(`/api/v1/lessson?group_id=${groupId}`)
      .then(res => {
        setLessons(res.data?.data || res.data || []);
      })
      .catch(() => setLessons([]));
  }, [groupId]);

  function validate() {
    const e = {};
    if (!formData.title) e.title = "Sarlavha kiriting";
    if (!formData.video_url) e.video_url = "Video linkini kiriting";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post('/api/v1/videos', {
        ...formData,
        group_id: parseInt(groupId),
        lesson_id: formData.lesson_id ? parseInt(formData.lesson_id) : undefined
      });
      setSnackbar({ open: true, msg: "Video muvaffaqiyatli qo'shildi!", sev: 'success' });
      setTimeout(() => navigate(`/group/${groupId}?tab=1`), 1200);
    } catch (e) {
      setSnackbar({ open: true, msg: e.response?.data?.message || 'Xatolik', sev: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: '#6b7280' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
          Video qo'shish
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1 }}>Sarlavha *</Typography>
          <TextField
            fullWidth
            placeholder="Video sarlavhasi"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            error={!!errors.title}
            helperText={errors.title}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Box>

        <Box>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1 }}>Video URL (YouTube) *</Typography>
          <TextField
            fullWidth
            placeholder="https://www.youtube.com/watch?v=..."
            value={formData.video_url}
            onChange={e => setFormData({ ...formData, video_url: e.target.value })}
            error={!!errors.video_url}
            helperText={errors.video_url}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Box>

        <Box>
           <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1 }}>Dars (ixtiyoriy)</Typography>
           <FormControl fullWidth>
            <Select
              value={formData.lesson_id}
              onChange={e => setFormData({ ...formData, lesson_id: e.target.value })}
              displayEmpty
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="">Darsni tanlang</MenuItem>
              {lessons.map(l => (
                <MenuItem key={l.id} value={l.id}>{l.topic || `Dars #${l.id}`}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1 }}>Izoh</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Video haqida batafsil..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
           <Button variant="outlined" fullWidth onClick={() => navigate(-1)} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}>
             Bekor qilish
           </Button>
           <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={saving}
            sx={{
              borderRadius: '10px', textTransform: 'none', fontWeight: 700,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }
            }}
           >
             {saving ? <CircularProgress size={24} color="inherit" /> : "Saqlash"}
           </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.sev} variant="filled">{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
