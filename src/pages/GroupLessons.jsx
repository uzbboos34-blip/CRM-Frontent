import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import {
  Box, Typography, Button, Tab, Tabs, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  CircularProgress, Chip, IconButton, Tooltip, Menu, MenuItem,
  Snackbar, Alert, Dialog, DialogContent, DialogTitle,
} from '@mui/material';
import { useUploads } from '../context/UploadContext';
import CreateVideo from './CreateVideo';
import Add from '@mui/icons-material/Add';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import AccessTime from '@mui/icons-material/AccessTime';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import MoreVert from '@mui/icons-material/MoreVert';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import Close from '@mui/icons-material/Close';
import PlayCircle from '@mui/icons-material/PlayCircle';
import { Pause, PlayArrow } from '@mui/icons-material';

const AddIcon = Add;
const PersonOutlineIcon = PersonOutlined;
const AccessTimeIcon = AccessTime;
const CheckCircleOutlineIcon = CheckCircleOutlined;
const MoreVertIcon = MoreVert;
const DeleteOutlineIcon = DeleteOutlined;
const EditOutlinedIcon = EditOutlined;
const CloseIcon = Close;
const PlayCircleIcon = PlayCircle;
const PauseIcon = Pause;
const PlayIcon = PlayArrow;

/* ─── Format helpers ─────────────────────────────────────── */
const MONTHS = [
  'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn',
  'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek',
];

function fmtDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  const day = dt.getDate();
  const mon = MONTHS[dt.getMonth()];
  const yr = dt.getFullYear();
  const h = String(dt.getHours()).padStart(2, '0');
  const m = String(dt.getMinutes()).padStart(2, '0');
  return `${day} ${mon}, ${yr}\n${h}:${m}`;
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]}, ${dt.getFullYear()}`;
}

function fmtFileSize(bytes) {
  if (!bytes) return '—';
  const b = Number(bytes);
  if (b === 0) return '—';
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getYTThumb(url) {
  if (!url) return '';
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (ytMatch) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
  }
  // Local video placeholder
  return 'https://img.freepik.com/free-vector/gradient-play-button-concept_23-2148705809.jpg';
}

function getFullVideoUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  let baseUrl = api.defaults.baseURL || import.meta.env.VITE_API_URL || 'https://crm-backend-l7jq.onrender.com';

  // Oxiridagi slashni olib tashlaymiz
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  // Agar baseURL ichida /api/v1 bo'lsa, uni tozalaymiz (chunki static fayllar rootda /file da joylashgan)
  baseUrl = baseUrl.replace(/\/api\/v1$/, '');

  return `${baseUrl}/file/${url}`;
}

/* ─── Sub-tab labels ─────────────────────────────────────── */
const SUB_TABS = ['Uyga vazifa', 'Videolar', 'Imtihonlar', 'Jurnal'];

/* ════════════════════════════════════════════════════════════
   GroupLessons  — props: { groupId }
   ════════════════════════════════════════════════════════════ */
export default function GroupLessons({ groupId }) {
  const navigate = useNavigate();
  const { uploads, setUploads } = useUploads();

  // Mobil ekranni aniqlash (md = 900px dan kichik bo'lsa mobil)
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const location = useLocation();
  const [subTab, setSubTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('subTab') || '0', 10);
  });
  const [homeworks, setHomeworks] = useState([]);
  const [videos, setVideos] = useState([]);
  const [exams, setExams] = useState([]);
  const [createExamModalOpen, setCreateExamModalOpen] = useState(false);
  const [examForm, setExamForm] = useState({ title: '', description: '', start_date: '', end_date: '' });
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  // Homework menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuHw, setMenuHw] = useState(null);
  // Video menu (separate to avoid state confusion)
  const [vidAnchorEl, setVidAnchorEl] = useState(null);
  const [menuVid, setMenuVid] = useState(null);
  // Exam menu
  const [examAnchorEl, setExamAnchorEl] = useState(null);
  const [menuExam, setMenuExam] = useState(null);
  const [editingExamId, setEditingExamId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  // Video preview modal
  const [previewVid, setPreviewVid] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', sev: 'success' });

  /* ── read subTab from URL on mount & URL changes ── */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sub = params.get('subTab');
    if (sub !== null) {
      setSubTab(parseInt(sub));
    }
  }, [location.search]);

  /* ── fetch data based on tab ── */
  useEffect(() => {
    if (!groupId) return;
    if (subTab === 0) fetchHomeworks();
    if (subTab === 1) fetchVideos();
    if (subTab === 2) fetchExams();
  }, [subTab, groupId]);

  async function fetchExams() {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/exams/group/${groupId}`);
      setExams(res.data?.data || res.data || []);
    } catch (e) {
      console.error('Exams fetch error:', e);
      setExams([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateExam(e) {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', examForm.title);
      formData.append('description', examForm.description);
      formData.append('group_id', String(groupId));
      if (examForm.start_date) formData.append('start_date', examForm.start_date);
      if (examForm.end_date) formData.append('end_date', examForm.end_date);
      if (file) formData.append('file', file);

      if (editingExamId) {
        await api.put(`/api/v1/exams/${editingExamId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSnackbar({ open: true, msg: "Imtihon muvaffaqiyatli tahrirlandi", sev: 'success' });
      } else {
        await api.post('/api/v1/exams', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSnackbar({ open: true, msg: "Imtihon muvaffaqiyatli yaratildi", sev: 'success' });
      }

      setCreateExamModalOpen(false);
      setExamForm({ title: '', description: '', start_date: '', end_date: '' });
      setEditingExamId(null);
      setFile(null);
      fetchExams();
    } catch (e) {
      setSnackbar({ open: true, msg: e.response?.data?.message || 'Xatolik', sev: 'error' });
    }
  }

  function handleDeleteExam(id) {
    handleExamMenuClose();
    setExamToDelete(id);
    setDeleteConfirmOpen(true);
  }

  async function confirmDeleteExam(id) {
    if (!id) return;
    try {
      await api.delete(`/api/v1/exams/${id}`);
      setSnackbar({ open: true, msg: "Imtihon muvaffaqiyatli o'chirildi", sev: 'success' });
      fetchExams();
    } catch (e) {
      setSnackbar({ open: true, msg: e.response?.data?.message || 'Xatolik', sev: 'error' });
    } finally {
      setExamToDelete(null);
    }
  }

  function handleExamMenuOpen(e, exam) {
    e.stopPropagation();
    setExamAnchorEl(e.currentTarget);
    setMenuExam(exam);
  }

  function handleExamMenuClose() {
    setExamAnchorEl(null);
    setMenuExam(null);
  }

  /* ── auto-refresh when background upload completes ── */
  useEffect(() => {
    const completed = uploads.filter(u => String(u.metadata.groupId) === String(groupId) && u.status === 'completed');
    if (completed.length > 0) {
      // Small delay to ensure DB is updated
      const timer = setTimeout(() => {
        if (subTab === 0) fetchHomeworks();
        if (subTab === 1) fetchVideos();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [uploads, groupId, subTab]);

  async function fetchHomeworks() {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/home-works/group/${groupId}`);
      setHomeworks(res.data?.data || res.data || []);
    } catch (e) {
      console.error('HomeWorks fetch error:', e);
      setHomeworks([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchVideos() {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/videos/group/${groupId}`);
      setVideos(res.data?.data || res.data || []);
    } catch (e) {
      console.error('Videos fetch error:', e);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }

  /* ── delete homework ── */
  async function handleDelete(id) {
    handleMenuClose();
    try {
      await api.delete(`/api/v1/home-works/${id}`);
      setSnackbar({ open: true, msg: "Uyga vazifa o'chirildi", sev: 'success' });
      fetchHomeworks();
    } catch (e) {
      setSnackbar({ open: true, msg: e.response?.data?.message || 'Xatolik', sev: 'error' });
    }
  }

  /* ── delete video ── */
  async function handleDeleteVideo(id) {
    handleVidMenuClose();
    try {
      await api.delete(`/api/v1/videos/${id}`);
      setSnackbar({ open: true, msg: "Video o'chirildi", sev: 'success' });
      fetchVideos();
    } catch (e) {
      setSnackbar({ open: true, msg: e.response?.data?.message || 'Xatolik', sev: 'error' });
    }
  }

  /* ── homework menu handlers ── */
  function handleMenuOpen(e, hw) {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
    setMenuHw(hw);
  }
  function handleMenuClose() {
    setAnchorEl(null);
    setMenuHw(null);
  }

  /* ── video menu handlers ── */
  function handleVidMenuOpen(e, vid) {
    e.stopPropagation();
    setVidAnchorEl(e.currentTarget);
    setMenuVid(vid);
  }
  function handleVidMenuClose() {
    setVidAnchorEl(null);
    setMenuVid(null);
  }

  /* ─────────────────────────────────────────────────────── */
  return (
    <Box>
      {/* ── Sub-tabs row + button ── */}
      {/* Mobilda vertikal, desktopda gorizontal joylashish */}
      <Box sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        mb: 3, gap: 1.5,
      }}>
        {/* Sub-tab bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', mr: 2 }}>
            Guruh darsliklari
          </Typography>
          {/* Mobilda gorizontal scroll bo'lsin */}
          <Tabs
            value={subTab}
            onChange={(_, v) => {
              setSubTab(v);
              navigate(`?tab=1&subTab=${v}`, { replace: true });
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 36,
              '& .MuiTabs-indicator': {
                backgroundColor: '#10b981', height: 2,
              },
              '& .MuiTab-root': {
                textTransform: 'none', fontWeight: 600,
                fontSize: '0.85rem', color: '#6b7280',
                minHeight: 36, minWidth: 0, px: 2, py: 0.5,
              },
              '& .Mui-selected': { color: '#111827 !important' },
            }}
          >
            {SUB_TABS.map((t, i) => (
              <Tab key={i} label={t} />
            ))}
          </Tabs>
        </Box>

        {/* Qo'shish tugmasi */}
        {subTab === 0 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/group/${groupId}/homework/create`)}
            sx={addBtnSx}
          >
            Uyga vazifa qo'shish
          </Button>
        )}
        {subTab === 1 && (
          <Button
            variant="contained"
            onClick={() => setUploadModalOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff', textTransform: 'none', fontWeight: 600,
              borderRadius: '8px', px: 3, py: 0.8,
              boxShadow: 'none',
              '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', boxShadow: 'none' },
            }}
          >
            Qo'shish
          </Button>
        )}
      </Box>

      {/* ══ Tab 0: Uyga vazifa ══════════════════════════════ */}
      {subTab === 0 && (
        loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#10b981' }} />
          </Box>
        ) : (homeworks.length === 0 && uploads.filter(u => String(u.metadata.groupId) === String(groupId) && u.metadata.type === 'homework').length === 0) ? (
          <Paper elevation={0} sx={{
            border: '1px solid #e5e7eb', borderRadius: '16px',
            py: 8, textAlign: 'center',
          }}>
            <Typography sx={{ color: '#9ca3af', fontWeight: 500 }}>
              Hozircha uyga vazifalar mavjud emas
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/group/${groupId}/homework/create`)}
              sx={{
                mt: 2, textTransform: 'none', fontWeight: 600,
                borderColor: '#10b981', color: '#10b981', borderRadius: '10px',
                '&:hover': { borderColor: '#059669', backgroundColor: '#f0fdf4' },
              }}
            >
              Birinchi vazifani qo'shish
            </Button>
          </Paper>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{
            border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden',
          }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell sx={thSx}>#</TableCell>
                  <TableCell sx={thSx}>Mavzu</TableCell>
                  {/* 3 icon columns */}
                  <TableCell sx={{ ...thSx, textAlign: 'center', width: 50 }}>
                    <Tooltip title="O'quvchilar soni"><PersonOutlineIcon sx={{ fontSize: 18, color: '#9ca3af' }} /></Tooltip>
                  </TableCell>
                  <TableCell sx={{ ...thSx, textAlign: 'center', width: 50 }}>
                    <Tooltip title="Kutilmoqda"><AccessTimeIcon sx={{ fontSize: 18, color: '#f59e0b' }} /></Tooltip>
                  </TableCell>
                  <TableCell sx={{ ...thSx, textAlign: 'center', width: 50 }}>
                    <Tooltip title="Bajarildi"><CheckCircleOutlineIcon sx={{ fontSize: 18, color: '#10b981' }} /></Tooltip>
                  </TableCell>
                  <TableCell sx={thSx}>Berilgan vaqt</TableCell>
                  <TableCell sx={thSx}>Tugash vaqti</TableCell>
                  <TableCell sx={thSx}>Dars sanasi</TableCell>
                  <TableCell sx={{ ...thSx, width: 48 }} />
                </TableRow>
              </TableHead>

              <TableBody>
                {/* Homework records list only (uploads moved to Videos tab) */}

                {homeworks.map((hw, idx) => {
                  const createdAt = new Date(hw.created_at);
                  const [datePart1, timePart1] = fmtDateTime(createdAt).split('\n');

                  // Deadline: Created + 24 hours
                  const deadlineDate = new Date(createdAt.getTime() + 86400000);
                  const [datePart2, timePart2] = fmtDateTime(deadlineDate).split('\n');

                  // Lesson Date: From the linked lesson, fallback to created_at if missing
                  const lessonDate = hw.lessons?.date ? fmtDate(hw.lessons.date) : fmtDate(hw.created_at);

                  const stats = hw.stats || { totalStudents: 0, pending: 0, graded: 0 };

                  return (
                    <TableRow
                      key={hw.id}
                      onClick={() => navigate(`/group/${groupId}/homework/${hw.id}`)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f8f7ff' },
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* # */}
                      <TableCell sx={tdSx}>
                        <Typography sx={{ fontWeight: 700, color: '#374151', fontSize: '0.85rem' }}>
                          {idx + 1}
                        </Typography>
                      </TableCell>

                      {/* Mavzu */}
                      <TableCell sx={{ ...tdSx, maxWidth: 340 }}>
                        <Typography sx={{
                          fontWeight: 600, color: '#111827', fontSize: '0.85rem',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {hw.title}
                        </Typography>
                        {hw.lessons?.topic && (
                          <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af', mt: 0.3 }}>
                            {hw.lessons.topic}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Total Students */}
                      <TableCell sx={{ ...tdSx, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 700, color: '#374151', fontSize: '0.85rem' }}>
                          {stats.totalStudents || '—'}
                        </Typography>
                      </TableCell>
                      {/* Pending */}
                      <TableCell sx={{ ...tdSx, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.85rem' }}>
                          {stats.pending || 0}
                        </Typography>
                      </TableCell>
                      {/* Graded/Accepted */}
                      <TableCell sx={{ ...tdSx, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 700, color: '#10b981', fontSize: '0.85rem' }}>
                          {stats.graded || 0}
                        </Typography>
                      </TableCell>

                      {/* Berilgan vaqt */}
                      <TableCell sx={tdSx}>
                        <Typography sx={{ fontSize: '0.82rem', color: '#374151', fontWeight: 500 }}>
                          {datePart1}
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                          {timePart1}
                        </Typography>
                      </TableCell>

                      {/* Tugash vaqti */}
                      <TableCell sx={tdSx}>
                        <Typography sx={{ fontSize: '0.82rem', color: '#374151', fontWeight: 500 }}>
                          {datePart2}
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                          {timePart2}
                        </Typography>
                      </TableCell>

                      {/* Dars sanasi */}
                      <TableCell sx={tdSx}>
                        <Typography sx={{ fontSize: '0.82rem', color: '#374151', fontWeight: 500 }}>
                          {lessonDate}
                        </Typography>
                      </TableCell>

                      {/* Actions menu */}
                      <TableCell sx={{ ...tdSx, textAlign: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, hw); }}
                          sx={{ color: '#9ca3af', '&:hover': { color: '#374151' } }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                      {/* Clickable arrow */}
                      <TableCell sx={{ ...tdSx, textAlign: 'right', width: 32, pr: 2 }}>
                        <Typography sx={{ color: '#d1d5db', fontSize: '1.1rem', fontWeight: 300 }}>›</Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {/* ══ Tab 1: Videolar ════════════════════════════════ */}
      {subTab === 1 && (
        loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#10b981' }} />
          </Box>
        ) : (videos.length === 0 && uploads.filter(u => String(u.metadata.groupId) === String(groupId) && u.metadata.type === 'video').length === 0) ? (
          <Paper elevation={0} sx={emptyPaperSx}>
            <Typography sx={{ color: '#9ca3af', fontWeight: 500 }}>
              Hozircha videolar mavjud emas
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setUploadModalOpen(true)}
              sx={emptyBtnSx}
            >
              Birinchi videoni qo'shish
            </Button>
          </Paper>
        ) : (
          <>
          {/* Desktop jadval — mobilda yashiriladi */}
          <TableContainer component={Paper} elevation={0} sx={{
            border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden',
            display: { xs: 'none', md: 'block' },
          }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell sx={thSx}>Video nomi</TableCell>
                  <TableCell sx={thSx}>Dars nomi</TableCell>
                  <TableCell sx={thSx}>Status</TableCell>
                  <TableCell sx={thSx}>Dars sanasi</TableCell>
                  <TableCell sx={thSx}>Hajmi</TableCell>
                  <TableCell sx={thSx}>Qo'shilgan vaqti</TableCell>
                  <TableCell sx={{ ...thSx, width: 80, textAlign: 'center' }}>Harakatlar</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {/* Background Uploads in progress */}
                {uploads
                  .filter(u => String(u.metadata.groupId) === String(groupId) && u.metadata.type === 'video' && u.status !== 'completed')
                  .map(u => (
                    <TableRow key={u.id} sx={{ backgroundColor: u.status === 'error' ? '#fef2f2' : '#eff6ff' }}>
                      <TableCell sx={{ ...tdSx, color: u.status === 'error' ? '#991b1b' : '#3b82f6', fontWeight: 600 }}>
                        {u.metadata.title}
                      </TableCell>
                      <TableCell sx={tdSx}>{u.metadata.lessonTopic || '—'}</TableCell>
                      <TableCell sx={tdSx}>
                        {u.status === 'error' ? (
                          <Chip label="Xato" size="small" sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700, color: '#fff', background: '#ef4444' }} />
                        ) : (
                          <Chip
                            label={`Yuklanyapti ${u.progress || 0}%`}
                            size="small"
                            variant="outlined"
                            sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700, color: '#3b82f6', borderColor: '#3b82f6', background: '#eff6ff' }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={tdSx}>—</TableCell>
                      <TableCell sx={tdSx}>—</TableCell>
                      <TableCell sx={tdSx}>Bugun</TableCell>
                      <TableCell sx={{ ...tdSx, textAlign: 'center' }}>
                        {u.status === 'error' ? (
                          <Button size="small" color="error" sx={{ fontSize: '0.65rem' }} onClick={() => setUploads(prev => prev.filter(x => x.id !== u.id))}>Tozalash</Button>
                        ) : (
                          <IconButton size="small" sx={{ color: '#ef4444' }} onClick={() => setUploads(prev => prev.filter(x => x.id !== u.id))}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                }

                {/* Finished videos */}
                {videos.map((vid) => (
                  <TableRow
                    key={vid.id}
                    onClick={() => setPreviewVid(vid)}
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f9fafb' } }}
                  >
                    <TableCell sx={{ ...tdSx }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PlayCircleIcon sx={{ fontSize: 20, color: '#10b981', flexShrink: 0 }} />
                        <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '0.85rem' }}>
                          {vid.title}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={tdSx}>{vid.lessons?.topic || '—'}</TableCell>
                    <TableCell sx={tdSx}>
                      <Chip label="Tayyor" size="small" sx={{ background: '#f0fdf4', color: '#10b981', fontWeight: 700, height: 24, fontSize: '0.75rem' }} />
                    </TableCell>
                    <TableCell sx={tdSx}>{fmtDate(vid.lessons?.date || vid.created_at)}</TableCell>
                    <TableCell sx={tdSx}>{fmtFileSize(vid.file_size)}</TableCell>
                    <TableCell sx={tdSx}>{fmtDate(vid.created_at)}</TableCell>
                    <TableCell sx={{ ...tdSx, textAlign: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleVidMenuOpen(e, vid)}
                        sx={{ color: '#9ca3af', '&:hover': { color: '#374151' } }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobil karta ko'rinishi — faqat xs va sm ekranlarda ko'rsatiladi */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {/* Yuklanayotgan videolar */}
            {uploads
              .filter(u => String(u.metadata.groupId) === String(groupId) && u.metadata.type === 'video' && u.status !== 'completed')
              .map(u => (
                <Paper key={u.id} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '12px', p: 2, backgroundColor: u.status === 'error' ? '#fef2f2' : '#eff6ff' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: u.status === 'error' ? '#991b1b' : '#3b82f6' }}>
                      {u.metadata.title}
                    </Typography>
                    <Chip
                      label={u.status === 'error' ? 'Xato' : `${u.progress || 0}%`}
                      size="small"
                      sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700,
                        color: u.status === 'error' ? '#fff' : '#3b82f6',
                        background: u.status === 'error' ? '#ef4444' : '#eff6ff',
                        border: u.status === 'error' ? 'none' : '1px solid #3b82f6'
                      }}
                    />
                  </Box>
                </Paper>
              ))
            }
            {/* Yuklangan videolar */}
            {videos.map((vid) => (
              <Paper
                key={vid.id}
                elevation={0}
                onClick={() => setPreviewVid(vid)}
                sx={{ border: '1px solid #e5e7eb', borderRadius: '12px', p: 2, cursor: 'pointer', '&:hover': { backgroundColor: '#f9fafb' } }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <PlayCircleIcon sx={{ fontSize: 28, color: '#10b981', flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {vid.title}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {vid.lessons?.topic || '—'}
                    </Typography>
                  </Box>
                  <Chip label="Tayyor" size="small" sx={{ background: '#f0fdf4', color: '#10b981', fontWeight: 700, height: 24, fontSize: '0.72rem', flexShrink: 0 }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    {fmtDate(vid.created_at)} · {fmtFileSize(vid.file_size)}
                  </Typography>
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleVidMenuOpen(e, vid); }} sx={{ color: '#9ca3af' }}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            ))}
          </Box>
          </>
        )
      )}


      {/* ══ Tab 2: Imtihonlar ══════════════════════════════ */}
      {subTab === 2 && (
        <Box sx={{ animation: 'fadeIn 0.3s ease-out' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateExamModalOpen(true)}
              sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' }, textTransform: 'none', borderRadius: '10px', px: 3, fontWeight: 600 }}
            >
              Yangi imtihon
            </Button>
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress sx={{ color: '#10b981' }} />
            </Box>
          ) : exams.length === 0 ? (
            <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', py: 8, textAlign: 'center' }}>
              <Typography sx={{ color: '#9ca3af', fontWeight: 500 }}>
                Imtihonlar ro'yxati bo'sh
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                    <TableCell sx={thSx}>#</TableCell>
                    <TableCell sx={thSx}>Mavzu</TableCell>
                    <TableCell sx={{ ...thSx, textAlign: 'center' }}><PersonOutlineIcon sx={{ fontSize: 18 }} /></TableCell>
                    <TableCell sx={{ ...thSx, textAlign: 'center' }}><CloseIcon sx={{ fontSize: 18, color: '#ef4444' }} /></TableCell>
                    <TableCell sx={thSx}>Status</TableCell>
                    <TableCell sx={thSx}>Dars vaqti</TableCell>
                    <TableCell sx={thSx}>Berilgan vaqt</TableCell>
                    <TableCell sx={thSx}>E'lon qilingan vaqti</TableCell>
                    <TableCell sx={thSx}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exams.map((ex, idx) => {
                    const isEnded = ex.end_date && new Date(ex.end_date) < new Date();
                    return (
                      <TableRow
                        key={ex.id}
                        onClick={() => navigate(`/group/${groupId}/exam/${ex.id}`)}
                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f8f7ff' }, borderBottom: '1px solid #f3f4f6' }}
                      >
                        <TableCell sx={tdSx}>{exams.length - idx}</TableCell>
                        <TableCell sx={{ ...tdSx, fontWeight: 600, color: '#3b82f6' }}>{ex.title}</TableCell>
                        <TableCell sx={{ ...tdSx, textAlign: 'center' }}>{ex._count?.examAnswers || 0}</TableCell>
                        <TableCell sx={{ ...tdSx, textAlign: 'center' }}>0</TableCell>
                        <TableCell sx={tdSx}>
                          <Chip label={isEnded ? "Tugagan" : "Jarayonda"} size="small" sx={{ borderRadius: '8px', backgroundColor: '#f3f4f6', color: '#6b7280', fontWeight: 600 }} />
                        </TableCell>
                        <TableCell sx={tdSx}>{fmtDateTime(ex.start_date)}</TableCell>
                        <TableCell sx={tdSx}>{fmtDateTime(ex.created_at)}</TableCell>
                        <TableCell sx={tdSx}>{fmtDateTime(ex.published_at)}</TableCell>
                        <TableCell sx={tdSx}>
                          <IconButton
                            size="small"
                            onClick={(e) => handleExamMenuOpen(e, ex)}
                            sx={{ color: '#9ca3af', '&:hover': { color: '#374151' } }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Create Exam Modal */}
          <Dialog open={createExamModalOpen} onClose={() => { setCreateExamModalOpen(false); setEditingExamId(null); setExamForm({ title: '', description: '', start_date: '', end_date: '' }); setFile(null); }} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '16px', padding: 1 } }}>
            <DialogTitle sx={{ fontWeight: 800, fontSize: '1.2rem', pb: 1 }}>{editingExamId ? "Imtihonni tahrirlash" : "Yangi imtihon e'lon qilish"}</DialogTitle>
            <DialogContent>
              <form onSubmit={handleCreateExam}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>Mavzu *</Typography>
                    <input required value={examForm.title} onChange={e=>setExamForm({...examForm, title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.95rem' }} placeholder="Masalan: Examination" />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>Boshlanish vaqti</Typography>
                      <input type="datetime-local" value={examForm.start_date} onChange={e=>setExamForm({...examForm, start_date: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.95rem' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>Tugash vaqti</Typography>
                      <input type="datetime-local" value={examForm.end_date} onChange={e=>setExamForm({...examForm, end_date: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.95rem' }} />
                    </Box>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>Imtihon shartlari (Izoh)</Typography>
                    <textarea rows={4} value={examForm.description} onChange={e=>setExamForm({...examForm, description: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', outline: 'none', resize: 'vertical', fontSize: '0.95rem' }} placeholder="Linklar va vazifalar..." />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>Fayl yuklash (Zarur bo'lsa)</Typography>
                    <Box
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        border: '1px dashed #d1d5db', borderRadius: '10px', p: 1.5,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
                        cursor: 'pointer', '&:hover': { borderColor: '#10b981', background: '#f9fafb' }
                      }}
                    >
                      <input type="file" hidden ref={fileInputRef} onChange={e => setFile(e.target.files[0])} />
                      <Typography sx={{ fontSize: '0.85rem', color: '#9ca3af' }}>{file ? file.name : "Faylni yuklash uchun bosing..."}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
                    <Button onClick={() => { setCreateExamModalOpen(false); setEditingExamId(null); setExamForm({ title: '', description: '', start_date: '', end_date: '' }); setFile(null); }} sx={{ color: '#6b7280', textTransform: 'none', fontWeight: 600 }}>Bekor qilish</Button>
                    <Button type="submit" variant="contained" sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' }, textTransform: 'none', borderRadius: '10px', px: 3, fontWeight: 600 }}>{editingExamId ? "Saqlash" : "Yaratish"}</Button>
                  </Box>
                </Box>
              </form>
            </DialogContent>
          </Dialog>
        </Box>
      )}

      {/* ══ Tab 3: Jurnal ══════════════════════════════════ */}
      {subTab === 3 && <EmptyTab label="Jurnal" />}

      {/* ── Video Preview Modal ── */}
      {/* Video preview — mobilda to'liq ekran, desktopda modal */}
      <Dialog
        open={Boolean(previewVid)}
        onClose={() => setPreviewVid(null)}
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : '25px',
            backgroundColor: '#ffffff',
            maxWidth: isMobile ? '100%' : '550px',
            overflow: 'hidden',
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '1.05rem', color: '#111827' }}>
            {previewVid?.lessons?.topic || previewVid?.title}
          </Typography>
          <IconButton onClick={() => setPreviewVid(null)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ px: 2, pb: 2 }}>
          <Box sx={{
            width: '100%',
            borderRadius: '9px',
            overflow: 'hidden',
            backgroundColor: '#000',
            aspectRatio: '16/9',
          }}>
            {previewVid && (
              <Box
                component="video"
                src={getFullVideoUrl(previewVid.video_url)}
                controls
                autoPlay={false}
                sx={{ width: '100%', height: '100%', display: 'block' }}
              />
            )}
          </Box>
        </Box>
      </Dialog>

      {/* ── Video Upload Modal ── */}
      <Dialog
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        <CreateVideo groupId={groupId} onClose={() => setUploadModalOpen(false)} />
      </Dialog>

      {/* ── Homework Context menu ── */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: '12px', minWidth: 160, py: 0.5 },
        }}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate(`/group/${groupId}/homework/edit/${menuHw?.id}`);
          }}
          sx={{ gap: 1.5, fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}
        >
          <EditOutlinedIcon fontSize="small" sx={{ color: '#6b7280' }} />
          Tahrirlash
        </MenuItem>
        <MenuItem
          onClick={() => handleDelete(menuHw?.id)}
          sx={{ gap: 1.5, fontSize: '0.85rem', fontWeight: 600, color: '#ef4444' }}
        >
          <DeleteOutlineIcon fontSize="small" />
          O'chirish
        </MenuItem>
      </Menu>

      {/* ── Video Context menu ── */}
      <Menu
        anchorEl={vidAnchorEl}
        open={Boolean(vidAnchorEl)}
        onClose={handleVidMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: '12px', minWidth: 160, py: 0.5 },
        }}
      >
        <MenuItem
          onClick={() => { handleVidMenuClose(); setPreviewVid(menuVid); }}
          sx={{ gap: 1.5, fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}
        >
          <PlayCircleIcon fontSize="small" sx={{ color: '#10b981' }} />
          Ko'rish
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteVideo(menuVid?.id)}
          sx={{ gap: 1.5, fontSize: '0.85rem', fontWeight: 600, color: '#ef4444' }}
        >
          <DeleteOutlineIcon fontSize="small" />
          O'chirish
        </MenuItem>
      </Menu>

      {/* ── Exam Context menu ── */}
      <Menu
        anchorEl={examAnchorEl}
        open={Boolean(examAnchorEl)}
        onClose={handleExamMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: '12px', minWidth: 160, py: 0.5 },
        }}
      >
        <MenuItem
          onClick={() => {
            handleExamMenuClose();
            setEditingExamId(menuExam?.id);
            setExamForm({
              title: menuExam?.title || '',
              description: menuExam?.description || '',
              start_date: menuExam?.start_date ? menuExam.start_date.substring(0, 16) : '',
              end_date: menuExam?.end_date ? menuExam.end_date.substring(0, 16) : '',
            });
            setCreateExamModalOpen(true);
          }}
          sx={{ gap: 1.5, fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}
        >
          <EditOutlinedIcon fontSize="small" sx={{ color: '#6b7280' }} />
          Tahrirlash
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteExam(menuExam?.id)}
          sx={{ gap: 1.5, fontSize: '0.85rem', fontWeight: 600, color: '#ef4444' }}
        >
          <DeleteOutlineIcon fontSize="small" />
          O'chirish
        </MenuItem>
      </Menu>

      {/* ── Beautiful Delete Confirmation Dialog ── */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        fullWidth
        maxWidth={false}
        PaperProps={{
          style: {
            borderRadius: '16px',
            padding: '24px 20px',
            width: '320px',
            maxWidth: '95%',
            marginLeft: 'auto',
            marginRight: 'auto',
            border: '1px solid #f3f4f6',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.08), 0 10px 10px -5px rgba(0,0,0,0.03)'
          }
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          {/* Warning Icon Container */}
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#fef2f2',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2
          }}>
            <DeleteOutlineIcon sx={{ fontSize: 24 }} />
          </Box>

          <Typography sx={{ fontWeight: 800, color: '#111827', mb: 1, fontSize: '1rem' }}>
            Imtihonni o'chirish
          </Typography>

          <Typography sx={{ fontSize: '0.78rem', color: '#4b5563', px: 0.5, mb: 3, lineHeight: 1.5 }}>
            Ushbu imtihonni o'chirmoqchimisiz? Loyihaga bog'liq barcha talabalar baholari va natijalari butunlay o'chib ketadi.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Button
              onClick={() => setDeleteConfirmOpen(false)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                flex: 1,
                py: 1,
                borderRadius: '8px',
                border: '1.5px solid #e5e7eb',
                color: '#374151',
                fontSize: '0.78rem',
                '&:hover': { background: '#f9fafb', borderColor: '#d1d5db' }
              }}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={() => {
                setDeleteConfirmOpen(false);
                confirmDeleteExam(examToDelete);
              }}
              variant="contained"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                flex: 1,
                py: 1,
                borderRadius: '8px',
                backgroundColor: '#ef4444',
                boxShadow: 'none',
                fontSize: '0.78rem',
                '&:hover': {
                  backgroundColor: '#dc2626',
                  boxShadow: 'none'
                }
              }}
            >
              O'chirish
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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

/* ── Helper: empty placeholder tab ── */
function EmptyTab({ label }) {
  return (
    <Paper elevation={0} sx={{
      border: '1px solid #e5e7eb', borderRadius: '16px',
      py: 8, textAlign: 'center',
    }}>
      <Typography sx={{ color: '#9ca3af', fontWeight: 500 }}>
        {label} bo'limi hozircha mavjud emas
      </Typography>
    </Paper>
  );
}

/* ── Table style helpers ── */
const thSx = {
  fontWeight: 700, fontSize: '0.8rem', color: '#6b7280',
  py: 1.5, px: 2, borderBottom: '1px solid #e5e7eb',
  whiteSpace: 'nowrap',
};
const tdSx = {
  py: 1.5, px: 2, borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle',
};

const addBtnSx = {
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  color: '#fff', textTransform: 'none', fontWeight: 700,
  borderRadius: '10px', px: 2.5, py: 1,
  boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
  '&:hover': {
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    boxShadow: '0 6px 18px rgba(16,185,129,0.45)',
  },
};

const emptyPaperSx = {
  border: '1px solid #e5e7eb', borderRadius: '16px',
  py: 8, textAlign: 'center',
};

const emptyBtnSx = {
  mt: 2, textTransform: 'none', fontWeight: 600,
  borderColor: '#10b981', color: '#10b981', borderRadius: '10px',
  '&:hover': { borderColor: '#059669', backgroundColor: '#f0fdf4' },
};
