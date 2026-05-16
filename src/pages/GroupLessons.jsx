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
import { Pause, PlayArrow } from '@mui/icons-material';

const AddIcon = Add;
const PersonOutlineIcon = PersonOutlined;
const AccessTimeIcon = AccessTime;
const CheckCircleOutlineIcon = CheckCircleOutlined;
const MoreVertIcon = MoreVert;
const DeleteOutlineIcon = DeleteOutlined;
const EditOutlinedIcon = EditOutlined;
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
  const { uploads, setUploads } = useUploads();

  const [subTab, setSubTab]       = useState(0);
  const [homeworks, setHomeworks] = useState([]);
  const [videos, setVideos]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [anchorEl, setAnchorEl]   = useState(null);
  const [menuHw, setMenuHw]       = useState(null);
  const [snackbar, setSnackbar]   = useState({ open: false, msg: '', sev: 'success' });

  /* ── read subTab from URL on mount ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('subTab');
    if (sub !== null) {
      setSubTab(parseInt(sub));
    }
  }, []);

  /* ── fetch data based on tab ── */
  useEffect(() => {
    if (!groupId) return;
    if (subTab === 0) fetchHomeworks();
    if (subTab === 1) fetchVideos();
  }, [subTab, groupId]);

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
        ) : (videos.length === 0 && uploads.filter(u => String(u.metadata.groupId) === String(groupId) && u.metadata.type === 'video').length === 0) ? (
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
          <TableContainer component={Paper} elevation={0} sx={{
            border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden',
          }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell sx={thSx}>#</TableCell>
                  <TableCell sx={thSx}>Video nomi</TableCell>
                  <TableCell sx={thSx}>Dars nomi</TableCell>
                  <TableCell sx={thSx}>Holat</TableCell>
                  <TableCell sx={thSx}>Sana</TableCell>
                  <TableCell sx={{ ...thSx, width: 100, textAlign: 'center' }}>Harakatlar</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {/* Background Uploads (Videos & Homework) */}
                {uploads.filter(u => String(u.metadata.groupId) === String(groupId)).map(u => (
                  <TableRow key={u.id} sx={{ backgroundColor: u.status === 'error' ? '#fef2f2' : u.status === 'completed' ? '#f0fdf4' : '#f0fdf4' }}>
                    <TableCell sx={tdSx}>--</TableCell>
                    <TableCell sx={{ ...tdSx, color: u.status === 'error' ? '#991b1b' : '#3b82f6', fontWeight: 600 }}>
                      {u.metadata.title}
                      {u.metadata.type === 'homework' && <Chip label="Vazifa" size="small" sx={{ ml: 1, fontSize: '0.65rem', height: 18 }} />}
                    </TableCell>
                    <TableCell sx={tdSx}>{u.metadata.lessonTopic || '—'}</TableCell>
                    <TableCell sx={tdSx}>
                      {u.status === 'error' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label="Xato" 
                            size="small" 
                            variant="filled"
                            sx={{ height: 24, fontSize: '0.75rem', fontWeight: 700, color: '#fff', background: '#ef4444' }} 
                          />
                          <Typography sx={{ color: '#ef4444', fontSize: '0.7rem' }}>{u.error}</Typography>
                        </Box>
                      ) : u.status === 'completed' ? (
                        <Chip 
                          label="Bajarildi" 
                          size="small" 
                          sx={{ height: 24, fontSize: '0.75rem', fontWeight: 700, color: '#fff', background: '#10b981' }} 
                        />
                      ) : (
                        <Chip 
                          label={`Yuklanyapti ${u.progress}%`} 
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            height: 24, fontSize: '0.75rem', fontWeight: 700,
                            color: '#3b82f6', borderColor: '#3b82f6', background: '#eff6ff'
                          }} 
                        />
                      )}
                    </TableCell>
                    <TableCell sx={tdSx}>{u.status === 'completed' ? 'Bajarildi' : 'Bugun'}</TableCell>
                    <TableCell sx={{ ...tdSx, textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {u.status === 'error' ? (
                          <Button size="small" variant="text" color="error" sx={{ fontSize: '0.65rem', p: 0 }} onClick={() => setUploads(prev => prev.filter(x => x.id !== u.id))}>Tozalash</Button>
                        ) : (
                          <>
                            <IconButton size="small" sx={{ color: '#9ca3af' }}><PauseIcon fontSize="small" /></IconButton>
                            <IconButton size="small" sx={{ color: '#ef4444' }} onClick={() => setUploads(prev => prev.filter(x => x.id !== u.id))}><DeleteOutlineIcon fontSize="small" /></IconButton>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}

                {videos.map((vid, idx) => (
                  <TableRow key={vid.id} sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}>
                    <TableCell sx={tdSx}>{idx + 1}</TableCell>
                    <TableCell 
                      sx={{ ...tdSx, color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => window.open(getFullVideoUrl(vid.video_url), '_blank')}
                    >
                      {vid.title}
                    </TableCell>
                    <TableCell sx={tdSx}>{vid.lessons?.topic || '—'}</TableCell>
                    <TableCell sx={tdSx}>
                      <Chip label="Tayyor" size="small" sx={{ background: '#f0fdf4', color: '#10b981', fontWeight: 600, height: 24, fontSize: '0.75rem' }} />
                    </TableCell>
                    <TableCell sx={tdSx}>{fmtDate(vid.created_at)}</TableCell>
                    <TableCell sx={{ ...tdSx, textAlign: 'center' }}>
                       <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setMenuHw(vid); }}>
                         <MoreVertIcon fontSize="small" />
                       </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
