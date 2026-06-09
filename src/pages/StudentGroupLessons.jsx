import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, MenuItem, Select, FormControl
} from '@mui/material';
import api from '../api/axios';

// Sana formatlash: "2025-yil 10-noyabr"
function formatLessonDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
  ];
  return `${d.getFullYear()}-yil ${d.getDate()}-${months[d.getMonth()]}`;
}

// Uy vazifasi holati config
const HW_STATUS = {
  ACCEPTED: { label: 'Qabul qilingan', bg: '#4caf50', color: '#fff' },
  PENDING: { label: 'Kutayotganlar', bg: '#5c6bc0', color: '#fff' },
  RETURNED: { label: 'Qaytarilgan', bg: '#ffa000', color: '#fff' },
  NOT_DONE: { label: 'Bajarilmagan', bg: '#ff3b30', color: '#fff' },
  NONE: { label: 'Berilmagan', bg: '#78909c', color: '#fff' },
};

const STATUS_OPTIONS = [
  { value: 'ALL',      label: 'Barchasi' },
  { value: 'ACCEPTED', label: 'Qabul qilingan' },
  { value: 'NONE',     label: 'Berilmagan' },
  { value: 'RETURNED', label: 'Qaytarilgan' },
  { value: 'NOT_DONE', label: 'Bajarilmagan' },
  { value: 'PENDING',  label: 'Kutayotganlar' },
];

const DROPDOWN_COLORS = {
  ALL: { bg: '#ffffff', color: '#1a202c', hoverBg: '#f7fafc' },
  ACCEPTED: { bg: '#4caf50', color: '#ffffff', hoverBg: '#45a049' },
  NONE: { bg: '#78909c', color: '#ffffff', hoverBg: '#6b7280' },
  RETURNED: { bg: '#ffa000', color: '#ffffff', hoverBg: '#ff8f00' },
  NOT_DONE: { bg: '#ff3b30', color: '#ffffff', hoverBg: '#ef4444' },
  PENDING: { bg: '#5c6bc0', color: '#ffffff', hoverBg: '#4f5d75' },
};

