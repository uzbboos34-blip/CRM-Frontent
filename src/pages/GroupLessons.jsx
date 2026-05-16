import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Box, Typography, Button, Tab, Tabs, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  CircularProgress, Chip, IconButton, Tooltip, Menu, MenuItem,
  Snackbar, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

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

/* ─── Sub-tab labels ─────────────────────────────────────── */
const SUB_TABS = ['Uyga vazifa', 'Videolar', 'Imtihonlar', 'Jurnal'];

/* ════════════════════════════════════════════════════════════
   GroupLessons  — props: { groupId }
   ════════════════════════════════════════════════════════════ */
export default function GroupLessons({ groupId }) {
  const navigate = useNavigate();

  const [subTab, setSubTab]       = useState(0);
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [anchorEl, setAnchorEl]   = useState(null);
  const [menuHw, setMenuHw]       = useState(null);
  const [snackbar, setSnackbar]   = useState({ open: false, msg: '', sev: 'success' });

  /* ── fetch homeworks for this group ── */
  useEffect(() => {
    if (subTab === 0 && groupId) fetchHomeworks();
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

        {/* Uyga vazifa qo'shish — faqat 0-tab */}
        {subTab === 0 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/group/${groupId}/homework/create`)}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff', textTransform: 'none', fontWeight: 700,
              borderRadius: '10px', px: 2.5, py: 1,
              boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                boxShadow: '0 6px 18px rgba(16,185,129,0.45)',
              },
            }}
          >
            Uyga vazifa qo'shish
          </Button>
        )}
      </Box>

      {/* ══ Tab 0: Uyga vazifa ══════════════════════════════ */}
      {subTab === 0 && (
        loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#10b981' }} />
          </Box>
        ) : homeworks.length === 0 ? (
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
                {homeworks.map((hw, idx) => {
                  const [datePart1, timePart1] = fmtDateTime(hw.created_at).split('\n');
                  // Tugash vaqti: lesson.date + 24h (default)
                  const endDate = hw.lessons?.date
                    ? new Date(new Date(hw.lessons.date).getTime() + 86400000)
                    : null;
                  const [datePart2, timePart2] = fmtDateTime(endDate).split('\n');
                  const lessonDate = fmtDate(hw.lessons?.date);

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

                      {/* Students count (static placeholder) */}
                      <TableCell sx={{ ...tdSx, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 700, color: '#374151', fontSize: '0.85rem' }}>
                          —
                        </Typography>
                      </TableCell>
                      {/* Pending */}
                      <TableCell sx={{ ...tdSx, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.85rem' }}>
                          0
                        </Typography>
                      </TableCell>
                      {/* Done */}
                      <TableCell sx={{ ...tdSx, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 700, color: '#10b981', fontSize: '0.85rem' }}>
                          0
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
      {subTab === 1 && <EmptyTab label="Videolar" />}

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
