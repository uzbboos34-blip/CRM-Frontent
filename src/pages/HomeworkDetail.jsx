import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Box, Typography, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress,
  Avatar, Chip, Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ReplayIcon from '@mui/icons-material/Replay';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

/* ─── Helpers ──────────────────────────────────────────────────────────── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]}, ${dt.getFullYear()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
}

function getInitials(name = '') {
  const p = name.trim().split(' ');
  return p.length >= 2
    ? (p[0][0] + p[1][0]).toUpperCase()
    : (p[0]?.[0] || '?').toUpperCase();
}

const avatarColors = ['#7b61ff','#10b981','#f59e0b','#3b82f6','#ec4899','#ef4444'];
const avatarColor = (i) => avatarColors[i % avatarColors.length];

/* ─── Tab config ───────────────────────────────────────────────────────── */
const TABS = [
  { key: 'kutilayotganlar', label: 'Kutilayotganlar', color: '#f59e0b', icon: <AccessTimeIcon sx={{ fontSize: 16 }} /> },
  { key: 'qaytarilganlar',  label: 'Qaytarilganlar',  color: '#ef4444', icon: <ReplayIcon sx={{ fontSize: 16 }} /> },
  { key: 'qabulQilinganlar',label: 'Qabul qilinganlar',color:'#10b981', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
  { key: 'bajarmaganlar',   label: 'Bajarmaganlar',   color: '#6b7280', icon: <CancelIcon sx={{ fontSize: 16 }} /> },
];

const STATUS_MAP = {
  kutilayotganlar: { label: 'Kutilayapti',      bg: '#fef3c7', color: '#d97706' },
  qaytarilganlar:  { label: 'Qaytarilgan',      bg: '#fee2e2', color: '#dc2626' },
  qabulQilinganlar:{ label: 'Qabul qilingan',   bg: '#d1fae5', color: '#059669' },
  bajarmaganlar:   { label: 'Bajarmaganlar',    bg: '#f3f4f6', color: '#6b7280' },
};

/* ═══════════════════════════════════════════════════════════════════════════
   HomeworkDetail  — shows all student submissions for a homework
   ═══════════════════════════════════════════════════════════════════════════ */
export default function HomeworkDetail() {
  const { groupId, hwId } = useParams();
  const navigate = useNavigate();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/home-works/${hwId}/submissions`);
      setData(res.data?.data || null);
    } catch (e) {
      console.error('HomeworkDetail fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [hwId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const hw = data.homework;
  const stats = data.stats;
  const currentTabKey = TABS[tab].key;
  const currentList = data[currentTabKey] || [];

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-out' }}>

      {/* ── Back button ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/group/${groupId}?tab=1`)}
          sx={{
            textTransform: 'none', fontWeight: 700, color: '#6b7280',
            '&:hover': { color: '#7b61ff', backgroundColor: '#f0eeff' },
            borderRadius: '10px',
          }}
        >
          Orqaga
        </Button>
      </Box>

      {/* ── Homework info card ── */}
      <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', p: 3, mb: 3 }}>
        <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af', mb: 0.5 }}>Mavzu</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#111827', mb: 1 }}>
          {hw.title}
        </Typography>
        {hw.description && (
          <Typography sx={{ fontSize: '0.88rem', color: '#6b7280', mb: 1 }}>
            {hw.description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af' }}>Tugash vaqti:</Typography>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
            {fmtDate(new Date(new Date(hw.created_at).getTime() + 86400000))}
          </Typography>
        </Box>
      </Paper>

      {/* ── Tabs ── */}
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: '2px solid #f3f4f6',
            '& .MuiTabs-indicator': { backgroundColor: '#7b61ff', height: 2 },
            '& .MuiTab-root': {
              textTransform: 'none', fontWeight: 600,
              fontSize: '0.9rem', color: '#9ca3af',
              minWidth: 0, px: 0, mr: 4,
            },
            '& .Mui-selected': { color: '#111827 !important' },
          }}
        >
          {TABS.map((t, i) => {
            const count =
              t.key === 'kutilayotganlar' ? stats.pending :
              t.key === 'qaytarilganlar'  ? stats.returned :
              t.key === 'qabulQilinganlar'? stats.accepted :
              stats.notDone;
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
            {TABS[tab].label} yo'q
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                <TableCell sx={thSx}>O'quvchi ismi</TableCell>
                <TableCell sx={thSx}>
                  {currentTabKey === 'kutilayotganlar' ? 'Uyga vazifa jo\'natilgan vaqt' :
                   currentTabKey === 'bajarmaganlar'   ? 'Holat' :
                   'Ball / Holat'}
                </TableCell>
                <TableCell sx={{ ...thSx, width: 80 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {currentList.map((item, idx) => {
                const st = STATUS_MAP[currentTabKey];
                return (
                  <TableRow
                    key={item.student?.id || idx}
                    onClick={() => navigate(`/group/${groupId}/homework/${hwId}/student/${item.student?.id}`)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f8f7ff' },
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Student name */}
                    <TableCell sx={tdSx}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 36, height: 36,
                            backgroundColor: avatarColor(idx),
                            fontSize: '0.8rem', fontWeight: 700,
                          }}
                        >
                          {getInitials(item.student?.full_name || '')}
                        </Avatar>
                        <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>
                          {item.student?.full_name || '—'}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Status / time */}
                    <TableCell sx={tdSx}>
                      {currentTabKey === 'bajarmaganlar' ? (
                        <Chip
                          label="Bajarmaganlar"
                          size="small"
                          sx={{ backgroundColor: st.bg, color: st.color, fontWeight: 700, fontSize: '0.78rem', height: 26 }}
                        />
                      ) : currentTabKey === 'kutilayotganlar' ? (
                        <Typography sx={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>
                          {fmtDate(item.submitted_at)}
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography sx={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>
                            {fmtDate(item.submitted_at)}
                          </Typography>
                          <Chip
                            label={`${item.result?.grade ?? '—'} ball`}
                            size="small"
                            sx={{ backgroundColor: st.bg, color: st.color, fontWeight: 700, fontSize: '0.78rem', height: 26 }}
                          />
                        </Box>
                      )}
                    </TableCell>

                    {/* Arrow */}
                    <TableCell sx={{ ...tdSx, textAlign: 'right' }}>
                      <Typography sx={{ color: '#d1d5db', fontSize: '1rem' }}>›</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

/* ─── Table styles ── */
const thSx = {
  fontWeight: 700, fontSize: '0.8rem', color: '#6b7280',
  py: 1.5, px: 2.5, borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap',
};
const tdSx = {
  py: 1.8, px: 2.5, borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle',
};