export default function StudentGroupLessons() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    api.get(`/api/v1/students/my/groups/${groupId}/lessons`)
      .then(res => {
        setLessons(res.data?.data || []);
      })
      .catch(err => {
        console.error('API error while fetching group lessons:', err);
        setLessons([]);
      })
      .finally(() => setLoading(false));
  }, [groupId]);

  // Helper to extract status key from lesson data
  const getHwStatusKey = (lesson) => {
    const hw = lesson.homeWorks?.[0];
    if (!hw) return 'NONE';
    const answer = hw.homeWorkAnswers?.[0];
    if (!answer) return 'NOT_DONE';
    return answer.homeworkStatus || 'PENDING';
  };

  // Filter lessons
  const filtered = lessons.filter(lesson => {
    if (filter === 'ALL') return true;
    return getHwStatusKey(lesson) === filter;
  });

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-out', pt: 0.5, px: 1 }}>
      {/* Title "Uy vazifasi statusi" */}
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', mb: 0.4 }}>
        Uy vazifasi statusi
      </Typography>

      {/* Filter bar */}
      <Box sx={{ mb: 2.2 }}>
        <FormControl size="small">
          <Select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            MenuProps={{
              PaperProps: {
                sx: {
                  borderRadius: '8px',
                  p: 0.5,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }
              }
            }}
            sx={{
              minWidth: 180,
              backgroundColor: '#fff',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#2d3748',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#c5a059' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#c5a059' },
            }}
          >
            {STATUS_OPTIONS.map(opt => {
              const colors = DROPDOWN_COLORS[opt.value] || DROPDOWN_COLORS.ALL;
              return (
                <MenuItem
                  key={opt.value}
                  value={opt.value}
                  sx={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    backgroundColor: colors.bg,
                    color: colors.color,
                    borderRadius: '6px',
                    my: 0.4,
                    mx: 0.6,
                    py: 1,
                    transition: 'all 0.15s',
                    '&:hover': {
                      backgroundColor: colors.hoverBg,
                      opacity: 0.95
                    },
                    '&.Mui-selected': {
                      backgroundColor: colors.hoverBg,
                      color: colors.color,
                      fontWeight: 700,
                      '&:hover': {
                        backgroundColor: colors.hoverBg,
                      }
                    }
                  }}
                >
                  {opt.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>

      {/* Table grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: '#c5a059' }} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <Typography sx={{ color: '#9ca3af', fontWeight: 600 }}>Darslar mavjud emas</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff' }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#ffffff' }}>
              <TableRow sx={{ '& th': { borderBottom: '1.5px solid #e2e8f0' } }}>
                <TableCell sx={{ fontWeight: 700, color: '#2d3748', fontSize: '0.85rem', py: 2.2, px: 3, whiteSpace: 'nowrap' }}>Mavzular</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#2d3748', fontSize: '0.85rem', py: 2.2, px: 3, whiteSpace: 'nowrap' }}>Video</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#2d3748', fontSize: '0.85rem', py: 2.2, px: 3, whiteSpace: 'nowrap' }}>Uyga vazifa Holati</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#2d3748', fontSize: '0.85rem', py: 2.2, px: 3, whiteSpace: 'nowrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
                    Uyga vazifa tugash vaqti
                    <Box component="span" sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a202c', ml: 0.5 }}>↓</Box>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#2d3748', fontSize: '0.85rem', py: 2.2, px: 3, whiteSpace: 'nowrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
                    Dars sanasi
                    <Box component="span" sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#38a169', ml: 0.5 }}>↑</Box>
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((lesson, idx) => {
                const videoCount = lesson._count?.videos ?? 0;
                const statusKey = getHwStatusKey(lesson);

                return (
                  <TableRow
                    key={lesson.id}
                    onClick={() => navigate(`/student/groups/${groupId}/lessons/${lesson.id}`)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#fdf8f0' },
                      '& td': { borderBottom: idx === filtered.length - 1 ? 'none' : '1px solid #e2e8f0' },
                      transition: 'background 0.12s',
                    }}
                  >
                    {/* Mavzu */}
                    <TableCell sx={{ py: 2, px: 3 }}>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#2d3748', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                        {lesson.topic || lesson.description || `Dars #${idx + 1}`}
                      </Typography>
                    </TableCell>

                    {/* Video count circle blue badge */}
                    <TableCell sx={{ py: 2, px: 3 }}>
                      <Box sx={{
                        width: 24, height: 24, borderRadius: '50%',
                        border: '1.5px solid #2196f3',
                        color: '#2196f3', fontSize: '0.8rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {videoCount}
                      </Box>
                    </TableCell>

                    {/* Status Pill Badge */}
                    <TableCell sx={{ py: 2, px: 3, whiteSpace: 'nowrap' }}>
                      <Box sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        px: 2, py: 0.5,
                        borderRadius: '20px',
                        backgroundColor: HW_STATUS[statusKey]?.bg || '#78909c',
                      }}>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: HW_STATUS[statusKey]?.color || '#fff', whiteSpace: 'nowrap' }}>
                          {HW_STATUS[statusKey]?.label || 'Berilmagan'}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Deadline (No deadline field is stored, so display '-' or leave empty) */}
                    <TableCell sx={{ py: 2, px: 3, fontSize: '0.83rem', color: '#4a5568', fontWeight: 600, fontFamily: "'Inter', 'Outfit', sans-serif", whiteSpace: 'nowrap' }}>
                      -
                    </TableCell>

                    {/* Date */}
                    <TableCell sx={{ py: 2, px: 3, fontSize: '0.83rem', color: '#4a5568', fontWeight: 600, fontFamily: "'Inter', 'Outfit', sans-serif", whiteSpace: 'nowrap' }}>
                      {formatLessonDate(lesson.date)}
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
