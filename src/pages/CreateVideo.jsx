import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useUploads } from '../context/UploadContext';
import {
  Box, Typography, Button, MenuItem, Select, FormControl,
  FormHelperText, TextField, Paper, Divider, CircularProgress,
  Snackbar, Alert, IconButton, Chip, LinearProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  DeleteOutlined as DeleteIcon,
  VideoFile as VideoFileIcon,
  Add as AddIcon,
} from '@mui/icons-material';

export default function CreateVideo() {
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  const { startUpload } = useUploads();

  const [lessons, setLessons] = useState([]);
  // Each row: { id, file, lesson_id, video_url, title }
  const [rows, setRows] = useState([{ id: Date.now(), file: null, lesson_id: '', video_url: '', title: '' }]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', sev: 'success' });

  // Refs per row for file input
  const fileRefs = useRef({});

  useEffect(() => {
    if (!groupId) return;
    api.get(`/api/v1/lessson?group_id=${groupId}`)
      .then(res => setLessons(res.data?.data || res.data || []))
      .catch(() => setLessons([]));
  }, [groupId]);

  /* ── Row helpers ── */
  function addRow() {
    setRows(prev => [...prev, { id: Date.now(), file: null, lesson_id: '', video_url: '', title: '' }]);
  }

  function removeRow(id) {
    setRows(prev => prev.filter(r => r.id !== id));
  }

  function updateRow(id, field, value) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    // clear error
    setErrors(prev => {
      const next = { ...prev };
      delete next[`${id}_${field}`];
      return next;
    });
  }

  function handleFileChange(id, e) {
    const file = e.target.files[0];
    if (!file) return;
    updateRow(id, 'file', file);
    // Auto-fill title from filename if empty
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const name = file.name.replace(/\.[^/.]+$/, '');
      return { ...r, file, title: r.title || name };
    }));
    // reset input so same file can be re-selected
    e.target.value = '';
  }

  /* ── Drag & Drop ── */
  function handleDrop(e) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'));
    if (!files.length) return;

    setRows(prev => {
      const updated = [...prev];
      // Fill existing empty rows first, then add new ones
      files.forEach(file => {
        const emptyIdx = updated.findIndex(r => !r.file && !r.video_url);
        if (emptyIdx !== -1) {
          const name = file.name.replace(/\.[^/.]+$/, '');
          updated[emptyIdx] = { ...updated[emptyIdx], file, title: name };
        } else {
          const name = file.name.replace(/\.[^/.]+$/, '');
          updated.push({ id: Date.now() + Math.random(), file, lesson_id: '', video_url: '', title: name });
        }
      });
      return updated;
    });
  }

  /* ── Validation ── */
  function validate() {
    const e = {};
    rows.forEach(r => {
      if (!r.file && !r.video_url) {
        e[`${r.id}_file`] = "Video fayl yoki URL kiritilishi shart";
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── Submit ── */
  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);

    let submitted = 0;
    for (const row of rows) {
      const selectedLesson = lessons.find(l => l.id === row.lesson_id);
      const autoTitle = row.title || selectedLesson?.topic || `Dars videosi ${submitted + 1}`;

      const data = new FormData();
      data.append('title', autoTitle);
      data.append('group_id', groupId);
      if (row.lesson_id) data.append('lesson_id', row.lesson_id);

      if (row.file) {
        data.append('video', row.file);
      } else {
        data.append('video_url', row.video_url);
      }

      startUpload('/api/v1/videos', data, {
        title: autoTitle,
        groupId,
        type: 'video',
        lessonTopic: selectedLesson?.topic || '—',
      });
      submitted++;
    }

    setSnackbar({ open: true, msg: `${submitted} ta video yuklash boshlandi...`, sev: 'success' });
    setTimeout(() => navigate(`/group/${groupId}?tab=1&subTab=1`), 600);
    setSaving(false);
  }

  const hasMultiple = rows.length > 1;

  return (
    <Box sx={{ maxWidth: 740, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <IconButton
          onClick={() => navigate(`/group/${groupId}?tab=1&subTab=1`)}
          sx={{ color: '#6b7280', '&:hover': { backgroundColor: '#f3f4f6' } }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
            Video qo'shish
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af', mt: 0.3 }}>
            Bir yoki bir nechta video yuklang
          </Typography>
        </Box>
      </Box>

      {/* Drop zone */}
      <Box
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed #d1d5db',
          borderRadius: '14px',
          p: 3,
          mb: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
        }}
        onClick={() => {
          // click hidden multi-input
          document.getElementById('global-video-input')?.click();
        }}
      >
        <input
          id="global-video-input"
          type="file"
          accept="video/*"
          multiple
          hidden
          onChange={e => {
            const files = Array.from(e.target.files);
            if (!files.length) return;
            setRows(prev => {
              const updated = [...prev];
              files.forEach(file => {
                const name = file.name.replace(/\.[^/.]+$/, '');
                const emptyIdx = updated.findIndex(r => !r.file && !r.video_url);
                if (emptyIdx !== -1) {
                  updated[emptyIdx] = { ...updated[emptyIdx], file, title: name };
                } else {
                  updated.push({ id: Date.now() + Math.random(), file, lesson_id: '', video_url: '', title: name });
                }
              });
              return updated;
            });
            e.target.value = '';
          }}
        />
        <CloudUploadIcon sx={{ fontSize: 40, color: '#10b981' }} />
        <Typography sx={{ fontWeight: 700, color: '#374151', fontSize: '0.95rem' }}>
          Videofaylni yuklash uchun ushbu hudud ustiga bosing yoki faylni shu yerga olib keling
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af' }}>
          Videofayl: mp4, webm, mpeg, .avi, .mkv, .m4v, .ogm, .mov, .mpg formatlaridan birida bo'lishi kerak
        </Typography>
      </Box>

      {/* Rows table */}
      <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '14px', overflow: 'hidden', mb: 3 }}>
        {/* Table header */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: hasMultiple ? '2fr 2fr 2fr 44px' : '2fr 2fr 2fr',
          gap: 0,
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          px: 2,
          py: 1.2,
        }}>
          <Typography sx={thSx}>File name</Typography>
          <Typography sx={thSx}>* Dars</Typography>
          <Typography sx={thSx}>* Video nomi</Typography>
          {hasMultiple && <Typography sx={thSx}>Actions</Typography>}
        </Box>

        {/* Rows */}
        {rows.map((row, idx) => {
          const fileErr = errors[`${row.id}_file`];
          return (
            <Box
              key={row.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: hasMultiple ? '2fr 2fr 2fr 44px' : '2fr 2fr 2fr',
                alignItems: 'center',
                gap: 0,
                px: 2,
                py: 1.2,
                borderBottom: idx < rows.length - 1 ? '1px solid #f3f4f6' : 'none',
                backgroundColor: fileErr ? '#fef2f2' : 'white',
              }}
            >
              {/* File name / upload cell */}
              <Box sx={{ pr: 1 }}>
                {row.file ? (
                  <Box
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.7,
                      backgroundColor: '#f0fdf4', borderRadius: '8px',
                      px: 1, py: 0.5, cursor: 'pointer',
                      border: '1px solid #a7f3d0',
                      '&:hover': { borderColor: '#10b981' },
                    }}
                    onClick={() => fileRefs.current[row.id]?.click()}
                  >
                    <VideoFileIcon sx={{ fontSize: 16, color: '#10b981', flexShrink: 0 }} />
                    <Typography sx={{
                      fontSize: '0.78rem', color: '#065f46', fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      maxWidth: 140,
                    }}>
                      {row.file.name}
                    </Typography>
                    <input
                      ref={el => fileRefs.current[row.id] = el}
                      type="file"
                      accept="video/*"
                      hidden
                      onChange={e => handleFileChange(row.id, e)}
                    />
                  </Box>
                ) : (
                  <Box>
                    <Box
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 0.7,
                        border: `1px dashed ${fileErr ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '8px', px: 1, py: 0.5,
                        cursor: 'pointer', transition: 'all 0.2s',
                        '&:hover': { borderColor: '#10b981', backgroundColor: '#f9fafb' },
                      }}
                      onClick={() => fileRefs.current[row.id]?.click()}
                    >
                      <CloudUploadIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                      <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af' }}>Fayl tanlang</Typography>
                      <input
                        ref={el => fileRefs.current[row.id] = el}
                        type="file"
                        accept="video/*"
                        hidden
                        onChange={e => handleFileChange(row.id, e)}
                      />
                    </Box>
                    {/* OR URL field */}
                    <TextField
                      size="small"
                      placeholder="yoki URL..."
                      value={row.video_url}
                      onChange={e => {
                        updateRow(row.id, 'video_url', e.target.value);
                      }}
                      error={!!fileErr && !row.video_url}
                      sx={{
                        mt: 0.6,
                        '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.78rem' },
                        '& input': { py: 0.6, px: 1 },
                      }}
                      fullWidth
                    />
                    {fileErr && (
                      <Typography sx={{ fontSize: '0.7rem', color: '#ef4444', mt: 0.3 }}>
                        {fileErr}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>

              {/* Lesson select */}
              <Box sx={{ px: 1 }}>
                <Select
                  size="small"
                  value={row.lesson_id}
                  onChange={e => updateRow(row.id, 'lesson_id', e.target.value)}
                  displayEmpty
                  fullWidth
                  sx={{ borderRadius: '8px', fontSize: '0.82rem' }}
                >
                  <MenuItem value="" disabled sx={{ fontSize: '0.82rem', color: '#9ca3af' }}>
                    Darsni tanlang
                  </MenuItem>
                  {lessons.map(l => (
                    <MenuItem key={l.id} value={l.id} sx={{ fontSize: '0.82rem' }}>
                      {l.topic}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              {/* Video title */}
              <Box sx={{ px: 1 }}>
                <TextField
                  size="small"
                  placeholder={`Video ${idx + 1}`}
                  value={row.title}
                  onChange={e => updateRow(row.id, 'title', e.target.value)}
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.82rem' } }}
                />
              </Box>

              {/* Delete row */}
              {hasMultiple && (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <IconButton
                    size="small"
                    onClick={() => removeRow(row.id)}
                    sx={{ color: '#ef4444', '&:hover': { backgroundColor: '#fef2f2' } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
          );
        })}
      </Paper>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Button
          variant="text"
          startIcon={<AddIcon />}
          onClick={addRow}
          sx={{
            textTransform: 'none', fontWeight: 600, color: '#10b981',
            '&:hover': { backgroundColor: '#f0fdf4' },
          }}
        >
          Qator qo'shish
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/group/${groupId}?tab=1&subTab=1`)}
            sx={{
              borderRadius: '10px', textTransform: 'none', fontWeight: 700,
              borderColor: '#d1d5db', color: '#374151',
              '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
            }}
          >
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            sx={{
              borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
              '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
            }}
          >
            {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Fayllarni yuklash'}
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
