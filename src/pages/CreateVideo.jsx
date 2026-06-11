import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { useUploads } from '../context/UploadContext';
import {
  Box, Typography, Button, MenuItem, Select,
  TextField, Snackbar, Alert, IconButton, CircularProgress,
} from '@mui/material';
import {
  DeleteOutlined as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

// Custom SVG icon for upload
const UploadBoxIcon = (props) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M11.6667 30H28.3333C31.0948 30 33.3333 27.7614 33.3333 25V18.3333C33.3333 16.4924 31.8409 15 30 15H25L23.3333 11.6667H16.6667L15 15H10C8.15906 15 6.66667 16.4924 6.66667 18.3333V25C6.66667 27.7614 8.90524 30 11.6667 30Z" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 25V16.6667M20 16.6667L16.6667 20M20 16.6667L23.3333 20" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const thSx = {
  fontWeight: 700,
  fontSize: '0.8rem',
  color: '#6b7280',
  py: 1.5,
  px: 2,
  borderBottom: '1px solid #e5e7eb',
  whiteSpace: 'nowrap',
};
const tdSx = {
  py: 1.5,
  px: 2,
  borderBottom: '1px solid #f3f4f6',
  verticalAlign: 'middle',
};

export default function CreateVideo({ groupId: propGroupId, onClose }) {
  const { id } = useParams();
  const groupId = propGroupId || id;
  const { startUpload } = useUploads();

  const [lessons, setLessons] = useState([]);
  const [lessonsLoaded, setLessonsLoaded] = useState(false);
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', sev: 'success' });
  const [dragOver, setDragOver] = useState(false);

  const globalInputRef = useRef(null);

  const fetchLessons = () => {
    if (!groupId || lessonsLoaded) return;
    api.get(`/api/v1/lessson?group_id=${groupId}`)
      .then(res => {
        const fetchedLessons = res.data?.data || res.data || [];
        fetchedLessons.sort((a, b) => b.id - a.id);
        setLessons(fetchedLessons);
        setLessonsLoaded(true);
      })
      .catch(() => setLessons([]));
  };

  /* ── helpers ── */
  function addFilesToRows(files) {
    const videoFiles = files.filter(f => f.type.startsWith('video/') || /\.(mp4|webm|mpeg|avi|mkv|m4v|ogm|mov|mpg)$/i.test(f.name));
    if (!videoFiles.length) return;

    setRows(prev => {
      const updated = [...prev];
      videoFiles.forEach(file => {
        const name = file.name;
        updated.push({ id: Date.now() + Math.random(), file, lesson_id: '', title: name });
      });
      return updated;
    });
  }

  function removeRow(id) {
    setRows(prev => prev.filter(r => r.id !== id));
  }

  function updateRow(id, field, value) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    setErrors(prev => { const n = { ...prev }; delete n[`${id}_file`]; return n; });
  }

  /* ── drag & drop ── */
  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    addFilesToRows(Array.from(e.dataTransfer.files));
  }

  /* ── validate ── */
  function validate() {
    const e = {};
    rows.forEach(r => { 
      if (!r.file) e[`${r.id}_file`] = true; 
      if (!r.lesson_id) e[`${r.id}_lesson`] = true;
      if (!r.title) e[`${r.id}_title`] = true;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── submit ── */
  async function handleSubmit() {
    if (rows.length === 0) {
      if (onClose) onClose();
      return;
    }
    if (!validate()) return;
    setSaving(true);

    for (const row of rows) {
      const selectedLesson = lessons.find(l => l.id === row.lesson_id);
      const autoTitle = row.title || 'Dars videosi';
      const data = new FormData();
      data.append('title', autoTitle);
      data.append('group_id', groupId);
      if (row.lesson_id) data.append('lesson_id', row.lesson_id);
      if (row.file) data.append('video', row.file);

      startUpload('/api/v1/videos', data, {
        title: autoTitle,
        groupId,
        type: 'video',
        lessonTopic: selectedLesson?.topic || '—',
      });
    }

    setSnackbar({ open: true, msg: `${rows.length} ta video yuklash boshlandi...`, sev: 'success' });
    setTimeout(() => {
      if (onClose) onClose();
    }, 600);
    setSaving(false);
  }

  const hasFiles = rows.length > 0;

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#111827' }}>
          Qo'shish
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: '#9ca3af', '&:hover': { color: '#374151' } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Upload Zone */}
      <Box
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => globalInputRef.current?.click()}
        sx={{
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          py: 4,
          px: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          transition: 'all 0.2s',
          backgroundColor: dragOver ? '#f0fdf4' : '#fff',
          '&:hover': { backgroundColor: '#f9fafb' },
          mb: hasFiles ? 3 : 0,
        }}
      >
        <input
          ref={globalInputRef}
          type="file"
          accept="video/*"
          multiple
          hidden
          onChange={e => { addFilesToRows(Array.from(e.target.files)); e.target.value = ''; }}
        />
        <UploadBoxIcon />
        <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem', textAlign: 'center' }}>
          Videofaylni yuklash uchun ushbu hudud ustiga bosing yoki faylni shu yerga olib keling
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
          Videofayl: .mp4, .webm, .mpeg, .avi, .mkv, .m4v, .ogm, .mov, .mpg formatlaridan birida bo'lishi kerak
        </Typography>
      </Box>

      {/* Table for files */}
      {hasFiles && (
        <Box sx={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', mb: 3 }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 2fr 60px',
            backgroundColor: '#fff',
            borderBottom: '1px solid #e5e7eb',
          }}>
            {['File name', '* Dars', '* Video nomi', 'Actions'].map((h, i) => (
              <Box key={i} sx={{ ...thSx, background: 'transparent' }}>
                {h}
              </Box>
            ))}
          </Box>

          {rows.map((row, idx) => {
            const hasErr = errors[`${row.id}_file`];
            const darsErr = errors[`${row.id}_lesson`];
            const titleErr = errors[`${row.id}_title`];
            return (
              <Box
                key={row.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr 2fr 60px',
                  alignItems: 'center',
                  borderBottom: idx < rows.length - 1 ? '1px solid #f3f4f6' : 'none',
                  backgroundColor: hasErr ? '#fef2f2' : 'white',
                }}
              >
                {/* File name */}
                <Box sx={{ ...tdSx }}>
                  <Typography sx={{
                    fontSize: '0.85rem', color: '#111827', fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: 180,
                  }}>
                    {row.file?.name}
                  </Typography>
                </Box>

                {/* Dars select */}
                <Box sx={{ ...tdSx }}>
                  <Select
                    size="small"
                    value={row.lesson_id}
                    onChange={e => updateRow(row.id, 'lesson_id', e.target.value)}
                    displayEmpty
                    error={darsErr}
                    fullWidth
                    onOpen={fetchLessons}
                    sx={{
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      height: 36,
                      backgroundColor: '#f9fafb',
                      '& fieldset': { borderColor: '#e5e7eb' },
                    }}
                  >
                    <MenuItem value="" disabled sx={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                      Darsni tanlang
                    </MenuItem>
                    {lessons.map(l => (
                      <MenuItem key={l.id} value={l.id} sx={{ fontSize: '0.85rem' }}>
                        {l.topic}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>

                {/* Title */}
                <Box sx={{ ...tdSx }}>
                  <TextField
                    size="small"
                    value={row.title}
                    onChange={e => updateRow(row.id, 'title', e.target.value)}
                    error={titleErr}
                    fullWidth
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '8px', fontSize: '0.85rem', height: 36, backgroundColor: '#f9fafb',
                        '& fieldset': { borderColor: '#e5e7eb' }
                      } 
                    }}
                  />
                </Box>

                {/* Delete */}
                <Box sx={{ ...tdSx, display: 'flex', justifyContent: 'center' }}>
                  <IconButton
                    size="small"
                    onClick={() => removeRow(row.id)}
                    sx={{ border: '1px solid #e5e7eb', borderRadius: '8px', '&:hover': { backgroundColor: '#fef2f2', color: '#ef4444' } }}
                  >
                    <DeleteIcon fontSize="small" sx={{ color: '#9ca3af' }} />
                  </IconButton>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Footer */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: hasFiles ? 0 : 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            textTransform: 'none', fontWeight: 600, color: '#374151', 
            borderColor: '#e5e7eb', borderRadius: '8px', px: 3, py: 0.8,
            '&:hover': { backgroundColor: '#f9fafb', borderColor: '#d1d5db' },
          }}
        >
          Bekor qilish
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || rows.length === 0}
          startIcon={saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : null}
          sx={{
            textTransform: 'none', fontWeight: 600,
            borderRadius: '8px', px: 3, py: 0.8,
            background: '#10b981', color: '#fff',
            boxShadow: 'none',
            '&:hover': { background: '#059669', boxShadow: 'none' },
            '&.Mui-disabled': { background: '#9ca3af', color: '#f3f4f6' }
          }}
        >
          {saving ? 'Yuklanmoqda...' : 'Fayllarni yuklash'}
        </Button>
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
