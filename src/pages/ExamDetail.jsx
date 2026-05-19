import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Box, Typography, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress,
  Avatar, Chip, Button, IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

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
  { key: 'NOT_SUBMITTED', label: 'Topshirmaganlar', color: '#6b7280', icon: <CancelIcon sx={{ fontSize: 16 }} /> },
];

export default function ExamDetail() {
  const { groupId, examId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [examInfo, setExamInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);

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
              component="a"
              href={getFileUrl(examInfo.file)}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              size="small"
              startIcon={<InsertDriveFileIcon />}
              sx={{ textTransform: 'none', borderRadius: '8px', color: '#10b981', borderColor: '#10b981', '&:hover': { borderColor: '#059669', background: '#f0fdf4' } }}
            >
              Faylni yuklab olish
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
                {currentTabKey !== 'NOT_SUBMITTED' && <TableCell sx={thSx}>Yuborilgan fayl</TableCell>}
                {currentTabKey !== 'NOT_SUBMITTED' && <TableCell sx={thSx}>Vaqt</TableCell>}
                {currentTabKey !== 'NOT_SUBMITTED' && <TableCell sx={thSx}>Ball</TableCell>}
                <TableCell sx={{ ...thSx, width: 80 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {currentList.map((item, idx) => (
                  <TableRow 
                    key={item.id} 
                    onClick={() => navigate(`/group/${groupId}/exam/${examId}/student/${item.student_id}`)}
                    sx={{ '&:hover': { backgroundColor: '#f8f7ff' }, borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s', cursor: 'pointer' }}
                  >
                    <TableCell sx={tdSx}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, backgroundColor: avatarColor(idx), fontSize: '0.8rem', fontWeight: 700 }}>
                          {getInitials(item.students?.full_name || '')}
                        </Avatar>
                        <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>
                          {item.students?.full_name || '—'}
                        </Typography>
                      </Box>
                    </TableCell>
                    {currentTabKey !== 'NOT_SUBMITTED' && (
                      <TableCell sx={tdSx}>
                         {item.file ? (
                           <Typography sx={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                             <InsertDriveFileIcon sx={{ fontSize: 16 }} /> Fayl yuklangan
                           </Typography>
                         ) : (
                           <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>
                             {item.title || 'Faylsiz javob'}
                           </Typography>
                         )}
                      </TableCell>
                    )}
                    {currentTabKey !== 'NOT_SUBMITTED' && (
                      <TableCell sx={tdSx}>
                        <Typography sx={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>
                           {fmtDate(item.created_at)}
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
                    <TableCell sx={{ ...tdSx, textAlign: 'right' }}>
                       <IconButton>
                          <ChevronRightIcon sx={{ color: '#6b7280' }} />
                       </IconButton>
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

const thSx = { fontWeight: 700, fontSize: '0.8rem', color: '#6b7280', py: 1.5, px: 2.5, borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' };
const tdSx = { py: 1.8, px: 2.5, borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' };
