import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Box, Typography, Paper, Button, CircularProgress,
  Chip, Slider, TextField, Snackbar, Alert, Avatar,
  Divider, Dialog, DialogTitle, DialogContent, IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReplayIcon from '@mui/icons-material/Replay';
import CancelIcon from '@mui/icons-material/Cancel';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ArticleIcon from '@mui/icons-material/Article';
import WarningIcon from '@mui/icons-material/Warning';

/* ─── Helpers ──────────────────────────────────────────────────────────── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]}, ${dt.getFullYear()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
}

const SUPABASE_URL = 'https://mcjypffxtuoqfttoapjh.supabase.co';

function getFileUrl(filename) {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  return `${SUPABASE_URL}/storage/v1/object/public/NajotEdu/${filename}`;
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

function TextPreview({ url }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [url]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 15 }}>
        <CircularProgress size={40} sx={{ color: '#7b61ff' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 10, px: 2, textAlign: 'center' }}>
        <Typography color="error" sx={{ fontWeight: 600 }}>
          Fayl tarkibini yuklab bo'lmadi.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, background: '#f8fafc', minHeight: 400 }}>
      <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
        <Box sx={{ background: '#f1f5f9', py: 1, px: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ArticleIcon sx={{ fontSize: 16, color: '#64748b' }} />
          <Typography sx={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
            Matn ko'rinishi (Preview)
          </Typography>
        </Box>
        <Box sx={{ p: 2, maxHeight: '480px', overflow: 'auto' }}>
          <pre style={{ margin: 0, fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', color: '#334155', lineHeight: 1.5 }}>
            {content}
          </pre>
        </Box>
      </Box>
    </Box>
  );
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
  const [snackbar,   setSnackbar]   = useState({ open: false, msg: '', sev: 'success' });
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;
  const isLocked = userRole === 'TEACHER' && data?.status === 'accepted';

  // Late check logic
  const deadlineDate = data?.homework?.created_at 
    ? new Date(new Date(data.homework.created_at).getTime() + 24 * 60 * 60 * 1000) 
    : null;
  const submissionDate = data?.answer?.created_at ? new Date(data.answer.created_at) : null;
  const isLate = deadlineDate && submissionDate ? submissionDate > deadlineDate : false;
  const hoursLate = isLate ? Math.ceil((submissionDate.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60)) : 0;
  const originalGrade = data?.result?.grade ? Math.round(data.result.grade / 0.9) : grade;

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

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchData();
    });
  }, [fetchData]);

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
      navigate(`/group/${groupId}/homework/${hwId}`);
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
        <Box sx={{ background: '#f9fafb', borderRadius: '10px', p: 2, mb: (data.homework?.file || data.homework?.video_url) ? 2 : 0 }}>
          <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af', mb: 0.3 }}>Izoh:</Typography>
          <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>
            {data.homework?.title || '—'}
          </Typography>
          {data.homework?.description && (
            <Typography
              sx={{ color: '#6b7280', fontSize: '0.85rem', mt: 0.5 }}
              dangerouslySetInnerHTML={{ __html: data.homework.description }}
            />
          )}
        </Box>

        {/* Original homework resource files */}
        {(data.homework?.file || data.homework?.video_url) && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
            {data.homework.file && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<InsertDriveFileIcon />}
                onClick={() => {
                  setPreviewFile(data.homework.file);
                  setFilePreviewOpen(true);
                }}
                sx={{
                  textTransform: 'none',
                  borderRadius: '8px',
                  color: '#7b61ff',
                  borderColor: '#7b61ff',
                  fontWeight: 600,
                  '&:hover': { borderColor: '#6246ea', background: '#f0eeff' }
                }}
              >
                Vazifa fayli
              </Button>
            )}
            {data.homework.video_url && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<VolumeUpIcon />}
                onClick={() => {
                  setPreviewFile(data.homework.video_url);
                  setFilePreviewOpen(true);
                }}
                sx={{
                  textTransform: 'none',
                  borderRadius: '8px',
                  color: '#7b61ff',
                  borderColor: '#7b61ff',
                  fontWeight: 600,
                  '&:hover': { borderColor: '#6246ea', background: '#f0eeff' }
                }}
              >
                Vazifa videosi
              </Button>
            )}
          </Box>
        )}
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
                        onClick={() => {
                          setPreviewFile(f);
                          setFilePreviewOpen(true);
                        }}
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
                        onClick={() => {
                          setPreviewFile(f);
                          setFilePreviewOpen(true);
                        }}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 1,
                          px: 2, py: 1, borderRadius: '10px',
                          border: '1.5px solid #e5e7eb', background: '#f9fafb',
                          cursor: 'pointer', color: '#374151',
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

          {/* Locked banner if accepted */}
          {isLocked && (
            <Alert
              severity="info"
              sx={{
                mb: 3,
                borderRadius: '12px',
                backgroundColor: '#eff6ff',
                border: '1px solid #dbeafe',
                color: '#1e40af',
                fontWeight: 600,
              }}
            >
              Bu vazifa qabul qilingan. Uni qaytadan baholay olmaysiz.
            </Alert>
          )}

          {/* Late penalty banner */}
          {isLate && (
            <Alert
              severity="warning"
              icon={<WarningIcon sx={{ color: '#ea580c' }} />}
              sx={{
                mb: 3,
                borderRadius: '12px',
                backgroundColor: '#fff7ed',
                border: '1px solid #ffedd5',
                color: '#9a3412',
                fontWeight: 600,
                '& .MuiAlert-icon': { color: '#ea580c' }
              }}
            >
              {data.result?.grade !== undefined ? (
                `${hoursLate} soatdan kechikib topshirilgani uchun qo'yilgan ${originalGrade} ball 10 % ga kamaytirildi.`
              ) : (
                `Vazifa ${hoursLate} soat kechikib topshirilgan. Qo'yilgan balldan 10 % kamaytiriladi (masalan, ${grade} ball qo'yilsa, o'quvchi ${Math.round(grade * 0.9)} ball oladi).`
              )}
            </Alert>
          )}

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
                disabled={isLocked}
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

          <Divider sx={{ mt: 2, mb: 3 }} />

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
            disabled={isLocked}
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
              disabled={grading || data.status === 'not_done' || isLocked}
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

      {/* ── File Preview Modal ── */}
      <Dialog
        open={filePreviewOpen}
        onClose={() => setFilePreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', overflow: 'hidden' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, px: 2.5, borderBottom: '1px solid #f3f4f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InsertDriveFileIcon sx={{ color: '#7b61ff' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
              {previewFile.split('/').pop() || 'Fayl ko\'rish'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component="a"
              href={getFileUrl(previewFile)}
              download
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              size="small"
              startIcon={<DownloadIcon />}
              sx={{ textTransform: 'none', borderRadius: '8px', backgroundColor: '#7b61ff', '&:hover': { backgroundColor: '#6246ea' }, boxShadow: 'none', fontSize: '0.82rem' }}
            >
              Saqlash
            </Button>
            <IconButton size="small" onClick={() => setFilePreviewOpen(false)} sx={{ color: '#9ca3af' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, minHeight: 500 }}>
          {previewFile && (() => {
            const url = getFileUrl(previewFile);
            const ext = (previewFile.split('.').pop() || '').toLowerCase();
            const isImg = ['jpg','jpeg','png','gif','webp','svg'].includes(ext);
            const isPdf = ext === 'pdf';
            const isOffice = ['doc','docx','xls','xlsx','ppt','pptx','odt','ods','odp'].includes(ext);
            const isText = ['txt','json','js','ts','jsx','tsx','html','css','md','csv','xml','yaml'].includes(ext);
            const isAudio = ['mp3','wav','ogg','m4a','flac'].includes(ext);
            const isVideo = ['mp4','webm','ogg','avi','mov'].includes(ext);
            const isArchive = ['zip','rar','7z','tar','gz'].includes(ext);

            if (isImg) {
              return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                  <img src={url} alt="homework file" style={{ maxWidth: '100%', maxHeight: 600, borderRadius: 8 }} />
                </Box>
              );
            }
            if (isPdf) {
              return (
                <iframe
                  src={url}
                  title="homework-file"
                  width="100%"
                  height="560px"
                  style={{ border: 'none' }}
                />
              );
            }
            if (isOffice) {
              return (
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                  title="homework-office-file"
                  width="100%"
                  height="560px"
                  style={{ border: 'none' }}
                />
              );
            }
            if (isText) {
              return <TextPreview url={url} />;
            }
            if (isAudio) {
              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 3, px: 4 }}>
                  <VolumeUpIcon sx={{ fontSize: 72, color: '#7b61ff' }} />
                  <Typography sx={{ fontWeight: 700, color: '#374151', fontSize: '1.1rem' }}>
                    Audio faylni tinglash
                  </Typography>
                  <audio controls src={url} style={{ width: '100%', maxWidth: 500 }} />
                </Box>
              );
            }
            if (isVideo) {
              return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, background: '#000' }}>
                  <video
                    src={url}
                    controls
                    style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: 8 }}
                  />
                </Box>
              );
            }
            if (isArchive) {
              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2.5, px: 3, textAlign: 'center' }}>
                  <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FolderZipIcon sx={{ fontSize: 80, color: '#7b61ff' }} />
                  </Box>
                  <Typography sx={{ color: '#111827', fontWeight: 800, fontSize: '1.2rem' }}>
                    Siqilgan arxiv (ZIP / RAR) fayli
                  </Typography>
                  <Typography sx={{ color: '#6b7280', fontSize: '0.9rem', maxWidth: 450 }}>
                    Bu arxiv fayl hisoblanadi. Fayl tarkibini ko'rish uchun uni kompyuteringiz yoki telefoningizga saqlang va arxivdan chiqaring.
                  </Typography>
                  <Button
                    component="a"
                    href={url}
                    download
                    target="_blank"
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    sx={{ textTransform: 'none', borderRadius: '10px', backgroundColor: '#7b61ff', '&:hover': { backgroundColor: '#6246ea' }, boxShadow: 'none', px: 4, py: 1, mt: 1 }}
                  >
                    Arxivni yuklab olish
                  </Button>
                </Box>
              );
            }

            // Other file types — show info + download
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
                <InsertDriveFileIcon sx={{ fontSize: 64, color: '#d1d5db' }} />
                <Typography sx={{ color: '#6b7280', fontWeight: 500 }}>
                  Bu fayl tur brauzerda ko'rsatilmaydi
                </Typography>
                <Button
                  component="a"
                  href={url}
                  download
                  target="_blank"
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  sx={{ textTransform: 'none', borderRadius: '8px', backgroundColor: '#7b61ff', '&:hover': { backgroundColor: '#6246ea' }, boxShadow: 'none' }}
                >
                  Yuklab olish
                </Button>
              </Box>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
