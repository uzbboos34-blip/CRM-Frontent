import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useUploads } from '../context/UploadContext';
import {
  Box, Typography, Button, MenuItem, Select, FormControl,
  FormHelperText, TextField, Paper, Divider, CircularProgress,
  Snackbar, Alert, IconButton
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, CloudUpload as CloudUploadIcon, VideoCall as VideoIcon } from '@mui/icons-material';
import LoadingBuffer from '../components/LoadingBuffer';

export default function CreateVideo() {
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  const { startUpload } = useUploads();

  const [lessons, setLessons] = useState([]);
  const [formData, setFormData] = useState({
    lesson_id: '',
    title: '',
    video_url: '',
    description: ''
  });
  const [videoFile, setVideoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', sev: 'success' });

  const videoInputRef = useRef(null);

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
    if (!formData.video_url && !videoFile) e.video_url = "Video yuklang yoki URL kiriting";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    
    const data = new FormData();
    data.append('title', formData.title);
    data.append('group_id', groupId);
    if (formData.lesson_id) data.append('lesson_id', formData.lesson_id);
    data.append('description', formData.description || '');
    
    if (videoFile) {
      data.append('video', videoFile);
    } else {
      data.append('video_url', formData.video_url);
    }

    // Background upload
    startUpload('/api/v1/videos', data, { title: formData.title, groupId, type: 'video' });
    
    setSnackbar({ open: true, msg: "Video yuklash boshlandi...", sev: 'success' });
    setTimeout(() => navigate(`/group/${groupId}?tab=1`), 600);
  }


  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <IconButton onClick={() => navigate(`/group/${groupId}?tab=1`)} sx={{ color: '#6b7280' }}>
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
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1 }}>Video yuklash yoki URL *</Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Thin Dashed Box Style */}
            <Box
              onClick={() => videoInputRef.current?.click()}
              sx={{
                border: '1px dashed #d1d5db', borderRadius: '10px',
                p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
                cursor: 'pointer', backgroundColor: videoFile ? '#f9fafb' : '#fff',
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#10b981', backgroundColor: '#f9fafb' },
              }}
            >
              <input type="file" accept="video/*" hidden ref={videoInputRef} onChange={(e) => setVideoFile(e.target.files[0])} />
              <CloudUploadIcon sx={{ color: '#9ca3af', fontSize: 20 }} />
              <Typography sx={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 500 }}>
                {videoFile ? videoFile.name : "Yuklash"}
              </Typography>
            </Box>

            <Divider>yoki</Divider>

            <TextField
              fullWidth
              placeholder="YouTube URL: https://www.youtube.com/watch?v=..."
              value={formData.video_url}
              onChange={e => {
                setFormData({ ...formData, video_url: e.target.value });
                if (e.target.value) setVideoFile(null);
              }}
              error={!!errors.video_url}
              helperText={errors.video_url}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Box>
        </Box>

        {saving && (
          <LoadingBuffer label="Video yuklanmoqda..." />
        )}

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
           <Button variant="outlined" fullWidth onClick={() => navigate(`/group/${groupId}?tab=1`)} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}>
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
             {saving ? "Yuklanmoqda..." : "Saqlash"}
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
