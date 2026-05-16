import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Box, Typography, Button, Tab, Tabs, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  CircularProgress, Chip, IconButton, Tooltip, Menu, MenuItem,
  Snackbar, Alert, LinearProgress,
} from '@mui/material';
import { useUploads } from '../context/UploadContext';
import Add from '@mui/icons-material/Add';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import AccessTime from '@mui/icons-material/AccessTime';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import MoreVert from '@mui/icons-material/MoreVert';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';

const AddIcon = Add;
const PersonOutlineIcon = PersonOutlined;
const AccessTimeIcon = AccessTime;
const CheckCircleOutlineIcon = CheckCircleOutlined;
const MoreVertIcon = MoreVert;
const DeleteOutlineIcon = DeleteOutlined;
const EditOutlinedIcon = EditOutlined;

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
  const yr  = dt.getFullYear();
  const h   = String(dt.getHours()).padStart(2, '0');
  const m   = String(dt.getMinutes()).padStart(2, '0');
  return `${day} ${mon}, ${yr}\n${h}:${m}`;
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]}, ${dt.getFullYear()}`;
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
  // Prepend backend URL for local files
  return `https://crm-backend-l7jq.onrender.com/file/${url}`;
}

/* ─── Sub-tab labels ─────────────────────────────────────── */
const SUB_TABS = ['Uyga vazifa', 'Videolar', 'Imtihonlar', 'Jurnal'];

/* ════════════════════════════════════════════════════════════
   GroupLessons  — props: { groupId }
   ════════════════════════════════════════════════════════════ */
