import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Box, Typography, Button, MenuItem, Select, FormControl,
  FormHelperText, Paper, Divider, CircularProgress,
  Snackbar, Alert, IconButton, Tooltip, TextField
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import CloudUpload from '@mui/icons-material/CloudUpload';
import AttachFile from '@mui/icons-material/AttachFile';
import Close from '@mui/icons-material/Close';
import LoadingBuffer from '../components/LoadingBuffer';

const ArrowBackIcon = ArrowBack;
const CloudUploadIcon = CloudUpload;
const AttachFileIcon = AttachFile;
const CloseIcon = Close;

/* ── Minimal Rich-Text Editor ── */
const FONT_FAMILIES = ['Sans Serif', 'Serif', 'Monospace'];
const FONT_SIZES    = ['Normal', 'Small', 'Large', 'H1', 'H2'];

function RichEditor({ value, onChange }) {
  const editorRef = useRef(null);
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      if (value === '' || (value && editorRef.current.innerHTML === '')) {
         editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  function exec(cmd, val = null) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    syncValue();
  }
  function syncValue() {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }

  const toolBtnSx = {
    minWidth: 32, height: 28, px: 0.5, border: '1px solid #e5e7eb', borderRadius: '6px',
    fontSize: '0.78rem', fontWeight: 700, color: '#374151', cursor: 'pointer', background: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    '&:hover': { background: '#f3f4f6', borderColor: '#d1d5db' },
  };

  return (
    <Box sx={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, alignItems: 'center', px: 1.5, py: 1, borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
        <Box component="button" sx={toolBtnSx} onClick={() => exec('formatBlock', '<h1>')}>H1</Box>
        <Box component="button" sx={toolBtnSx} onClick={() => exec('formatBlock', '<h2>')}>H2</Box>
        <Select size="small" defaultValue="Sans Serif" sx={{ height: 28, fontSize: '0.78rem', minWidth: 100, borderRadius: '6px' }} onChange={(e) => exec('fontName', e.target.value)}>
          {FONT_FAMILIES.map(f => <MenuItem key={f} value={f} sx={{ fontSize: '0.78rem' }}>{f}</MenuItem>)}
        </Select>
        <Select size="small" defaultValue="Normal" sx={{ height: 28, fontSize: '0.78rem', minWidth: 90, borderRadius: '6px' }} onChange={(e) => {
          const map = { Normal: '3', Small: '1', Large: '5', H1: '6', H2: '5' };
          exec('fontSize', map[e.target.value] || '3');
        }}>
          {FONT_SIZES.map(s => <MenuItem key={s} value={s} sx={{ fontSize: '0.78rem' }}>{s}</MenuItem>)}
        </Select>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Tooltip title="Bold"><Box component="button" sx={{ ...toolBtnSx, fontWeight: 900 }} onClick={() => exec('bold')}>B</Box></Tooltip>
        <Tooltip title="Italic"><Box component="button" sx={{ ...toolBtnSx, fontStyle: 'italic' }} onClick={() => exec('italic')}>I</Box></Tooltip>
        <Tooltip title="Underline"><Box component="button" sx={{ ...toolBtnSx, textDecoration: 'underline' }} onClick={() => exec('underline')}>U</Box></Tooltip>
        <Tooltip title="Ordered list"><Box component="button" sx={toolBtnSx} onClick={() => exec('insertOrderedList')}>1.</Box></Tooltip>
        <Tooltip title="Unordered list"><Box component="button" sx={toolBtnSx} onClick={() => exec('insertUnorderedList')}>•</Box></Tooltip>
      </Box>
      <Box
        ref={editorRef} contentEditable suppressContentEditableWarning onInput={syncValue} onBlur={syncValue}
        sx={{
          minHeight: 140, p: 2, outline: 'none', fontSize: '0.9rem', color: '#111827', lineHeight: 1.7,
          '&:empty:before': { content: '"Izoh yozing..."', color: '#9ca3af', pointerEvents: 'none' },
        }}
      />
    </Box>
  );
}

export default function CreateHomeWork() {
  const { id: groupId, hwId } = useParams();
  const navigate = useNavigate();

  const [lessons, setLessons]       = useState([]);
  const [lessonId, setLessonId]     = useState('');
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile]             = useState(null);
  const [videoFile, setVideoFile]   = useState(null);
  const [saving, setSaving]         = useState(false);
  const [errors, setErrors]         = useState({});
  const [snackbar, setSnackbar]     = useState({ open: false, msg: '', sev: 'success' });

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    if (!groupId) return;
    api.get(`/api/v1/lessson?group_id=${groupId}`)
      .then(res => setLessons(res.data?.data || res.data || []))
      .catch(() => setLessons([]));
  }, [groupId]);

  useEffect(() => {
    if (hwId) {
      api.get(`/api/v1/home-works/${hwId}`)
        .then(res => {
          const d = res.data?.data || res.data;
          if (d) {
            setTitle(d.title || '');
            setLessonId(d.lesson_id || '');
            setDescription(d.description || '');
          }
        });
    }
  }, [hwId]);

  function validate() {
    const e = {};
    if (!title) e.title = "Sarlavha kiriting";
    if (!lessonId) e.lessonId = "Darsni tanlang";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('lesson_id', lessonId);
    formData.append('group_id', groupId);
    formData.append('description', description);
    if (file) formData.append('file', file);
    if (videoFile) formData.append('video', videoFile);

    try {
      if (hwId) await api.put(`/api/v1/home-works/${hwId}`, formData);
      else await api.post('/api/v1/home-works', formData);
      setSnackbar({ open: true, msg: "Muvaffaqiyatli saqlandi!", sev: 'success' });
      setTimeout(() => navigate(`/group/${groupId}?tab=1`), 1200);
    } catch (e) {
      setSnackbar({ open: true, msg: e.response?.data?.message || 'Xatolik', sev: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <IconButton onClick={() => navigate(`/group/${groupId}?tab=1`)} sx={{ color: '#6b7280' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
          {hwId ? 'Vazifani tahrirlash' : 'Yangi vazifa yaratish'}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
        {/* Title */}
        <Box>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1 }}>Sarlavha *</Typography>
          <TextField
            fullWidth placeholder="Vazifa sarlavhasi"
            value={title} onChange={e => setTitle(e.target.value)}
            error={!!errors.title} helperText={errors.title}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Box>

        {/* Lesson */}
        <Box>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1 }}>Darsni tanlang *</Typography>
          <FormControl fullWidth error={!!errors.lessonId}>
            <Select
              value={lessonId} onChange={e => setLessonId(e.target.value)} displayEmpty
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="" disabled>Mavzuni tanlang</MenuItem>
              {lessons.map(l => <MenuItem key={l.id} value={l.id}>{l.topic || `Dars #${l.id}`}</MenuItem>)}
            </Select>
            {errors.lessonId && <FormHelperText>{errors.lessonId}</FormHelperText>}
          </FormControl>
        </Box>

        {/* Description */}
        <Box>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1 }}>Izoh</Typography>
          <RichEditor value={description} onChange={setDescription} />
        </Box>

        {/* Video Upload */}
        <Box>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1 }}>Video yuklash</Typography>
          <Box
            onClick={() => videoInputRef.current?.click()}
            sx={{
              border: '1px dashed #d1d5db', borderRadius: '10px', p: 1.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
              cursor: 'pointer', '&:hover': { borderColor: '#10b981', background: '#f9fafb' }
            }}
          >
            <input type="file" accept="video/*" hidden ref={videoInputRef} onChange={e => setVideoFile(e.target.files[0])} />
            <CloudUploadIcon sx={{ color: '#9ca3af', fontSize: 20 }} />
            <Typography sx={{ fontSize: '0.85rem', color: '#9ca3af' }}>{videoFile ? videoFile.name : "Yuklash"}</Typography>
          </Box>
        </Box>

        {/* File Upload */}
        <Box>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1 }}>Fayl yuklash</Typography>
          <Box
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: '1px dashed #d1d5db', borderRadius: '10px', p: 1.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
              cursor: 'pointer', '&:hover': { borderColor: '#10b981', background: '#f9fafb' }
            }}
          >
            <input type="file" hidden ref={fileInputRef} onChange={e => setFile(e.target.files[0])} />
            <CloudUploadIcon sx={{ color: '#9ca3af', fontSize: 20 }} />
            <Typography sx={{ fontSize: '0.85rem', color: '#9ca3af' }}>{file ? file.name : "Yuklash"}</Typography>
          </Box>
        </Box>

        {saving && <LoadingBuffer label="Ma'lumotlar saqlanmoqda..." />}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
          <Button variant="outlined" fullWidth onClick={() => navigate(`/group/${groupId}?tab=1`)} sx={{ borderRadius: '12px', py: 1.2, textTransform: 'none', fontWeight: 700 }}>
            Bekor qilish
          </Button>
          <Button
            variant="contained" fullWidth onClick={handleSubmit} disabled={saving}
            sx={{
              borderRadius: '12px', py: 1.2, textTransform: 'none', fontWeight: 700,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            }}
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </Box>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snackbar.sev} variant="filled">{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
