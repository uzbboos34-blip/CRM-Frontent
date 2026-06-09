import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, MenuItem, Select, FormControl, IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../api/axios';

// Uy vazifasi holati config
const HW_STATUS = {
  ACCEPTED: { label: 'Qabul qilingan', bg: '#16a34a', color: '#fff' },
  RETURNED:  { label: 'Qaytarilgan',   bg: '#f97316', color: '#fff' },
  NOT_DONE:  { label: 'Bajarilmagan',  bg: '#ef4444', color: '#fff' },
  PENDING:   { label: 'Kutayotganlar', bg: '#6366f1', color: '#fff' },
  NONE:      { label: 'Berilmagan',    bg: '#6b7280', color: '#fff' },
  NO_HW:     { label: 'Berilmagan',    bg: '#6b7280', color: '#fff' },
};

const STATUS_OPTIONS = [
  { value: 'ALL',      label: 'Barchasi' },
  { value: 'ACCEPTED', label: 'Qabul qilingan' },
  { value: 'NONE',     label: 'Berilmagan' },
  { value: 'RETURNED', label: 'Qaytarilgan' },
  { value: 'NOT_DONE', label: 'Bajarilmagan' },
  { value: 'PENDING',  label: 'Kutayotganlar' },
];

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = [
    'yanvar','fevral','mart','aprel','may','iyun',
    'iyul','avgust','sentabr','oktabr','noyabr','dekabr'
  ];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}-yil ${d.getDate()}-${months[d.getMonth()]}, soat ${hh}:${mm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = [
    'yanvar','fevral','mart','aprel','may','iyun',
    'iyul','avgust','sentabr','oktabr','noyabr','dekabr'
  ];
  return `${d.getFullYear()}-yil ${d.getDate()}-${months[d.getMonth()]}`;
}

function HwBadge({ statusKey }) {
  const cfg = HW_STATUS[statusKey] || HW_STATUS.NONE;
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center',
      px: 1.5, py: 0.35, borderRadius: '6px',
      backgroundColor: cfg.bg,
    }}>
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: cfg.color, whiteSpace: 'nowrap' }}>
        {cfg.label}
      </Typography>
    </Box>
  );
}

export default function StudentGroupLessons() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    api.get(`/api/v1/students/my/groups/${groupId}/lessons`)
      .then(res => setLessons(res.data?.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [groupId]);

  // Har bir dars uchun uy vazifasi holati aniqlash
  function getHwInfo(lesson) {
    const hw = lesson.homeWorks?.[0];
    if (!hw) return { statusKey: 'NO_HW', submittedAt: null };
    const answer = hw.homeWorkAnswers?.[0];
    if (!answer) return { statusKey: 'NONE', submittedAt: null };
    return {
      statusKey: answer.homeworkStatus || 'PENDING',
      submittedAt: answer.updated_at || answer.created_at,
    };
  }

  // Filter
  const filtered = lessons.filter(lesson => {
    if (filter === 'ALL') return true;
    const { statusKey } = getHwInfo(lesson);
    if (filter === 'NONE') return statusKey === 'NONE' || statusKey === 'NO_HW';
    return statusKey === filter;
  });

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Sarlavha */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <IconButton
          size="small"
          onClick={() => navigate('/student/groups')}
          sx={{
            backgroundColor: '#f3f4f6',
            '&:hover': { backgroundColor: '#e5e7eb' },
            borderRadius: '8px',
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 18, color: '#374151' }} />
        </IconButton>
        <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
          Darslar
        </Typography>
      </Box>

      {/* Filter */}
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', mb: 0.8 }}>
          Uy vazifasi statusi
        </Typography>
        <FormControl size="small">
          <Select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            sx={{
              minWidth: 180,
              backgroundColor: '#fff',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: 600,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#c5a059' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#c5a059' },
            }}
          >
            {STATUS_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {opt.value !== 'ALL' && (
                    <Box sx={{
                      width: 10, height: 10, borderRadius: '50%',
                      backgroundColor: HW_STATUS[opt.value]?.bg || '#6b7280',
                      flexShrink: 0,
                    }} />
                  )}
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 600 }}>{opt.label}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Jadval */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: '#c5a059' }} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <Typography sx={{ color: '#9ca3af', fontWeight: 600 }}>Darslar mavjud emas</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.83rem', py: 1.3, px: 2 }}>Mavzular</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.83rem', py: 1.3, px: 2 }}>Video</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.83rem', py: 1.3, px: 2 }}>Uyga vazifa Holati</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.83rem', py: 1.3, px: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Uyga vazifa tugash vaqti
                    <Box component="span" sx={{ fontSize: '0.7rem', color: '#9ca3af' }}>↓</Box>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.83rem', py: 1.3, px: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Dars sanasi
                    <Box component="span" sx={{ fontSize: '0.7rem', color: '#c5a059' }}>↑</Box>
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((lesson, idx) => {
                const { statusKey, submittedAt } = getHwInfo(lesson);
                const videoCount = lesson._count?.videos ?? 0;

                return (
                  <TableRow
                    key={lesson.id}
                    sx={{
                      '&:hover': { backgroundColor: '#fdf8f0' },
                      '& td': { borderBottom: idx === filtered.length - 1 ? 'none' : '1px solid #f3f4f6' },
                      transition: 'background 0.12s',
                    }}
                  >
                    {/* Mavzu */}
                    <TableCell sx={{ py: 1.3, px: 2, maxWidth: 260 }}>
                      <Typography sx={{
                        fontSize: '0.88rem', fontWeight: 500, color: '#111827',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {lesson.topic || lesson.description || `Dars #${idx + 1}`}
                      </Typography>
                    </TableCell>

                    {/* Video soni */}
                    <TableCell sx={{ py: 1.3, px: 2 }}>
                      <Box sx={{
                        width: 28, height: 28, borderRadius: '50%',
                        border: '1.5px solid #c5a059',
                        color: '#c5a059', fontSize: '0.78rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: videoCount > 0 ? 'pointer' : 'default',
                      }}>
                        {videoCount}
                      </Box>
                    </TableCell>

                    {/* Uy vazifasi holati */}
                    <TableCell sx={{ py: 1.3, px: 2 }}>
                      <HwBadge statusKey={statusKey} />
                    </TableCell>

                    {/* Yuborilgan vaqt */}
                    <TableCell sx={{ py: 1.3, px: 2, fontSize: '0.83rem', color: '#4b5563', whiteSpace: 'nowrap' }}>
                      {statusKey !== 'NO_HW' && statusKey !== 'NONE' ? formatDateTime(submittedAt) : '—'}
                    </TableCell>

                    {/* Dars sanasi */}
                    <TableCell sx={{ py: 1.3, px: 2, fontSize: '0.83rem', color: '#4b5563', whiteSpace: 'nowrap' }}>
                      {formatDate(lesson.date)}
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
