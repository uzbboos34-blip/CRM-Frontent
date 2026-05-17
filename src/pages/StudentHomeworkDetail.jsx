import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Box, Typography, Paper, Button, CircularProgress,
  Chip, Slider, TextField, Snackbar, Alert, Avatar,
  Divider, LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReplayIcon from '@mui/icons-material/Replay';
import CancelIcon from '@mui/icons-material/Cancel';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';

/* ─── Helpers ──────────────────────────────────────────────────────────── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]}, ${dt.getFullYear()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
}

const BASE_URL = import.meta.env.VITE_API_URL || 'https://crm-backend-l7jq.onrender.com';

function getFileUrl(filename) {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  return `${BASE_URL}/file/${filename}`;
}

function isImage(filename = '') {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);
}

function getInitials(name = '') {
  const p = name.trim().split(' ');
  return p.length >= 2
    ? (p[0][0] + p[1][0]).toUpperCase()
    : (p[0]?.[0] || '?').toUpperCase();
}

/* ─── Status config ─────────────────────────────────────────────────────── */
function getStatusChip(status) {
  const map = {
    pending:  { label: 'Kutilayapti',    bg: '#fef3c7', color: '#d97706', icon: <AccessTimeIcon sx={{ fontSize: 14 }} /> },
    accepted: { label: 'Qabul qilindi',  bg: '#d1fae5', color: '#059669', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
    returned: { label: 'Qaytarildi',     bg: '#fee2e2', color: '#dc2626', icon: <ReplayIcon sx={{ fontSize: 14 }} /> },
    not_done: { label: 'Bajarmaganlar',  bg: '#f3f4f6', color: '#6b7280', icon: <CancelIcon sx={{ fontSize: 14 }} /> },
  };
  return map[status] || map.not_done;
}

/* ═══════════════════════════════════════════════════════════════════════════
   StudentHomeworkDetail — 2nd + 3rd screenshot combined
   ═══════════════════════════════════════════════════════════════════════════ */
export default function StudentHomeworkDetail() {
  const { groupId, hwId, studentId } = useParams();
  const navigate = useNavigate();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Grading state
  const [grade,      setGrade]      = useState(60);
  const [comment,    setComment]    = useState('');
  const [grading,    setGrading]    = useState(false);
  const [dragOver,   setDragOver]   = useState(false);
  const [snackbar,   setSnackbar]   = useState({ open: false, msg: '', sev: 'success' });

  const fileInputRef = useRef();

  /* ── Fetch ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/home-works/${hwId}/student/${studentId}`);
      const d = res.data?.data || null;
      setData(d);
      // Pre-fill grade if already graded
      if (d?.result?.grade !== undefined) {
        setGrade(d.result.grade);
        setComment(d.result.title || '');
      }
    } catch (e) {
      console.error('StudentHomeworkDetail fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [hwId, studentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Grade submit ── */
  async function handleGrade() {
    if (!data?.answer?.id) return;
    setGrading(true);
    try {
      await api.post(`/api/v1/home-works/${hwId}/grade/${data.answer.id}`, {
        grade,
        comment,
      });
      const statusMsg = grade >= 60
        ? `Vazifa qabul qilindi (${grade} ball)`
        : `Vazifa qaytarildi (${grade} ball)`;
      setSnackbar({ open: true, msg: statusMsg, sev: grade >= 60 ? 'success' : 'warning' });
      await fetchData();
    } catch (e) {
      setSnackbar({ open: true, msg: e.response?.data?.message || 'Xatolik yuz berdi', sev: 'error' });
    } finally {
      setGrading(false);
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: '#7b61ff' }} />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary">Ma'lumot topilmadi</Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>← Orqaga</Button>
      </Box>
    );
  }

  const statusInfo = getStatusChip(data.status);
  const files = data.answer?.files || [];

  // Breadcrumb label mapping
  const breadcrumbStatus =
    data.status === 'kutilayotganlar' ? 'Kutilayotganlar' :
    data.status === 'returned'        ? 'Qaytarilganlar'  :
    data.status === 'accepted'        ? 'Qabul qilinganlar':
    'Kutilayotganlar';

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-out', maxWidth: 900, mx: 'auto' }}>

      {/* ── Breadcrumb + back ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/group/${groupId}/homework/${hwId}`)}
          sx={{
            textTransform: 'none', fontWeight: 700, color: '#6b7280', px: 0,
            '&:hover': { color: '#7b61ff', backgroundColor: 'transparent' },
          }}
        >
          {breadcrumbStatus}
        </Button>
        <Typography sx={{ color: '#d1d5db', fontSize: '1.1rem' }}>›</Typography>
        <Typography sx={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
          Uyga vazifa
        </Typography>
      </Box>

      {/* ── Homework info card ── */}
      <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', p: 3, mb: 3 }}>
        <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af', mb: 0.3 }}>Uy vazifasi</Typography>
        <Box sx={{ background: '#f9fafb', borderRadius: '10px', p: 2 }}>
          <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af', mb: 0.3 }}>Izoh:</Typography>
          <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>
            {data.homework?.title || '—'}
          </Typography>
          {data.homework?.description && (
            <Typography sx={{ color: '#6b7280', fontSize: '0.85rem', mt: 0.5 }}>
              {data.homework.description}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* ── Student submission card ── */}
      <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', p: 3, mb: 3 }}>

        {/* Student header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 40, height: 40, backgroundColor: '#7b61ff', fontWeight: 700, fontSize: '1rem' }}>
              {getInitials(data.student?.full_name || '')}
            </Avatar>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>
              {data.student?.full_name || '—'}
            </Typography>
          </Box>
          <Chip
            icon={statusInfo.icon}
            label={statusInfo.label}
            size="small"
            sx={{
              backgroundColor: statusInfo.bg,
              color: statusInfo.color,
              fontWeight: 700,
              fontSize: '0.8rem',
              height: 28,
              '& .MuiChip-icon': { color: statusInfo.color },
            }}
          />
        </Box>

        {data.status === 'not_done' ? (
          <Box sx={{
            background: '#f9fafb', borderRadius: '12px', p: 4,
            textAlign: 'center', border: '1.5px dashed #e5e7eb',
          }}>
            <CancelIcon sx={{ fontSize: 40, color: '#d1d5db', mb: 1 }} />
            <Typography sx={{ color: '#9ca3af', fontWeight: 500 }}>
              Bu o'quvchi uyga vazifani topshirmagan
            </Typography>
          </Box>
        ) : (
          <>
            {/* Submission meta */}
            <Paper elevation={0} sx={{ background: '#f9fafb', borderRadius: '12px', p: 2.5, mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af', mb: 0.3 }}>Vaqti:</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>
                    {fmtDate(data.answer?.created_at)}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af', mb: 0.3 }}>Fayllar soni:</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>
                    {files.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af', mb: 0.3 }}>Status:</Typography>
                  <Chip
                    label={statusInfo.label}
                    size="small"
                    sx={{
                      backgroundColor: statusInfo.bg, color: statusInfo.color,
                      fontWeight: 700, fontSize: '0.75rem', height: 24,
                    }}
                  />
                </Box>
                {data.result?.grade !== undefined && (
                  <Box>
                    <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af', mb: 0.3 }}>Ball:</Typography>
                    <Typography sx={{ fontWeight: 800, color: data.result.grade >= 60 ? '#059669' : '#dc2626', fontSize: '0.9rem' }}>
                      {data.result.grade} / 100
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Files */}
            {files.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600, mb: 1 }}>
                  Fayl: <strong>{files.length}</strong>
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {files.map((f, i) => (
                    isImage(f) ? (
                      <Box
                        key={i}
                        component="a"
                        href={getFileUrl(f)}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          width: 120, height: 80, borderRadius: '10px',
                          overflow: 'hidden', border: '1.5px solid #e5e7eb',
                          display: 'block', cursor: 'pointer',
                          transition: 'border-color 0.2s',
                          '&:hover': { borderColor: '#7b61ff' },
                        }}
                      >
                        <Box
                          component="img"
                          src={getFileUrl(f)}
                          alt={`file-${i}`}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </Box>
                    ) : (
                      <Box
                        key={i}
                        component="a"
                        href={getFileUrl(f)}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 1,
                          px: 2, py: 1, borderRadius: '10px',
                          border: '1.5px solid #e5e7eb', background: '#f9fafb',
                          textDecoration: 'none', color: '#374151',
                          fontSize: '0.8rem', fontWeight: 600,
                          transition: 'all 0.2s',
                          '&:hover': { borderColor: '#7b61ff', color: '#7b61ff', background: '#f0eeff' },
                        }}
                      >
                        <InsertDriveFileIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
                        {f.split('/').pop()?.substring(0, 20) || 'Fayl'}
                      </Box>
                    )
                  ))}
                </Box>
              </Box>
            )}

            {/* Student comment */}
            {data.answer?.comment && (
              <Box sx={{
                borderLeft: '3px solid #7b61ff', pl: 2, py: 1,
                background: '#fafafa', borderRadius: '0 10px 10px 0',
              }}>
                <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af', mb: 0.3 }}>
                  Uyga vazifa izohi:
                </Typography>
                <Typography sx={{ fontSize: '0.88rem', color: '#374151', fontWeight: 500 }}>
                  {data.answer.comment}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* ── Grading section (3rd screenshot) — only if student submitted ── */}
      {data.status !== 'not_done' && (
        <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', p: 3 }}>

          {/* Info banner */}
          <Box sx={{
            background: '#eff6ff', borderRadius: '10px', p: 2, mb: 3,
            display: 'flex', alignItems: 'flex-start', gap: 1,
          }}>
            <Box sx={{
              width: 20, height: 20, borderRadius: '50%',
              background: '#3b82f6', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.72rem', fontWeight: 800, flexShrink: 0, mt: 0.2,
            }}>
              i
            </Box>
            <Typography sx={{ fontSize: '0.82rem', color: '#1e40af', fontWeight: 500 }}>
              60-100 oralig'ida ball qo'yilgan vazifa{' '}
              <strong>'Qabul qilingan'</strong>, 0-59 oralig'ida ball qo'yilgan vazifa{' '}
              <strong>'Qaytarilgan'</strong> hisoblanadi.
            </Typography>
          </Box>

          {/* Ball slider */}
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#111827', mb: 2 }}>
            Ball
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Slider
                value={grade}
                onChange={(_, v) => setGrade(v)}
                min={0}
                max={100}
                sx={{
                  color: grade >= 60 ? '#10b981' : '#ef4444',
                  '& .MuiSlider-thumb': {
                    width: 20, height: 20,
                    border: '2px solid currentColor',
                    '&:hover': { boxShadow: '0 0 0 8px rgba(16,185,129,0.16)' },
                  },
                  '& .MuiSlider-rail': { backgroundColor: '#e5e7eb', height: 8 },
                  '& .MuiSlider-track': { height: 8, borderRadius: 4 },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                  {grade >= 60 ? "✓ O'tish bali" : '✗ O\'tish baliga yetmadi'}
                </Typography>
              </Box>
            </Box>

            {/* Grade input box */}
            <Box sx={{
              width: 64, height: 40, border: '1.5px solid #e5e7eb', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#fff', flexShrink: 0,
            }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
                {grade}
              </Typography>
            </Box>
          </Box>

          {/* Color indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Box sx={{
              height: 6, borderRadius: 3, flex: 1,
              background: `linear-gradient(to right, ${grade >= 60 ? '#10b981' : '#ef4444'} ${grade}%, #e5e7eb ${grade}%)`,
            }} />
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Comment / Izoh */}
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', mb: 1.5 }}>
            Izoh (ixtiyoriy)
          </Typography>
          <TextField
            multiline
            rows={3}
            fullWidth
            placeholder="Izohingiz..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '& fieldset': { borderColor: '#e5e7eb' },
                '&:hover fieldset': { borderColor: '#7b61ff' },
                '&.Mui-focused fieldset': { borderColor: '#7b61ff' },
              },
            }}
          />

          {/* Grade result preview */}
          <Box sx={{
            p: 2, borderRadius: '12px', mb: 3,
            background: grade >= 60 ? '#d1fae5' : '#fee2e2',
            border: `1.5px solid ${grade >= 60 ? '#a7f3d0' : '#fecaca'}`,
          }}>
            <Typography sx={{
              fontWeight: 700, fontSize: '0.88rem',
              color: grade >= 60 ? '#059669' : '#dc2626',
            }}>
              {grade >= 60
                ? `✓ Bu ball bilan vazifa "Qabul qilingan" statusiga o'tadi`
                : `✗ Bu ball bilan vazifa "Qaytarilgan" statusiga o'tadi`}
            </Typography>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/group/${groupId}/homework/${hwId}`)}
              sx={{
                textTransform: 'none', fontWeight: 700,
                borderColor: '#e5e7eb', color: '#374151', borderRadius: '10px', px: 3,
                '&:hover': { borderColor: '#d1d5db', background: '#f9fafb' },
              }}
            >
              Bekor qilish
            </Button>
            <Button
              variant="contained"
              disabled={grading || data.status === 'not_done'}
              onClick={handleGrade}
              sx={{
                textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 4,
                background: grade >= 60
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                boxShadow: grade >= 60
                  ? '0 4px 14px rgba(16,185,129,0.35)'
                  : '0 4px 14px rgba(245,158,11,0.35)',
                '&:hover': {
                  background: grade >= 60
                    ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                    : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                },
                '&:disabled': { opacity: 0.6 },
              }}
            >
              {grading
                ? <CircularProgress size={18} sx={{ color: '#fff' }} />
                : grade >= 60 ? 'Qabul qilish' : 'Qaytarish'}
            </Button>
          </Box>

          {/* Already graded info */}
          {data.result && (
            <Box sx={{ mt: 2, p: 1.5, background: '#f9fafb', borderRadius: '10px' }}>
              <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                Oxirgi baho: <strong style={{ color: '#374151' }}>{data.result.grade} ball</strong>
                {' '}— {fmtDate(data.result.created_at)}
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.sev}
          variant="filled"
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