export default function GroupLessons({ groupId }) {
  const navigate = useNavigate();
  const { uploads } = useUploads();

  const [subTab, setSubTab]       = useState(0);
  const [homeworks, setHomeworks] = useState([]);
  const [videos, setVideos]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [anchorEl, setAnchorEl]   = useState(null);
  const [menuHw, setMenuHw]       = useState(null);
  const [snackbar, setSnackbar]   = useState({ open: false, msg: '', sev: 'success' });

  /* ── fetch data based on tab ── */
  useEffect(() => {
    if (!groupId) return;
    if (subTab === 0) fetchHomeworks();
    if (subTab === 1) fetchVideos();
  }, [subTab, groupId]);

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

  /* ── delete ── */
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

  /* ── menu handlers ── */
  function handleMenuOpen(e, hw) {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
    setMenuHw(hw);
  }
  function handleMenuClose() {
    setAnchorEl(null);
    setMenuHw(null);
  }

  /* ─────────────────────────────────────────────────────── */
  return (
    <Box>
      {/* ── Sub-tabs row + button ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', mb: 3,
      }}>
        {/* Sub-tab bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', mr: 2 }}>
            Guruh darsliklari
          </Typography>
          <Tabs
            value={subTab}
            onChange={(_, v) => setSubTab(v)}
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
            startIcon={<AddIcon />}
            onClick={() => navigate(`/group/${groupId}/video/create`)}
            sx={addBtnSx}
          >
            Video qo'shish
          </Button>
        )}
      </Box>

      {/* ══ Tab 0: Uyga vazifa ══════════════════════════════ */}
      {subTab === 0 && (
        loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#10b981' }} />
          </Box>
        ) : (homeworks.length === 0 && uploads.filter(u => u.metadata.groupId === groupId && u.metadata.type === 'homework').length === 0) ? (
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
                {/* Background Uploads */}
                {uploads.filter(u => u.metadata.groupId === groupId && u.metadata.type === 'homework').map(u => (
                  <TableRow key={u.id} sx={{ backgroundColor: '#f0fdf4' }}>
                    <TableCell sx={tdSx}>--</TableCell>
                    <TableCell sx={tdSx}>
                      <Box sx={{ width: '100%' }}>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#065f46' }}>
                          {u.metadata.title} (Yuklanmoqda {u.progress}%)
                        </Typography>
                        <LinearProgress 
                          variant="buffer" 
                          value={u.progress} 
                          valueBuffer={u.buffer} 
                          sx={{ height: 6, borderRadius: 3, mt: 0.5, backgroundColor: '#d1fae5', '& .MuiLinearProgress-bar': { backgroundColor: '#10b981' } }} 
                        />
                      </Box>
                    </TableCell>
                    <TableCell colSpan={6} sx={tdSx}>
                      {u.status === 'error' ? (
                        <Typography sx={{ color: '#ef4444', fontSize: '0.75rem' }}>Xato: {u.error}</Typography>
                      ) : (
                        <Typography sx={{ color: '#6b7280', fontSize: '0.75rem' }}>Fayl yuklanmoqda, sahifadan chiqib ketmang...</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

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
                      sx={{
                        '&:hover': { backgroundColor: '#fafafa' },
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
                          onClick={(e) => handleMenuOpen(e, hw)}
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
        )
      )}

      {/* ══ Tab 1: Videolar ════════════════════════════════ */}
      {subTab === 1 && (
        loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#10b981' }} />
          </Box>
        ) : (videos.length === 0 && uploads.filter(u => u.metadata.groupId === groupId && u.metadata.type === 'video').length === 0) ? (
          <Paper elevation={0} sx={emptyPaperSx}>
            <Typography sx={{ color: '#9ca3af', fontWeight: 500 }}>
              Hozircha videolar mavjud emas
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/group/${groupId}/video/create`)}
              sx={emptyBtnSx}
            >
              Birinchi videoni qo'shish
            </Button>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 3 }}>
            {/* Background Uploads for Videos */}
            {uploads.filter(u => u.metadata.groupId === groupId && u.metadata.type === 'video').map(u => (
              <Paper key={u.id} sx={{
                borderRadius: '16px', overflow: 'hidden', border: '2px dashed #10b981',
                p: 2, background: '#f0fdf4', display: 'flex', flexDirection: 'column', gap: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CircularProgress size={24} variant="determinate" value={u.progress} sx={{ color: '#10b981' }} />
                  <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{u.metadata.title}</Typography>
                </Box>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>
                    {u.status === 'error' ? 'Xatolik yuz berdi' : `Yuklanmoqda: ${u.progress}%`}
                  </Typography>
                  <LinearProgress 
                    variant="buffer" 
                    value={u.progress} 
                    valueBuffer={u.buffer} 
                    sx={{ height: 6, borderRadius: 3, mt: 0.5, backgroundColor: '#d1fae5', '& .MuiLinearProgress-bar': { backgroundColor: '#10b981' } }} 
                  />
                  {u.status === 'error' && (
                    <Typography sx={{ color: '#ef4444', fontSize: '0.7rem', mt: 0.5 }}>{u.error}</Typography>
                  )}
                </Box>
              </Paper>
            ))}

            {videos.map((vid) => (
              <Paper key={vid.id} sx={{
                borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e7eb',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.08)' }
              }}>
                {/* Video Preview */}
                <Box sx={{ position: 'relative', pt: '56.25%', background: '#000' }}>
                   <Box
                    component="img"
                    src={getYTThumb(vid.video_url)}
                    sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                   />
                   <Box sx={{
                     position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                     width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
                     display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                     '&:hover': { background: '#fff' }
                   }} onClick={() => window.open(getFullVideoUrl(vid.video_url), '_blank')}>
                      <Box sx={{
                        width: 0, height: 0, borderTop: '8px solid transparent',
                        borderBottom: '8px solid transparent', borderLeft: '14px solid #10b981',
                        ml: 0.5
                      }} />
                   </Box>
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem', mb: 0.5, lineHeight: 1.4 }}>
                    {vid.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: '#6b7280', mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {vid.description || 'Izoh yo\'q'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                      {fmtDate(vid.created_at)}
                    </Typography>
                    {vid.lessons && (
                      <Chip label={vid.lessons.topic} size="small" sx={{ height: 20, fontSize: '0.65rem', background: '#f0fdf4', color: '#10b981', fontWeight: 600 }} />
                    )}
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        )
      )}

      {/* ══ Tab 2: Imtihonlar ══════════════════════════════ */}
      {subTab === 2 && <EmptyTab label="Imtihonlar" />}

      {/* ══ Tab 3: Jurnal ══════════════════════════════════ */}
      {subTab === 3 && <EmptyTab label="Jurnal" />}

      {/* ── Context menu ── */}
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
