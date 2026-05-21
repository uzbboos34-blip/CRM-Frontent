import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Box, Typography, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress,
  Avatar, Chip, Button, IconButton, Dialog, DialogContent, DialogTitle
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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
  // Faqat fayl nomi saqlangan bo'lsa — Supabase public URL yasaymiz
  return `${SUPABASE_URL}/storage/v1/object/public/NajotEdu/${filename}`;
}

function getInitials(name = '') {
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (p[0]?.[0] || '?').toUpperCase();
}

const avatarColors = ['#7b61ff','#10b981','#f59e0b','#3b82f6','#ec4899','#ef4444'];
const avatarColor = (i) => avatarColors[i % avatarColors.length];

/* ─── Tab config ───────────────────────────────────────────────────────── */
const TABS = [
  { key: 'PENDING', label: 'Kutayotganlar', color: '#f59e0b', icon: <AccessTimeIcon sx={{ fontSize: 16 }} /> },
  { key: 'RETURNED', label: 'Qaytarilganlar', color: '#ef4444', icon: <CancelIcon sx={{ fontSize: 16 }} /> },
  { key: 'ACCEPTED', label: 'Qabul qilinganlar', color: '#10b981', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
  { key: 'NOT_SUBMITTED', label: 'Bajarilmagan', color: '#6b7280', icon: <CancelIcon sx={{ fontSize: 16 }} /> },
];

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

export default function ExamDetail() {
  const { groupId, examId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [examInfo, setExamInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/exams/${examId}/submissions`);
      setExamInfo(res.data?.exam || null);
      setData(res.data?.data || []);
    } catch (e) {
      console.error('ExamDetail fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePublish = async () => {
    try {
      await api.post(`/api/v1/exams/${examId}/publish`);
      alert("Natijalar muvaffaqiyatli e'lon qilindi!");
      fetchData();
    } catch (error) {
      alert("Xatolik yuz berdi");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: '#10b981' }} />
      </Box>
    );
  }

  if (!examInfo) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary">Imtihon topilmadi</Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>← Orqaga</Button>
      </Box>
    );
  }

  const currentTabKey = TABS[tabIndex].key;
  const currentList = data.filter(item => item.examStatus === currentTabKey);

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-out', p: 2 }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/group/${groupId}?tab=1&subTab=2`)}
          sx={{
            textTransform: 'none', fontWeight: 700, color: '#6b7280',
            '&:hover': { color: '#10b981', backgroundColor: '#f0fdf4' },
            borderRadius: '10px',
          }}
        >
          Orqaga
        </Button>

        {/* E'lon qilish tugmasi */}
        {!examInfo.is_published ? (
           <Button 
             variant="contained" 
             onClick={handlePublish}
             sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' }, textTransform: 'none', borderRadius: '10px', fontWeight: 600 }}
           >
             Natijalarni e'lon qilish
           </Button>
        ) : (
           <Chip label="Natijalar e'lon qilingan" sx={{ backgroundColor: '#d1fae5', color: '#059669', fontWeight: 700 }} />
        )}
      </Box>

      {/* ── Exam info card ── */}
      <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', p: 3, mb: 3 }}>
        <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af', mb: 0.5 }}>Imtihon shartlari</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#111827', mb: 1 }}>
          {examInfo.title}
        </Typography>
        {examInfo.description && (
          <Typography sx={{ fontSize: '0.88rem', color: '#6b7280', mb: 2 }}>
            {examInfo.description}
          </Typography>
        )}
        {examInfo.file && (
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<InsertDriveFileIcon />}
              onClick={() => setFilePreviewOpen(true)}
              sx={{ textTransform: 'none', borderRadius: '8px', color: '#10b981', borderColor: '#10b981', '&:hover': { borderColor: '#059669', background: '#f0fdf4' } }}
            >
              Faylni ko'rish
            </Button>
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, pt: 1, borderTop: '1px solid #f3f4f6' }}>
          <Box>
             <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af' }}>Boshlanish:</Typography>
             <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{fmtDate(examInfo.start_date)}</Typography>
          </Box>
          <Box>
             <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af' }}>Tugash:</Typography>
             <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{fmtDate(examInfo.end_date)}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* ── Tabs ── */}
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v)}
          sx={{
            borderBottom: '2px solid #f3f4f6',
            '& .MuiTabs-indicator': { backgroundColor: '#10b981', height: 2 },
            '& .MuiTab-root': {
              textTransform: 'none', fontWeight: 600, fontSize: '0.9rem', color: '#9ca3af', minWidth: 0, px: 0, mr: 4,
            },
            '& .Mui-selected': { color: '#111827 !important' },
          }}
        >
          {TABS.map((t) => {
            const count = data.filter(i => i.examStatus === t.key).length;
            return (
              <Tab
                key={t.key}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    {t.label}
                    <Box sx={{
                      minWidth: 22, height: 22, borderRadius: '50%',
                      backgroundColor: count > 0 ? t.color : '#e5e7eb',
                      color: count > 0 ? '#fff' : '#9ca3af',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: 700,
                    }}>
                      {count}
                    </Box>
                  </Box>
                }
              />
            );
          })}
        </Tabs>
      </Box>

      {/* ── Table ── */}
      {currentList.length === 0 ? (
        <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', py: 8, textAlign: 'center' }}>
          <Typography sx={{ color: '#9ca3af', fontWeight: 500 }}>
            Hozircha {TABS[tabIndex].label.toLowerCase()} yo'q
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                <TableCell sx={thSx}>O'quvchi ismi</TableCell>
                {currentTabKey !== 'NOT_SUBMITTED' && <TableCell sx={thSx}>Topshirilgan vaqti</TableCell>}
                {(currentTabKey === 'ACCEPTED' || currentTabKey === 'RETURNED') && <TableCell sx={thSx}>Tekshirilgan vaqti</TableCell>}
                {currentTabKey !== 'NOT_SUBMITTED' && <TableCell sx={thSx}>Ball</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {currentList.map((item, idx) => (
                  <TableRow 
                    key={item.id} 
                    sx={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s', '&:hover': { backgroundColor: '#f8f7ff' } }}
                  >
                    <TableCell sx={tdSx}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, backgroundColor: avatarColor(idx), fontSize: '0.8rem', fontWeight: 700 }}>
                          {getInitials(item.students?.full_name || '')}
                        </Avatar>
                        <Typography
                          onClick={() => navigate(`/group/${groupId}/exam/${examId}/student/${item.student_id}`)}
                          sx={{
                            fontWeight: 600, color: '#111827', fontSize: '0.9rem',
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline', color: '#10b981' }
                          }}
                        >
                          {item.students?.full_name || '—'}
                        </Typography>
                      </Box>
                    </TableCell>
                    {currentTabKey !== 'NOT_SUBMITTED' && (
                      <TableCell sx={tdSx}>
                        <Typography sx={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>
                           {fmtDate(item.created_at)}
                         </Typography>
                      </TableCell>
                    )}
                    {(currentTabKey === 'ACCEPTED' || currentTabKey === 'RETURNED') && (
                      <TableCell sx={tdSx}>
                        <Typography sx={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>
                           {fmtDate(item.updated_at || item.created_at)}
                         </Typography>
                      </TableCell>
                    )}
                    {currentTabKey !== 'NOT_SUBMITTED' && (
                      <TableCell sx={tdSx}>
                        <Chip
                          label={`${item.score || 0} ball`}
                          size="small"
                          sx={{ backgroundColor: item.score >= 60 ? '#d1fae5' : '#fee2e2', color: item.score >= 60 ? '#059669' : '#dc2626', fontWeight: 700, fontSize: '0.78rem', height: 26 }}
                        />
                      </TableCell>
                    )}
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
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
              {examInfo?.title} — Fayl
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component="a"
              href={getFileUrl(examInfo?.file)}
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
          {examInfo?.file && (() => {
            const url = getFileUrl(examInfo.file);
            const ext = (examInfo.file.split('.').pop() || '').toLowerCase();
            const isImage = ['jpg','jpeg','png','gif','webp','svg'].includes(ext);
            const isPdf = ext === 'pdf';
            const isOffice = ['doc','docx','xls','xlsx','ppt','pptx','odt','ods','odp'].includes(ext);
            const isText = ['txt','json','js','ts','jsx','tsx','html','css','md','csv','xml','yaml'].includes(ext);
            const isAudio = ['mp3','wav','ogg','m4a','flac'].includes(ext);
            const isVideo = ['mp4','webm','ogg','avi','mov'].includes(ext);
            const isArchive = ['zip','rar','7z','tar','gz'].includes(ext);

            if (isImage) {
              return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                  <img src={url} alt="exam file" style={{ maxWidth: '100%', maxHeight: 600, borderRadius: 8 }} />
                </Box>
              );
            }
            if (isPdf) {
              return (
                <iframe
                  src={url}
                  title="exam-file"
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
                  title="exam-office-file"
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

const thSx = { fontWeight: 700, fontSize: '0.8rem', color: '#6b7280', py: 1.5, px: 2.5, borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' };
const tdSx = { py: 1.8, px: 2.5, borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' };
