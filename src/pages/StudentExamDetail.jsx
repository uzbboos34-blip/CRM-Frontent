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
        <CircularProgress size={40} sx={{ color: '#10b981' }} />
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
    PENDING:       { label: 'Kutilmoqda',      bg: '#fef3c7', color: '#d97706', icon: <AccessTimeIcon sx={{ fontSize: 14 }} /> },
    ACCEPTED:      { label: 'Qabul qilindi',   bg: '#d1fae5', color: '#059669', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
    RETURNED:      { label: 'Qaytarildi',      bg: '#fee2e2', color: '#dc2626', icon: <ReplayIcon sx={{ fontSize: 14 }} /> },
    NOT_SUBMITTED: { label: 'Topshirmaganlar', bg: '#f3f4f6', color: '#6b7280', icon: <CancelIcon sx={{ fontSize: 14 }} /> },
  };
  return map[status] || map.NOT_SUBMITTED;
}

export default function StudentExamDetail() {
  const { groupId, examId, studentId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  // Grading state
  const [score, setScore] = useState(60);
  const [feedback, setFeedback] = useState('');
  const [grading, setGrading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', sev: 'success' });
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);

  /* ── Fetch ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/exams/${examId}/submissions`);
      const matchedExam = res.data?.exam || null;
      const matchedSub = res.data?.data?.find(s => String(s.student_id) === String(studentId)) || null;
      
      setExam(matchedExam);
      setSubmission(matchedSub);

      if (matchedSub && matchedSub.examStatus !== 'NOT_SUBMITTED') {
        setScore(matchedSub.score || 0);
        setFeedback(matchedSub.feedback || '');
      }
    } catch (e) {
      console.error('StudentExamDetail fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [examId, studentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Grade submit ── */
  async function handleGrade() {
    if (!submission?.id) return;
    setGrading(true);
    try {
      await api.post(`/api/v1/exams/submissions/${submission.id}/grade`, {
        score,
        feedback,
      });
      const isPassed = score >= 60;
      const statusMsg = isPassed
        ? `Imtihon bahosi saqlandi (${score} ball)`
        : `Imtihon qaytarildi (${score} ball)`;
      setSnackbar({ open: true, msg: statusMsg, sev: isPassed ? 'success' : 'warning' });
      
      setTimeout(() => {
        navigate(`/group/${groupId}/exam/${examId}`);
      }, 800);
    } catch (e) {
      setSnackbar({ open: true, msg: e.response?.data?.message || 'Xatolik yuz berdi', sev: 'error' });
    } finally {
      setGrading(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: '#10b981' }} />
      </Box>
    );
  }

  if (!exam || !submission) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary">Ma'lumot topilmadi</Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>← Orqaga</Button>
      </Box>
    );
  }

  const statusInfo = getStatusChip(submission.examStatus);

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-out', maxWidth: 900, mx: 'auto', p: 2 }}>
      
      {/* ── Breadcrumb + back ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/group/${groupId}/exam/${examId}`)}
          sx={{
            textTransform: 'none', fontWeight: 700, color: '#6b7280', px: 0,
            '&:hover': { color: '#10b981', backgroundColor: 'transparent' },
          }}
        >
          Imtihon topshiriqlari
        </Button>
        <Typography sx={{ color: '#d1d5db', fontSize: '1.1rem' }}>›</Typography>
        <Typography sx={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
          Baholash
        </Typography>
      </Box>

      {/* ── Exam info card ── */}
      <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', p: 3, mb: 3 }}>
        <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af', mb: 0.3 }}>Imtihon shartlari</Typography>
        <Box sx={{ background: '#f9fafb', borderRadius: '10px', p: 2 }}>
          <Typography sx={{ fontWeight: 750, color: '#111827', fontSize: '1rem', mb: 0.5 }}>
            {exam.title || '—'}
          </Typography>
          {exam.description && (
            <Typography sx={{ color: '#6b7280', fontSize: '0.85rem' }}>
              {exam.description}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* ── Student Header ── */}
      <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 40, height: 40, backgroundColor: '#10b981', fontWeight: 700, fontSize: '1rem' }}>
              {getInitials(submission.students?.full_name || '')}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>
                {submission.students?.full_name || '—'}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                O'quvchi
              </Typography>
            </Box>
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
      </Paper>

      {/* ── Student's Submission Content / Yuborilgan vazifa tafsilotlari ── */}
      {submission.examStatus !== 'NOT_SUBMITTED' && (
        <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', p: 3, mb: 3 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#111827', mb: 2 }}>
            Yuborilgan javob
          </Typography>

          <Box sx={{ background: '#f9fafb', borderRadius: '12px', p: 2.5, border: '1px solid #f3f4f6', mb: submission.file ? 2 : 0 }}>
            {submission.title && (
              <Typography sx={{ fontWeight: 700, color: '#374151', fontSize: '0.9rem', mb: 1 }}>
                Mavzu/Sarlavha: <span style={{ fontWeight: 500, color: '#4b5563' }}>{submission.title}</span>
              </Typography>
            )}
            
            {submission.description ? (
              <Typography sx={{ color: '#4b5563', fontSize: '0.88rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {submission.description}
              </Typography>
            ) : (
              <Typography sx={{ color: '#9ca3af', fontSize: '0.85rem', fontStyle: 'italic' }}>
                Izoh yuborilmagan
              </Typography>
            )}

            <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af', mt: 2, textAlign: 'right' }}>
              Topshirilgan vaqt: {fmtDate(submission.created_at)}
            </Typography>
          </Box>

          {submission.file && (
            <Box
              sx={{
                border: '1.5px solid #e5e7eb',
                borderRadius: '12px',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fff',
                '&:hover': { borderColor: '#10b981', boxShadow: '0 4px 12px rgba(16,185,129,0.05)' },
                transition: 'all 0.2s',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '10px',
                    backgroundColor: '#f0fdf4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                  }}
                >
                  <InsertDriveFileIcon />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {submission.file.split('/').pop() || 'yuborilgan_fayl'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    Yuklangan fayl
                  </Typography>
                </Box>
              </Box>

              <Button
                onClick={() => setFilePreviewOpen(true)}
                variant="contained"
                size="small"
                sx={{
                  backgroundColor: '#10b981',
                  '&:hover': { backgroundColor: '#059669' },
                  textTransform: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  boxShadow: 'none',
                }}
              >
                Faylni ko'rish
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {/* ── Grading section ── */}
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
            60-100 oralig'ida ball qo'yilgan imtihon{' '}
            <strong>'Qabul qilingan'</strong>, 0-59 oralig'ida ball qo'yilgan imtihon{' '}
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
              value={score}
              onChange={(_, v) => setScore(v)}
              min={0}
              max={100}
              sx={{
                color: score >= 60 ? '#10b981' : '#ef4444',
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
                {score >= 60 ? "✓ O'tish bali" : '✗ O\'tish baliga yetmadi'}
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
              {score}
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
          placeholder="O'quvchiga izohingiz..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              '& fieldset': { borderColor: '#e5e7eb' },
              '&:hover fieldset': { borderColor: '#10b981' },
              '&.Mui-focused fieldset': { borderColor: '#10b981' },
            },
          }}
        />

        {/* Grade result preview */}
        <Box sx={{
          p: 2, borderRadius: '12px', mb: 3,
          background: score >= 60 ? '#d1fae5' : '#fee2e2',
          border: `1.5px solid ${score >= 60 ? '#a7f3d0' : '#fecaca'}`,
        }}>
          <Typography sx={{
            fontWeight: 700, fontSize: '0.88rem',
            color: score >= 60 ? '#059669' : '#dc2626',
          }}>
            {score >= 60
              ? `✓ Bu ball bilan imtihon "Qabul qilingan" statusiga o'tadi`
              : `✗ Bu ball bilan imtihon "Qaytarilgan" statusiga o'tadi`}
          </Typography>
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/group/${groupId}/exam/${examId}`)}
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
            disabled={grading}
            onClick={handleGrade}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 4,
              background: score >= 60
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              boxShadow: score >= 60
                ? '0 4px 14px rgba(16,185,129,0.35)'
                : '0 4px 14px rgba(245,158,11,0.35)',
              '&:hover': {
                background: score >= 60
                  ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                  : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              },
            }}
          >
            {grading
              ? <CircularProgress size={18} sx={{ color: '#fff' }} />
              : score >= 60 ? 'Qabul qilish' : 'Qaytarish'}
          </Button>
        </Box>
      </Paper>

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
            <InsertDriveFileIcon sx={{ color: '#10b981' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
              {submission?.file?.split('/').pop() || 'Fayl ko\'rish'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component="a"
              href={getFileUrl(submission?.file)}
              download
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              size="small"
              startIcon={<DownloadIcon />}
              sx={{ textTransform: 'none', borderRadius: '8px', backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' }, boxShadow: 'none', fontSize: '0.82rem' }}
            >
              Saqlash
            </Button>
            <IconButton size="small" onClick={() => setFilePreviewOpen(false)} sx={{ color: '#9ca3af' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, minHeight: 500 }}>
          {submission?.file && (() => {
            const url = getFileUrl(submission.file);
            const ext = (submission.file.split('.').pop() || '').toLowerCase();
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
                  <img src={url} alt="submission file" style={{ maxWidth: '100%', maxHeight: 600, borderRadius: 8 }} />
                </Box>
              );
            }
            if (isPdf) {
              return (
                <iframe
                  src={url}
                  title="submission-file"
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
                  title="submission-office-file"
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
                  <VolumeUpIcon sx={{ fontSize: 72, color: '#10b981' }} />
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
                  <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FolderZipIcon sx={{ fontSize: 80, color: '#10b981' }} />
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
                    sx={{ textTransform: 'none', borderRadius: '10px', backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' }, boxShadow: 'none', px: 4, py: 1, mt: 1 }}
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
                  sx={{ textTransform: 'none', borderRadius: '8px', backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' }, boxShadow: 'none' }}
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
